import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Stripe from 'stripe'

// Lazy-init to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// GET redirects to Stripe onboarding (for link clicks)
export async function GET(req: NextRequest) {
  return handleOnboard(req, true)
}

// POST returns JSON with URL for programmatic calls
export async function POST(req: NextRequest) {
  return handleOnboard(req, false)
}

async function handleOnboard(req: NextRequest, redirect: boolean = false) {
  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  try {
    const session = await getSession()
    if (!session) {
      if (redirect) {
        return NextResponse.redirect(`${baseUrl}/login`)
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
    })
    
    if (!tenant) {
      if (redirect) {
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=tenant_not_found`)
      }
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    let accountId = tenant.stripeAccountId
    
    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard', // Standard accounts have full Stripe dashboard
        email: tenant.email,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        },
        business_profile: {
          name: tenant.name,
        },
      })
      
      accountId = account.id
      
      // Save to tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeAccountId: accountId },
      })
    }
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
      return_url: `${baseUrl}/dashboard/settings?stripe=success`,
      type: 'account_onboarding',
    })
    
    if (redirect) {
      return NextResponse.redirect(accountLink.url)
    }
    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Error creating Stripe onboarding:', error)
    if (redirect) {
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=stripe_error`)
    }
    return NextResponse.json(
      { error: error.message || 'Failed to start Stripe onboarding' },
      { status: 500 }
    )
  }
}
