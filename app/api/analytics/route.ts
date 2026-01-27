import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/analytics - Dashboard analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'week' // today, week, month, year

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get orders in period
    const orders = await prisma.order.findMany({
      where: {
        tenantId: session.tenantId,
        createdAt: { gte: startDate },
        status: { not: 'cancelled' }
      },
      select: {
        id: true,
        total: true,
        items: true,
        type: true,
        createdAt: true,
        status: true,
      }
    })

    // Calculate stats
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const pickupOrders = orders.filter(o => o.type === 'pickup').length
    const deliveryOrders = orders.filter(o => o.type === 'delivery').length

    // Top items
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {}
    orders.forEach(order => {
      const items = order.items as any[]
      items.forEach(item => {
        const key = item.menuItemId || item.name
        if (!itemCounts[key]) {
          itemCounts[key] = { name: item.name, count: 0, revenue: 0 }
        }
        itemCounts[key].count += item.quantity
        itemCounts[key].revenue += item.price * item.quantity
      })
    })

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Peak hours
    const hourCounts: Record<number, number> = {}
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Daily breakdown (for charts)
    const dailyStats: Record<string, { date: string; orders: number; revenue: number }> = {}
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { date, orders: 0, revenue: 0 }
      }
      dailyStats[date].orders += 1
      dailyStats[date].revenue += order.total
    })

    const dailyBreakdown = Object.values(dailyStats).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // Comparison with previous period
    const periodMs = now.getTime() - startDate.getTime()
    const previousStart = new Date(startDate.getTime() - periodMs)
    
    const previousOrders = await prisma.order.findMany({
      where: {
        tenantId: session.tenantId,
        createdAt: { gte: previousStart, lt: startDate },
        status: { not: 'cancelled' }
      },
      select: { total: true }
    })

    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0)
    const previousOrderCount = previousOrders.length

    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    const ordersChange = previousOrderCount > 0
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
      : 0

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        pickupOrders,
        deliveryOrders,
        revenueChange,
        ordersChange,
      },
      topItems,
      peakHours,
      dailyBreakdown,
    })
  } catch (error) {
    console.error('[Analytics] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
