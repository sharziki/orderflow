import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

// Check if user is platform admin
async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return false

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true },
    })
    return user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false
  } catch {
    return false
  }
}

// GET /api/admin/tenants - List all tenants (admin only)
export async function GET(req: NextRequest) {
  const admin = await isAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          isActive: true,
          isOnboarded: true,
          stripeOnboardingComplete: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              menuItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.tenant.count({ where }),
    ])

    // Get aggregate stats
    const stats = await prisma.tenant.aggregate({
      _count: true,
    })

    const activeCount = await prisma.tenant.count({ where: { isActive: true } })
    const stripeConnectedCount = await prisma.tenant.count({ where: { stripeOnboardingComplete: true } })

    // Calculate total orders and revenue
    const orderStats = await prisma.order.aggregate({
      _count: true,
      _sum: { total: true },
    })

    return NextResponse.json({
      tenants,
      total,
      stats: {
        totalTenants: stats._count,
        activeTenants: activeCount,
        stripeConnected: stripeConnectedCount,
        totalOrders: orderStats._count,
        totalRevenue: orderStats._sum.total || 0,
      },
      pagination: { limit, offset, hasMore: offset + tenants.length < total },
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}
