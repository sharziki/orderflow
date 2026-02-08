import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/menu/items/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    const item = await prisma.menuItem.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { category: true },
    })
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json({ error: 'Failed to fetch menu item' }, { status: 500 })
  }
}

// PUT /api/menu/items/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await req.json()
    const { 
      categoryId, 
      name, 
      description, 
      price, 
      image,
      images, 
      options,
      variants,
      modifierGroupIds,
      isSoldOut,
      soldOutAutoReset,
      allergens,
      calories,
      prepTimeMinutes,
      availableFrom,
      availableTo,
      availableDays,
      isAvailable, 
      sortOrder 
    } = body
    
    // Verify ownership
    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    
    // If changing category, verify it belongs to tenant
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, tenantId: session.tenantId },
      })
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
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
    
    // Verify modifier groups belong to tenant if provided
    if (modifierGroupIds !== undefined && modifierGroupIds.length > 0) {
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
    
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(image !== undefined && { image }),
        ...(images !== undefined && { images }),
        ...(options !== undefined && { options }),
        ...(variants !== undefined && { variants }),
        ...(modifierGroupIds !== undefined && { modifierGroupIds }),
        ...(isSoldOut !== undefined && { isSoldOut }),
        ...(soldOutAutoReset !== undefined && { soldOutAutoReset }),
        ...(allergens !== undefined && { allergens }),
        ...(calories !== undefined && { calories }),
        ...(prepTimeMinutes !== undefined && { prepTimeMinutes }),
        ...(availableFrom !== undefined && { availableFrom }),
        ...(availableTo !== undefined && { availableTo }),
        ...(availableDays !== undefined && { availableDays }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

// DELETE /api/menu/items/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Verify ownership
    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    
    await prisma.menuItem.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}
