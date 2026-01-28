import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/auth/me - Get current user and tenant
export async function GET(req: NextRequest) {
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
