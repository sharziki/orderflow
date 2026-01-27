import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/reviews - List reviews for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const rating = searchParams.get('rating')

    const where: any = { tenantId: session.tenantId }
    if (rating) {
      where.rating = parseInt(rating)
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: { name: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where })
    ])

    // Calculate average rating
    const avgResult = await prisma.review.aggregate({
      where: { tenantId: session.tenantId },
      _avg: { rating: true },
      _count: { rating: true }
    })

    return NextResponse.json({
      reviews,
      total,
      averageRating: avgResult._avg.rating || 0,
      totalReviews: avgResult._count.rating,
    })
  } catch (error) {
    console.error('[Reviews] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews - Create a review (customer-facing)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantSlug, orderId, rating, comment, customerPhone } = body

    if (!tenantSlug || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 })
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, reviewsEnabled: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (!tenant.reviewsEnabled) {
      return NextResponse.json({ error: 'Reviews are disabled' }, { status: 400 })
    }

    // Find or create customer
    let customerId = null
    if (customerPhone) {
      const customer = await prisma.customer.upsert({
        where: {
          tenantId_phone: { tenantId: tenant.id, phone: customerPhone }
        },
        create: {
          tenantId: tenant.id,
          phone: customerPhone,
        },
        update: {},
      })
      customerId = customer.id
    }

    const review = await prisma.review.create({
      data: {
        tenantId: tenant.id,
        customerId,
        orderId,
        rating,
        comment,
      }
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('[Reviews] Create error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
