import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/menu/items/sold-out - Bulk toggle sold out status
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { itemIds, isSoldOut } = body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 })
    }

    if (typeof isSoldOut !== 'boolean') {
      return NextResponse.json({ error: 'isSoldOut boolean is required' }, { status: 400 })
    }

    // Update only items belonging to this tenant
    const result = await prisma.menuItem.updateMany({
      where: {
        id: { in: itemIds },
        tenantId: session.tenantId,
      },
      data: {
        isSoldOut,
      },
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.count 
    })
  } catch (error) {
    console.error('Error updating sold out status:', error)
    return NextResponse.json({ error: 'Failed to update sold out status' }, { status: 500 })
  }
}

// GET /api/menu/items/sold-out - List all sold out items
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await prisma.menuItem.findMany({
      where: {
        tenantId: session.tenantId,
        isSoldOut: true,
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        isSoldOut: true,
        soldOutAutoReset: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching sold out items:', error)
    return NextResponse.json({ error: 'Failed to fetch sold out items' }, { status: 500 })
  }
}
