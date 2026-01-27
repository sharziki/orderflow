import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeField } from '@/lib/sanitize'

// GET /api/promo-codes - List promo codes for tenant (dashboard)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'
    
    const where = {
      tenantId: session.tenantId,
      ...(activeOnly && { isActive: true }),
    }
    
    const promoCodes = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ promoCodes })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
  }
}

// POST /api/promo-codes - Create promo code with all rules
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      firstTimeOnly,
      singleUse,
      maxUsageCount,
      startsAt,
      expiresAt,
    } = body
    
    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'code, discountType, and discountValue are required' },
        { status: 400 }
      )
    }
    
    // Validate discount type
    if (!['percent', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'discountType must be "percent" or "fixed"' },
        { status: 400 }
      )
    }
    
    // Validate discount value
    if (discountType === 'percent' && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percent discount must be between 1 and 100' },
        { status: 400 }
      )
    }
    
    if (discountType === 'fixed' && discountValue <= 0) {
      return NextResponse.json(
        { error: 'Fixed discount must be greater than 0' },
        { status: 400 }
      )
    }
    
    // Normalize code to uppercase
    const normalizedCode = sanitizeField(code).toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // Check for duplicate
    const existing = await prisma.promoCode.findUnique({
      where: {
        tenantId_code: {
          tenantId: session.tenantId,
          code: normalizedCode,
        },
      },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      )
    }
    
    const promoCode = await prisma.promoCode.create({
      data: {
        tenantId: session.tenantId,
        code: normalizedCode,
        description: description ? sanitizeField(description) : null,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        firstTimeOnly: Boolean(firstTimeOnly),
        singleUse: Boolean(singleUse),
        maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })
    
    return NextResponse.json({ promoCode })
  } catch (error) {
    console.error('Error creating promo code:', error)
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 })
  }
}
