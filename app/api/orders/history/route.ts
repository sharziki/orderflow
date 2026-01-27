import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizePhone } from '@/lib/sanitize'

// Order item type for reordering
interface ReorderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
  options: any[]
  specialRequests: string
}

// GET /api/orders/history - Get order history by phone number
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    const tenantSlug = searchParams.get('tenantSlug')
    const tenantId = searchParams.get('tenantId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }
    
    // Sanitize phone number
    const sanitizedPhone = sanitizePhone(phone)
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }
    
    // Build tenant filter
    let tenantFilter: { id?: string; slug?: string } = {}
    if (tenantId) {
      tenantFilter = { id: tenantId }
    } else if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      })
      if (!tenant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        )
      }
      tenantFilter = { id: tenant.id }
    }
    
    // Get orders for this phone number
    const where = {
      customerPhone: sanitizedPhone,
      ...(tenantFilter.id && { tenantId: tenantFilter.id }),
      // Only show completed/delivered orders in history (not cancelled)
      status: {
        in: ['completed', 'ready', 'out_for_delivery'],
      },
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])
    
    // Transform orders to include reorder capability
    const ordersWithReorder = orders.map(order => {
      // Parse items and format for reordering
      const items = (order.items as unknown) as ReorderItem[]
      const reorderItems = items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        options: item.options || [],
        specialRequests: item.specialRequests || '',
      }))
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        tip: order.tip,
        deliveryFee: order.deliveryFee,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          options: item.options,
        })),
        tenant: order.tenant,
        // Reorder capability - items formatted for adding to cart
        reorderItems,
      }
    })
    
    return NextResponse.json({
      orders: ordersWithReorder,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + orders.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching order history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order history' },
      { status: 500 }
    )
  }
}
