import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleApiError, AppError, logRequest } from '@/lib/api-utils'

const VALID_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
const TRACKING_LINK_EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 hours

type RouteContext = {
  params: { orderId: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const orderId = context.params.orderId
  
  try {
    logRequest('GET', `/api/orders/${orderId}`)

    if (!orderId) {
      throw new AppError('Order ID is required', 400, 'MISSING_ORDER_ID')
    }

    const { data: orderData, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .eq('id', orderId)
      .single()

    const order = orderData as any

    if (error || !order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // Check if order tracking link is expired (2 hours)
    const orderAge = Date.now() - new Date(order.createdAt).getTime()

    if (orderAge > TRACKING_LINK_EXPIRY_MS) {
      throw new AppError('Tracking link has expired', 410, 'LINK_EXPIRED', {
        orderId: orderId,
        createdAt: order.createdAt,
        expiresAfterHours: 2
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    return handleApiError(error, `GET /api/orders/${orderId}`)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const orderId = context.params.orderId
  
  try {
    logRequest('PATCH', `/api/orders/${orderId}`)

    if (!orderId) {
      throw new AppError('Order ID is required', 400, 'MISSING_ORDER_ID')
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      throw new AppError('Status is required', 400, 'MISSING_STATUS')
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`,
        400,
        'INVALID_STATUS',
        { providedStatus: status, validStatuses: VALID_ORDER_STATUSES }
      )
    }

    const { data: existingOrderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    const existingOrder = existingOrderData as any

    if (fetchError || !existingOrder) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
    }

    const invalidTransitions: Record<string, string[]> = {
      'COMPLETED': ['PENDING', 'PREPARING', 'READY'],
      'CANCELLED': ['PENDING', 'PREPARING', 'READY', 'COMPLETED']
    }

    if (invalidTransitions[existingOrder.status]?.includes(status)) {
      throw new AppError(
        `Cannot change order from ${existingOrder.status} to ${status}`,
        400,
        'INVALID_STATUS_TRANSITION',
        { currentStatus: existingOrder.status, requestedStatus: status }
      )
    }

    const { data: updatedOrderData, error: updateError } = await (supabase
      .from('orders') as any)
      .update({ status })
      .eq('id', orderId)
      .select(`
        *,
        customer:customers(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .single()

    const updatedOrder = updatedOrderData as any

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw new AppError('Failed to update order', 500, 'UPDATE_ERROR')
    }

    console.log(`[Order Status Update] Order ${orderId}: ${existingOrder.status} → ${status}`)

    return NextResponse.json(updatedOrder)
  } catch (error) {
    return handleApiError(error, `PATCH /api/orders/${orderId}`)
  }
}
