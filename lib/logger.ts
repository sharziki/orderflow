type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  tenantId?: string
  orderId?: string
  orderNumber?: string
  paymentIntentId?: string
  deliveryId?: string
  eventId?: string
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  context?: LogContext
}

/**
 * Simple structured logger for OrderFlow
 * Outputs JSON format for easy parsing by log aggregators
 */
class Logger {
  private formatEntry(level: LogLevel, event: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    }
  }

  private log(level: LogLevel, event: string, context?: LogContext) {
    const entry = this.formatEntry(level, event, context)
    const output = JSON.stringify(entry)
    
    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.log(output)
        }
        break
      default:
        console.log(output)
    }
  }

  debug(event: string, context?: LogContext) {
    this.log('debug', event, context)
  }

  info(event: string, context?: LogContext) {
    this.log('info', event, context)
  }

  warn(event: string, context?: LogContext) {
    this.log('warn', event, context)
  }

  error(event: string, context?: LogContext) {
    this.log('error', event, context)
  }

  // ============================================
  // Domain-specific logging helpers
  // ============================================

  orderCreated(tenantId: string, orderId: string, orderNumber: string, total: number, type: string) {
    this.info('order_created', {
      tenantId,
      orderId,
      orderNumber,
      total,
      type,
    })
  }

  orderStatusChanged(tenantId: string, orderId: string, orderNumber: string, oldStatus: string, newStatus: string) {
    this.info('order_status_changed', {
      tenantId,
      orderId,
      orderNumber,
      oldStatus,
      newStatus,
    })
  }

  paymentProcessed(tenantId: string, orderId: string, paymentIntentId: string, amount: number, status: string) {
    this.info('payment_processed', {
      tenantId,
      orderId,
      paymentIntentId,
      amount,
      status,
    })
  }

  paymentFailed(tenantId: string, orderId: string, paymentIntentId: string, error: string) {
    this.error('payment_failed', {
      tenantId,
      orderId,
      paymentIntentId,
      error,
    })
  }

  deliveryRequested(tenantId: string, orderId: string, deliveryId: string, address: string) {
    this.info('delivery_requested', {
      tenantId,
      orderId,
      deliveryId,
      address,
    })
  }

  deliveryStatusChanged(orderId: string, deliveryId: string, oldStatus: string, newStatus: string) {
    this.info('delivery_status_changed', {
      orderId,
      deliveryId,
      oldStatus,
      newStatus,
    })
  }

  webhookReceived(source: string, eventId: string, eventType: string) {
    this.info('webhook_received', {
      source,
      eventId,
      eventType,
    })
  }

  webhookSkipped(source: string, eventId: string, reason: string) {
    this.info('webhook_skipped', {
      source,
      eventId,
      reason,
    })
  }

  webhookProcessed(source: string, eventId: string, eventType: string, durationMs: number) {
    this.info('webhook_processed', {
      source,
      eventId,
      eventType,
      durationMs,
    })
  }
}

export const logger = new Logger()
