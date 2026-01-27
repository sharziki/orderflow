import { logger } from './logger'

interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryCondition?: (error: any) => boolean
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  retryCondition: () => true, // Retry all errors by default
}

/**
 * Generic retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { context?: string } = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  const context = options.context || 'operation'
  
  let lastError: any
  let delay = opts.initialDelayMs

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if we should retry this error
      if (!opts.retryCondition(error)) {
        throw error
      }
      
      // If this was the last attempt, throw
      if (attempt > opts.maxRetries) {
        logger.error('retry_exhausted', {
          context,
          attempts: attempt,
          error: error.message,
        })
        throw error
      }
      
      logger.warn('retry_attempt', {
        context,
        attempt,
        maxRetries: opts.maxRetries,
        delayMs: delay,
        error: error.message,
      })
      
      // Wait before retrying
      await sleep(delay)
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs)
    }
  }
  
  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Stripe-specific retry: retry on rate limits and network errors
 */
export function isStripeRetryable(error: any): boolean {
  // Stripe rate limit
  if (error.type === 'StripeRateLimitError') return true
  if (error.statusCode === 429) return true
  
  // Network errors
  if (error.code === 'ECONNRESET') return true
  if (error.code === 'ETIMEDOUT') return true
  if (error.code === 'ENOTFOUND') return true
  
  // 5xx server errors
  if (error.statusCode >= 500 && error.statusCode < 600) return true
  
  return false
}

/**
 * DoorDash-specific retry: retry on rate limits and server errors
 */
export function isDoorDashRetryable(error: any): boolean {
  const status = error.response?.status || error.statusCode
  
  // Rate limit
  if (status === 429) return true
  
  // Network errors
  if (error.code === 'ECONNRESET') return true
  if (error.code === 'ETIMEDOUT') return true
  if (error.code === 'ENOTFOUND') return true
  
  // 5xx server errors
  if (status >= 500 && status < 600) return true
  
  return false
}

/**
 * Convenience wrapper for Stripe API calls
 */
export async function withStripeRetry<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  return withRetry(fn, {
    retryCondition: isStripeRetryable,
    context: context || 'stripe_api',
  })
}

/**
 * Convenience wrapper for DoorDash API calls
 */
export async function withDoorDashRetry<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  return withRetry(fn, {
    retryCondition: isDoorDashRetryable,
    context: context || 'doordash_api',
  })
}
