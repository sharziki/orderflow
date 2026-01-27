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

// GET /api/loyalty - Check points balance for customer
export async function GET(req: NextRequest) {
  try {
    const customerAuth = getCustomerFromToken(req)
    
    // If not authenticated, allow lookup by query params
    const { searchParams } = new URL(req.url)
    const customerId = customerAuth?.customerId || searchParams.get('customerId')
    const tenantId = customerAuth?.tenantId || searchParams.get('tenantId')
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer authentication or customerId required' },
        { status: 401 }
      )
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        loyaltyPoints: true,
        totalSpent: true,
        orderCount: true,
        tenant: {
          select: {
            loyaltyEnabled: true,
            loyaltyPointsPerDollar: true,
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
        { error: 'Loyalty program not enabled for this restaurant' },
        { status: 400 }
      )
    }
    
    // Calculate redeemable value
    const pointsRedemptionRate = customer.tenant.loyaltyPointsRedemptionRate // e.g., 100 points
    const redemptionValue = customer.tenant.loyaltyRedemptionValue // e.g., $5
    
    const redeemableUnits = Math.floor(customer.loyaltyPoints / pointsRedemptionRate)
    const redeemableValue = redeemableUnits * redemptionValue
    const pointsToNextReward = pointsRedemptionRate - (customer.loyaltyPoints % pointsRedemptionRate)
    
    return NextResponse.json({
      points: customer.loyaltyPoints,
      totalSpent: customer.totalSpent,
      orderCount: customer.orderCount,
      pointsPerDollar: customer.tenant.loyaltyPointsPerDollar,
      pointsRedemptionRate,
      redemptionValue,
      redeemableUnits,
      redeemableValue,
      pointsToNextReward,
    })
  } catch (error) {
    console.error('Error fetching loyalty points:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty points' }, { status: 500 })
  }
}
