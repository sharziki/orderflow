/**
 * Input Sanitization Utilities
 * Strips dangerous HTML/script content from user input
 */

/**
 * Strip HTML tags and script content from a string
 * Removes all HTML/XML tags, script blocks, and event handlers
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return ''
  if (typeof input !== 'string') return ''
  
  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove any remaining encoded characters that could be XSS
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sanitize an object's string fields recursively
 * Only sanitizes strings, leaves other types unchanged
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToSanitize?: string[]
): T {
  if (!obj || typeof obj !== 'object') return obj
  
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (fieldsToSanitize && !fieldsToSanitize.includes(key)) {
      // Skip fields not in the list
      result[key] = value
    } else if (typeof value === 'string') {
      result[key] = stripHtml(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' 
          ? stripHtml(item) 
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      )
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  
  return result as T
}

/**
 * Common fields that typically need sanitization
 */
export const SANITIZABLE_FIELDS = [
  'name',
  'customerName',
  'description',
  'notes',
  'message',
  'specialRequests',
  'instructions',
  'dropoff_instructions',
  'pickup_instructions',
] as const

/**
 * Sanitize common user input fields from a request body
 */
export function sanitizeUserInput<T extends Record<string, unknown>>(body: T): T {
  return sanitizeObject(body, [...SANITIZABLE_FIELDS])
}

/**
 * Sanitize a single field value, returning empty string if invalid
 */
export function sanitizeField(value: unknown): string {
  if (typeof value !== 'string') return ''
  return stripHtml(value)
}

/**
 * Validate and sanitize email (basic format check + sanitization)
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return ''
  const sanitized = stripHtml(email).toLowerCase().trim()
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize phone number (strip non-numeric except + and -)
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return ''
  return phone.replace(/[^0-9+\-() ]/g, '').trim()
}
