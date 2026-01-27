import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, generateOrderNumber } from '@/lib/auth'

// GET /api/orders - List orders for current tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where = {
      tenantId: session.tenantId,
      ...(status && status !== 'all' && { status }),
      ...(type && type !== 'all' && { type }),
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ])
    
    // Get stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const stats = await prisma.order.groupBy({
      by: ['status', 'type'],
      where: {
        tenantId: session.tenantId,
        createdAt: { gte: today },
      },
      _count: true,
      _sum: { total: true },
    })
    
    return NextResponse.json({ 
      orders, 
      total, 
      stats,
      pagination: { limit, offset, hasMore: offset + orders.length < total }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST /api/orders - Create new order (from customer storefront)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      tenantSlug, // or tenantId
      type,
      customerName,
      customerEmail,
      customerPhone,
      items,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      scheduledFor,
      notes,
      tip,
      giftCardCode,
    } = body
    
    // Find tenant
    const tenant = await prisma.tenant.findFirst({
      where: tenantSlug 
        ? { slug: tenantSlug } 
        : { id: body.tenantId },
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    
    if (!tenant.isActive) {
      return NextResponse.json({ error: 'Restaurant is not accepting orders' }, { status: 400 })
    }
    
    // Validate required fields
    if (!type || !customerName || !customerPhone || !items?.length) {
      return NextResponse.json(
        { error: 'type, customerName, customerPhone, and items are required' },
        { status: 400 }
      )
    }
    
    if (type === 'delivery' && !deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }
    
    // Calculate totals
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
        where: { id: item.menuItemId, tenantId: tenant.id, isAvailable: true },
      })
      
      if (!menuItem) {
        return NextResponse.json(
          { error: `Item not found or unavailable: ${item.menuItemId}` },
          { status: 400 }
        )
      }
      
      let itemPrice = menuItem.price
      
      // Add option prices
      if (item.options) {
        // options: [{ optionGroupName, optionName, price }]
        for (const opt of item.options) {
          itemPrice += opt.price || 0
        }
      }
      
      const lineTotal = itemPrice * item.quantity
      subtotal += lineTotal
      
      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: itemPrice,
        options: item.options || [],
        specialRequests: item.specialRequests || '',
      })
    }
    
    // Check minimum order
    if (subtotal < tenant.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount is $${tenant.minOrderAmount.toFixed(2)}` },
        { status: 400 }
      )
    }
    
    // Calculate tax and fees
    const tax = subtotal * (tenant.taxRate / 100)
    const deliveryFee = type === 'delivery' ? tenant.deliveryFee : 0
    const tipAmount = tip || 0
    
    // Gift card handling
    let giftCardAmount = 0
    let giftCard = null
    
    if (giftCardCode) {
      giftCard = await prisma.giftCard.findFirst({
        where: { 
          code: giftCardCode.toUpperCase(), 
          tenantId: tenant.id,
          isActive: true,
          currentBalance: { gt: 0 },
        },
      })
      
      if (giftCard) {
        const orderTotal = subtotal + tax + deliveryFee + tipAmount
        giftCardAmount = Math.min(giftCard.currentBalance, orderTotal)
      }
    }
    
    const total = subtotal + tax + deliveryFee + tipAmount - giftCardAmount
    
    // Generate order number
    const orderNumber = await generateOrderNumber(tenant.id)
    
    // Create order
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          orderNumber,
          status: 'pending',
          type,
          customerName,
          customerEmail: customerEmail || '',
          customerPhone,
          deliveryAddress,
          deliveryLat,
          deliveryLng,
          items: orderItems,
          subtotal,
          tax,
          tip: tipAmount,
          deliveryFee,
          discount: 0,
          giftCardId: giftCard?.id,
          giftCardAmount,
          total,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          notes,
        },
      })
      
      // Deduct gift card balance
      if (giftCard && giftCardAmount > 0) {
        await tx.giftCard.update({
          where: { id: giftCard.id },
          data: { currentBalance: giftCard.currentBalance - giftCardAmount },
        })
      }
      
      return newOrder
    })
    
    return NextResponse.json({ 
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      },
      message: 'Order placed successfully!',
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 })
  }
}
