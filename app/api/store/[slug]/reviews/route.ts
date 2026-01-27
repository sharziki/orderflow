import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/store/[slug]/reviews - Public reviews for store page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, reviewsEnabled: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (!tenant.reviewsEnabled) {
      return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 })
    }

    const [reviews, avgResult] = await Promise.all([
      prisma.review.findMany({
        where: {
          tenantId: tenant.id,
          isPublic: true,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          response: true,
          createdAt: true,
          customer: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.review.aggregate({
        where: { tenantId: tenant.id, isPublic: true },
        _avg: { rating: true },
        _count: { rating: true }
      })
    ])

    // Anonymize customer names
    const publicReviews = reviews.map(r => ({
      ...r,
      customerName: r.customer?.name 
        ? `${r.customer.name.charAt(0)}***` 
        : 'Customer',
      customer: undefined,
    }))

    return NextResponse.json({
      reviews: publicReviews,
      averageRating: avgResult._avg.rating || 0,
      totalReviews: avgResult._count.rating,
    })
  } catch (error) {
    console.error('[PublicReviews] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
