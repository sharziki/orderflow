import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    if (!tenant.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        accountId: null,
      })
    }
    
    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(tenant.stripeAccountId)
    
    const onboardingComplete = account.details_submitted && 
                              account.charges_enabled && 
                              account.payouts_enabled
    
    // Update tenant if onboarding status changed
    if (onboardingComplete !== tenant.stripeOnboardingComplete) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeOnboardingComplete: onboardingComplete },
      })
    }
    
    return NextResponse.json({
      connected: true,
      onboardingComplete,
      accountId: tenant.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error: any) {
    console.error('Error checking Stripe status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check Stripe status' },
      { status: 500 }
    )
  }
}
