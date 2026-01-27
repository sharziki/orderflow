import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (use Redis/Upstash in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute
}

// Stricter limits for auth endpoints
const AUTH_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per 15 minutes
}

// Very strict for password reset
const RESET_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 attempts per hour
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    const keys = Array.from(rateLimitStore.keys())
    for (const k of keys) {
      const v = rateLimitStore.get(k)
      if (v && v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return { success: true, remaining: config.max - 1, reset: now + config.windowMs }
  }

  if (entry.count >= config.max) {
    // Rate limited
    return { success: false, remaining: 0, reset: entry.resetTime }
  }

  // Increment
  entry.count++
  rateLimitStore.set(key, entry)
  return { success: true, remaining: config.max - entry.count, reset: entry.resetTime }
}

export function rateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  )
}

// Middleware helper
export function checkRateLimit(
  req: NextRequest,
  type: 'default' | 'auth' | 'reset' = 'default'
): { success: boolean; response?: NextResponse } {
  const ip = getClientIp(req)
  const path = req.nextUrl.pathname
  const key = `${type}:${ip}:${path}`

  const config = type === 'auth' ? AUTH_CONFIG : type === 'reset' ? RESET_CONFIG : DEFAULT_CONFIG
  const result = rateLimit(key, config)

  if (!result.success) {
    return { success: false, response: rateLimitResponse(result.reset) }
  }

  return { success: true }
}

// Wrap API handler with rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: 'default' | 'auth' | 'reset' = 'default'
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { success, response } = checkRateLimit(req, type)
    
    if (!success && response) {
      return response
    }

    return handler(req)
  }
}
