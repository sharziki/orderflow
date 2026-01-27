import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/menu/items - List all menu items for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const available = searchParams.get('available')
    
    const items = await prisma.menuItem.findMany({
      where: {
        tenantId: session.tenantId,
        ...(categoryId && { categoryId }),
        ...(available !== null && { isAvailable: available === 'true' }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    })
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

// POST /api/menu/items - Create menu item
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { categoryId, name, description, price, image, options, isAvailable } = await req.json()
    
    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'categoryId, name, and price are required' },
        { status: 400 }
      )
    }
    
    // Verify category belongs to tenant
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId: session.tenantId },
    })
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    
    // Get max sort order in category
    const maxOrder = await prisma.menuItem.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    })
    
    const item = await prisma.menuItem.create({
      data: {
        tenantId: session.tenantId,
        categoryId,
        name,
        description,
        price: parseFloat(price),
        image,
        options: options || null,
        isAvailable: isAvailable ?? true,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
