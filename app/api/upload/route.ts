import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client (works with Cloudflare R2, AWS S3, etc.)
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT, // e.g., https://xxx.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.S3_BUCKET || 'orderflow'
const PUBLIC_URL = process.env.S3_PUBLIC_URL || '' // e.g., https://cdn.orderflow.io

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if S3 is configured
    if (!process.env.S3_ENDPOINT) {
      // Return a placeholder URL for development
      return NextResponse.json({
        url: `https://placehold.co/400x300/2563eb/white?text=Image`,
        message: 'S3 not configured - using placeholder',
      })
    }
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'menu' // menu, logo, category
    
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
    const ext = file.name.split('.').pop()
    const key = `${session.tenantId}/${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }))
    
    const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`
    
    return NextResponse.json({ url, key })
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
    
    const { key } = await req.json()
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }
    
    // Verify the key belongs to this tenant (basic check)
    if (!key.startsWith(session.tenantId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }))
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}
