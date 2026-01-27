import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email'

// POST /api/tenants - Create new restaurant (onboarding)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      restaurantName,
      slug,
      email,
      password,
      phone,
      address,
      city,
      state,
      zip,
      timezone,
      template,
      primaryColor,
      secondaryColor,
      pickupEnabled,
      deliveryEnabled,
      scheduledOrdersEnabled,
      giftCardsEnabled,
      stripePublishableKey,
      stripeSecretKey,
    } = body
    
    // Validate required fields
    if (!restaurantName || !slug || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantName, slug, email, password' },
        { status: 400 }
      )
    }
    
    // Check if slug is taken
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'This URL is already taken. Please choose another.' },
        { status: 400 }
      )
    }
    
    // Check if email is taken
    const existingEmail = await prisma.tenant.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      )
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: restaurantName,
          slug: slug.toLowerCase(),
          email: email.toLowerCase(),
          phone,
          address,
          city,
          state,
          zip,
          timezone: timezone || 'America/New_York',
          template: template || 'modern',
          primaryColor: primaryColor || '#2563eb',
          secondaryColor: secondaryColor || '#1e40af',
          pickupEnabled: pickupEnabled ?? true,
          deliveryEnabled: deliveryEnabled ?? false,
          scheduledOrdersEnabled: scheduledOrdersEnabled ?? true,
          giftCardsEnabled: giftCardsEnabled ?? true,
          isOnboarded: true,
        },
      })
      
      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: email.toLowerCase(),
          passwordHash,
          name: restaurantName,
          role: 'owner',
        },
      })
      
      // Create some default categories
      const defaultCategories = [
        { name: '🥗 Appetizers', sortOrder: 1 },
        { name: '🍝 Main Courses', sortOrder: 2 },
        { name: '🥤 Beverages', sortOrder: 3 },
        { name: '🍰 Desserts', sortOrder: 4 },
      ]
      
      for (const cat of defaultCategories) {
        await tx.category.create({
          data: {
            tenantId: tenant.id,
            name: cat.name,
            sortOrder: cat.sortOrder,
          },
        })
      }
      
      return { tenant, user }
    })
    
    // Create auth token
    const token = createToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role,
    })
    
    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })
    
    // Send welcome email
    await sendWelcomeEmail(result.tenant.email, result.tenant.name)
    
    return NextResponse.json({
      success: true,
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        name: result.tenant.name,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    })
    
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create restaurant. Please try again.' },
      { status: 500 }
    )
  }
}

// GET /api/tenants - List all tenants (admin only, for now just return empty)
export async function GET(req: NextRequest) {
  // In production, this would be admin-only
  // For now, return basic info
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      template: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  
  return NextResponse.json({ tenants })
}
