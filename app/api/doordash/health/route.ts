import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get tenant's DoorDash credentials
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        doordashDeveloperId: true,
        doordashKeyId: true,
        doordashSigningSecret: true,
      },
    })
    
    if (!tenant?.doordashDeveloperId || !tenant?.doordashKeyId || !tenant?.doordashSigningSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'DoorDash credentials not configured' 
      })
    }
    
    // Try to import and use the DoorDash service
    const { doorDashService } = await import('@/lib/doordash')
    
    // Use an obviously invalid ID to test auth without creating anything
    const fakeId = 'healthcheck_invalid_id'
    await doorDashService.getDeliveryStatus(fakeId)

    // If DoorDash returns 200 for a bogus id (unlikely), treat as connected
    return NextResponse.json({ success: true, message: 'DoorDash connection verified' })
  } catch (err: any) {
    // Axios-style error handling to extract HTTP details
    const status = err?.response?.status
    const data = err?.response?.data

    if (status === 404) {
      // 404 Not Found means: we authenticated and reached the API
      return NextResponse.json({ success: true, message: 'DoorDash connection verified' })
    }

    if (status === 401 || status === 403) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials - please check your Developer ID, Key ID, and Signing Secret' 
      })
    }

    // Network or unexpected errors
    return NextResponse.json({ 
      success: false, 
      error: err?.message || 'Failed to connect to DoorDash' 
    })
  }
}


