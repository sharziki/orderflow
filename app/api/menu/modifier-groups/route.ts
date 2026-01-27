import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/menu/modifier-groups - List all modifier groups for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const modifierGroups = await prisma.modifierGroup.findMany({
      where: {
        tenantId: session.tenantId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ modifierGroups })
  } catch (error) {
    console.error('Error fetching modifier groups:', error)
    return NextResponse.json({ error: 'Failed to fetch modifier groups' }, { status: 500 })
  }
}

// POST /api/menu/modifier-groups - Create modifier group
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, modifiers, minSelections, maxSelections, isRequired, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!modifiers || !Array.isArray(modifiers) || modifiers.length === 0) {
      return NextResponse.json({ error: 'modifiers array is required' }, { status: 400 })
    }

    // Validate modifiers format
    for (const mod of modifiers) {
      if (!mod.name) {
        return NextResponse.json({ error: 'Each modifier must have a name' }, { status: 400 })
      }
      if (mod.price !== undefined && typeof mod.price !== 'number') {
        return NextResponse.json({ error: 'Modifier price must be a number' }, { status: 400 })
      }
    }

    // Get max sort order
    const maxOrder = await prisma.modifierGroup.aggregate({
      where: { tenantId: session.tenantId },
      _max: { sortOrder: true },
    })

    const modifierGroup = await prisma.modifierGroup.create({
      data: {
        tenantId: session.tenantId,
        name,
        description: description || null,
        modifiers,
        minSelections: minSelections ?? 0,
        maxSelections: maxSelections ?? null,
        isRequired: isRequired ?? false,
        sortOrder: sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
        isActive: true,
      },
    })

    return NextResponse.json({ modifierGroup })
  } catch (error) {
    console.error('Error creating modifier group:', error)
    return NextResponse.json({ error: 'Failed to create modifier group' }, { status: 500 })
  }
}
