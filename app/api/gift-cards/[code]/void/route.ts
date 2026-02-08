import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/gift-cards/[code]/void - Void a gift card (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params
    const upperCode = code.toUpperCase()
    const body = await request.json()
    const { reason } = body

    // Find the gift card
    const giftCard = await prisma.giftCard.findFirst({
      where: { 
        code: upperCode,
        tenantId: session.tenantId,
      },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    if (!giftCard.isActive) {
      return NextResponse.json(
        { error: 'Gift card is already inactive' },
        { status: 400 }
      )
    }

    // Deactivate the gift card
    const updatedCard = await prisma.giftCard.update({
      where: { id: giftCard.id },
      data: {
        isActive: false,
        message: giftCard.message 
          ? `${giftCard.message}\nVoided: ${reason || 'No reason provided'}`
          : `Voided: ${reason || 'No reason provided'}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Gift card voided successfully',
      giftCard: {
        code: updatedCard.code,
        currentBalance: updatedCard.currentBalance,
        isActive: updatedCard.isActive,
      },
    })
  } catch (error) {
    console.error('[GiftCard Void] Error:', error)
    return NextResponse.json(
      { error: 'Failed to void gift card' },
      { status: 500 }
    )
  }
}
