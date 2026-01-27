import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Platform fee: flat $1 per order (100 cents)
const PLATFORM_FEE_CENTS = parseInt(process.env.PLATFORM_FEE_CENTS || '100', 10)

export async function POST(req: NextRequest) {
  try {
    const { orderId, tenantSlug } = await req.json()
    
    // Find order and tenant
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tenant: true },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    const tenant = order.tenant
    
    // Check if tenant has Stripe connected
    if (!tenant.stripeAccountId || !tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'This restaurant is not set up to accept payments yet.' },
        { status: 400 }
      )
    }
    
    // Calculate amounts in cents
    const totalCents = Math.round(order.total * 100)
    const platformFeeCents = PLATFORM_FEE_CENTS // Flat $1 platform fee
    
    // Create payment intent with transfer to connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: tenant.stripeAccountId,
      },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    })
    
    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id },
    })
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
