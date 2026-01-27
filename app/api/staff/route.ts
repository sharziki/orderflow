import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/staff - List staff members
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner or manager
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, canManageStaff: true }
    })

    if (!currentUser || (currentUser.role !== 'owner' && !currentUser.canManageStaff)) {
      return NextResponse.json({ error: 'Not authorized to manage staff' }, { status: 403 })
    }

    const staff = await prisma.user.findMany({
      where: { tenantId: session.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canViewOrders: true,
        canEditOrders: true,
        canEditMenu: true,
        canEditSettings: true,
        canViewAnalytics: true,
        canManageStaff: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('[Staff] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST /api/staff - Create staff member
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, canManageStaff: true }
    })

    if (!currentUser || (currentUser.role !== 'owner' && !currentUser.canManageStaff)) {
      return NextResponse.json({ error: 'Not authorized to manage staff' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      email, 
      name, 
      password, 
      role = 'staff',
      canViewOrders = true,
      canEditOrders = false,
      canEditMenu = false,
      canEditSettings = false,
      canViewAnalytics = false,
      canManageStaff = false,
    } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Validate role
    if (!['manager', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Can't create owner
    if (role === 'owner') {
      return NextResponse.json({ error: 'Cannot create owner account' }, { status: 400 })
    }

    // Check if email exists for this tenant
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: session.tenantId, email } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        tenantId: session.tenantId,
        email,
        name,
        passwordHash,
        role,
        canViewOrders,
        canEditOrders,
        canEditMenu,
        canEditSettings,
        canViewAnalytics,
        canManageStaff,
        emailVerified: true, // Staff accounts are pre-verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canViewOrders: true,
        canEditOrders: true,
        canEditMenu: true,
        canEditSettings: true,
        canViewAnalytics: true,
        canManageStaff: true,
      }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('[Staff] Create error:', error)
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
