import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, generateOrderNumber } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeField, sanitizeEmail, sanitizePhone } from '@/lib/sanitize'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email'
import { checkOrderThrottle, formatThrottleMessage } from '@/lib/order-throttle'
import { calculatePrepTimeFromMenuItems } from '@/lib/prep-time'

// Validate promo code and return discount info
async function validatePromoCode(
  tenantId: string,
  code: string,
  subtotal: number,
  customerId?: string
): Promise<{ valid: boolean; discount: number; promoCodeId?: string; reason?: string }> {
  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  const promoCode = await prisma.promoCode.findUnique({
    where: {
      tenantId_code: { tenantId, code: normalizedCode },
    },
  })
  
  if (!promoCode || !promoCode.isActive) {
    return { valid: false, discount: 0, reason: 'Invalid or inactive promo code' }
  }
  
  if (promoCode.startsAt && promoCode.startsAt > new Date()) {
    return { valid: false, discount: 0, reason: 'Promo code not yet active' }
  }
  
  if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
    return { valid: false, discount: 0, reason: 'Promo code expired' }
  }
  
  if (promoCode.maxUsageCount !== null && promoCode.usageCount >= promoCode.maxUsageCount) {
    return { valid: false, discount: 0, reason: 'Promo code maximum usage reached' }
  }
  
  if (promoCode.minOrderAmount !== null && subtotal < promoCode.minOrderAmount) {
    return { valid: false, discount: 0, reason: `Minimum order $${promoCode.minOrderAmount.toFixed(2)} required` }
  }
  
  if (promoCode.firstTimeOnly && customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (customer && customer.orderCount > 0) {
      return { valid: false, discount: 0, reason: 'First-time customers only' }
    }
  }
  
  if (promoCode.singleUse && customerId) {
    const previousUse = await prisma.order.findFirst({
      where: { customerId, promoCodeId: promoCode.id },
    })
    if (previousUse) {
      return { valid: false, discount: 0, reason: 'Already used this promo code' }
    }
  }
  
  let discount: number
  if (promoCode.discountType === 'percent') {
    discount = subtotal * (promoCode.discountValue / 100)
    if (promoCode.maxDiscountAmount !== null) {
      discount = Math.min(discount, promoCode.maxDiscountAmount)
    }
  } else {
    discount = Math.min(promoCode.discountValue, subtotal)
  }
  
  return { valid: true, discount: Math.round(discount * 100) / 100, promoCodeId: promoCode.id }
}

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
    const scheduledDate = body.scheduledDate // "2024-01-15" format for future date orders
    const notes = sanitizeField(body.notes)
    const tip = body.tip
    const giftCardCode = body.giftCardCode
    const promoCode = body.promoCode // NEW: promo code
    const loyaltyPointsToRedeem = body.loyaltyPointsToRedeem // NEW: loyalty points redemption
    const customerId = body.customerId // NEW: link order to customer
    
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
    
    // Check order throttling
    const throttleResult = await checkOrderThrottle(tenant.id)
    if (!throttleResult.allowed) {
      return NextResponse.json(
        { 
          error: formatThrottleMessage(throttleResult),
          nextAvailableTime: throttleResult.nextAvailableTime?.toISOString(),
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(throttleResult.retryAfterSeconds || 60),
          },
        }
      )
    }
    
    // Validate future date orders
    if (scheduledDate) {
      const scheduledDateObj = new Date(scheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(scheduledDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled date format. Use YYYY-MM-DD format.' },
          { status: 400 }
        )
      }
      
      if (scheduledDateObj < today) {
        return NextResponse.json(
          { error: 'Scheduled date must be today or in the future' },
          { status: 400 }
        )
      }
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
    
    // Promo code handling
    let promoCodeDiscount = 0
    let validatedPromoCodeId: string | undefined
    
    if (promoCode) {
      const promoResult = await validatePromoCode(tenant.id, promoCode, subtotal, customerId)
      if (!promoResult.valid) {
        return NextResponse.json(
          { error: promoResult.reason || 'Invalid promo code' },
          { status: 400 }
        )
      }
      promoCodeDiscount = promoResult.discount
      validatedPromoCodeId = promoResult.promoCodeId
    }
    
    // Loyalty points redemption
    let loyaltyDiscount = 0
    let loyaltyPointsRedeemed = 0
    
    if (loyaltyPointsToRedeem && customerId && tenant.loyaltyEnabled) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { loyaltyPoints: true },
      })
      
      if (customer && customer.loyaltyPoints >= loyaltyPointsToRedeem) {
        // Points must be in increments of redemption rate
        const redemptionRate = tenant.loyaltyPointsRedemptionRate
        const redemptionValue = tenant.loyaltyRedemptionValue
        
        if (loyaltyPointsToRedeem % redemptionRate === 0) {
          loyaltyPointsRedeemed = loyaltyPointsToRedeem
          loyaltyDiscount = (loyaltyPointsToRedeem / redemptionRate) * redemptionValue
        }
      }
    }
    
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
        const orderTotal = subtotal + tax + deliveryFee + tipAmount - promoCodeDiscount - loyaltyDiscount
        giftCardAmount = Math.min(giftCard.currentBalance, orderTotal)
      }
    }
    
    // Calculate loyalty points to earn (based on subtotal after discounts)
    let loyaltyPointsEarned = 0
    if (tenant.loyaltyEnabled && (customerId || customerPhone)) {
      const earnableAmount = subtotal - promoCodeDiscount
      loyaltyPointsEarned = Math.floor(earnableAmount * tenant.loyaltyPointsPerDollar)
    }
    
    const totalDiscount = promoCodeDiscount + loyaltyDiscount
    const total = subtotal + tax + deliveryFee + tipAmount - totalDiscount - giftCardAmount
    
    // Create or update customer record by phone number
    let resolvedCustomerId = customerId
    if (customerPhone && !resolvedCustomerId) {
      const customer = await prisma.customer.upsert({
        where: {
          tenantId_phone: { tenantId: tenant.id, phone: customerPhone },
        },
        create: {
          tenantId: tenant.id,
          phone: customerPhone,
          email: customerEmail || null,
          name: customerName,
        },
        update: {
          email: customerEmail || undefined,
          name: customerName || undefined,
        },
      })
      resolvedCustomerId = customer.id
    }
    
    // Generate order number
    const orderNumber = await generateOrderNumber(tenant.id)
    
    // Calculate prep time from menu items
    const menuItemsForPrepTime = await prisma.menuItem.findMany({
      where: {
        id: { in: orderItems.map(item => item.menuItemId) },
        tenantId: tenant.id,
      },
      select: {
        id: true,
        prepTimeMinutes: true,
      },
    })
    
    const estimatedPrepMinutes = calculatePrepTimeFromMenuItems(
      orderItems.map(item => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      menuItemsForPrepTime
    )
    
    // Create order
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          customerId: resolvedCustomerId || null,
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
          discount: totalDiscount,
          promoCodeId: validatedPromoCodeId || null,
          promoCodeDiscount,
          giftCardId: giftCard?.id,
          giftCardAmount,
          loyaltyPointsEarned,
          loyaltyPointsRedeemed,
          total,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          scheduledDate: scheduledDate || null,
          estimatedPrepMinutes,
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
      
      // Increment promo code usage
      if (validatedPromoCodeId) {
        await tx.promoCode.update({
          where: { id: validatedPromoCodeId },
          data: { usageCount: { increment: 1 } },
        })
      }
      
      // Update customer loyalty and stats
      if (resolvedCustomerId) {
        await tx.customer.update({
          where: { id: resolvedCustomerId },
          data: {
            loyaltyPoints: {
              increment: loyaltyPointsEarned - loyaltyPointsRedeemed,
            },
            totalSpent: { increment: total },
            orderCount: { increment: 1 },
          },
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
