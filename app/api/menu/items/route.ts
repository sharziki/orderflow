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
    
    const body = await req.json()
    const { 
      categoryId, 
      name, 
      description, 
      price, 
      image, 
      options, 
      variants,
      modifierGroupIds,
      allergens,
      calories,
      prepTimeMinutes,
      availableFrom,
      availableTo,
      availableDays,
      isAvailable 
    } = body
    
    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'categoryId, name, and price are required' },
        { status: 400 }
      )
    }
    
    // Validate variants if provided
    if (variants !== undefined && variants !== null) {
      if (!Array.isArray(variants)) {
        return NextResponse.json({ error: 'variants must be an array' }, { status: 400 })
      }
      for (const v of variants) {
        if (!v.name || typeof v.price !== 'number') {
          return NextResponse.json({ error: 'Each variant must have name and price' }, { status: 400 })
        }
      }
    }
    
    // Verify category belongs to tenant
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId: session.tenantId },
    })
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    
    // Verify modifier groups belong to tenant if provided
    if (modifierGroupIds && modifierGroupIds.length > 0) {
      const validGroups = await prisma.modifierGroup.count({
        where: { 
          id: { in: modifierGroupIds },
          tenantId: session.tenantId,
        },
      })
      if (validGroups !== modifierGroupIds.length) {
        return NextResponse.json({ error: 'One or more modifier groups not found' }, { status: 404 })
      }
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
        variants: variants || null,
        modifierGroupIds: modifierGroupIds || [],
        allergens: allergens || [],
        calories: calories || null,
        prepTimeMinutes: prepTimeMinutes || null,
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        availableDays: availableDays || [],
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
