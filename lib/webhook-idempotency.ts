import { prisma } from './db'
import { logger } from './logger'

type WebhookSource = 'stripe' | 'doordash'

/**
 * Check if a webhook event has already been processed
 * Returns true if already processed (should skip), false if new
 */
export async function isWebhookProcessed(
  eventId: string,
  source: WebhookSource
): Promise<boolean> {
  try {
    const existing = await prisma.processedWebhook.findUnique({
      where: { eventId },
    })
    return !!existing
  } catch (error) {
    // If we can't check, assume not processed to avoid losing events
    logger.warn('webhook_idempotency_check_failed', {
      eventId,
      source,
      error: (error as Error).message,
    })
    return false
  }
}

/**
 * Mark a webhook event as processed
 */
export async function markWebhookProcessed(
  eventId: string,
  source: WebhookSource,
  eventType: string
): Promise<void> {
  try {
    await prisma.processedWebhook.create({
      data: {
        eventId,
        source,
        eventType,
      },
    })
  } catch (error: any) {
    // Ignore unique constraint violations (concurrent processing)
    if (error.code === 'P2002') {
      logger.debug('webhook_already_marked', { eventId, source })
      return
    }
    logger.error('webhook_mark_processed_failed', {
      eventId,
      source,
      error: error.message,
    })
    throw error
  }
}

/**
 * Process a webhook with idempotency protection
 * Returns { processed: boolean, result?: T } where processed=false means it was a duplicate
 */
export async function processWebhookIdempotently<T>(
  eventId: string,
  source: WebhookSource,
  eventType: string,
  handler: () => Promise<T>
): Promise<{ processed: boolean; result?: T }> {
  // Check if already processed
  const alreadyProcessed = await isWebhookProcessed(eventId, source)
  if (alreadyProcessed) {
    logger.webhookSkipped(source, eventId, 'duplicate')
    return { processed: false }
  }

  const startTime = Date.now()
  
  // Process the webhook
  const result = await handler()
  
  // Mark as processed
  await markWebhookProcessed(eventId, source, eventType)
  
  const durationMs = Date.now() - startTime
  logger.webhookProcessed(source, eventId, eventType, durationMs)
  
  return { processed: true, result }
}

/**
 * Clean up old processed webhook records (optional maintenance)
 * Call this periodically to prevent table bloat
 */
export async function cleanupOldWebhooks(daysOld: number = 30): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysOld)
  
  const result = await prisma.processedWebhook.deleteMany({
    where: {
      processedAt: { lt: cutoff },
    },
  })
  
  if (result.count > 0) {
    logger.info('webhook_cleanup', { deletedCount: result.count, daysOld })
  }
  
  return result.count
}
