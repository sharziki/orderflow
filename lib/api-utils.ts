/**
 * API utility functions for error handling, logging, and response formatting
 */

import { NextResponse } from 'next/server'

export interface ApiError {
  message: string
  code?: string
  status: number
  details?: any
}

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Standardized error response handler
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  console.error(`[API Error${context ? ` - ${context}` : ''}]:`, error)

  // Handle AppError (custom errors)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.status }
    )
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any

    // Handle Supabase unique constraint violations (23505 is PostgreSQL unique violation)
    if (supabaseError.code === '23505' || supabaseError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'A record with this information already exists', code: 'DUPLICATE_RECORD' },
        { status: 409 }
      )
    }

    // Handle Supabase not found errors
    if (supabaseError.code === 'PGRST116' || supabaseError.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
  }

  // Handle axios errors (DoorDash API)
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any
    return NextResponse.json(
      {
        error: axiosError.response?.data?.message || 'External API request failed',
        code: 'EXTERNAL_API_ERROR',
        details: axiosError.response?.data,
      },
      { status: axiosError.response?.status || 500 }
    )
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  return NextResponse.json(
    { error: message, code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 }
  )
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Validation helper
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => !data[field])

  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'VALIDATION_ERROR',
      { missingFields: missing }
    )
  }
}

/**
 * Request logger
 */
export function logRequest(
  method: string,
  path: string,
  data?: any,
  userId?: string
): void {
  const timestamp = new Date().toISOString()
  const logData: any = {
    timestamp,
    method,
    path,
  }

  if (userId) logData.userId = userId
  if (data) logData.data = data

  console.log('[API Request]', JSON.stringify(logData))
}

/**
 * Parse and validate JSON body
 */
export async function parseJsonBody<T = any>(request: Request): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    throw new AppError('Invalid JSON in request body', 400, 'INVALID_JSON')
  }
}

/**
 * Phone number normalization
 * Converts phone numbers to E.164 international format (+[country code][number])
 * Handles US numbers (10 digits) by adding country code 1
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  
  // Remove all non-digit characters
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 0) return null
  
  // If already starts with +, check if it's valid format
  if (raw.trim().startsWith('+')) {
    // Already in international format, validate and return
    const cleaned = raw.trim()
    // Basic validation: should start with + followed by digits
    if (/^\+\d+$/.test(cleaned)) {
      return cleaned
    }
  }
  
  // Handle US numbers (10 digits) - add country code 1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // Handle US numbers with country code already (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // For other lengths, assume country code is included
  // Return with + prefix
  return `+${digits}`
}

/**
 * State name to abbreviation mapping
 */
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC'
}

/**
 * Normalize address to DoorDash-compatible format
 * Converts formats like "1200 SE J Street, Bentonville, Benton County, Arkansas, 72712, United States"
 * to "1200 SE J Street Bentonville, AR 72712"
 */
export function normalizeAddress(
  address: string | null | undefined,
  components?: Record<string, any>
): string {
  if (!address) return ''

  const trimmed = address.trim()
  
  // CRITICAL: Check for exact working format first: "Street City, ST ZIP"
  // This is the format that works with DoorDash: "1200 SE J Street Bentonville, AR 72712"
  const workingFormatPattern = /^(.+?),\s*([A-Z]{2})\s+(\d{5}(-\d{4})?)$/i
  const workingMatch = trimmed.match(workingFormatPattern)
  if (workingMatch) {
    // Already in working format - return EXACTLY as-is, don't modify
    return trimmed
  }
  
  // If already in correct format without comma (has state abbreviation followed by ZIP), return as-is
  // Pattern: "Street City ST ZIP"
  const correctFormatPattern = /^(.+?)\s+([A-Z]{2})\s+(\d{5}(-\d{4})?)$/i
  const match = trimmed.match(correctFormatPattern)
  if (match) {
    // Already in correct format: "Street City ST ZIP" - but add comma for consistency
    const [, streetCity, state, zip] = match
    return `${streetCity.trim()}, ${state.toUpperCase()} ${zip}`
  }

  // Try to extract from components if available (Nominatim format)
  if (components) {
    const houseNumber = components.house_number || components.house || ''
    const road = components.road || components.street || ''
    const city = components.city || components.town || components.village || components.municipality || ''
    const state = components.state || ''
    const postcode = components.postcode || components.postal_code || ''

    if (road && city && state && postcode) {
      const street = [houseNumber, road].filter(Boolean).join(' ').trim()
      const stateAbbr = STATE_ABBREVIATIONS[state.toLowerCase()] || (state.length === 2 ? state.toUpperCase() : state.toUpperCase().slice(0, 2))
      return `${street} ${city}, ${stateAbbr} ${postcode}`.trim()
    }
  }

  // Parse from display_name format (Nominatim)
  // Format: "Street, City, County, State, ZIP, Country"
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean)
  
  if (parts.length >= 4) {
    // Find ZIP code (usually 5 digits, sometimes 5-4)
    const zipIndex = parts.findIndex(p => /^\d{5}(-\d{4})?$/.test(p))
    if (zipIndex > 0 && zipIndex < parts.length) {
      const zip = parts[zipIndex]
      const state = parts[zipIndex - 1]
      const city = parts[zipIndex - 2]
      const street = parts.slice(0, zipIndex - 2).join(' ')

      if (street && city && state && zip) {
        const stateAbbr = STATE_ABBREVIATIONS[state.toLowerCase()] || (state.length === 2 ? state.toUpperCase() : state.toUpperCase().slice(0, 2))
        return `${street} ${city}, ${stateAbbr} ${zip}`.trim()
      }
    }
  }

  // Fallback: try to extract ZIP and state from anywhere in the string
  const zipMatch = trimmed.match(/\b(\d{5}(-\d{4})?)\b/)
  if (zipMatch) {
    const zip = zipMatch[1]
    const zipIndex = zipMatch.index!
    const beforeZip = trimmed.substring(0, zipIndex).trim()
    const afterZip = trimmed.substring(zipIndex + zip.length).trim()
    
    // Try to find state abbreviation (2 uppercase letters) before or after ZIP
    let stateAbbr = ''
    const stateAbbrBefore = beforeZip.match(/\b([A-Z]{2})\s*$/)?.[1]
    const stateAbbrAfter = afterZip.match(/^\s*([A-Z]{2})\b/)?.[1]
    
    if (stateAbbrBefore) {
      stateAbbr = stateAbbrBefore
    } else if (stateAbbrAfter) {
      stateAbbr = stateAbbrAfter
    } else {
      // Try to find full state name before ZIP
      const stateNameMatch = beforeZip.match(/\b([A-Za-z\s]+)\s*$/)
      if (stateNameMatch) {
        const stateName = stateNameMatch[1].trim()
        stateAbbr = STATE_ABBREVIATIONS[stateName.toLowerCase()] || stateName.toUpperCase().slice(0, 2)
      }
    }
    
    if (stateAbbr) {
      // Extract city (usually before state)
      const beforeState = beforeZip.replace(/\b([A-Z]{2}|\w+)\s*$/, '').trim()
      const cityMatch = beforeState.match(/\b([^,]+)\s*$/)
      const city = cityMatch ? cityMatch[1].trim() : ''
      const street = beforeState.replace(/\b[^,]+\s*$/, '').trim()
      
      if (street && city) {
        return `${street} ${city}, ${stateAbbr} ${zip}`.trim()
      } else if (city) {
        // If no clear street, use everything before city as street
        return `${beforeState} ${city}, ${stateAbbr} ${zip}`.trim()
      }
    }
  }

  // Last resort: return cleaned address
  return trimmed
}

/**
 * Email validation
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return /.+@.+\..+/.test(email)
}

/**
 * Convert dollars to cents for payment processing
 */
export function toCents(amount: number): number {
  return Math.max(100, Math.round(amount * 100))
}

/**
 * Convert cents to dollars
 */
export function toDollars(cents: number): number {
  return cents / 100
}

/**
 * Calculate order fees
 */
export interface OrderFees {
  subtotal: number
  tax: number
  deliveryFee: number
  merchantDeliveryFee: number
  tip: number
  stripeFee: number
  total: number
}

export function calculateOrderFees(
  subtotal: number,
  orderType: 'PICKUP' | 'DELIVERY',
  deliveryFeeCents?: number | null,
  tipCents?: number | null
): OrderFees {
  const tax = subtotal * 0.1025 // 10.25% tax
  const deliveryFee = orderType === 'DELIVERY' && deliveryFeeCents
    ? deliveryFeeCents / 100
    : 0
  const merchantDeliveryFee = orderType === 'DELIVERY' ? 1.00 : 0
  const tip = tipCents ? tipCents / 100 : 0

  // Calculate subtotal before Stripe fee
  const subtotalBeforeStripeFee = subtotal + tax + deliveryFee + merchantDeliveryFee + tip

  // Stripe fee: 2.9% + $0.30
  const stripeFee = (subtotalBeforeStripeFee * 0.029) + 0.30

  // Final total
  const total = subtotalBeforeStripeFee + stripeFee

  return {
    subtotal,
    tax,
    deliveryFee,
    merchantDeliveryFee,
    tip,
    stripeFee,
    total,
  }
}
