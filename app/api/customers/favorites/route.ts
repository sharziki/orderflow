import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'orderflow-secret-change-in-production'

interface CustomerTokenPayload {
  customerId: string
  tenantId: string
  phone: string
  type: 'customer'
}

// Verify customer token from Authorization header
function getCustomerFromToken(req: NextRequest): CustomerTokenPayload | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.slice(7)
  try {
    const payload = verify(token, JWT_SECRET) as CustomerTokenPayload
    if (payload.type !== 'customer') {
      return null
    }
    return payload
  } catch {
    return null
  }
}

// GET /api/customers/favorites - List favorites for customer
export async function GET(req: NextRequest) {
  try {
    const customerAuth = getCustomerFromToken(req)
    const { searchParams } = new URL(req.url)
    const customerId = customerAuth?.customerId || searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer authentication required' },
        { status: 401 }
      )
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        favoriteItems: true,
        tenantId: true,
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Fetch full menu item details for favorites
    const menuItems = customer.favoriteItems.length > 0
      ? await prisma.menuItem.findMany({
          where: {
            id: { in: customer.favoriteItems },
            tenantId: customer.tenantId,
            isAvailable: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        })
      : []
    
    return NextResponse.json({
      favoriteItemIds: customer.favoriteItems,
      favorites: menuItems,
    })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// POST /api/customers/favorites - Add item to favorites
export async function POST(req: NextRequest) {
  try {
    const customerAuth = getCustomerFromToken(req)
    const body = await req.json()
    
    const customerId = customerAuth?.customerId || body.customerId
    const { menuItemId } = body
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer authentication required' },
        { status: 401 }
      )
    }
    
    if (!menuItemId) {
      return NextResponse.json(
        { error: 'menuItemId is required' },
        { status: 400 }
      )
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { favoriteItems: true, tenantId: true },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Verify menu item exists and belongs to same tenant
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        tenantId: customer.tenantId,
      },
    })
    
    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }
    
    // Add to favorites if not already there
    if (!customer.favoriteItems.includes(menuItemId)) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          favoriteItems: {
            push: menuItemId,
          },
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item added to favorites',
    })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

// DELETE /api/customers/favorites - Remove item from favorites
export async function DELETE(req: NextRequest) {
  try {
    const customerAuth = getCustomerFromToken(req)
    const { searchParams } = new URL(req.url)
    
    const customerId = customerAuth?.customerId || searchParams.get('customerId')
    const menuItemId = searchParams.get('menuItemId')
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer authentication required' },
        { status: 401 }
      )
    }
    
    if (!menuItemId) {
      return NextResponse.json(
        { error: 'menuItemId is required' },
        { status: 400 }
      )
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { favoriteItems: true },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Remove from favorites
    const updatedFavorites = customer.favoriteItems.filter(id => id !== menuItemId)
    
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        favoriteItems: updatedFavorites,
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Item removed from favorites',
    })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
