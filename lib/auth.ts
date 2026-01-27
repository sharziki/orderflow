import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'admin_session'

// Get JWT secret key
function getJWTSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
  return new TextEncoder().encode(secret)
}

/**
 * Verifies the admin password using bcrypt
 * @param password - The password to verify
 * @returns Promise<boolean> - True if password is correct
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
  const adminPasswordPlain = process.env.ADMIN_PASSWORD

  // Support both hashed and plain passwords for backward compatibility
  if (adminPasswordHash) {
    // Preferred: Use bcrypt hash
    return await bcrypt.compare(password, adminPasswordHash)
  } else if (adminPasswordPlain) {
    // Fallback: Plain password (less secure, for development)
    return password === adminPasswordPlain
  }

  // Default password for development only
  return password === 'admin123'
}

/**
 * Generates a bcrypt hash for a password
 * @param password - The password to hash
 * @returns Promise<string> - The bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return await bcrypt.hash(password, salt)
}

/**
 * Creates a secure JWT session token
 * @returns Promise<string> - The JWT token
 */
export async function createSessionToken(): Promise<string> {
  const secret = getJWTSecret()

  const token = await new SignJWT({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setIssuer('restaurant-ordering-system')
    .setAudience('admin-dashboard')
    .sign(secret)

  return token
}

/**
 * Verifies and decodes a JWT session token
 * @param token - The JWT token to verify
 * @returns Promise<boolean> - True if token is valid
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = getJWTSecret()

    const { payload } = await jwtVerify(token, secret, {
      issuer: 'restaurant-ordering-system',
      audience: 'admin-dashboard',
    })

    // Check if token has admin role
    if (payload.role !== 'admin') {
      return false
    }

    return true
  } catch (error) {
    // Token is invalid or expired
    return false
  }
}

/**
 * Rate limiting store (in-memory, for simple protection)
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

/**
 * Checks if an IP address has exceeded login attempt limits
 * @param ip - The IP address to check
 * @returns boolean - True if rate limit exceeded
 */
export function isRateLimited(ip: string): boolean {
  const MAX_ATTEMPTS = 5
  const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

  const now = Date.now()
  const attempt = loginAttempts.get(ip)

  if (!attempt) {
    return false
  }

  // Reset if window expired
  if (now > attempt.resetAt) {
    loginAttempts.delete(ip)
    return false
  }

  return attempt.count >= MAX_ATTEMPTS
}

/**
 * Records a failed login attempt
 * @param ip - The IP address that failed
 */
export function recordLoginAttempt(ip: string): void {
  const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
  const now = Date.now()
  const attempt = loginAttempts.get(ip)

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
  } else {
    attempt.count++
  }
}

/**
 * Clears login attempts for an IP (on successful login)
 * @param ip - The IP address to clear
 */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(loginAttempts.entries())
  entries.forEach(([ip, attempt]) => {
    if (now > attempt.resetAt) {
      loginAttempts.delete(ip)
    }
  })
}, 60 * 60 * 1000) // 1 hour

export { SESSION_COOKIE_NAME }
