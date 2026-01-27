import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/menu/items/bulk - Bulk update menu items
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { itemIds, updates } = body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 })
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 })
    }

    const { price, isAvailable, categoryId, isSoldOut } = updates

    // If changing category, verify it belongs to tenant
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, tenantId: session.tenantId },
      })
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (price !== undefined) updateData.price = parseFloat(price)
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isSoldOut !== undefined) updateData.isSoldOut = isSoldOut

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    // Update only items belonging to this tenant
    const result = await prisma.menuItem.updateMany({
      where: {
        id: { in: itemIds },
        tenantId: session.tenantId,
      },
      data: updateData,
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.count 
    })
  } catch (error) {
    console.error('Error bulk updating menu items:', error)
    return NextResponse.json({ error: 'Failed to bulk update menu items' }, { status: 500 })
  }
}

// DELETE /api/menu/items/bulk - Bulk delete menu items
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { itemIds } = body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 })
    }

    // Delete only items belonging to this tenant
    const result = await prisma.menuItem.deleteMany({
      where: {
        id: { in: itemIds },
        tenantId: session.tenantId,
      },
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    })
  } catch (error) {
    console.error('Error bulk deleting menu items:', error)
    return NextResponse.json({ error: 'Failed to bulk delete menu items' }, { status: 500 })
  }
}
