import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Generate a unique gift card code
function generateGiftCardCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = 3
  const segmentLength = 4

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('')
  }).join('-')

  return `GIFT-${code}`
}

// GET /api/gift-cards - List gift cards for tenant (dashboard)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const giftCards = await prisma.giftCard.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ giftCards })
  } catch (error) {
    console.error('[GiftCards] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift cards' },
      { status: 500 }
    )
  }
}

// POST /api/gift-cards - Create a gift card (for admin/dashboard)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      amount, 
      recipientName, 
      recipientEmail, 
      purchaserName, 
      purchaserEmail,
      message,
      expiresAt,
    } = body

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Generate unique code
    let code = generateGiftCardCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.giftCard.findUnique({ where: { code } })
      if (!existing) break
      code = generateGiftCardCode()
      attempts++
    }

    const giftCard = await prisma.giftCard.create({
      data: {
        tenantId: session.tenantId,
        code,
        initialBalance: amount,
        currentBalance: amount,
        recipientName,
        recipientEmail,
        purchaserName,
        purchaserEmail,
        message,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ giftCard }, { status: 201 })
  } catch (error) {
    console.error('[GiftCards] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create gift card' },
      { status: 500 }
    )
  }
}
