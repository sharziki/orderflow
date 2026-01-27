import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendOrderStatusUpdate } from '@/lib/email'

// GET /api/orders/[orderId] - Get single order (for tracking or dashboard)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    
    // Check if it's an order number or ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId },
        ],
      },
      include: {
        tenant: {
          select: {
            name: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
      },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PUT /api/orders/[orderId] - Update order (status, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { orderId } = await params
    const body = await req.json()
    const { status, estimatedReady, notes } = body
    
    // Verify ownership
    const existing = await prisma.order.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    // Validate status transition
    const validTransitions: { [key: string]: string[] } = {
      pending: ['confirmed', 'preparing', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'completed'],
      out_for_delivery: ['completed'],
      completed: [],
      cancelled: [],
    }
    
    if (status && !validTransitions[existing.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${status}` },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      if (status === 'completed') {
        updateData.completedAt = new Date()
      }
    }
    
    if (estimatedReady) {
      updateData.estimatedReady = new Date(estimatedReady)
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        tenant: { select: { name: true } },
      },
    })
    
    // Send email notification on status change
    if (status && order.customerEmail) {
      await sendOrderStatusUpdate(order.customerEmail, {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        restaurantName: order.tenant.name,
      })
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
