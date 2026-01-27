import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, generateOrderNumber } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeField, sanitizeEmail, sanitizePhone } from '@/lib/sanitize'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email'

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
  // Rate limit: 10 orders per minute per IP
  const rateCheck = checkRateLimit(req, 'order')
  if (!rateCheck.success && rateCheck.response) {
    return rateCheck.response
  }

  try {
    const body = await req.json()
    
    // Sanitize user input
    const tenantSlug = body.tenantSlug // or tenantId
    const type = body.type
    const customerName = sanitizeField(body.customerName)
    const customerEmail = sanitizeEmail(body.customerEmail)
    const customerPhone = sanitizePhone(body.customerPhone)
    const items = body.items
    const deliveryAddress = sanitizeField(body.deliveryAddress)
    const deliveryLat = body.deliveryLat
    const deliveryLng = body.deliveryLng
    const scheduledFor = body.scheduledFor
    const notes = sanitizeField(body.notes)
    const tip = body.tip
    const giftCardCode = body.giftCardCode
    
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
    
    // Send email notifications (fire and forget - don't block response)
    const emailPromises: Promise<void>[] = []
    
    // Send confirmation to customer
    if (customerEmail) {
      emailPromises.push(
        sendOrderConfirmation(customerEmail, {
          orderNumber: order.orderNumber,
          customerName,
          items: orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          tax,
          deliveryFee: type === 'delivery' ? deliveryFee : undefined,
          tip: tipAmount || undefined,
          total: order.total,
          type: type as 'pickup' | 'delivery',
          restaurantName: tenant.name,
          restaurantPhone: tenant.phone || undefined,
          restaurantAddress: tenant.address ? `${tenant.address}, ${tenant.city}, ${tenant.state} ${tenant.zip}` : undefined,
          estimatedTime: scheduledFor ? new Date(scheduledFor).toLocaleString() : undefined,
        })
      )
    }
    
    // Send alert to restaurant
    if (tenant.email) {
      emailPromises.push(
        sendNewOrderNotification(tenant.email, {
          orderNumber: order.orderNumber,
          customerName,
          total: order.total,
          itemCount: orderItems.length,
          type: type as 'pickup' | 'delivery',
        })
      )
    }
    
    // Don't await - let emails send in background
    Promise.all(emailPromises).catch(err => {
      console.error('[Orders] Email notification error:', err)
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
