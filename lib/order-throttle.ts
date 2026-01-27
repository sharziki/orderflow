/**
 * Order Throttling Utilities
 * 
 * Limits the number of orders a tenant can receive within a time window.
 * This prevents kitchen overload during peak times.
 */

import { prisma } from './db'

export interface ThrottleResult {
  allowed: boolean
  currentCount: number
  maxOrders: number | null
  windowMinutes: number | null
  windowStart: Date
  windowEnd: Date
  nextAvailableTime?: Date
  retryAfterSeconds?: number
}

/**
 * Check if a new order is allowed based on tenant throttling settings
 * 
 * @param tenantId - Tenant ID to check
 * @returns ThrottleResult with allowed status and timing info
 */
export async function checkOrderThrottle(tenantId: string): Promise<ThrottleResult> {
  // Get tenant throttling settings
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      maxOrdersPerWindow: true,
      orderWindowMinutes: true,
    },
  })

  const now = new Date()

  // If no throttling configured, always allow
  if (!tenant?.maxOrdersPerWindow || !tenant?.orderWindowMinutes) {
    return {
      allowed: true,
      currentCount: 0,
      maxOrders: null,
      windowMinutes: null,
      windowStart: now,
      windowEnd: now,
    }
  }

  const windowMinutes = tenant.orderWindowMinutes
  const maxOrders = tenant.maxOrdersPerWindow

  // Calculate window boundaries
  // Window starts at the most recent window boundary
  const windowMs = windowMinutes * 60 * 1000
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs)
  const windowEnd = new Date(windowStart.getTime() + windowMs)

  // Count orders in current window
  const currentCount = await prisma.order.count({
    where: {
      tenantId,
      createdAt: {
        gte: windowStart,
        lt: windowEnd,
      },
      // Don't count cancelled orders
      status: {
        not: 'cancelled',
      },
    },
  })

  if (currentCount >= maxOrders) {
    // Calculate when next window starts
    const nextAvailableTime = windowEnd
    const retryAfterSeconds = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)

    return {
      allowed: false,
      currentCount,
      maxOrders,
      windowMinutes,
      windowStart,
      windowEnd,
      nextAvailableTime,
      retryAfterSeconds,
    }
  }

  return {
    allowed: true,
    currentCount,
    maxOrders,
    windowMinutes,
    windowStart,
    windowEnd,
  }
}

/**
 * Format throttle error message for customer
 * 
 * @param result - ThrottleResult from checkOrderThrottle
 * @returns User-friendly error message
 */
export function formatThrottleMessage(result: ThrottleResult): string {
  if (result.allowed) {
    return ''
  }

  const waitMinutes = Math.ceil((result.retryAfterSeconds ?? 0) / 60)
  
  if (waitMinutes <= 1) {
    return 'We are at capacity. Please try again in a moment.'
  }
  
  return `We are at capacity. Please try again in ${waitMinutes} minutes.`
}

/**
 * Get order availability info for display
 * 
 * @param tenantId - Tenant ID to check
 * @returns Object with availability info
 */
export async function getOrderAvailability(tenantId: string): Promise<{
  accepting: boolean
  spotsRemaining: number | null
  windowEnds: Date | null
  message?: string
}> {
  const result = await checkOrderThrottle(tenantId)

  if (!result.maxOrders) {
    return {
      accepting: true,
      spotsRemaining: null,
      windowEnds: null,
    }
  }

  const spotsRemaining = result.maxOrders - result.currentCount

  if (!result.allowed) {
    return {
      accepting: false,
      spotsRemaining: 0,
      windowEnds: result.windowEnd,
      message: formatThrottleMessage(result),
    }
  }

  return {
    accepting: true,
    spotsRemaining,
    windowEnds: result.windowEnd,
    message: spotsRemaining <= 3 
      ? `Only ${spotsRemaining} order spots remaining in this window`
      : undefined,
  }
}
