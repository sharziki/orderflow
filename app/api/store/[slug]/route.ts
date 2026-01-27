import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/store/[slug] - Get public store info + menu
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
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
        isActive: true,
      },
    })
    
    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Get categories with items
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
            options: true,
            calories: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    
    // Check if currently open
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    let isOpen = true
    
    if (tenant.businessHours) {
      const hours = tenant.businessHours as any
      if (hours[today]) {
        const { open, close, closed } = hours[today]
        if (closed) {
          isOpen = false
        } else {
          const currentTime = now.getHours() * 100 + now.getMinutes()
          const openTime = parseInt(open.replace(':', ''))
          const closeTime = parseInt(close.replace(':', ''))
          isOpen = currentTime >= openTime && currentTime < closeTime
        }
      }
    }
    
    return NextResponse.json({
      store: {
        ...tenant,
        isOpen,
      },
      categories,
    })
  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 })
  }
}
