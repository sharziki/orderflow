import { NextRequest, NextResponse } from 'next/server'
import { handleDoorDashWebhook, DoorDashWebhookEvent } from '@/lib/doordash-multi'

// POST /api/doordash/webhook - Handle DoorDash status updates
export async function POST(request: NextRequest) {
  try {
    const event = await request.json() as DoorDashWebhookEvent
    
    console.log('[DoorDash Webhook] Received:', {
      event_name: event.event_name,
      external_delivery_id: event.external_delivery_id,
      delivery_status: event.delivery_status,
    })

    const result = await handleDoorDashWebhook(event)

    if (result.success) {
      console.log('[DoorDash Webhook] Updated order:', result.orderId, '→', result.newStatus)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, ...result })
  } catch (error: any) {
    console.error('[DoorDash Webhook] Error:', error.message)
    // Still return 200 to prevent retries
    return NextResponse.json({ received: true, error: error.message })
  }
}

// GET /api/doordash/webhook - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'DoorDash webhook receiver',
    timestamp: new Date().toISOString(),
  })
}
