import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendOrderStatusUpdate } from '@/lib/email'

// Editable statuses - only these can have items modified
const EDITABLE_STATUSES = ['pending', 'confirmed']

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

// PUT /api/orders/[orderId] - Update order (status, items, kitchen notes)
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
    const { status, estimatedReady, notes, items, kitchenNotes } = body
    
    // Verify ownership
    const existing = await prisma.order.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
      include: {
        tenant: { select: { taxRate: true } },
      },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    // Validate status transition - allows forward and backward movement for admin flexibility
    const validTransitions: { [key: string]: string[] } = {
      pending: ['confirmed', 'preparing', 'cancelled'],
      confirmed: ['pending', 'preparing', 'cancelled'], // Can go back to pending
      preparing: ['pending', 'confirmed', 'ready', 'cancelled'], // Can go back to pending/confirmed
      ready: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed', 'cancelled'], // Can go back
      out_for_delivery: ['ready', 'completed', 'cancelled'], // Can go back to ready
      completed: ['ready'], // Allow reopening completed orders back to ready
      cancelled: ['pending'], // Allow reactivating cancelled orders
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
    
    // Handle kitchen notes (internal staff notes)
    if (kitchenNotes !== undefined) {
      updateData.kitchenNotes = kitchenNotes
    }
    
    // Handle order item editing
    if (items !== undefined) {
      // Only allow editing for pending/confirmed orders
      if (!EDITABLE_STATUSES.includes(existing.status)) {
        return NextResponse.json(
          { error: `Cannot edit items for order in ${existing.status} status. Only pending and confirmed orders can be edited.` },
          { status: 400 }
        )
      }
      
      // Validate and recalculate totals
      let subtotal = 0
      const orderItems: {
        menuItemId: string
        name: string
        quantity: number
        price: number
        options: any[]
        specialRequests: string
      }[] = []
      
      for (const item of items) {
        const menuItem = await prisma.menuItem.findFirst({
          where: { id: item.menuItemId, tenantId: session.tenantId },
        })
        
        if (!menuItem) {
          return NextResponse.json(
            { error: `Item not found: ${item.menuItemId}` },
            { status: 400 }
          )
        }
        
        let itemPrice = item.price ?? menuItem.price
        const lineTotal = itemPrice * item.quantity
        subtotal += lineTotal
        
        orderItems.push({
          menuItemId: menuItem.id,
          name: item.name ?? menuItem.name,
          quantity: item.quantity,
          price: itemPrice,
          options: item.options || [],
          specialRequests: item.specialRequests || '',
        })
      }
      
      // Recalculate tax and total
      const tax = subtotal * (existing.tenant.taxRate / 100)
      const total = subtotal + tax + (existing.tip || 0) + existing.deliveryFee - existing.discount - existing.giftCardAmount
      
      updateData.items = orderItems
      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.total = total
      
      // Track edit history in kitchenNotes
      const timestamp = new Date().toISOString()
      const editNote = `[${timestamp}] Order items modified by staff`
      const existingKitchenNotes = updateData.kitchenNotes ?? existing.kitchenNotes ?? ''
      updateData.kitchenNotes = existingKitchenNotes 
        ? `${existingKitchenNotes}\n${editNote}`
        : editNote
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
