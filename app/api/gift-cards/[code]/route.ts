import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/gift-cards/[code] - Check gift card balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const upperCode = code.toUpperCase()

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: upperCode },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    if (!giftCard.isActive) {
      return NextResponse.json({
        valid: false,
        message: 'This gift card is inactive and cannot be used.',
        code: giftCard.code,
        currentBalance: giftCard.currentBalance,
      })
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      return NextResponse.json({
        valid: false,
        message: 'This gift card has expired.',
        code: giftCard.code,
        currentBalance: giftCard.currentBalance,
        expiresAt: giftCard.expiresAt,
      })
    }

    if (giftCard.currentBalance <= 0) {
      return NextResponse.json({
        valid: false,
        message: 'This gift card has been fully redeemed (balance: $0.00).',
        code: giftCard.code,
        currentBalance: 0,
      })
    }

    return NextResponse.json({
      valid: true,
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      initialBalance: giftCard.initialBalance,
      recipientName: giftCard.recipientName,
      expiresAt: giftCard.expiresAt,
    })
  } catch (error) {
    console.error('[GiftCard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift card' },
      { status: 500 }
    )
  }
}
