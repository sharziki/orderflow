import { NextRequest, NextResponse } from 'next/server'
import { handleDoorDashWebhook, DoorDashWebhookEvent } from '@/lib/doordash-multi'
import { processWebhookIdempotently } from '@/lib/webhook-idempotency'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

/**
 * Verify DoorDash webhook signature (HMAC-SHA256)
 * DoorDash sends signature in X-DoorDash-Signature header
 * Format: "v1=<signature>" where signature is HMAC-SHA256(timestamp.body, secret)
 * 
 * Note: If a signing secret isn't configured for the tenant, we log a warning
 * but still process the webhook (with validation that the order exists)
 */
async function verifyDoorDashSignature(
  request: NextRequest,
  body: string,
  event: DoorDashWebhookEvent
): Promise<{ valid: boolean; reason?: string }> {
  const signature = request.headers.get('x-doordash-signature')
  const timestamp = request.headers.get('x-doordash-timestamp')
  
  // If no signature header, we can't verify but may still process
  // (DoorDash Drive may not always send signatures depending on setup)
  if (!signature) {
    logger.warn('doordash_no_signature', { 
      external_delivery_id: event.external_delivery_id,
      message: 'No signature header - relying on order validation'
    })
    return { valid: true, reason: 'no_signature_header' }
  }
  
  // Look up the order to get tenant's signing secret
  const order = await prisma.order.findFirst({
    where: { orderNumber: event.external_delivery_id },
    include: {
      tenant: {
        select: {
          doordashSigningSecret: true,
        },
      },
    },
  })
  
  if (!order) {
    // No order found - reject (could be spoofed)
    return { valid: false, reason: 'order_not_found' }
  }
  
  const signingSecret = order.tenant.doordashSigningSecret
  
  if (!signingSecret) {
    // No signing secret configured - can't verify but order exists
    logger.warn('doordash_no_secret', {
      external_delivery_id: event.external_delivery_id,
      message: 'No signing secret configured for tenant'
    })
    return { valid: true, reason: 'no_secret_configured' }
  }
  
  try {
    // Parse signature format: v1=<hex_signature>
    const signatureMatch = signature.match(/v1=([a-f0-9]+)/i)
    if (!signatureMatch) {
      return { valid: false, reason: 'invalid_signature_format' }
    }
    
    const providedSignature = signatureMatch[1]
    
    // Compute expected signature
    // DoorDash typically signs: timestamp.body
    const payload = timestamp ? `${timestamp}.${body}` : body
    const expectedSignature = crypto
      .createHmac('sha256', signingSecret)
      .update(payload)
      .digest('hex')
    
    // Constant-time comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSignature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    
    if (providedBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: 'signature_length_mismatch' }
    }
    
    const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    
    if (!isValid) {
      return { valid: false, reason: 'signature_mismatch' }
    }
    
    return { valid: true }
  } catch (error: any) {
    logger.error('doordash_signature_error', { 
      error: error.message,
      external_delivery_id: event.external_delivery_id
    })
    return { valid: false, reason: 'verification_error' }
  }
}

// POST /api/doordash/webhook - Handle DoorDash status updates
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    let event: DoorDashWebhookEvent
    
    try {
      event = JSON.parse(body) as DoorDashWebhookEvent
    } catch {
      logger.error('doordash_invalid_json', { message: 'Invalid JSON body' })
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    // Create unique event ID from delivery ID + status (DoorDash doesn't provide event IDs)
    const eventId = `doordash_${event.external_delivery_id}_${event.delivery_status || event.event_name}`
    const eventType = event.event_name || event.delivery_status || 'unknown'

    logger.webhookReceived('doordash', eventId, eventType)
    
    // Verify webhook signature
    const verification = await verifyDoorDashSignature(request, body, event)
    if (!verification.valid) {
      logger.error('doordash_signature_failed', { 
        reason: verification.reason,
        external_delivery_id: event.external_delivery_id
      })
      return NextResponse.json(
        { error: 'Invalid signature', reason: verification.reason },
        { status: 401 }
      )
    }

    // Process with idempotency protection
    const { processed, result } = await processWebhookIdempotently(
      eventId,
      'doordash',
      eventType,
      async () => {
        return handleDoorDashWebhook(event)
      }
    )

    if (processed && result?.success) {
      logger.deliveryStatusChanged(
        result.orderId || 'unknown',
        event.delivery_id || event.external_delivery_id,
        'previous',
        result.newStatus || 'unknown'
      )
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, processed, ...result })
  } catch (error: any) {
    logger.error('doordash_webhook_error', { error: error.message })
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
