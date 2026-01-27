import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizePhone } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rate-limit'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'orderflow-secret-change-in-production'

// Create customer session token
function createCustomerToken(customerId: string, tenantId: string, phone: string): string {
  return sign(
    { customerId, tenantId, phone, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

// POST /api/auth/phone/verify - Verify code and return customer session
export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const rateCheck = checkRateLimit(req, 'auth')
  if (!rateCheck.success && rateCheck.response) {
    return rateCheck.response
  }

  try {
    const body = await req.json()
    const { tenantId, tenantSlug, phone, code } = body
    
    if ((!tenantId && !tenantSlug) || !phone || !code) {
      return NextResponse.json(
        { error: 'tenantId (or tenantSlug), phone, and code are required' },
        { status: 400 }
      )
    }
    
    const normalizedPhone = sanitizePhone(phone)
    
    // Find tenant if only slug provided
    let resolvedTenantId = tenantId
    if (!resolvedTenantId && tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      })
      if (!tenant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
      }
      resolvedTenantId = tenant.id
    }
    
    // Find customer
    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId: resolvedTenantId,
          phone: normalizedPhone,
        },
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Verify code
    if (!customer.verifyCode || customer.verifyCode !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }
    
    // Check expiry
    if (!customer.verifyCodeExpiry || customer.verifyCodeExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification code expired' },
        { status: 400 }
      )
    }
    
    // Mark phone as verified and clear code
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phoneVerified: true,
        verifyCode: null,
        verifyCodeExpiry: null,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        loyaltyPoints: true,
        totalSpent: true,
        orderCount: true,
        favoriteItems: true,
        allergenFilters: true,
        phoneVerified: true,
        createdAt: true,
      },
    })
    
    // Create session token
    const token = createCustomerToken(customer.id, resolvedTenantId, normalizedPhone)
    
    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      token,
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
