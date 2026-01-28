import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Demo mode user and tenant for when database isn't available
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@orderflow.co',
  name: 'Demo User',
  role: 'owner',
  canViewOrders: true,
  canEditOrders: true,
  canEditMenu: true,
  canEditSettings: true,
  canViewAnalytics: true,
  canManageStaff: true,
}

const DEMO_TENANT = {
  id: 'demo-tenant',
  slug: 'demo-kitchen',
  name: 'Demo Kitchen',
  logo: null,
  email: 'hello@demokitchen.com',
  phone: '(555) 123-4567',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  template: 'modern',
  menuLayout: 'blu-bentonville',
  primaryColor: '#2563eb',
  isOnboarded: true,
  stripeOnboardingComplete: false,
}

// Check if we're in demo mode (no database configured)
function isDemoMode(): boolean {
  return !process.env.DATABASE_URL
}

// GET /api/auth/me - Get current user and tenant
export async function GET(req: NextRequest) {
  // Demo mode - return demo user without auth check
  if (isDemoMode()) {
    return NextResponse.json({
      user: DEMO_USER,
      tenant: DEMO_TENANT,
      demoMode: true,
    })
  }

  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canViewOrders: true,
        canEditOrders: true,
        canEditMenu: true,
        canEditSettings: true,
        canViewAnalytics: true,
        canManageStaff: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        logo: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        template: true,
        menuLayout: true,
        primaryColor: true,
        isOnboarded: true,
        stripeOnboardingComplete: true,
      }
    })

    return NextResponse.json({
      user,
      tenant,
    })
  } catch (error) {
    console.error('[Auth Me] Error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
