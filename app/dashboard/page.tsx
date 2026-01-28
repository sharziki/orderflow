'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  ExternalLink,
  QrCode,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package
} from 'lucide-react'

interface DashboardStats {
  today: { revenue: number; orders: number; change: number }
  week: { revenue: number; orders: number; change: number }
  month: { revenue: number; orders: number; change: number }
  topItems: { name: string; count: number; revenue: number }[]
  recentOrders: { id: string; orderNumber: string; total: number; status: string; customerName: string; createdAt: string }[]
  dailyRevenue: { date: string; revenue: number }[]
}

export default function DashboardHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setTenant(data.tenant)
    } catch {
      router.push('/login')
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics?period=month')
      if (res.ok) {
        const data = await res.json()
        
        // Transform analytics data to dashboard stats
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        
        const todayData = data.dailyBreakdown?.find((d: any) => d.date === todayStr) || { orders: 0, revenue: 0 }
        
        setStats({
          today: { 
            revenue: todayData.revenue || 0, 
            orders: todayData.orders || 0,
            change: data.summary?.ordersChange || 0
          },
          week: { 
            revenue: data.summary?.totalRevenue || 0, 
            orders: data.summary?.totalOrders || 0,
            change: data.summary?.revenueChange || 0
          },
          month: { 
            revenue: data.summary?.totalRevenue || 0, 
            orders: data.summary?.totalOrders || 0,
            change: data.summary?.revenueChange || 0
          },
          topItems: data.topItems?.slice(0, 5) || [],
          recentOrders: [],
          dailyRevenue: data.dailyBreakdown || []
        })
      }
      
      // Fetch recent orders
      const ordersRes = await fetch('/api/orders?limit=5')
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setStats(prev => prev ? {
          ...prev,
          recentOrders: ordersData.orders?.slice(0, 5) || []
        } : null)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...(stats?.dailyRevenue.map(d => d.revenue) || [1]))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                OrderFlow
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  Dashboard
                </Link>
                <Link href="/dashboard/menu" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Menu
                </Link>
                <Link href="/dashboard/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Orders
                </Link>
                <Link href="/dashboard/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href={`/store/${tenant?.slug}`}
                target="_blank"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ExternalLink className="w-4 h-4" />
                View Store
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {tenant?.name || 'there'}
          </h1>
          <p className="text-gray-600 mt-1">Here's how your business is doing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Today</span>
              <span className={`flex items-center text-sm font-medium ${stats?.today.change && stats.today.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats?.today.change && stats.today.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats?.today.change || 0).toFixed(0)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats?.today.revenue || 0)}
            </div>
            <div className="text-sm text-gray-500">
              {stats?.today.orders || 0} orders
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">This Week</span>
              <span className={`flex items-center text-sm font-medium ${stats?.week.change && stats.week.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats?.week.change && stats.week.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats?.week.change || 0).toFixed(0)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats?.week.revenue || 0)}
            </div>
            <div className="text-sm text-gray-500">
              {stats?.week.orders || 0} orders
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">This Month</span>
              <span className={`flex items-center text-sm font-medium ${stats?.month.change && stats.month.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats?.month.change && stats.month.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats?.month.change || 0).toFixed(0)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats?.month.revenue || 0)}
            </div>
            <div className="text-sm text-gray-500">
              {stats?.month.orders || 0} orders
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (Last 7 Days)</h2>
          <div className="h-40 flex items-end gap-2">
            {stats?.dailyRevenue.slice(-7).map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                  style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 4)}%` }}
                  title={`${day.date}: ${formatCurrency(day.revenue)}`}
                />
                <span className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
            {(!stats?.dailyRevenue || stats.dailyRevenue.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Items</h2>
            {stats?.topItems && stats.topItems.length > 0 ? (
              <div className="space-y-3">
                {stats.topItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{item.count} sold</div>
                      <div className="text-xs text-gray-500">{formatCurrency(item.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No sales data yet</p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No orders yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/menu"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Menu
            </Link>
            <Link
              href={`/store/${tenant?.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Store
            </Link>
            <Link
              href="/api/qr-code?format=png"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Download QR Code
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
