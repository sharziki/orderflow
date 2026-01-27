/**
 * DoorDash Webhook Handler
 * Handles delivery status updates from DoorDash
 * Documentation: https://developer.doordash.com/en-US/docs/drive/webhooks/
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleApiError, AppError, logRequest } from '@/lib/api-utils'
import crypto from 'crypto'

// Webhook event types
const WEBHOOK_EVENTS = {
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_UPDATED: 'delivery.updated',
  DELIVERY_CANCELLED: 'delivery.cancelled',
  DASHER_CONFIRMED: 'dasher.confirmed',
  DASHER_ARRIVED_AT_PICKUP: 'dasher.arrived_at_pickup',
  DASHER_PICKED_UP: 'dasher.picked_up',
  DASHER_ARRIVED_AT_DROPOFF: 'dasher.arrived_at_dropoff',
  DASHER_DROPPED_OFF: 'dasher.dropped_off',
}

/**
 * Verify webhook signature
 * DoorDash signs webhooks with HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/doordash/webhook')

    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-doordash-signature')

    // Verify webhook signature (optional in sandbox, required in production)
    if (process.env.NODE_ENV === 'production') {
      const webhookSecret = process.env.DOORDASH_WEBHOOK_SECRET
      if (!webhookSecret) {
        throw new AppError('DOORDASH_WEBHOOK_SECRET not configured', 500, 'CONFIG_ERROR')
      }

      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        throw new AppError('Invalid webhook signature', 401, 'INVALID_SIGNATURE')
      }
    }

    // Parse webhook payload
    const event = JSON.parse(rawBody)
    const {
      event_type,
      external_delivery_id,
      delivery_id,
      delivery_status,
      dasher_info,
      pickup_time,
      dropoff_time,
    } = event

    console.log('[DoorDash Webhook]', {
      eventType: event_type,
      deliveryId: delivery_id,
      externalId: external_delivery_id,
      status: delivery_status
    })

    // Find the order by external_delivery_id (which is our order ID)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${external_delivery_id},doordash_order_id.eq.${delivery_id}`)
      .single()

    const order = orderData as any

    if (!order) {
      console.warn('[DoorDash Webhook] Order not found:', external_delivery_id)
      // Return 200 to acknowledge receipt even if order not found
      return NextResponse.json({ received: true, message: 'Order not found' })
    }

    // Update order based on event type
    type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
    let orderStatus: OrderStatus = order.status as OrderStatus

    switch (event_type) {
      case WEBHOOK_EVENTS.DELIVERY_CREATED:
      case WEBHOOK_EVENTS.DASHER_CONFIRMED:
        // Delivery is confirmed and assigned
        if (order.status === 'PENDING') {
          orderStatus = 'CONFIRMED'
        }
        break

      case WEBHOOK_EVENTS.DASHER_ARRIVED_AT_PICKUP:
        // Dasher is at restaurant
        console.log('[DoorDash] Dasher arrived at pickup for order:', order.id)
        break

      case WEBHOOK_EVENTS.DASHER_PICKED_UP:
        // Food picked up, on the way to customer
        if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
          orderStatus = 'READY' // Or create a new "OUT_FOR_DELIVERY" status
        }
        break

      case WEBHOOK_EVENTS.DASHER_ARRIVED_AT_DROPOFF:
        // Dasher arrived at customer location
        console.log('[DoorDash] Dasher arrived at dropoff for order:', order.id)
        break

      case WEBHOOK_EVENTS.DASHER_DROPPED_OFF:
        // Delivery completed
        orderStatus = 'COMPLETED'
        break

      case WEBHOOK_EVENTS.DELIVERY_CANCELLED:
        // Delivery was cancelled
        orderStatus = 'CANCELLED'
        break

      default:
        console.log('[DoorDash Webhook] Unhandled event type:', event_type)
    }

    // Update order status if changed
    if (orderStatus !== order.status) {
      const { error: updateError } = await (supabase
        .from('orders') as any)
        .update({ status: orderStatus })
        .eq('id', order.id)

      if (updateError) {
        console.error(`[DoorDash Webhook] Error updating order status:`, updateError)
      } else {
        console.log(`[DoorDash Webhook] Updated order ${order.id} status: ${order.status} → ${orderStatus}`)
      }
    }

    // Store DoorDash delivery ID if not already set
    if (delivery_id && !order.doordash_order_id) {
      const { error: deliveryIdError } = await (supabase
        .from('orders') as any)
        .update({ doordash_order_id: delivery_id })
        .eq('id', order.id)

      if (deliveryIdError) {
        console.error(`[DoorDash Webhook] Error updating DoorDash order ID:`, deliveryIdError)
      }
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      orderId: order.id,
      eventType: event_type,
      statusUpdated: orderStatus !== order.status
    })

  } catch (error) {
    // Always return 200 for webhooks to prevent retries
    // But log the error for debugging
    console.error('[DoorDash Webhook] Error:', error)

    if (error instanceof AppError && error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    )
  }
}

// GET endpoint to test webhook configuration
export async function GET() {
  return NextResponse.json({
    message: 'DoorDash webhook endpoint is active',
    webhookUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/doordash/webhook`
      : 'Set NEXT_PUBLIC_APP_URL to see full webhook URL',
    events: Object.values(WEBHOOK_EVENTS)
  })
}
