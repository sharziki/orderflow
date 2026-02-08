import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/settings/demo-mode - Get demo mode status
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        demoModeEnabled: true,
        demoModeCompletedAt: true,
        demoOrderCount: true,
        doordashDeveloperId: true,
        doordashKeyId: true,
        doordashSigningSecret: true,
        stripeOnboardingComplete: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const hasProductionDoordash = !!(
      tenant.doordashDeveloperId &&
      tenant.doordashKeyId &&
      tenant.doordashSigningSecret
    )

    return NextResponse.json({
      demoModeEnabled: tenant.demoModeEnabled,
      demoModeCompletedAt: tenant.demoModeCompletedAt,
      demoOrderCount: tenant.demoOrderCount,
      hasProductionDoordash,
      hasStripeConfigured: tenant.stripeOnboardingComplete,
    })
  } catch (error) {
    console.error('Error fetching demo mode status:', error)
    return NextResponse.json({ error: 'Failed to fetch demo mode status' }, { status: 500 })
  }
}

// POST /api/settings/demo-mode - Enable/disable demo mode
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { enabled, autoDisableAfterSuccess } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 })
    }

    // Update demo mode
    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        demoModeEnabled: enabled,
        // Reset counters when enabling
        ...(enabled && {
          demoOrderCount: 0,
          demoModeCompletedAt: null,
        }),
      },
      select: {
        demoModeEnabled: true,
        demoModeCompletedAt: true,
        demoOrderCount: true,
      },
    })

    return NextResponse.json({
      success: true,
      demoModeEnabled: tenant.demoModeEnabled,
      demoModeCompletedAt: tenant.demoModeCompletedAt,
      demoOrderCount: tenant.demoOrderCount,
      message: enabled
        ? 'Demo mode enabled. You can now test delivery orders without real charges.'
        : 'Demo mode disabled. Orders will now use production settings.',
    })
  } catch (error) {
    console.error('Error updating demo mode:', error)
    return NextResponse.json({ error: 'Failed to update demo mode' }, { status: 500 })
  }
}

// PUT /api/settings/demo-mode - Mark demo as completed
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { autoDisable = false } = body

    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        demoModeCompletedAt: new Date(),
        ...(autoDisable && { demoModeEnabled: false }),
      },
      select: {
        demoModeEnabled: true,
        demoModeCompletedAt: true,
        demoOrderCount: true,
      },
    })

    return NextResponse.json({
      success: true,
      demoModeEnabled: tenant.demoModeEnabled,
      demoModeCompletedAt: tenant.demoModeCompletedAt,
      demoOrderCount: tenant.demoOrderCount,
      message: autoDisable
        ? 'Demo test completed successfully! Demo mode has been automatically disabled.'
        : 'Demo test completed successfully!',
    })
  } catch (error) {
    console.error('Error completing demo test:', error)
    return NextResponse.json({ error: 'Failed to complete demo test' }, { status: 500 })
  }
}
