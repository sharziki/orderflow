import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PUT /api/staff/[id] - Update staff member
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

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, canManageStaff: true }
    })

    if (!currentUser || (currentUser.role !== 'owner' && !currentUser.canManageStaff)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get target user
    const targetUser = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't edit owner unless you are owner
    if (targetUser.role === 'owner' && currentUser.role !== 'owner') {
      return NextResponse.json({ error: 'Cannot edit owner account' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      name, 
      password,
      role,
      canViewOrders,
      canEditOrders,
      canEditMenu,
      canEditSettings,
      canViewAnalytics,
      canManageStaff,
      isActive,
    } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive
    
    // Only owner can change roles
    if (role !== undefined && currentUser.role === 'owner') {
      if (!['manager', 'staff'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
    }

    // Permissions
    if (canViewOrders !== undefined) updateData.canViewOrders = canViewOrders
    if (canEditOrders !== undefined) updateData.canEditOrders = canEditOrders
    if (canEditMenu !== undefined) updateData.canEditMenu = canEditMenu
    if (canEditSettings !== undefined) updateData.canEditSettings = canEditSettings
    if (canViewAnalytics !== undefined) updateData.canViewAnalytics = canViewAnalytics
    if (canManageStaff !== undefined) updateData.canManageStaff = canManageStaff

    // Password change
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[Staff] Update error:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

// DELETE /api/staff/[id] - Deactivate staff member
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

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, canManageStaff: true }
    })

    if (!currentUser || (currentUser.role !== 'owner' && !currentUser.canManageStaff)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get target user
    const targetUser = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't delete owner
    if (targetUser.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete owner account' }, { status: 403 })
    }

    // Can't delete yourself
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Soft delete (deactivate)
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Staff] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
