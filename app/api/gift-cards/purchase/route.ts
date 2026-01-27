import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { generateGiftCardCode } from '@/lib/auth'

// Lazy load Stripe to avoid build-time errors
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, tenantSlug, amount, purchaserEmail, purchaserName, recipientEmail, recipientName, message, action, paymentIntentId } = body

    // Find tenant
    let tenant
    if (tenantSlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    } else if (tenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    }
    
    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // If action is 'create-payment-intent', create the payment intent
    if (action === 'create-payment-intent') {
      if (typeof amount !== 'number' || amount < 5 || amount > 500) {
        return NextResponse.json({ error: 'Amount must be between $5 and $500' }, { status: 400 })
      }

      const stripe = getStripe()
      const amountInCents = Math.round(amount * 100)

      // Calculate platform fee
      const platformFeeCents = Math.round(amountInCents * (tenant.platformFeePercent / 100))

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        ...(tenant.stripeAccountId && tenant.stripeOnboardingComplete ? {
          application_fee_amount: platformFeeCents,
          transfer_data: { destination: tenant.stripeAccountId },
        } : {}),
        metadata: {
          type: 'gift_card',
          tenantId: tenant.id,
          amount: amount.toString(),
        },
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    }

    // Complete the gift card purchase
    if (!amount || !purchaserEmail || !paymentIntentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify payment succeeded
    const stripe = getStripe()
    const paymentIntentObj = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntentObj.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Generate unique code
    const code = generateGiftCardCode()

    // Create gift card
    const giftCard = await prisma.giftCard.create({
      data: {
        tenantId: tenant.id,
        code,
        initialBalance: amount,
        currentBalance: amount,
        purchaserEmail,
        purchaserName: purchaserName || null,
        recipientEmail: recipientEmail || null,
        recipientName: recipientName || null,
        message: message || null,
        isActive: true,
      },
    })

    // TODO: Send email to recipient if recipientEmail provided

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.initialBalance,
        recipientEmail: giftCard.recipientEmail,
        recipientName: giftCard.recipientName,
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
