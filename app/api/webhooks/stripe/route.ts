import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email'
import { processWebhookIdempotently } from '@/lib/webhook-idempotency'
import { logger } from '@/lib/logger'

// Lazy-init to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    logger.error('stripe_webhook_signature_failed', { error: err.message })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  logger.webhookReceived('stripe', event.id, event.type)

  try {
    // Process with idempotency protection
    const { processed } = await processWebhookIdempotently(
      event.id,
      'stripe',
      event.type,
      async () => {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
            break

          case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
            break

          case 'account.updated':
            await handleAccountUpdated(event.data.object as Stripe.Account)
            break

          case 'charge.refunded':
            await handleChargeRefunded(event.data.object as Stripe.Charge)
            break
        }
      }
    )

    return NextResponse.json({ received: true, processed })
  } catch (error: any) {
    logger.error('stripe_webhook_processing_failed', {
      eventId: event.id,
      eventType: event.type,
      error: error.message,
    })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      status: 'confirmed',
    },
    include: {
      tenant: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
  })

  logger.paymentProcessed(
    order.tenantId,
    order.id,
    paymentIntent.id,
    paymentIntent.amount,
    'paid'
  )

  logger.orderStatusChanged(
    order.tenantId,
    order.id,
    order.orderNumber,
    'pending',
    'confirmed'
  )

  // Send confirmation to customer
  if (order.customerEmail) {
    const restaurantAddress = [order.tenant.address, order.tenant.city, order.tenant.state, order.tenant.zip]
      .filter(Boolean)
      .join(', ')

    await sendOrderConfirmation(order.customerEmail, {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items as any[],
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryFee || undefined,
      tip: order.tip || undefined,
      total: order.total,
      type: order.type as 'pickup' | 'delivery',
      restaurantName: order.tenant.name,
      restaurantPhone: order.tenant.phone || undefined,
      restaurantAddress: restaurantAddress || undefined,
      estimatedTime: '20-30 minutes',
    })
  }

  // Send notification to restaurant
  if (order.tenant.email) {
    await sendNewOrderNotification(order.tenant.email, {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      total: order.total,
      itemCount: (order.items as any[]).length,
      type: order.type as 'pickup' | 'delivery',
    })
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'failed' },
  })

  logger.paymentFailed(
    order.tenantId,
    order.id,
    paymentIntent.id,
    paymentIntent.last_payment_error?.message || 'Payment failed'
  )
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return

  const onboardingComplete = 
    account.details_submitted && 
    account.charges_enabled && 
    account.payouts_enabled

  await prisma.tenant.updateMany({
    where: { stripeAccountId: account.id },
    data: { stripeOnboardingComplete: onboardingComplete },
  })

  logger.info('stripe_account_updated', {
    stripeAccountId: account.id,
    onboardingComplete,
  })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string
  if (!paymentIntentId) return

  const result = await prisma.order.updateMany({
    where: { paymentIntentId },
    data: { paymentStatus: 'refunded' },
  })

  if (result.count > 0) {
    logger.info('order_refunded', { paymentIntentId, count: result.count })
  }
}
