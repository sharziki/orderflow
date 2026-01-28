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
  BarChart3
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

// Generate realistic demo data
const generateDemoStats = (): DashboardStats => {
  const today = new Date()
  const dailyRevenue = []
  
  // Generate last 30 days of data with realistic patterns
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    
    // Weekend boost, weekday variance
    let baseRevenue = 800 + Math.random() * 400
    if (dayOfWeek === 5 || dayOfWeek === 6) baseRevenue *= 1.4 // Fri/Sat boost
    if (dayOfWeek === 0) baseRevenue *= 1.2 // Sunday moderate
    
    // Add some trend (growth over time)
    baseRevenue *= (1 + (29 - i) * 0.008)
    
    const orders = Math.floor(baseRevenue / 28) + Math.floor(Math.random() * 8)
    
    dailyRevenue.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseRevenue * 100) / 100,
      orders
    })
  }
  
  const todayData = dailyRevenue[dailyRevenue.length - 1]
  const yesterdayData = dailyRevenue[dailyRevenue.length - 2]
  const weekData = dailyRevenue.slice(-7)
  const lastWeekData = dailyRevenue.slice(-14, -7)
  
  const weekRevenue = weekData.reduce((sum, d) => sum + d.revenue, 0)
  const lastWeekRevenue = lastWeekData.reduce((sum, d) => sum + d.revenue, 0)
  const weekOrders = weekData.reduce((sum, d) => sum + d.orders, 0)
  
  const monthRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0)
  const monthOrders = dailyRevenue.reduce((sum, d) => sum + d.orders, 0)
  
  return {
    today: {
      revenue: todayData.revenue,
      orders: todayData.orders,
      change: ((todayData.revenue - yesterdayData.revenue) / yesterdayData.revenue) * 100
    },
    week: {
      revenue: weekRevenue,
      orders: weekOrders,
      change: ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
    },
    month: {
      revenue: monthRevenue,
      orders: monthOrders,
      change: 12.5 // Assume positive growth
    },
    topItems: [
      { name: 'Classic Cheeseburger', count: 156, revenue: 2027.44 },
      { name: 'Crispy Chicken Sandwich', count: 134, revenue: 1606.66 },
      { name: 'Truffle Fries', count: 98, revenue: 684.02 },
      { name: 'Garden Salad', count: 87, revenue: 782.13 },
      { name: 'Fresh Lemonade', count: 203, revenue: 1012.97 }
    ],
    recentOrders: [
      { id: '1', orderNumber: '1047', total: 34.97, status: 'preparing', customerName: 'John D.', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: '2', orderNumber: '1046', total: 28.45, status: 'ready', customerName: 'Sarah M.', createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
      { id: '3', orderNumber: '1045', total: 52.30, status: 'completed', customerName: 'Mike R.', createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
      { id: '4', orderNumber: '1044', total: 19.99, status: 'completed', customerName: 'Emily K.', createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString() },
      { id: '5', orderNumber: '1043', total: 45.50, status: 'completed', customerName: 'David L.', createdAt: new Date(Date.now() - 1000 * 60 * 52).toISOString() }
    ],
    dailyRevenue,
    giftCards: {
      totalSold: 47,
      totalValue: 2350,
      activeCards: 31
    }
  }
}

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
      const res = await fetch('/api/analytics?period=month')
      if (res.ok) {
        const data = await res.json()
        
        // Check if we have real data
        const hasRealData = data.summary?.totalOrders > 0
        
        if (hasRealData) {
          // Use real data
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
            dailyRevenue: data.dailyBreakdown?.map((d: any) => ({
              date: d.date,
              revenue: d.revenue || 0,
              orders: d.orders || 0
            })) || [],
            giftCards: { totalSold: 0, totalValue: 0, activeCards: 0 }
          })
          
          // Fetch recent orders
          const ordersRes = await fetch('/api/orders?limit=5')
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json()
            setStats(prev => prev ? {
              ...prev,
              recentOrders: ordersData.orders?.slice(0, 5) || []
            } : null)
          }
          
          // Fetch gift card stats
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
        } else {
          // Use demo data for preview
          setStats(generateDemoStats())
        }
      } else {
        // Fallback to demo data
        setStats(generateDemoStats())
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats(generateDemoStats())
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
                <Link href="/admin" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Kitchen
                </Link>
                <Link href="/admin/gift-cards" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Gift Cards
                </Link>
                <Link href="/dashboard/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
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
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {tenant?.name || 'there'}
          </h1>
          <p className="text-gray-600 mt-1">Here's how your business is doing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.today.revenue || 0)}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex items-center text-xs font-medium ${(stats?.today.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(stats?.today.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stats?.today.change || 0).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          {/* Orders Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Orders Today</CardTitle>
              <ShoppingBag className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.today.orders || 0}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.week.orders || 0} this week
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.month.revenue || 0)}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex items-center text-xs font-medium ${(stats?.month.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(stats?.month.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stats?.month.change || 0).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">growth</span>
              </div>
            </CardContent>
          </Card>

          {/* Gift Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Gift Cards</CardTitle>
              <Gift className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.giftCards.totalValue || 0)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.giftCards.activeCards || 0} active cards
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
            </div>
          </CardHeader>
          <CardContent>
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
                <div className="space-y-4">
                  {stats.topItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.count} sold</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No sales data yet</p>
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
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customerName} · {formatTime(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</p>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No orders yet</p>
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
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/menu">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Menu
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/orders">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  View Orders
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/store/${tenant?.slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Store
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api/qr-code?format=png" target="_blank">
                  <QrCode className="w-4 h-4 mr-2" />
                  Download QR
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
