import { z } from 'zod'

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const signupSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
})

// ============================================
// MENU SCHEMAS
// ============================================

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
})

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative').max(10000, 'Price too high'),
  categoryId: z.string().min(1, 'Category is required'),
  image: z.string().url('Invalid image URL').optional().nullable(),
  isAvailable: z.boolean().default(true),
  options: z.any().optional().nullable(), // JSON for modifiers
})

export const menuItemFormSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Price must be a valid positive number'),
  categoryId: z.string().min(1, 'Category is required'),
})

// ============================================
// ORDER SCHEMAS
// ============================================

export const customerInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long'),
})

export const deliveryAddressSchema = z.object({
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State must be 2 letters'),
  zip: z.string().min(5, 'ZIP code must be at least 5 digits').max(10, 'Invalid ZIP code'),
  instructions: z.string().max(500, 'Instructions too long').optional(),
})

export const orderSchema = z.object({
  type: z.enum(['pickup', 'delivery']),
  customer: customerInfoSchema,
  deliveryAddress: deliveryAddressSchema.optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  notes: z.string().max(500, 'Notes too long').optional(),
  tip: z.number().min(0, 'Tip cannot be negative').default(0),
  giftCardCode: z.string().optional(),
})

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const restaurantSettingsSchema = z.object({
  name: z.string().min(2, 'Restaurant name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  timezone: z.string().default('America/New_York'),
})

export const brandingSchema = z.object({
  logo: z.string().url('Invalid logo URL').optional().nullable(),
  template: z.enum(['modern', 'classic', 'bold', 'compact']).default('modern'),
  menuLayout: z.enum(['blu-bentonville', 'slice']).default('blu-bentonville'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export const feesSchema = z.object({
  taxRate: z.number().min(0).max(100, 'Tax rate cannot exceed 100%'),
  deliveryFee: z.number().min(0).max(1000, 'Delivery fee too high'),
  minOrderAmount: z.number().min(0).max(10000, 'Minimum order too high'),
  platformFeePercent: z.number().min(0).max(100, 'Platform fee cannot exceed 100%'),
})

export const featuresSchema = z.object({
  pickupEnabled: z.boolean().default(true),
  deliveryEnabled: z.boolean().default(false),
  scheduledOrdersEnabled: z.boolean().default(true),
  giftCardsEnabled: z.boolean().default(true),
})

// ============================================
// GIFT CARD SCHEMAS
// ============================================

export const purchaseGiftCardSchema = z.object({
  amount: z.number().min(5, 'Minimum $5').max(500, 'Maximum $500'),
  recipientName: z.string().min(1, 'Recipient name is required').max(100),
  recipientEmail: z.string().email('Invalid email address'),
  senderName: z.string().min(1, 'Your name is required').max(100),
  senderEmail: z.string().email('Invalid email address'),
  message: z.string().max(500, 'Message too long').optional(),
})

export const redeemGiftCardSchema = z.object({
  code: z.string().min(8, 'Gift card code must be at least 8 characters').max(20),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

export type ValidationErrors = Record<string, string>

export function formatZodErrors(error: z.ZodError): ValidationErrors {
  const errors: ValidationErrors = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: ValidationErrors } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: formatZodErrors(result.error) }
}

// Types
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type GiftCardPurchaseInput = z.infer<typeof purchaseGiftCardSchema>
