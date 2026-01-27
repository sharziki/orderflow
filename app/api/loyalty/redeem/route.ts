import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'orderflow-secret-change-in-production'

interface CustomerTokenPayload {
  customerId: string
  tenantId: string
  phone: string
  type: 'customer'
}

// Verify customer token from Authorization header
function getCustomerFromToken(req: NextRequest): CustomerTokenPayload | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.slice(7)
  try {
    const payload = verify(token, JWT_SECRET) as CustomerTokenPayload
    if (payload.type !== 'customer') {
      return null
    }
    return payload
  } catch {
    return null
  }
}

// POST /api/loyalty/redeem - Redeem points for discount
export async function POST(req: NextRequest) {
  try {
    const customerAuth = getCustomerFromToken(req)
    const body = await req.json()
    
    const customerId = customerAuth?.customerId || body.customerId
    const pointsToRedeem = body.points
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer authentication required' },
        { status: 401 }
      )
    }
    
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json(
        { error: 'points is required and must be positive' },
        { status: 400 }
      )
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tenant: {
          select: {
            loyaltyEnabled: true,
            loyaltyPointsRedemptionRate: true,
            loyaltyRedemptionValue: true,
          },
        },
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    if (!customer.tenant.loyaltyEnabled) {
      return NextResponse.json(
        { error: 'Loyalty program not enabled' },
        { status: 400 }
      )
    }
    
    // Check if customer has enough points
    if (customer.loyaltyPoints < pointsToRedeem) {
      return NextResponse.json(
        { error: 'Insufficient loyalty points' },
        { status: 400 }
      )
    }
    
    // Points must be redeemed in units of redemptionRate
    const redemptionRate = customer.tenant.loyaltyPointsRedemptionRate
    const redemptionValue = customer.tenant.loyaltyRedemptionValue
    
    if (pointsToRedeem % redemptionRate !== 0) {
      return NextResponse.json(
        { error: `Points must be redeemed in increments of ${redemptionRate}` },
        { status: 400 }
      )
    }
    
    // Calculate discount value
    const unitsRedeemed = pointsToRedeem / redemptionRate
    const discountValue = unitsRedeemed * redemptionValue
    
    // Deduct points
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          decrement: pointsToRedeem,
        },
      },
      select: {
        id: true,
        loyaltyPoints: true,
      },
    })
    
    return NextResponse.json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountValue,
      remainingPoints: updatedCustomer.loyaltyPoints,
    })
  } catch (error) {
    console.error('Error redeeming loyalty points:', error)
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 })
  }
}
