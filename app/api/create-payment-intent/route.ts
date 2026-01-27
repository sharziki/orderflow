import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover' as any,
  })
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const body = await request.json()
    const { amount, subtotal, tax, deliveryFee, tip = 0 } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Convert to cents
    const amountInCents = Math.round(amount * 100)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        subtotal: subtotal?.toString() || '0',
        tax: tax?.toString() || '0',
        deliveryFee: deliveryFee?.toString() || '0',
        tip: tip?.toString() || '0',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      platformFee: 0,
      restaurantPayout: amount,
      breakdown: {
        platformFee: 0,
        restaurantPayout: amount,
      }
    })
  } catch (error: any) {
    console.error('Payment intent error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
