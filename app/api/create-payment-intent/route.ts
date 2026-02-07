import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

// Check if we're in demo mode (explicit flag OR no Stripe configured)
function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || !process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
}

// Lazy-init Stripe to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

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
    
    // Demo mode: skip Stripe entirely
    if (isDemoMode()) {
      // Update order status to confirmed (simulating successful payment)
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'confirmed',
          paymentIntentId: `demo_${Date.now()}_${orderId}`,
        },
      })
      
      return NextResponse.json({
        demoMode: true,
        orderId: order.id,
        message: 'Demo mode - payment simulated successfully',
      })
    }
    
    const stripe = getStripe()
    
    // Calculate amounts in cents
    const totalCents = Math.round(order.total * 100)
    const platformFeeCents = PLATFORM_FEE_CENTS // Flat $1 platform fee
    
    // Check if we're in test/sandbox mode
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
    
    // Check if tenant has Stripe connected
    const hasStripeConnect = tenant.stripeAccountId && tenant.stripeOnboardingComplete
    
    // In production, require Stripe Connect
    if (!isTestMode && !hasStripeConnect) {
      return NextResponse.json(
        { error: 'This restaurant is not set up to accept payments yet.' },
        { status: 400 }
      )
    }
    
    // Create payment intent - with or without transfer based on Connect status
    const paymentIntentParams: any = {
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    }
    
    // Only add transfer if restaurant has Stripe Connect set up
    if (hasStripeConnect) {
      paymentIntentParams.application_fee_amount = platformFeeCents
      paymentIntentParams.transfer_data = {
        destination: tenant.stripeAccountId,
      }
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)
    
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
