import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  verifyAdminPassword,
  createSessionToken,
  isRateLimited,
  recordLoginAttempt,
  clearLoginAttempts,
  SESSION_COOKIE_NAME,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Verify password using bcrypt
    const isValid = await verifyAdminPassword(password)

    if (!isValid) {
      // Record failed attempt
      recordLoginAttempt(ip)

      // Use timing-safe response (always take similar time)
      await new Promise(resolve => setTimeout(resolve, 100))

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Clear any previous failed attempts
    clearLoginAttempts(ip)

    // Create secure JWT session token
    const sessionToken = await createSessionToken()

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' to 'strict' for better CSRF protection
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return NextResponse.json(
      { success: true },
      {
        headers: {
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
