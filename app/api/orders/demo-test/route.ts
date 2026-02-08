import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, generateOrderNumber } from '@/lib/auth'
import { DoorDashMultiTenant } from '@/lib/doordash-multi'

// POST /api/orders/demo-test - Create a demo test order
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        demoModeEnabled: true,
        taxRate: true,
        deliveryFee: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (!tenant.demoModeEnabled) {
      return NextResponse.json(
        { error: 'Demo mode must be enabled to place a test order' },
        { status: 400 }
      )
    }

    // Get a sample menu item for the test order
    const sampleItem = await prisma.menuItem.findFirst({
      where: { tenantId: tenant.id, isAvailable: true },
      select: { id: true, name: true, price: true },
    })

    if (!sampleItem) {
      return NextResponse.json(
        { error: 'No menu items available. Add at least one menu item to test.' },
        { status: 400 }
      )
    }

    // Generate demo order data
    const orderNumber = await generateOrderNumber(tenant.id)
    const testOrderNumber = `TEST-${orderNumber}`

    const orderItems = [
      {
        menuItemId: sampleItem.id,
        name: sampleItem.name,
        quantity: 1,
        price: sampleItem.price,
        options: [],
        specialRequests: 'DEMO ORDER - DO NOT PREPARE',
      },
    ]

    const subtotal = sampleItem.price
    const tax = subtotal * (tenant.taxRate / 100)
    const deliveryFee = tenant.deliveryFee
    const tip = 2.00 // Default test tip
    const total = subtotal + tax + deliveryFee + tip

    // Use restaurant's own address as delivery address for demo
    const deliveryAddress = tenant.address
      ? `${tenant.address}, ${tenant.city}, ${tenant.state} ${tenant.zip}`
      : '123 Demo Street, Test City, ST 12345'

    // Create the demo order
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber: testOrderNumber,
        status: 'pending',
        type: 'delivery',
        customerName: 'Demo Test User',
        customerEmail: tenant.email,
        customerPhone: tenant.phone || '(555) 123-4567',
        deliveryAddress,
        items: orderItems,
        subtotal,
        tax,
        tip,
        deliveryFee,
        discount: 0,
        total,
        notes: '🧪 DEMO TEST ORDER - This is a test order to verify your delivery integration. No real delivery will occur.',
        kitchenNotes: 'DEMO ORDER - DO NOT PREPARE',
      },
    })

    // Try to get a DoorDash quote
    let doordashQuote = null
    let doordashError = null

    try {
      const quoteRequest = {
        external_delivery_id: testOrderNumber,
        pickup_address: deliveryAddress,
        pickup_phone_number: tenant.phone || '+15555555555',
        pickup_business_name: tenant.name,
        dropoff_address: deliveryAddress,
        dropoff_phone_number: tenant.phone || '+15555555555',
        dropoff_contact_given_name: 'Demo',
        dropoff_contact_family_name: 'User',
        dropoff_contact_send_notifications: false,
        order_value: Math.round(subtotal * 100),
        currency: 'USD',
        tip: Math.round(tip * 100),
        items: orderItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: Math.round(item.price * 100),
        })),
      }

      doordashQuote = await DoorDashMultiTenant.createQuote(tenant.id, quoteRequest)
    } catch (err: any) {
      doordashError = err.message || 'Failed to get DoorDash quote'
      console.error('[Demo Test] DoorDash quote error:', err)
    }

    // Increment demo order count
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { demoOrderCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        items: orderItems,
        deliveryAddress,
        isDemo: true,
      },
      doordash: doordashQuote
        ? {
            success: true,
            quote: {
              fee: doordashQuote.fee / 100,
              estimatedPickupTime: doordashQuote.estimated_pickup_time,
              estimatedDropoffTime: doordashQuote.estimated_dropoff_time,
            },
          }
        : {
            success: false,
            error: doordashError,
          },
      message: doordashQuote
        ? '✅ Demo test order created successfully! DoorDash quote received.'
        : '⚠️ Demo test order created, but DoorDash quote failed. Check your DoorDash configuration.',
      nextSteps: [
        'Visit the Orders page to see your test order',
        'Update the order status to watch it flow through the system',
        doordashQuote
          ? 'DoorDash integration is working correctly!'
          : 'Fix DoorDash configuration and try again',
        'When done testing, disable demo mode from Settings',
      ],
    })
  } catch (error) {
    console.error('Error creating demo test order:', error)
    return NextResponse.json(
      { error: 'Failed to create demo test order' },
      { status: 500 }
    )
  }
}

// GET /api/orders/demo-test - Get demo test order summary
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent demo orders
    const demoOrders = await prisma.order.findMany({
      where: {
        tenantId: session.tenantId,
        orderNumber: { startsWith: 'TEST-' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        doordashDeliveryId: true,
      },
    })

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        demoModeEnabled: true,
        demoModeCompletedAt: true,
        demoOrderCount: true,
      },
    })

    return NextResponse.json({
      demoModeEnabled: tenant?.demoModeEnabled || false,
      demoModeCompletedAt: tenant?.demoModeCompletedAt,
      demoOrderCount: tenant?.demoOrderCount || 0,
      recentDemoOrders: demoOrders,
    })
  } catch (error) {
    console.error('Error fetching demo test summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demo test summary' },
      { status: 500 }
    )
  }
}
