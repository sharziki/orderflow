import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/gift-cards/[code]/redeem - Redeem/deduct from gift card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const upperCode = code.toUpperCase()
    const body = await request.json()
    const { amount, orderId } = body

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Find the gift card
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
      return NextResponse.json(
        { error: 'This gift card is inactive' },
        { status: 400 }
      )
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      return NextResponse.json(
        { error: 'This gift card has expired' },
        { status: 400 }
      )
    }

    if (giftCard.currentBalance < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          currentBalance: giftCard.currentBalance,
          requestedAmount: amount,
        },
        { status: 400 }
      )
    }

    // Deduct the amount
    const updatedCard = await prisma.giftCard.update({
      where: { code: upperCode },
      data: {
        currentBalance: giftCard.currentBalance - amount,
      },
    })

    return NextResponse.json({
      success: true,
      code: updatedCard.code,
      amountDeducted: amount,
      previousBalance: giftCard.currentBalance,
      newBalance: updatedCard.currentBalance,
      orderId,
    })
  } catch (error) {
    console.error('[GiftCard Redeem] Error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem gift card' },
      { status: 500 }
    )
  }
}
