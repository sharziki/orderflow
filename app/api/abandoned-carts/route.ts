import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/abandoned-carts - List abandoned carts for dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const showRecovered = searchParams.get('recovered') === 'true'

    const carts = await prisma.abandonedCart.findMany({
      where: {
        tenantId: session.tenantId,
        recovered: showRecovered,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get stats
    const [total, recoveredCount, totalValue] = await Promise.all([
      prisma.abandonedCart.count({ where: { tenantId: session.tenantId } }),
      prisma.abandonedCart.count({ where: { tenantId: session.tenantId, recovered: true } }),
      prisma.abandonedCart.aggregate({
        where: { tenantId: session.tenantId, recovered: false },
        _sum: { subtotal: true }
      })
    ])

    return NextResponse.json({
      carts,
      stats: {
        total,
        recovered: recoveredCount,
        pending: total - recoveredCount,
        recoveryRate: total > 0 ? (recoveredCount / total * 100).toFixed(1) : 0,
        lostRevenue: totalValue._sum.subtotal || 0,
      }
    })
  } catch (error) {
    console.error('[AbandonedCarts] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch abandoned carts' }, { status: 500 })
  }
}

// POST /api/abandoned-carts - Track an abandoned cart (from storefront)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantSlug, email, phone, items, subtotal } = body

    if (!tenantSlug || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Create or update abandoned cart
    const cart = await prisma.abandonedCart.create({
      data: {
        tenantId: tenant.id,
        email,
        phone,
        items,
        subtotal: subtotal || 0,
      }
    })

    return NextResponse.json({ cartId: cart.id }, { status: 201 })
  } catch (error) {
    console.error('[AbandonedCarts] Create error:', error)
    return NextResponse.json({ error: 'Failed to track cart' }, { status: 500 })
  }
}
