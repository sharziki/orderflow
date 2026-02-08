import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/menus - Get all menus for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const menus = await prisma.menu.findMany({
      where: { tenantId: session.tenantId },
      include: {
        categories: {
          where: { isActive: true },
          select: { id: true, name: true }
        },
        _count: {
          select: { categories: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ menus })
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 })
  }
}

// POST /api/menus - Create a new menu
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, icon, isActive = true, isDefault = false } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.menu.updateMany({
        where: { tenantId: session.tenantId, isDefault: true },
        data: { isDefault: false }
      })
    }

    // Get the highest sortOrder
    const lastMenu = await prisma.menu.findFirst({
      where: { tenantId: session.tenantId },
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = (lastMenu?.sortOrder || 0) + 1

    const menu = await prisma.menu.create({
      data: {
        tenantId: session.tenantId,
        name,
        description,
        icon,
        isActive,
        isDefault,
        sortOrder
      }
    })

    return NextResponse.json({ menu })
  } catch (error) {
    console.error('Error creating menu:', error)
    return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
  }
}

// PUT /api/menus - Update menus (bulk update for reordering)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { menus } = body

    if (!menus || !Array.isArray(menus)) {
      return NextResponse.json({ error: 'Invalid menus data' }, { status: 400 })
    }

    // Update each menu
    await Promise.all(
      menus.map((menu: { id: string; sortOrder: number }) =>
        prisma.menu.update({
          where: { 
            id: menu.id,
            tenantId: session.tenantId // Ensure it belongs to this tenant
          },
          data: { sortOrder: menu.sortOrder }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating menus:', error)
    return NextResponse.json({ error: 'Failed to update menus' }, { status: 500 })
  }
}
