import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

// Initialize S3 client (works with Cloudflare R2, AWS S3, etc.)
const getS3Client = () => {
  if (!process.env.S3_ENDPOINT) return null
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  })
}

// Initialize Supabase client for storage
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const BUCKET = process.env.S3_BUCKET || 'orderflow'
const PUBLIC_URL = process.env.S3_PUBLIC_URL || ''
const SUPABASE_BUCKET = 'uploads' // Supabase storage bucket name

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'logo' // menu, logo, category
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const key = `${session.tenantId}/${type}/${filename}`
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Try S3 first
    const s3Client = getS3Client()
    if (s3Client) {
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ACL: 'public-read',
        }))
        
        const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`
        return NextResponse.json({ url, key, storage: 's3' })
      } catch (s3Error) {
        console.error('S3 upload failed, trying Supabase:', s3Error)
      }
    }
    
    // Try Supabase Storage
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(key, buffer, {
            contentType: file.type,
            upsert: true,
          })
        
        if (error) {
          // Check if bucket doesn't exist
          if (error.message?.includes('not found') || error.message?.includes('Bucket') || (error as any).statusCode === '404') {
            console.error(`Supabase bucket '${SUPABASE_BUCKET}' not found. Please create it in the Supabase dashboard:`)
            console.error('1. Go to Storage in your Supabase dashboard')
            console.error('2. Click "New bucket"')
            console.error(`3. Name it "${SUPABASE_BUCKET}" and make it public`)
            throw new Error(`Bucket '${SUPABASE_BUCKET}' not found. Create it in Supabase dashboard.`)
          }
          throw error
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(key)
        
        return NextResponse.json({ 
          url: urlData.publicUrl, 
          key, 
          storage: 'supabase' 
        })
      } catch (supabaseError: any) {
        console.error('Supabase upload failed:', supabaseError.message || supabaseError)
      }
    }
    
    // Fallback: No storage configured - save as data URL for development
    // This isn't ideal for production but allows testing the flow
    console.warn('No storage configured (S3 or Supabase). Using placeholder.')
    
    return NextResponse.json({
      url: `https://placehold.co/400x400/2563eb/white?text=${encodeURIComponent(file.name.substring(0, 10))}`,
      message: 'Storage not configured. Configure S3_ENDPOINT or NEXT_PUBLIC_SUPABASE_URL for real uploads.',
      storage: 'placeholder',
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE /api/upload - Delete a file
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { key, storage } = await req.json()
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }
    
    // Verify the key belongs to this tenant (basic check)
    if (!key.startsWith(session.tenantId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Try S3
    if (storage === 's3' || !storage) {
      const s3Client = getS3Client()
      if (s3Client) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
          }))
          return NextResponse.json({ success: true })
        } catch (s3Error) {
          console.error('S3 delete failed:', s3Error)
        }
      }
    }
    
    // Try Supabase
    if (storage === 'supabase' || !storage) {
      const supabase = getSupabaseClient()
      if (supabase) {
        const { error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .remove([key])
        
        if (!error) {
          return NextResponse.json({ success: true })
        }
        console.error('Supabase delete failed:', error)
      }
    }
    
    return NextResponse.json({ success: true, message: 'No storage configured' })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}
