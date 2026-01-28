import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Check if we're in demo mode (no database configured)
function isDemoMode(): boolean {
  return !process.env.DATABASE_URL
}

// Demo gift cards
const DEMO_GIFT_CARDS = [
  {
    id: 'demo-gc-1',
    code: 'GIFT-DEMO-1234-ABCD',
    initialAmount: 50.00,
    currentBalance: 35.50,
    purchasedBy: 'demo-customer',
    purchasedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE' as const,
    notes: 'Happy Birthday!\nPayment Intent: pi_demo123',
    customer: {
      id: 'demo-customer',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(555) 123-4567'
    }
  },
  {
    id: 'demo-gc-2',
    code: 'GIFT-DEMO-5678-EFGH',
    initialAmount: 100.00,
    currentBalance: 100.00,
    purchasedBy: 'demo-customer-2',
    purchasedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsedAt: null,
    status: 'ACTIVE' as const,
    notes: 'Enjoy your gift card!',
    customer: {
      id: 'demo-customer-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(555) 987-6543'
    }
  },
  {
    id: 'demo-gc-3',
    code: 'GIFT-DEMO-9999-WXYZ',
    initialAmount: 25.00,
    currentBalance: 0.00,
    purchasedBy: 'demo-customer-3',
    purchasedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'REDEEMED' as const,
    notes: null,
    customer: {
      id: 'demo-customer-3',
      name: 'Mike Williams',
      email: 'mike@example.com',
      phone: null
    }
  }
]

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
  // Demo mode - return demo gift cards
  if (isDemoMode()) {
    return NextResponse.json(DEMO_GIFT_CARDS)
  }

  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const giftCards = await prisma.giftCard.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
    })

    // Return array directly for consistency
    return NextResponse.json(giftCards)
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
