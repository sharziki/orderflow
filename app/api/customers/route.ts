import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizePhone, sanitizeEmail, sanitizeField } from '@/lib/sanitize'

// GET /api/customers - Lookup customer by phone (for order history, loyalty)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    const tenantId = searchParams.get('tenantId')
    
    if (!phone || !tenantId) {
      return NextResponse.json(
        { error: 'phone and tenantId are required' },
        { status: 400 }
      )
    }
    
    const normalizedPhone = sanitizePhone(phone)
    
    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone: normalizedPhone,
        },
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
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Get order history
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        items: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({ customer, orders })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

// POST /api/customers - Create/update customer by phone number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, phone, email, name, allergenFilters } = body
    
    if (!tenantId || !phone) {
      return NextResponse.json(
        { error: 'tenantId and phone are required' },
        { status: 400 }
      )
    }
    
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const normalizedPhone = sanitizePhone(phone)
    const sanitizedEmail = email ? sanitizeEmail(email) : null
    const sanitizedName = name ? sanitizeField(name) : null
    
    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_phone: {
          tenantId,
          phone: normalizedPhone,
        },
      },
      update: {
        ...(sanitizedEmail && { email: sanitizedEmail }),
        ...(sanitizedName && { name: sanitizedName }),
        ...(allergenFilters && { allergenFilters }),
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        phone: normalizedPhone,
        email: sanitizedEmail,
        name: sanitizedName,
        allergenFilters: allergenFilters || [],
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
    
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error creating/updating customer:', error)
    return NextResponse.json({ error: 'Failed to save customer' }, { status: 500 })
  }
}
