import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/menu/items/reorder - Reorder items within a category
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemIds, categoryId } = await req.json()
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Invalid item IDs' }, { status: 400 })
    }

    // Verify category belongs to tenant
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, tenantId: session.tenantId }
      })
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    // Update sort order and optionally category for each item
    await prisma.$transaction(
      itemIds.map((id, index) => 
        prisma.menuItem.update({
          where: { id },
          data: { 
            sortOrder: index,
            ...(categoryId && { categoryId })
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Items Reorder] Error:', error)
    return NextResponse.json({ error: 'Failed to reorder items' }, { status: 500 })
  }
}
