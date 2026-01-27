/**
 * Environment variable validation
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string
  DIRECT_URL?: string

  // DoorDash
  DOORDASH_API_KEY: string
  DOORDASH_SECRET: string
  DOORDASH_DEVELOPER_ID: string
  DOORDASH_BASE_URL: string
  DOORDASH_PICKUP_ADDRESS: string
  DOORDASH_PICKUP_PHONE: string
  DOORDASH_PICKUP_BUSINESS_NAME: string
  DOORDASH_BUSINESS_ID?: string // Optional, defaults to 'default'
  DOORDASH_STORE_ID?: string // Optional, defaults to 'a65aa178-2ea5-4cfb-8994-e9259a270565'

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string

  // Admin Auth
  ADMIN_PASSWORD_HASH?: string
  ADMIN_PASSWORD?: string
  SESSION_SECRET: string

  // Environment
  NODE_ENV: string
  NEXT_PUBLIC_APP_URL?: string
}

function validateEnv(): EnvConfig {
  const requiredVars = [
    'DATABASE_URL',
    'DOORDASH_API_KEY',
    'DOORDASH_SECRET',
    'DOORDASH_DEVELOPER_ID',
    'DOORDASH_BASE_URL',
    'DOORDASH_PICKUP_ADDRESS',
    'DOORDASH_PICKUP_PHONE',
    'DOORDASH_PICKUP_BUSINESS_NAME',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SESSION_SECRET',
  ]

  const missing: string[] = []
  const warnings: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  // Check for admin authentication
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    warnings.push('ADMIN_PASSWORD_HASH or ADMIN_PASSWORD should be set for admin authentication')
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.STRIPE_SECRET_KEY?.includes('test')) {
      warnings.push('Using Stripe test keys in production mode')
    }

    if (process.env.DOORDASH_BASE_URL?.includes('sandbox')) {
      warnings.push('Using DoorDash sandbox in production mode')
    }

    if (!process.env.ADMIN_PASSWORD_HASH) {
      warnings.push('ADMIN_PASSWORD_HASH should be used instead of ADMIN_PASSWORD in production')
    }

    if (process.env.SESSION_SECRET === 'change-this-to-a-random-string-in-production-min-32-chars') {
      throw new Error('SESSION_SECRET must be changed from default value in production')
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}`
    )
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'development') {
    console.warn(
      `⚠️  Environment configuration warnings:\n${warnings.map(w => `  - ${w}`).join('\n')}`
    )
  }

  return process.env as unknown as EnvConfig
}

// Validate on import
export const env = validateEnv()

// Helper to check if we're in production
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'
