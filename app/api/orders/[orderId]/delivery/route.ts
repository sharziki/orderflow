import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { DoorDashMultiTenant } from '@/lib/doordash-multi'

// POST /api/orders/[orderId]/delivery - Create DoorDash delivery for order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { orderId } = await params
    
    // Verify order belongs to tenant
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    if (order.type !== 'delivery') {
      return NextResponse.json({ error: 'Order is not a delivery order' }, { status: 400 })
    }
    
    if (order.doordashDeliveryId) {
      return NextResponse.json({ error: 'Delivery already created' }, { status: 400 })
    }
    
    // Check if DoorDash is configured
    const isConfigured = await DoorDashMultiTenant.isConfigured(session.tenantId)
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'DoorDash is not configured. Add your credentials in Settings.' },
        { status: 400 }
      )
    }
    
    // Create delivery
    const result = await DoorDashMultiTenant.createDeliveryForOrder(orderId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      deliveryId: result.deliveryId,
      fee: result.fee,
    })
  } catch (error: any) {
    console.error('Error creating delivery:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create delivery' },
      { status: 500 }
    )
  }
}

// GET /api/orders/[orderId]/delivery - Get delivery status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { orderId } = await params
    
    // Get order
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    if (!order.doordashDeliveryId) {
      return NextResponse.json({ error: 'No delivery created for this order' }, { status: 404 })
    }
    
    // Get status from DoorDash
    try {
      const delivery = await DoorDashMultiTenant.getDeliveryStatus(
        session.tenantId,
        order.doordashDeliveryId
      )
      
      return NextResponse.json({
        deliveryId: order.doordashDeliveryId,
        status: delivery.status,
        dasherName: delivery.dasher_name,
        dasherPhone: delivery.dasher_phone,
        trackingUrl: delivery.tracking_url,
      })
    } catch (error: any) {
      // Return cached info if DoorDash API fails
      return NextResponse.json({
        deliveryId: order.doordashDeliveryId,
        status: order.status,
        error: 'Could not fetch live status',
      })
    }
  } catch (error: any) {
    console.error('Error getting delivery status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get delivery status' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[orderId]/delivery - Cancel delivery
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { orderId } = await params
    
    // Get order
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    if (!order.doordashDeliveryId) {
      return NextResponse.json({ error: 'No delivery to cancel' }, { status: 400 })
    }
    
    // Cancel delivery
    await DoorDashMultiTenant.cancelDelivery(session.tenantId, order.doordashDeliveryId)
    
    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling delivery:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel delivery' },
      { status: 500 }
    )
  }
}
