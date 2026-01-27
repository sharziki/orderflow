import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Stripe from 'stripe'

// Lazy-init Stripe to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// POST /api/orders/[orderId]/refund - Process a refund
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { orderId } = await params
    const body = await req.json()
    const { amount, reason, fullRefund } = body
    
    // Find order and verify ownership
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    // Check if order has a payment to refund
    if (!order.paymentIntentId) {
      return NextResponse.json(
        { error: 'No payment found for this order' },
        { status: 400 }
      )
    }
    
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'partial_refund') {
      return NextResponse.json(
        { error: `Cannot refund order with payment status: ${order.paymentStatus}` },
        { status: 400 }
      )
    }
    
    // Calculate refund amount
    const alreadyRefunded = order.refundedAmount || 0
    const maxRefundable = order.total - alreadyRefunded
    
    if (maxRefundable <= 0) {
      return NextResponse.json(
        { error: 'Order has already been fully refunded' },
        { status: 400 }
      )
    }
    
    let refundAmount: number
    if (fullRefund) {
      refundAmount = maxRefundable
    } else if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Refund amount must be greater than 0' },
          { status: 400 }
        )
      }
      if (amount > maxRefundable) {
        return NextResponse.json(
          { error: `Refund amount exceeds maximum refundable amount of $${maxRefundable.toFixed(2)}` },
          { status: 400 }
        )
      }
      refundAmount = amount
    } else {
      return NextResponse.json(
        { error: 'Either amount or fullRefund must be specified' },
        { status: 400 }
      )
    }
    
    // Process refund through Stripe
    const stripe = getStripe()
    const refundAmountCents = Math.round(refundAmount * 100)
    
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: refundAmountCents,
        reason: 'requested_by_customer',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: reason || 'Staff initiated refund',
        },
      })
      
      // Update order with refund info
      const totalRefunded = alreadyRefunded + refundAmount
      const isFullyRefunded = totalRefunded >= order.total
      
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          refundedAmount: totalRefunded,
          refundReason: reason || order.refundReason || 'Staff initiated refund',
          refundedAt: new Date(),
          paymentStatus: isFullyRefunded ? 'refunded' : 'partial_refund',
          // Add refund note to kitchen notes
          kitchenNotes: order.kitchenNotes
            ? `${order.kitchenNotes}\n[${new Date().toISOString()}] Refund: $${refundAmount.toFixed(2)} - ${reason || 'No reason provided'}`
            : `[${new Date().toISOString()}] Refund: $${refundAmount.toFixed(2)} - ${reason || 'No reason provided'}`,
        },
      })
      
      return NextResponse.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refundAmount,
          status: refund.status,
        },
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          refundedAmount: updatedOrder.refundedAmount,
          paymentStatus: updatedOrder.paymentStatus,
        },
      })
    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError)
      return NextResponse.json(
        { error: stripeError.message || 'Failed to process refund with Stripe' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
