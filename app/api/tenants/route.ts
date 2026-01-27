import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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
      primaryColor,
      secondaryColor,
      pickupEnabled,
      deliveryEnabled,
      scheduledOrdersEnabled,
      giftCardsEnabled,
    } = body

    // Validate required fields
    if (!restaurantName || !slug || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug is taken
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This URL is already taken' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create tenant
    const tenantId = createId()
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: restaurantName,
        slug,
        email,
        phone,
        address,
        city,
        state,
        zip,
        timezone: timezone || 'America/Chicago',
        primary_color: primaryColor || '#3B82F6',
        secondary_color: secondaryColor || '#1E40AF',
        pickup_enabled: pickupEnabled ?? true,
        delivery_enabled: deliveryEnabled ?? false,
        scheduled_orders_enabled: scheduledOrdersEnabled ?? true,
        gift_cards_enabled: giftCardsEnabled ?? true,
        status: 'pending',
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Tenant creation error:', tenantError)
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      )
    }

    // Create owner user
    const { error: userError } = await supabase
      .from('tenant_users')
      .insert({
        id: createId(),
        tenant_id: tenantId,
        email,
        password_hash: passwordHash,
        name: restaurantName,
        role: 'owner',
      })

    if (userError) {
      console.error('User creation error:', userError)
      // Rollback tenant creation
      await supabase.from('tenants').delete().eq('id', tenantId)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create default categories
    const defaultCategories = [
      { name: 'Appetizers', sort_order: 1 },
      { name: 'Main Courses', sort_order: 2 },
      { name: 'Sides', sort_order: 3 },
      { name: 'Desserts', sort_order: 4 },
      { name: 'Drinks', sort_order: 5 },
    ]

    await supabase.from('categories').insert(
      defaultCategories.map(cat => ({
        id: createId(),
        tenant_id: tenantId,
        ...cat,
      }))
    )

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenantId,
        name: restaurantName,
        slug,
        url: `https://${slug}.orderflow.io`,
      }
    })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Get tenant by slug or custom domain
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const domain = searchParams.get('domain')

  if (!slug && !domain) {
    return NextResponse.json(
      { error: 'slug or domain required' },
      { status: 400 }
    )
  }

  const query = supabase
    .from('tenants')
    .select('*')
  
  if (slug) {
    query.eq('slug', slug)
  } else if (domain) {
    query.eq('custom_domain', domain)
  }

  const { data: tenant, error } = await query.single()

  if (error || !tenant) {
    return NextResponse.json(
      { error: 'Restaurant not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ tenant })
}
