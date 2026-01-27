import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleApiError, AppError, logRequest } from '@/lib/api-utils'

type RouteContext = {
  params: { code: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const code = context.params.code.toUpperCase()
  
  try {
    logRequest('GET', `/api/gift-cards/${code}`)

    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select(`
        *,
        customer:customers(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('code', code)
      .single()

    if (error || !giftCard) {
      throw new AppError('Gift card not found', 404, 'GIFT_CARD_NOT_FOUND')
    }

    const card = giftCard as any

    if (card.status !== 'ACTIVE') {
      return NextResponse.json({
        valid: false,
        message: `This gift card is ${card.status.toLowerCase()} and cannot be used.`,
        status: card.status
      })
    }

    if (card.current_balance <= 0) {
      return NextResponse.json({
        valid: false,
        message: 'This gift card has been fully redeemed (balance: $0.00).',
        currentBalance: 0,
        status: card.status
      })
    }

    const { data: transactions } = await supabase
      .from('gift_card_transactions')
      .select('*')
      .eq('gift_card_id', card.id)
      .order('created_at', { ascending: false })

    const transformedTransactions = (transactions || []).map((t: any) => ({
      id: t.id,
      giftCardId: t.gift_card_id,
      orderId: t.order_id,
      amount: t.amount,
      balanceBefore: t.balance_before,
      balanceAfter: t.balance_after,
      transactionType: t.transaction_type,
      notes: t.notes,
      createdBy: t.created_by,
      createdAt: t.created_at
    }))

    return NextResponse.json({
      valid: true,
      giftCard: {
        code: card.code,
        initialAmount: card.initial_amount,
        currentBalance: card.current_balance,
        purchasedAt: card.purchased_at,
        lastUsedAt: card.last_used_at,
        status: card.status,
        customer: card.customer
      },
      transactions: transformedTransactions,
      message: `Gift card balance: $${card.current_balance.toFixed(2)}`
    })

  } catch (error) {
    return handleApiError(error, `GET /api/gift-cards/${code}`)
  }
}
