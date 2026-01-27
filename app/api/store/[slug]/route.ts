import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Helper to check if a category/item is available based on scheduling
function isAvailableNow(
  availableFrom: string | null,
  availableTo: string | null,
  availableDays: string[],
  currentTime: string,
  currentDay: string
): boolean {
  // Check day availability (empty array = all days)
  if (availableDays && availableDays.length > 0) {
    if (!availableDays.includes(currentDay)) {
      return false
    }
  }

  // Check time availability (null = all times)
  if (availableFrom && availableTo) {
    const current = parseInt(currentTime.replace(':', ''), 10)
    const from = parseInt(availableFrom.replace(':', ''), 10)
    const to = parseInt(availableTo.replace(':', ''), 10)

    // Handle overnight ranges (e.g., 22:00 to 02:00)
    if (from > to) {
      // Available if after 'from' OR before 'to'
      if (!(current >= from || current < to)) {
        return false
      }
    } else {
      // Normal range
      if (current < from || current >= to) {
        return false
      }
    }
  }

  return true
}

// GET /api/store/[slug] - Get public store info + menu
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    
    // Parse allergen filters from query param (comma-separated)
    const allergensParam = searchParams.get('allergens')
    const allergenFilters = allergensParam
      ? allergensParam.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)
      : []
    
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        logo: true,
        template: true,
        menuLayout: true,
        primaryColor: true,
        secondaryColor: true,
        pickupEnabled: true,
        deliveryEnabled: true,
        scheduledOrdersEnabled: true,
        taxRate: true,
        deliveryFee: true,
        minOrderAmount: true,
        businessHours: true,
        timezone: true,
        isActive: true,
        loyaltyEnabled: true,
      },
    })
    
    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Get current time in tenant's timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tenant.timezone || 'America/New_York',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    
    const parts = formatter.formatToParts(now)
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || 'monday'
    const hour = parts.find(p => p.type === 'hour')?.value || '12'
    const minute = parts.find(p => p.type === 'minute')?.value || '00'
    const currentTime = `${hour}:${minute}`
    const today = weekday
    
    // Get categories with items (including scheduling fields)
    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            allergens: true,
            calories: true,
            modifierGroupIds: true,
            variants: true,
            isSoldOut: true,
            availableFrom: true,
            availableTo: true,
            availableDays: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    
    // Get modifier groups for this tenant
    const modifierGroups = await prisma.modifierGroup.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    
    // Apply all filters: category scheduling, item scheduling, allergens
    let filteredCategories = categories
      // Filter categories by scheduling
      .filter(cat => isAvailableNow(
        cat.availableFrom,
        cat.availableTo,
        cat.availableDays,
        currentTime,
        today
      ))
      .map(category => ({
        ...category,
        menuItems: category.menuItems
          // Filter items by scheduling
          .filter(item => isAvailableNow(
            item.availableFrom,
            item.availableTo,
            item.availableDays,
            currentTime,
            today
          ))
          // Filter items by allergens
          .filter(item => {
            if (allergenFilters.length === 0) return true
            const itemAllergens = (item.allergens || []).map(a => a.toLowerCase())
            return !allergenFilters.some(filter => itemAllergens.includes(filter))
          }),
      }))
      // Remove empty categories
      .filter(category => category.menuItems.length > 0)
    
    // Check if currently open
    let isOpen = true
    
    if (tenant.businessHours) {
      const hours = tenant.businessHours as Record<string, { open?: string; close?: string; closed?: boolean }>
      if (hours[today]) {
        const { open, close, closed } = hours[today]
        if (closed) {
          isOpen = false
        } else if (open && close) {
          const currentTimeNum = parseInt(currentTime.replace(':', ''), 10)
          const openTime = parseInt(open.replace(':', ''), 10)
          const closeTime = parseInt(close.replace(':', ''), 10)
          isOpen = currentTimeNum >= openTime && currentTimeNum < closeTime
        }
      }
    }
    
    return NextResponse.json({
      store: {
        ...tenant,
        isOpen,
      },
      categories: filteredCategories,
      modifierGroups,
      appliedAllergenFilters: allergenFilters,
    })
  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 })
  }
}
