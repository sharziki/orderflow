import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import QRCode from 'qrcode'

// GET /api/qr-code - Generate QR code for store
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'png' // png, svg, dataurl
    const size = parseInt(searchParams.get('size') || '300')
    const margin = parseInt(searchParams.get('margin') || '2')

    // Get tenant slug
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { slug: true, name: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://orderflow.io'
    const storeUrl = `${baseUrl}/store/${tenant.slug}`

    const qrOptions = {
      width: size,
      margin,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }

    if (format === 'svg') {
      const svg = await QRCode.toString(storeUrl, { ...qrOptions, type: 'svg' })
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="${tenant.slug}-qr.svg"`,
        }
      })
    }

    if (format === 'dataurl') {
      const dataUrl = await QRCode.toDataURL(storeUrl, qrOptions)
      return NextResponse.json({ 
        dataUrl,
        storeUrl,
        restaurantName: tenant.name 
      })
    }

    // PNG format
    const buffer = await QRCode.toBuffer(storeUrl, qrOptions)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${tenant.slug}-qr.png"`,
      }
    })

  } catch (error) {
    console.error('[QR Code] Error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
