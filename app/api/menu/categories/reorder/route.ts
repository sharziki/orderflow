import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/menu/categories/reorder - Reorder categories
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryIds } = await req.json()
    
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Invalid category IDs' }, { status: 400 })
    }

    // Update sort order for each category
    await prisma.$transaction(
      categoryIds.map((id, index) => 
        prisma.category.update({
          where: { 
            id,
            tenantId: session.tenantId 
          },
          data: { sortOrder: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Categories Reorder] Error:', error)
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 })
  }
}
