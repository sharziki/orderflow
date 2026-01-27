import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'
import {
  handleApiError,
  AppError,
  validateRequired,
  logRequest
} from '@/lib/api-utils'

// Generate a unique gift card code
function generateGiftCardCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar looking chars
  const segments = 3
  const segmentLength = 4

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('')
  }).join('-')

  return `GIFT-${code}`
}

// POST /api/gift-cards - Purchase a gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    logRequest('POST', '/api/gift-cards', { amount: body.amount })

    const { amount, customer, notes } = body

    // Validate required fields
    validateRequired(body, ['amount'])

    if (typeof amount !== 'number' || amount <= 0) {
      throw new AppError('Amount must be a positive number', 400, 'INVALID_AMOUNT')
    }

    if (amount < 10) {
      throw new AppError('Minimum gift card amount is $10', 400, 'AMOUNT_TOO_LOW')
    }

    if (amount > 500) {
      throw new AppError('Maximum gift card amount is $500', 400, 'AMOUNT_TOO_HIGH')
    }

    // Generate unique code
    let code = generateGiftCardCode()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('gift_cards')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        code = generateGiftCardCode()
        attempts++
      }
    }

    if (!isUnique) {
      throw new AppError('Failed to generate unique gift card code', 500, 'CODE_GENERATION_FAILED')
    }

    // Handle customer if provided
    let customerId = null
    if (customer?.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', customer.email)
        .single()

      if (existingCustomer) {
        customerId = (existingCustomer as any).id
      } else if (customer.name) {
        // Create new customer
        const now = new Date().toISOString()
        const { data: newCustomer, error: customerError } = await (supabase
          .from('customers') as any)
          .insert({
            id: createId(),
            name: customer.name.trim(),
            email: customer.email,
            phone: customer.phone || null,
            created_at: now,
            updated_at: now
          })
          .select()
          .single()

        if (customerError) {
          console.error('Error creating customer:', customerError)
        } else {
          customerId = newCustomer.id
        }
      }
    }

    // Create gift card
    const giftCardId = createId()
    const now = new Date().toISOString()

    const { data: giftCard, error: giftCardError } = await (supabase
      .from('gift_cards') as any)
      .insert({
        id: giftCardId,
        code: code,
        initial_amount: amount,
        current_balance: amount,
        purchased_by: customerId,
        purchased_at: now,
        status: 'ACTIVE',
        notes: notes?.trim() || null,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (giftCardError) {
      console.error('Error creating gift card:', giftCardError)
      throw new AppError('Failed to create gift card', 500, 'GIFT_CARD_CREATE_ERROR')
    }

    // Create initial transaction record
    const transactionId = createId()
    await (supabase
      .from('gift_card_transactions') as any)
      .insert({
        id: transactionId,
        gift_card_id: giftCardId,
        amount: amount,
        balance_before: 0,
        balance_after: amount,
        transaction_type: 'PURCHASE',
        notes: 'Initial purchase',
        created_by: customerId ? 'customer' : 'anonymous',
        created_at: now
      })

    console.log('[Gift Cards API] Created gift card:', {
      id: giftCardId,
      code: code,
      amount: amount
    })

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        initialAmount: giftCard.initial_amount,
        currentBalance: giftCard.current_balance,
        purchasedAt: giftCard.purchased_at,
        status: giftCard.status
      },
      message: 'Gift card created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error, 'POST /api/gift-cards')
  }
}

// GET /api/gift-cards - Get all gift cards (admin only)
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/gift-cards')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    let query = supabase
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
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: giftCards, error } = await query

    if (error) {
      console.error('Error fetching gift cards:', error)
      throw new AppError('Failed to fetch gift cards', 500, 'FETCH_ERROR')
    }

    // Transform snake_case to camelCase for response
    const transformedCards = (giftCards || []).map((card: any) => ({
      id: card.id,
      code: card.code,
      initialAmount: card.initial_amount,
      currentBalance: card.current_balance,
      purchasedBy: card.purchased_by,
      purchasedAt: card.purchased_at,
      lastUsedAt: card.last_used_at,
      status: card.status,
      notes: card.notes,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
      customer: card.customer
    }))

    return NextResponse.json(transformedCards)
  } catch (error) {
    return handleApiError(error, 'GET /api/gift-cards')
  }
}
