import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/reviews/[id] - Respond to a review
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
    const { response, isPublic } = body

    // Verify review belongs to tenant
    const review = await prisma.review.findFirst({
      where: { id, tenantId: session.tenantId }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        response,
        respondedAt: response ? new Date() : null,
        isPublic: isPublic !== undefined ? isPublic : review.isPublic,
      }
    })

    return NextResponse.json({ review: updated })
  } catch (error) {
    console.error('[Reviews] Update error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

// DELETE /api/reviews/[id] - Hide a review (set isPublic = false)
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

    // Verify and hide
    const review = await prisma.review.updateMany({
      where: { id, tenantId: session.tenantId },
      data: { isPublic: false }
    })

    if (review.count === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reviews] Delete error:', error)
    return NextResponse.json({ error: 'Failed to hide review' }, { status: 500 })
  }
}
