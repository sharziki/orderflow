import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/menus/[id] - Get a single menu
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const menu = await prisma.menu.findFirst({
      where: { 
        id: params.id,
        tenantId: session.tenantId 
      },
      include: {
        categories: {
          where: { isActive: true },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json({ menu })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
}

// PUT /api/menus/[id] - Update a menu
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, icon, isActive, isDefault } = body

    // Verify ownership
    const existing = await prisma.menu.findFirst({
      where: { 
        id: params.id,
        tenantId: session.tenantId 
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults first
    if (isDefault && !existing.isDefault) {
      await prisma.menu.updateMany({
        where: { tenantId: session.tenantId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (isActive !== undefined) updateData.isActive = isActive
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const menu = await prisma.menu.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ menu })
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 })
  }
}

// DELETE /api/menus/[id] - Delete a menu
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await prisma.menu.findFirst({
      where: { 
        id: params.id,
        tenantId: session.tenantId 
      },
      include: {
        _count: { select: { categories: true } }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Check if this is the last menu
    const menuCount = await prisma.menu.count({
      where: { tenantId: session.tenantId }
    })

    if (menuCount === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last menu. Create another menu first.' },
        { status: 400 }
      )
    }

    // Unlink categories from this menu (don't delete them)
    await prisma.category.updateMany({
      where: { menuId: params.id },
      data: { menuId: null }
    })

    // Delete the menu
    await prisma.menu.delete({
      where: { id: params.id }
    })

    // If this was the default menu, set another one as default
    if (existing.isDefault) {
      const firstMenu = await prisma.menu.findFirst({
        where: { tenantId: session.tenantId },
        orderBy: { sortOrder: 'asc' }
      })
      if (firstMenu) {
        await prisma.menu.update({
          where: { id: firstMenu.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 })
  }
}
