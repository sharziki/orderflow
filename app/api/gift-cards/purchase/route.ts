import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { generateGiftCardCode } from '@/lib/auth'
import { sendGiftCardEmail } from '@/lib/email'

// Lazy load Stripe to avoid build-time errors
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, paymentIntentId } = body

    // Handle confirm-purchase action - retrieve data from payment intent metadata
    if (action === 'confirm-purchase') {
      if (!paymentIntentId) {
        return NextResponse.json({ error: 'Missing payment intent ID' }, { status: 400 })
      }

      const stripe = getStripe()
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
      }

      // Check if gift card was already created for this payment (idempotency)
      const existingGiftCard = await prisma.giftCard.findFirst({
        where: { message: { contains: `Payment Intent: ${paymentIntentId}` } }
      })
      
      if (existingGiftCard) {
        // Return the existing gift card
        const tenant = await prisma.tenant.findUnique({ where: { id: existingGiftCard.tenantId } })
        return NextResponse.json({
          success: true,
          giftCard: {
            id: existingGiftCard.id,
            code: existingGiftCard.code,
            currentBalance: existingGiftCard.currentBalance,
            amount: existingGiftCard.initialBalance,
            recipientEmail: existingGiftCard.recipientEmail,
            recipientName: existingGiftCard.recipientName,
          },
        })
      }

      // Extract data from payment intent metadata
      const metadata = paymentIntent.metadata
      const tenantId = metadata.tenantId
      const amount = parseFloat(metadata.amount)
      const purchaserName = metadata.purchaserName || null
      const purchaserEmail = metadata.purchaserEmail || null
      const recipientName = metadata.recipientName || null
      const recipientEmail = metadata.recipientEmail || null
      const message = metadata.message || null

      if (!tenantId || isNaN(amount)) {
        return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 })
      }

      // Get tenant info
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (!tenant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
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

      // Create gift card with payment intent reference for idempotency
      const giftCard = await prisma.giftCard.create({
        data: {
          tenantId: tenant.id,
          code,
          initialBalance: amount,
          currentBalance: amount,
          purchaserEmail,
          purchaserName,
          recipientEmail,
          recipientName,
          message: message ? `${message}\nPayment Intent: ${paymentIntentId}` : `Payment Intent: ${paymentIntentId}`,
          isActive: true,
        },
      })

      // Send email to recipient (or purchaser if no recipient)
      const emailTo = recipientEmail || purchaserEmail
      if (emailTo) {
        const balanceCheckUrl = `${APP_URL}/${tenant.slug}/gift-cards/balance`
        await sendGiftCardEmail(emailTo, {
          code: giftCard.code,
          amount: giftCard.initialBalance,
          recipientName,
          purchaserName,
          message,
          restaurantName: tenant.name,
          balanceCheckUrl,
        })

        // Also send confirmation to purchaser if this is a gift
        if (recipientEmail && purchaserEmail && recipientEmail !== purchaserEmail) {
          await sendGiftCardEmail(purchaserEmail, {
            code: giftCard.code,
            amount: giftCard.initialBalance,
            recipientName,
            purchaserName,
            message: `Your gift to ${recipientName || recipientEmail} has been sent!`,
            restaurantName: tenant.name,
            balanceCheckUrl,
          })
        }
      }

      return NextResponse.json({
        success: true,
        giftCard: {
          id: giftCard.id,
          code: giftCard.code,
          currentBalance: giftCard.currentBalance,
          amount: giftCard.initialBalance,
          recipientEmail: giftCard.recipientEmail,
          recipientName: giftCard.recipientName,
        },
      })
    }

    // Handle create-payment-intent action
    const { tenantId, tenantSlug, amount, customer, recipient, notes } = body

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

    // Check if gift cards are enabled
    if (!tenant.giftCardsEnabled) {
      return NextResponse.json({ error: 'Gift cards are not enabled for this restaurant' }, { status: 400 })
    }

    if (action === 'create-payment-intent') {
      if (typeof amount !== 'number' || amount < 10 || amount > 500) {
        return NextResponse.json({ error: 'Amount must be between $10 and $500' }, { status: 400 })
      }

      const stripe = getStripe()
      const amountInCents = Math.round(amount * 100)

      // Calculate platform fee
      const platformFeeCents = Math.round(amountInCents * (tenant.platformFeePercent / 100))

      // Store all customer data in metadata so we can retrieve it on confirmation
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
          purchaserName: customer?.name || '',
          purchaserEmail: customer?.email || '',
          purchaserPhone: customer?.phone || '',
          recipientName: recipient?.name || '',
          recipientEmail: recipient?.email || '',
          message: notes || '',
        },
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    }

    // Fallback: legacy flow (direct purchase without action)
    const { purchaserEmail, purchaserName, recipientEmail, recipientName, message } = body
    
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

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        currentBalance: giftCard.currentBalance,
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
