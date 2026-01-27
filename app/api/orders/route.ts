import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { doorDashService } from '@/lib/doordash'
import {
  handleApiError,
  AppError,
  validateRequired,
  normalizePhone,
  normalizeAddress,
  isValidEmail,
  calculateOrderFees,
  toCents,
  logRequest
} from '@/lib/api-utils'
import { createId } from '@paralleldrive/cuid2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    logRequest('POST', '/api/orders', { orderType: body.orderType, itemCount: body.items?.length })

    const { customer, items, orderType, deliveryAddress, deliveryCoordinates, apartmentUnit, gateCodeInstructions, notes, deliveryFeeCents, tipCents, doordashAcceptedDeliveryId, scheduledPickupTime, giftCardCode, giftCardAmountUsed } = body

    // Validate required fields
    validateRequired(body, ['customer', 'items', 'orderType'])
    validateRequired(customer, ['name', 'email'])

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400, 'INVALID_ITEMS')
    }

    if (orderType !== 'PICKUP' && orderType !== 'DELIVERY') {
      throw new AppError('Invalid order type. Must be PICKUP or DELIVERY', 400, 'INVALID_ORDER_TYPE')
    }

    if (orderType === 'DELIVERY' && !deliveryAddress) {
      throw new AppError('Delivery address is required for delivery orders', 400, 'MISSING_ADDRESS')
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      if (!item.id || !item.quantity || item.quantity < 1) {
        throw new AppError('Invalid item data', 400, 'INVALID_ITEM_DATA')
      }

      const { data: menuItemData, error: menuItemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', item.id)
        .single()

      const menuItem = menuItemData as any

      if (menuItemError || !menuItem) {
        throw new AppError(`Menu item not found: ${item.id}`, 404, 'MENU_ITEM_NOT_FOUND')
      }

      if (!menuItem.available) {
        throw new AppError(`Menu item "${menuItem.name}" is currently unavailable`, 400, 'ITEM_UNAVAILABLE')
      }

      const itemTotal = menuItem.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        menuItemId: item.id,
        quantity: item.quantity,
        price: menuItem.price,
        name: menuItem.name
      })
    }

    // Calculate fees using centralized function
    // Note: Gift card discount is applied AFTER fee calculation (gift cards don't cover fees)
    const fees = calculateOrderFees(subtotal, orderType, deliveryFeeCents, tipCents)
    
    // Apply gift card discount if provided (only to food+tax, not delivery fees)
    const giftCardDiscount = giftCardAmountUsed || 0
    const foodTaxTotal = subtotal + fees.tax
    const foodTaxAfterGiftCard = Math.max(0, foodTaxTotal - giftCardDiscount)
    
    // Recalculate Stripe fee only on the amount actually charged (after gift card)
    const amountToChargeCard = foodTaxAfterGiftCard + fees.deliveryFee + fees.merchantDeliveryFee + fees.tip
    const adjustedStripeFee = amountToChargeCard > 0 ? (amountToChargeCard * 0.029) + 0.30 : 0
    const finalAmountAfterGiftCard = amountToChargeCard + adjustedStripeFee
    
    // Update fees to reflect gift card discount
    const adjustedFees = {
      ...fees,
      stripeFee: adjustedStripeFee,
      total: finalAmountAfterGiftCard,
      giftCardDiscount: giftCardDiscount,
    }

    // Create or find customer
    const normalizedPhone = normalizePhone(customer.phone)
    const customerEmail = isValidEmail(customer.email)
      ? customer.email
      : `guest+${Date.now()}@example.test`

    // Check if customer exists
    const { data: existingCustomerData } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .single()

    let customerRecord = existingCustomerData as any

    if (!customerRecord) {
      const now = new Date().toISOString()
      const { data: newCustomerData, error: customerError } = await (supabase
        .from('customers') as any)
        .insert({
          id: createId(),
          name: customer.name.trim(),
          email: customerEmail,
          phone: normalizedPhone,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single()

      if (customerError) {
        console.error('Error creating customer:', customerError)
        throw new AppError('Failed to create customer record', 500, 'CUSTOMER_CREATE_ERROR')
      }

      customerRecord = newCustomerData
    }

    // Create order in database
    const orderId = createId()
    const now = new Date().toISOString()
      // Build order notes including gift card info if applicable
      let orderNotes = notes?.trim() || ''
      if (giftCardCode && giftCardAmountUsed > 0) {
        const giftCardNote = `\n\n[Gift Card Applied]\nCode: ${giftCardCode}\nAmount Used: $${giftCardAmountUsed.toFixed(2)}`
        orderNotes = orderNotes ? orderNotes + giftCardNote : giftCardNote.trim()
      }

      const { data: orderData, error: orderError } = await (supabase
        .from('orders') as any)
        .insert({
          id: orderId,
          customerId: customerRecord.id,
          orderType: orderType,
          totalAmount: adjustedFees.subtotal,
          deliveryFee: adjustedFees.deliveryFee,
          merchantDeliveryFee: adjustedFees.merchantDeliveryFee,
          stripeFee: adjustedFees.stripeFee,
          tax: adjustedFees.tax,
          finalAmount: adjustedFees.total,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
          notes: orderNotes || null,
          doordashOrderId: doordashAcceptedDeliveryId || null,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single()

    const order = orderData as any

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new AppError('Failed to create order', 500, 'ORDER_CREATE_ERROR')
    }

    // Create order items
    const itemTimestamp = new Date().toISOString()
    const orderItemsToInsert = orderItems.map(item => ({
      id: createId(),
      orderId: order.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      createdAt: itemTimestamp
    }))

    const { error: itemsError } = await (supabase
      .from('order_items') as any)
      .insert(orderItemsToInsert)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
    }

    // Fetch the full order with items
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .eq('id', order.id)
      .single()

    console.log('[Orders API] Created order:', {
      id: order.id,
      finalAmount: order.final_amount,
      type: order.order_type,
      customer: customerEmail
    })

    // Handle DoorDash delivery if needed and not already accepted
    if (orderType === 'DELIVERY' && !doordashAcceptedDeliveryId) {
      try {
        const pickupAddress = process.env.DOORDASH_PICKUP_ADDRESS || '607 SE 5th St, Bentonville, AR 72712'
        const pickupPhone = process.env.DOORDASH_PICKUP_PHONE || '+14792735400'
        const pickupName = process.env.DOORDASH_PICKUP_BUSINESS_NAME || 'Blu Fish Bentonville'

        // Split customer name into first and last for DoorDash
        const nameParts = customerRecord.name.trim().split(/\s+/)
        const dropoffGivenName = nameParts[0] || 'Customer'
        const dropoffFamilyName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

        // Build comprehensive delivery instructions
        let deliveryInstructions = []
        if (apartmentUnit) {
          deliveryInstructions.push(`Unit: ${apartmentUnit}`)
        }
        if (gateCodeInstructions) {
          deliveryInstructions.push(gateCodeInstructions)
        }
        if (notes) {
          deliveryInstructions.push(notes)
        }
        if (deliveryInstructions.length === 0) {
          deliveryInstructions.push("Please call upon arrival")
        }
        const finalInstructions = deliveryInstructions.join('. ')

        // Build full dropoff address with apartment/unit if provided
        // Normalize the base address first, then append apartment unit
        const normalizedBaseAddress = normalizeAddress(deliveryAddress)
        const fullDropoffAddress = apartmentUnit
          ? `${normalizedBaseAddress}, ${apartmentUnit}`
          : normalizedBaseAddress

        // Business and Store IDs are REQUIRED for successful DoorDash requests
        const pickupExternalBusinessId = process.env.DOORDASH_BUSINESS_ID || 'default'
        const pickupExternalStoreId = process.env.DOORDASH_STORE_ID || 'a65aa178-2ea5-4cfb-8994-e9259a270565'

        const deliveryData = {
          external_delivery_id: order.id,
          pickup_address: pickupAddress,
          pickup_phone_number: pickupPhone,
          pickup_business_name: pickupName,
          pickup_external_business_id: pickupExternalBusinessId,
          pickup_external_store_id: pickupExternalStoreId,
          pickup_instructions: "Please call when you arrive",
          dropoff_address: fullDropoffAddress,
          dropoff_phone_number: normalizedPhone || "+14792735400",
          dropoff_instructions: finalInstructions,
          dropoff_contact_given_name: dropoffGivenName,
          dropoff_contact_family_name: dropoffFamilyName,
          dropoff_contact_send_notifications: true, // Allow customer to receive DoorDash notifications
          order_value: toCents(fees.subtotal),
          currency: "USD",
          items: items.map((item: any) => ({
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            price: toCents(item.price)
          })),
          ...(tipCents ? { tip: tipCents } : {}),
          // Add coordinates if available for better location precision
          ...(deliveryCoordinates?.lat && deliveryCoordinates?.lng ? {
            dropoff_location: {
              lat: deliveryCoordinates.lat,
              lng: deliveryCoordinates.lng
            }
          } : {})
        }

        // Check if we have real API keys
        const hasApiKeys = process.env.DOORDASH_API_KEY &&
                          process.env.DOORDASH_API_KEY !== 'your_doordash_api_key_here' &&
                          process.env.DOORDASH_SECRET &&
                          process.env.DOORDASH_DEVELOPER_ID

        console.log('[DoorDash] Creating delivery:', {
          hasApiKeys,
          orderId: order.id,
          dropoffAddress: deliveryAddress
        })

        let deliveryResponse
        if (hasApiKeys) {
          deliveryResponse = await doorDashService.createDelivery(deliveryData)
        } else {
          console.warn('[DoorDash] Using mock delivery - API keys not configured')
          deliveryResponse = await doorDashService.createMockDelivery(deliveryData)
        }

        // Update order with DoorDash delivery ID
        await (supabase
          .from('orders') as any)
          .update({ doordashOrderId: deliveryResponse.delivery_id })
          .eq('id', order.id)

        console.log('[DoorDash] Delivery created:', deliveryResponse.delivery_id)
      } catch (error) {
        console.error('[DoorDash] Delivery creation failed:', error)
        // Log but don't fail the order - customer has already paid
        // In production, you might want to trigger an alert here
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: fullOrder || order,
      message: orderType === 'PICKUP'
        ? 'Order placed successfully! Please come to pick it up.'
        : 'Order placed successfully! Delivery is being arranged.'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error, 'POST /api/orders')
  }
}

export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/orders')

    // Optional filters via query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const limit = searchParams.get('limit')

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .order('createdAt', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (orderType) {
      query = query.eq('orderType', orderType)
    }
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: ordersData, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      throw new AppError('Failed to fetch orders', 500, 'FETCH_ERROR')
    }

    const orders = (ordersData || []) as any[]

    // Data is already in camelCase from Supabase, just return it
    return NextResponse.json(orders)
  } catch (error) {
    return handleApiError(error, 'GET /api/orders')
  }
}

