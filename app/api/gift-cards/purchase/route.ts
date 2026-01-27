import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'

// Lazy load Stripe to avoid build-time errors
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover' as any,
  })
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, customer, recipient, notes, action } = body

    // If action is 'create-payment-intent', create the payment intent
    if (action === 'create-payment-intent') {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
      }

      const stripe = getStripe()
      const amountInCents = Math.round(amount * 100)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: 'gift_card',
          amount: amount.toString(),
        },
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    }

    // Otherwise, complete the gift card purchase
    if (!amount || !customer?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create or find customer
    let customerId: string
    const { data: existingCustomer } = await (supabase.from('customers') as any)
      .select('id')
      .eq('email', customer.email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      customerId = createId()
      await (supabase.from('customers') as any).insert({
        id: customerId,
        email: customer.email,
        name: customer.name || null,
        phone: customer.phone || null,
      })
    }

    // Generate unique code
    const code = generateGiftCardCode()

    // Create gift card
    const giftCardId = createId()
    const { error: giftCardError } = await (supabase.from('gift_cards') as any).insert({
      id: giftCardId,
      code,
      initial_amount: amount,
      current_balance: amount,
      status: 'ACTIVE',
      purchased_by: customerId,
      purchased_at: new Date().toISOString(),
      recipient_email: recipient?.email || null,
      recipient_name: recipient?.name || null,
      notes: notes || null,
    })

    if (giftCardError) {
      console.error('Gift card creation error:', giftCardError)
      return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCardId,
        code,
        amount,
        recipientEmail: recipient?.email,
        recipientName: recipient?.name,
      },
    })
  } catch (error: any) {
    console.error('Gift card purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
