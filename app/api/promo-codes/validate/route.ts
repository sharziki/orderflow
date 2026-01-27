import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'

export interface PromoValidationResult {
  valid: boolean
  discount?: number
  discountType?: 'percent' | 'fixed'
  discountValue?: number
  promoCodeId?: string
  reason?: string
}

// POST /api/promo-codes/validate - Validate promo code
export async function POST(req: NextRequest): Promise<NextResponse<PromoValidationResult>> {
  try {
    const body = await req.json()
    const { tenantId, code, subtotal, customerId } = body
    
    if (!tenantId || !code) {
      return NextResponse.json(
        { valid: false, reason: 'tenantId and code are required' },
        { status: 400 }
      )
    }
    
    const normalizedCode = sanitizeField(code).toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: normalizedCode,
        },
      },
    })
    
    if (!promoCode) {
      return NextResponse.json({ valid: false, reason: 'Invalid promo code' })
    }
    
    if (!promoCode.isActive) {
      return NextResponse.json({ valid: false, reason: 'Promo code is no longer active' })
    }
    
    // Check start date
    if (promoCode.startsAt && promoCode.startsAt > new Date()) {
      return NextResponse.json({ valid: false, reason: 'Promo code is not yet active' })
    }
    
    // Check expiry
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: 'Promo code has expired' })
    }
    
    // Check max usage
    if (promoCode.maxUsageCount !== null && promoCode.usageCount >= promoCode.maxUsageCount) {
      return NextResponse.json({ valid: false, reason: 'Promo code has reached maximum usage' })
    }
    
    // Check minimum order amount
    const orderSubtotal = Number(subtotal) || 0
    if (promoCode.minOrderAmount !== null && orderSubtotal < promoCode.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        reason: `Minimum order amount is $${promoCode.minOrderAmount.toFixed(2)}`,
      })
    }
    
    // Check first-time customer only
    if (promoCode.firstTimeOnly && customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { orderCount: true },
      })
      
      if (customer && customer.orderCount > 0) {
        return NextResponse.json({
          valid: false,
          reason: 'Promo code is for first-time customers only',
        })
      }
    }
    
    // Check single use (already used by this customer)
    if (promoCode.singleUse && customerId) {
      const previousUse = await prisma.order.findFirst({
        where: {
          customerId,
          promoCodeId: promoCode.id,
        },
      })
      
      if (previousUse) {
        return NextResponse.json({
          valid: false,
          reason: 'You have already used this promo code',
        })
      }
    }
    
    // Calculate discount
    let discount: number
    if (promoCode.discountType === 'percent') {
      discount = orderSubtotal * (promoCode.discountValue / 100)
      // Apply max discount cap if set
      if (promoCode.maxDiscountAmount !== null) {
        discount = Math.min(discount, promoCode.maxDiscountAmount)
      }
    } else {
      // Fixed discount
      discount = promoCode.discountValue
      // Don't let discount exceed subtotal
      discount = Math.min(discount, orderSubtotal)
    }
    
    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100
    
    return NextResponse.json({
      valid: true,
      discount,
      discountType: promoCode.discountType as 'percent' | 'fixed',
      discountValue: promoCode.discountValue,
      promoCodeId: promoCode.id,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { valid: false, reason: 'Failed to validate promo code' },
      { status: 500 }
    )
  }
}
