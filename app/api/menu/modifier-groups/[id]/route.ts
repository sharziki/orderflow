import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/menu/modifier-groups/[id]
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

    const modifierGroup = await prisma.modifierGroup.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!modifierGroup) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }

    return NextResponse.json({ modifierGroup })
  } catch (error) {
    console.error('Error fetching modifier group:', error)
    return NextResponse.json({ error: 'Failed to fetch modifier group' }, { status: 500 })
  }
}

// PUT /api/menu/modifier-groups/[id]
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
    const { name, description, modifiers, minSelections, maxSelections, isRequired, sortOrder, isActive } = body

    // Verify ownership
    const existing = await prisma.modifierGroup.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }

    // Validate modifiers if provided
    if (modifiers !== undefined) {
      if (!Array.isArray(modifiers) || modifiers.length === 0) {
        return NextResponse.json({ error: 'modifiers must be a non-empty array' }, { status: 400 })
      }
      for (const mod of modifiers) {
        if (!mod.name) {
          return NextResponse.json({ error: 'Each modifier must have a name' }, { status: 400 })
        }
      }
    }

    const modifierGroup = await prisma.modifierGroup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(modifiers !== undefined && { modifiers }),
        ...(minSelections !== undefined && { minSelections }),
        ...(maxSelections !== undefined && { maxSelections }),
        ...(isRequired !== undefined && { isRequired }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ modifierGroup })
  } catch (error) {
    console.error('Error updating modifier group:', error)
    return NextResponse.json({ error: 'Failed to update modifier group' }, { status: 500 })
  }
}

// DELETE /api/menu/modifier-groups/[id]
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
    const existing = await prisma.modifierGroup.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }

    // Remove this modifier group from any menu items that reference it
    await prisma.$executeRaw`
      UPDATE "MenuItem" 
      SET "modifierGroupIds" = array_remove("modifierGroupIds", ${id})
      WHERE "tenantId" = ${session.tenantId} 
      AND ${id} = ANY("modifierGroupIds")
    `

    await prisma.modifierGroup.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting modifier group:', error)
    return NextResponse.json({ error: 'Failed to delete modifier group' }, { status: 500 })
  }
}
