import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/settings - Get tenant settings
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        timezone: true,
        logo: true,
        template: true,
        primaryColor: true,
        secondaryColor: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        pickupEnabled: true,
        deliveryEnabled: true,
        scheduledOrdersEnabled: true,
        giftCardsEnabled: true,
        taxRate: true,
        deliveryFee: true,
        minOrderAmount: true,
        businessHours: true,
        doordashDeveloperId: true,
        doordashKeyId: true,
        doordashSigningSecret: true,
        pickupInstructions: true,
        isActive: true,
        isOnboarded: true,
      },
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    // Mask sensitive keys for display (show last 4 chars)
    const maskKey = (key: string | null) => {
      if (!key) return ''
      if (key.length <= 8) return '••••••••'
      return '••••••••' + key.slice(-4)
    }
    
    return NextResponse.json({
      settings: {
        ...tenant,
        // Return masked versions for display
        doordashSigningSecretMasked: maskKey(tenant.doordashSigningSecret),
        // Flag to show if configured
        doordashConfigured: !!(tenant.doordashDeveloperId && tenant.doordashKeyId && tenant.doordashSigningSecret),
        stripeConfigured: !!tenant.stripeAccountId,
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings - Update tenant settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const {
      name,
      phone,
      address,
      city,
      state,
      zip,
      timezone,
      logo,
      template,
      primaryColor,
      secondaryColor,
      pickupEnabled,
      deliveryEnabled,
      scheduledOrdersEnabled,
      giftCardsEnabled,
      taxRate,
      deliveryFee,
      minOrderAmount,
      businessHours,
      doordashDeveloperId,
      doordashKeyId,
      doordashSigningSecret,
      pickupInstructions,
    } = body
    
    // Build update object (only include provided fields)
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zip !== undefined) updateData.zip = zip
    if (timezone !== undefined) updateData.timezone = timezone
    if (logo !== undefined) updateData.logo = logo
    if (template !== undefined) updateData.template = template
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor
    if (pickupEnabled !== undefined) updateData.pickupEnabled = pickupEnabled
    if (deliveryEnabled !== undefined) updateData.deliveryEnabled = deliveryEnabled
    if (scheduledOrdersEnabled !== undefined) updateData.scheduledOrdersEnabled = scheduledOrdersEnabled
    if (giftCardsEnabled !== undefined) updateData.giftCardsEnabled = giftCardsEnabled
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate) || 0
    if (deliveryFee !== undefined) updateData.deliveryFee = parseFloat(deliveryFee) || 0
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount) || 0
    if (businessHours !== undefined) updateData.businessHours = businessHours
    if (pickupInstructions !== undefined) updateData.pickupInstructions = pickupInstructions
    
    // DoorDash credentials - only update if provided (don't overwrite with empty)
    if (doordashDeveloperId) updateData.doordashDeveloperId = doordashDeveloperId
    if (doordashKeyId) updateData.doordashKeyId = doordashKeyId
    if (doordashSigningSecret) updateData.doordashSigningSecret = doordashSigningSecret
    
    // If delivery is being enabled, check DoorDash is configured
    if (deliveryEnabled && !updateData.deliveryEnabled) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { doordashDeveloperId: true, doordashKeyId: true, doordashSigningSecret: true },
      })
      
      const hasDoordash = tenant?.doordashDeveloperId && tenant?.doordashKeyId && tenant?.doordashSigningSecret
      const willHaveDoordash = doordashDeveloperId && doordashKeyId && doordashSigningSecret
      
      if (!hasDoordash && !willHaveDoordash) {
        return NextResponse.json(
          { error: 'Configure DoorDash credentials before enabling delivery' },
          { status: 400 }
        )
      }
    }
    
    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      settings: {
        id: tenant.id,
        name: tenant.name,
        doordashConfigured: !!(tenant.doordashDeveloperId && tenant.doordashKeyId && tenant.doordashSigningSecret),
      },
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
