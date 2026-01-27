import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'
import {
  handleApiError,
  AppError,
  validateRequired,
  logRequest
} from '@/lib/api-utils'

// POST /api/gift-cards/[code]/redeem - Redeem/deduct from gift card (admin only, in-store)
export async function POST(
  request: NextRequest,
  context: { params: { code: string } }
) {
  const code = context.params.code.toUpperCase()
  
  try {
    const body = await request.json()
    logRequest('POST', `/api/gift-cards/${code}/redeem`, { amount: body.amount })

    const { amount, orderId, notes, adminName } = body

    // Validate required fields
    validateRequired(body, ['amount'])

    if (typeof amount !== 'number' || amount <= 0) {
      throw new AppError('Amount must be a positive number', 400, 'INVALID_AMOUNT')
    }

    // Fetch gift card
    const { data: giftCard, error: fetchError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code)
      .single()

    if (fetchError || !giftCard) {
      throw new AppError('Gift card not found', 404, 'GIFT_CARD_NOT_FOUND')
    }

    const card = giftCard as any

    // Validate gift card status
    if (card.status !== 'ACTIVE') {
      throw new AppError(
        `Cannot redeem: gift card is ${card.status.toLowerCase()}`,
        400,
        'INVALID_STATUS'
      )
    }

    if (card.current_balance <= 0) {
      throw new AppError(
        'Cannot redeem: gift card has zero balance',
        400,
        'ZERO_BALANCE'
      )
    }

    if (amount > card.current_balance) {
      throw new AppError(
        `Insufficient balance. Available: $${card.current_balance.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
        400,
        'INSUFFICIENT_BALANCE'
      )
    }

    // Calculate new balance
    const balanceBefore = card.current_balance
    const balanceAfter = balanceBefore - amount
    const now = new Date().toISOString()

    // Update gift card balance
    const updateData: any = {
      current_balance: balanceAfter,
      last_used_at: now,
      updated_at: now
    }

    // If fully redeemed, mark as REDEEMED
    if (balanceAfter === 0) {
      updateData.status = 'REDEEMED'
    }

    const { error: updateError } = await (supabase
      .from('gift_cards') as any)
      .update(updateData)
      .eq('id', card.id)

    if (updateError) {
      console.error('Error updating gift card:', updateError)
      throw new AppError('Failed to update gift card balance', 500, 'UPDATE_ERROR')
    }

    // Create transaction record
    const transactionId = createId()
    const { error: transactionError } = await (supabase
      .from('gift_card_transactions') as any)
      .insert({
        id: transactionId,
        gift_card_id: card.id,
        order_id: orderId || null,
        amount: -amount, // Negative for redemption
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_type: 'REDEMPTION',
        notes: notes?.trim() || null,
        created_by: adminName || 'admin',
        created_at: now
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // Don't fail the request, just log the error
    }

    console.log('[Gift Cards API] Redeemed gift card:', {
      code: code,
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter
    })

    return NextResponse.json({
      success: true,
      redemption: {
        code: code,
        amountRedeemed: amount,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        status: balanceAfter === 0 ? 'REDEEMED' : 'ACTIVE'
      },
      message: balanceAfter > 0
        ? `Redeemed $${amount.toFixed(2)}. Remaining balance: $${balanceAfter.toFixed(2)}`
        : `Gift card fully redeemed. Total used: $${amount.toFixed(2)}`
    })

  } catch (error) {
    return handleApiError(error, `POST /api/gift-cards/${code}/redeem`)
  }
}
