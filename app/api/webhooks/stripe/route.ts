import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Stripe Webhook] Received:', event.type)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (orderId) {
          // Update order payment status
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

          console.log('[Stripe Webhook] Order paid:', order.orderNumber)

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
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'failed' },
          })
          console.log('[Stripe Webhook] Payment failed for order:', orderId)
        }
        break
      }

      case 'account.updated': {
        // Stripe Connect: Restaurant account updated
        const account = event.data.object as Stripe.Account
        
        if (account.id) {
          const onboardingComplete = 
            account.details_submitted && 
            account.charges_enabled && 
            account.payouts_enabled

          await prisma.tenant.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboardingComplete: onboardingComplete },
          })
          console.log('[Stripe Webhook] Account updated:', account.id, 'Complete:', onboardingComplete)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          await prisma.order.updateMany({
            where: { paymentIntentId },
            data: { paymentStatus: 'refunded' },
          })
          console.log('[Stripe Webhook] Order refunded:', paymentIntentId)
        }
        break
      }
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
