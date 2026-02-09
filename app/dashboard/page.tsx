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
  Package,
  Gift,
  Users,
  CreditCard,
  Settings,
  Menu,
  BarChart3,
  ChefHat,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardStats {
  today: { revenue: number; orders: number; change: number }
  week: { revenue: number; orders: number; change: number }
  month: { revenue: number; orders: number; change: number }
  topItems: { name: string; count: number; revenue: number }[]
  recentOrders: { id: string; orderNumber: string; total: number; status: string; customerName: string; createdAt: string }[]
  dailyRevenue: { date: string; revenue: number; orders: number }[]
  giftCards: { totalSold: number; totalValue: number; activeCards: number }
}

// Create empty stats for new restaurants
const createEmptyStats = (): DashboardStats => ({
  today: { revenue: 0, orders: 0, change: 0 },
  week: { revenue: 0, orders: 0, change: 0 },
  month: { revenue: 0, orders: 0, change: 0 },
  topItems: [],
  recentOrders: [],
  dailyRevenue: [],
  giftCards: { totalSold: 0, totalValue: 0, activeCards: 0 }
})

export default function DashboardHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d')

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
      // Fetch analytics data
      const res = await fetch('/api/analytics?period=month')
      
      if (!res.ok) {
        // API error - show empty state
        setStats(createEmptyStats())
        setLoading(false)
        return
      }
      
      const data = await res.json()
      
      // Build stats from real data (even if empty)
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const todayData = data.dailyBreakdown?.find((d: any) => d.date === todayStr) || { orders: 0, revenue: 0 }
      
      const newStats: DashboardStats = {
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
        dailyRevenue: data.dailyBreakdown?.map((d: any) => ({
          date: d.date,
          revenue: d.revenue || 0,
          orders: d.orders || 0
        })) || [],
        giftCards: { totalSold: 0, totalValue: 0, activeCards: 0 }
      }
      
      setStats(newStats)
      
      // Fetch recent orders
      try {
        const ordersRes = await fetch('/api/orders?limit=5')
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setStats(prev => prev ? {
            ...prev,
            recentOrders: ordersData.orders?.slice(0, 5) || []
          } : null)
        }
      } catch (e) {
        console.error('Failed to fetch orders:', e)
      }
      
      // Fetch gift card stats
      try {
        const giftRes = await fetch('/api/gift-cards')
        if (giftRes.ok) {
          const giftData = await giftRes.json()
          const cards = giftData.giftCards || []
          setStats(prev => prev ? {
            ...prev,
            giftCards: {
              totalSold: cards.length,
              totalValue: cards.reduce((sum: number, c: any) => sum + c.initialBalance, 0),
              activeCards: cards.filter((c: any) => c.currentBalance > 0).length
            }
          } : null)
        }
      } catch (e) {
        console.error('Failed to fetch gift cards:', e)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats(createEmptyStats())
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
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const chartData = chartPeriod === '7d' 
    ? stats?.dailyRevenue.slice(-7) 
    : stats?.dailyRevenue.slice(-30)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">DerbyFlow</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  Dashboard
                </Link>
                <Link href="/dashboard/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Orders
                </Link>
                <Link href="/dashboard/menu" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Menu
                </Link>
                <Link href="/admin/gift-cards" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Gift Cards
                </Link>
                <Link href="/dashboard/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Store Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild className="border-gray-300">
                <Link href={`/store/${tenant?.slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Store
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome banner for new restaurants */}
        {stats && stats.month.orders === 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">Welcome to DerbyFlow! 🎉</h2>
                  <p className="text-blue-100 mb-4">
                    Your restaurant is all set up. Here's how to start receiving orders:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">1. Add menu items</p>
                      <p className="text-sm text-blue-100">Create your delicious menu</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">2. Connect Stripe</p>
                      <p className="text-sm text-blue-100">Accept online payments</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">3. Share your link</p>
                      <p className="text-sm text-blue-100">Start taking orders</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href="/dashboard/menu">
                        <Menu className="w-4 h-4 mr-2" />
                        Add Menu Items
                      </Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/store/${tenant?.slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Store
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {tenant?.name || 'there'}
          </h1>
          <p className="text-gray-600 mt-1">
            {stats && stats.month.orders > 0 
              ? "Here's how your business is doing"
              : "Let's get your restaurant ready for customers"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Today */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Today's Revenue</p>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.today.revenue || 0)}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${(stats?.today.change || 0) >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {(stats?.today.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(stats?.today.change || 0).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs yesterday</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Today */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Orders Today</p>
                  <div className="text-2xl font-bold text-gray-900">{stats?.today.orders || 0}</div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats?.week.orders || 0} orders this week
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Monthly Revenue</p>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.month.revenue || 0)}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${(stats?.month.change || 0) >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {(stats?.month.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(stats?.month.change || 0).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">growth</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift Cards */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Gift Cards Sold</p>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.giftCards.totalValue || 0)}</div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats?.giftCards.activeCards || 0} active cards
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue and order trends</CardDescription>
              </div>
              {chartData && chartData.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    variant={chartPeriod === '7d' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartPeriod('7d')}
                  >
                    7 Days
                  </Button>
                  <Button 
                    variant={chartPeriod === '30d' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartPeriod('30d')}
                  >
                    30 Days
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chartData && chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                      labelFormatter={(date) => new Date(date as string).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No revenue data yet</h3>
                <p className="text-gray-500 max-w-sm mb-4">
                  Once you start receiving orders, your revenue trends will appear here.
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/store/${tenant?.slug}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share your store link to get started
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Selling Items</CardTitle>
              <CardDescription>Best performers this month</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topItems && stats.topItems.length > 0 ? (
                <div className="space-y-3">
                  {stats.topItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700' : 
                        i === 1 ? 'bg-gray-200 text-gray-700' : 
                        i === 2 ? 'bg-orange-100 text-orange-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.count} sold</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No sales data yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start receiving orders to see top items</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/orders">View all →</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customerName} · {formatTime(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No orders yet</p>
                  <p className="text-gray-400 text-xs mt-1">Orders will appear here in real-time</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gift Cards Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Gift Cards</CardTitle>
                <CardDescription>Overview of gift card sales</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/gift-cards">Manage →</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Total Value Sold</p>
                      <p className="text-xs text-gray-500">{stats?.giftCards.totalSold || 0} cards</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(stats?.giftCards.totalValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Cards</p>
                      <p className="text-xs text-gray-500">With remaining balance</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats?.giftCards.activeCards || 0}</span>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/admin/gift-cards">
                    <Gift className="w-4 h-4 mr-2" />
                    Create Gift Card
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/dashboard/orders" className="group">
                <div className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 text-center transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Orders</p>
                  <p className="text-xs text-slate-500 mt-1">View & manage</p>
                </div>
              </Link>
              <Link href="/dashboard/order-history" className="group">
                <div className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl p-4 text-center transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Clock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Order History</p>
                  <p className="text-xs text-slate-500 mt-1">Past orders</p>
                </div>
              </Link>
              <Link href="/dashboard/menu" className="group">
                <div className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-4 text-center transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Menu className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Menu</p>
                  <p className="text-xs text-slate-500 mt-1">Edit items</p>
                </div>
              </Link>
              <Link href="/admin/gift-cards" className="group">
                <div className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-4 text-center transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Gift className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Gift Cards</p>
                  <p className="text-xs text-slate-500 mt-1">Create & track</p>
                </div>
              </Link>
              <Link href="/dashboard/settings" className="group">
                <div className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 text-center transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Settings className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Settings</p>
                  <p className="text-xs text-slate-500 mt-1">Store options</p>
                </div>
              </Link>
              <Link href={`/store/${tenant?.slug}`} target="_blank" className="group">
                <div className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-4 text-center transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <ExternalLink className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">View Store</p>
                  <p className="text-xs text-slate-500 mt-1">Customer view</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
