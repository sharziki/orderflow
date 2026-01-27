import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/dashboard/launch - Mark store as live
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        stripeOnboardingComplete: true,
      },
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    // Check requirements
    if (!tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'Please connect Stripe before launching' },
        { status: 400 }
      )
    }
    
    const menuItemCount = await prisma.menuItem.count({
      where: { tenantId: session.tenantId },
    })
    
    if (menuItemCount === 0) {
      return NextResponse.json(
        { error: 'Please add at least one menu item before launching' },
        { status: 400 }
      )
    }
    
    // Mark as active/live
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { isActive: true },
    })
    
    return NextResponse.json({ success: true, message: 'Store is now live!' })
  } catch (error) {
    console.error('Error launching store:', error)
    return NextResponse.json({ error: 'Failed to launch store' }, { status: 500 })
  }
}
