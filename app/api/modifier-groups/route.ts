import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/modifier-groups - List all modifier groups for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const modifierGroups = await prisma.modifierGroup.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ modifierGroups })
  } catch (error: any) {
    console.error('Error fetching modifier groups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/modifier-groups - Create new modifier group
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, isRequired, minSelections, maxSelections, modifiers } = body

    if (!name || !modifiers || modifiers.length === 0) {
      return NextResponse.json({ error: 'Name and at least one modifier required' }, { status: 400 })
    }

    const modifierGroup = await prisma.modifierGroup.create({
      data: {
        tenantId: session.tenantId,
        name,
        description: description || null,
        isRequired: isRequired || false,
        minSelections: minSelections || 0,
        maxSelections: maxSelections || null,
        modifiers: modifiers,
      },
    })

    return NextResponse.json({ modifierGroup })
  } catch (error: any) {
    console.error('Error creating modifier group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/modifier-groups - Update modifier group
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, description, isRequired, minSelections, maxSelections, modifiers } = body

    if (!id || !name || !modifiers || modifiers.length === 0) {
      return NextResponse.json({ error: 'ID, name and at least one modifier required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.modifierGroup.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }

    const modifierGroup = await prisma.modifierGroup.update({
      where: { id },
      data: {
        name,
        description: description || null,
        isRequired: isRequired || false,
        minSelections: minSelections || 0,
        maxSelections: maxSelections || null,
        modifiers: modifiers,
      },
    })

    return NextResponse.json({ modifierGroup })
  } catch (error: any) {
    console.error('Error updating modifier group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/modifier-groups - Delete modifier group
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.modifierGroup.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }

    await prisma.modifierGroup.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting modifier group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
