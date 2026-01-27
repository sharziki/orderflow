import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/dashboard/launch-status
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        doordashDeveloperId: true,
        doordashKeyId: true,
        doordashSigningSecret: true,
      },
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    // Count menu items
    const menuItemCount = await prisma.menuItem.count({
      where: { tenantId: session.tenantId },
    })
    
    // Check DoorDash configured (all three fields present)
    const doordashConfigured = !!(
      tenant.doordashDeveloperId && 
      tenant.doordashKeyId && 
      tenant.doordashSigningSecret
    )
    
    return NextResponse.json({
      hasMenuItems: menuItemCount > 0,
      menuItemCount,
      stripeConnected: !!tenant.stripeAccountId,
      stripeOnboardingComplete: tenant.stripeOnboardingComplete,
      doordashConfigured,
      storeSlug: tenant.slug,
      storeName: tenant.name,
      isLive: tenant.isActive && tenant.stripeOnboardingComplete && menuItemCount > 0,
    })
  } catch (error) {
    console.error('Error getting launch status:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
