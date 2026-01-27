import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

// Lazy-init Stripe to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const checks = {
    db: false,
    stripe: false,
  }
  const errors: Record<string, string> = {}

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = true
  } catch (error: any) {
    errors.db = error.message || 'Database connection failed'
  }

  // Check Stripe connection
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe()
      await stripe.balance.retrieve()
      checks.stripe = true
    } else {
      errors.stripe = 'STRIPE_SECRET_KEY not configured'
    }
  } catch (error: any) {
    errors.stripe = error.message || 'Stripe connection failed'
  }

  const allHealthy = checks.db && checks.stripe
  const status = allHealthy ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      ...checks,
      timestamp,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
    },
    { status: allHealthy ? 200 : 503 }
  )
}
