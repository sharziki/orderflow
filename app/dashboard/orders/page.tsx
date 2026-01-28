'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Search,
  Filter,
  ShoppingBag,
  Truck,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  RefreshCcw,
  Bell,
  BellOff,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreVertical,
  Phone,
  MapPin,
  User,
  Printer,
  Eye,
  Volume2,
  VolumeX,
} from 'lucide-react'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  }),
  exit: { opacity: 0, x: -20 }
}

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'
type OrderType = 'pickup' | 'delivery'

interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
  options?: any[]
  specialRequests?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  type: OrderType
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  tip: number
  total: number
  createdAt: string
  scheduledFor?: string
  deliveryAddress?: string
  notes?: string
  doordashDeliveryId?: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'New Order', color: 'bg-yellow-100 text-yellow-800', icon: Bell },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', icon: Truck },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

// Notification sound (local file)
const NOTIFICATION_SOUND_URL = '/sounds/new-order.mp3'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<OrderType | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  
  // Refs for tracking state across refreshes
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previousOrderIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)
  
  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/login')
          return
        }
        setAuthChecked(true)
      } catch {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL)
    audioRef.current.volume = 0.7
    
    // Load sound preference from localStorage
    const savedSoundPref = localStorage.getItem('orderflow-sound-enabled')
    if (savedSoundPref !== null) {
      setSoundEnabled(savedSoundPref === 'true')
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])
  
  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => {
        console.log('[Orders] Could not play sound:', err)
      })
    }
  }, [soundEnabled])
  
  // Toggle sound and save preference
  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('orderflow-sound-enabled', String(newValue))
  }
  
  // Fetch orders from API
  const fetchOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('limit', '100')
      
      const res = await fetch(`/api/orders?${params.toString()}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await res.json()
      const fetchedOrders: Order[] = data.orders || []
      
      // Check for new orders (not on first load)
      if (!isFirstLoadRef.current) {
        const newPendingOrders = fetchedOrders.filter(
          order => 
            order.status === 'pending' && 
            !previousOrderIdsRef.current.has(order.id)
        )
        
        if (newPendingOrders.length > 0) {
          playNotificationSound()
          console.log(`[Orders] ${newPendingOrders.length} new order(s) received!`)
        }
      }
      
      // Update tracking refs
      isFirstLoadRef.current = false
      previousOrderIdsRef.current = new Set(fetchedOrders.map(o => o.id))
      
      setOrders(fetchedOrders)
      setLastFetchTime(new Date())
      
      // Update selected order if it exists
      if (selectedOrder) {
        const updatedSelected = fetchedOrders.find(o => o.id === selectedOrder.id)
        if (updatedSelected) {
          setSelectedOrder(updatedSelected)
        }
      }
    } catch (error) {
      console.error('[Orders] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, selectedOrder, playNotificationSound])
  
  // Initial fetch (only after auth check)
  useEffect(() => {
    if (authChecked) {
      fetchOrders(true)
    }
  }, [authChecked]) // Only on mount after auth
  
  // Refetch when filters change
  useEffect(() => {
    if (authChecked && !isFirstLoadRef.current) {
      fetchOrders(false)
    }
  }, [filterStatus, filterType, authChecked])
  
  // Auto-refresh every 30 seconds (fallback for realtime)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Supabase realtime subscription for instant order updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order',
        },
        (payload) => {
          console.log('[Orders] Realtime: New order received', payload)
          playNotificationSound()
          fetchOrders(false) // Refresh to get full order data
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
        },
        (payload) => {
          console.log('[Orders] Realtime: Order updated', payload)
          fetchOrders(false)
        }
      )
      .subscribe((status) => {
        console.log('[Orders] Realtime subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [playNotificationSound, fetchOrders])

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length,
    ready: orders.filter(o => o.status === 'ready').length,
    pickup: orders.filter(o => o.type === 'pickup').length,
    delivery: orders.filter(o => o.type === 'delivery').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search)
    return matchesSearch
  })

  const [requestingDelivery, setRequestingDelivery] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId)
    
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update order')
      }
      
      const { order } = await res.json()
      
      // Update local state
      setOrders(prev => 
        prev.map(o => o.id === orderId ? { ...o, status: order.status } : o)
      )
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: order.status } : null)
      }
    } catch (error: any) {
      console.error('[Orders] Update error:', error)
      alert(error.message || 'Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const requestDoorDashDelivery = async (orderId: string) => {
    setRequestingDelivery(true)
    setDeliveryError(null)
    
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request delivery')
      }
      
      // Update order with DoorDash delivery ID
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, doordashDeliveryId: data.deliveryId, status: 'out_for_delivery' as OrderStatus } : order
        )
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, doordashDeliveryId: data.deliveryId, status: 'out_for_delivery' as OrderStatus } : null)
      }
    } catch (err: any) {
      setDeliveryError(err.message)
    } finally {
      setRequestingDelivery(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Orders</h1>
                <p className="text-sm text-slate-500">
                  {lastFetchTime 
                    ? `Updated ${formatTime(lastFetchTime.toISOString())}`
                    : 'Loading...'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Sound Toggle */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleSound}
                title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-green-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => fetchOrders(true)}
                disabled={loading}
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="outline" className="gap-2 relative">
                <Bell className="w-4 h-4" />
                {stats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {stats.pending}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.pending > 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">New</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Bell className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Preparing</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.preparing}</p>
                </div>
                <ChefHat className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Ready</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
                </div>
                <Package className="w-6 h-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Pickup</p>
                  <p className="text-2xl font-bold">{stats.pickup}</p>
                </div>
                <Store className="w-6 h-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Delivery</p>
                  <p className="text-2xl font-bold">{stats.delivery}</p>
                </div>
                <Truck className="w-6 h-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Revenue</p>
                  <p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-6 h-6 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, name, or phone..."
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as OrderStatus | 'all')}>
              <SelectTrigger className="w-[150px] h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">New Orders</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as OrderType | 'all')}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-4">
            {loading && orders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <RefreshCcw className="w-12 h-12 text-slate-200 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-500">Loading orders...</p>
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, i) => {
                const StatusIcon = statusConfig[order.status]?.icon || Bell
                const statusStyle = statusConfig[order.status] || statusConfig.pending
                return (
                  <motion.div
                    key={order.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={i}
                    layout
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    } ${order.status === 'pending' ? 'border-l-4 border-l-yellow-500' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {statusStyle.label}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.type === 'delivery' 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {order.type === 'delivery' ? (
                              <><Truck className="w-3 h-3 inline mr-1" /> Delivery</>
                            ) : (
                              <><Store className="w-3 h-3 inline mr-1" /> Pickup</>
                            )}
                          </div>
                          {order.scheduledFor && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Scheduled
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-slate-500">{formatTime(order.createdAt)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                          <p className="text-sm text-slate-500">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-slate-900">${order.total.toFixed(2)}</p>
                          <p className="text-sm text-slate-500">{order.items.length} items</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="flex-1 gap-1"
                              disabled={updatingStatus === order.id}
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'preparing'); }}
                            >
                              {updatingStatus === order.id ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                              ) : (
                                <ChefHat className="w-4 h-4" />
                              )}
                              Start Preparing
                            </Button>
                          )}
                          {(order.status === 'preparing' || order.status === 'confirmed') && (
                            <Button 
                              size="sm" 
                              className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                              disabled={updatingStatus === order.id}
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'ready'); }}
                            >
                              {updatingStatus === order.id ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Package className="w-4 h-4" />
                              )}
                              Mark Ready
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button 
                              size="sm" 
                              className="flex-1 gap-1"
                              disabled={updatingStatus === order.id}
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'completed'); }}
                            >
                              {updatingStatus === order.id ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Complete Order
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  </motion.div>
                )
              })}
              </AnimatePresence>
            )}
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <Card className="sticky top-24">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedOrder.orderNumber}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color || 'bg-slate-100 text-slate-800'}`}>
                      {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.type === 'delivery' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedOrder.type === 'delivery' ? 'Delivery' : 'Pickup'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Customer</h4>
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-slate-400" />
                        {selectedOrder.customerName}
                      </p>
                      <p className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {selectedOrder.customerPhone}
                      </p>
                      {selectedOrder.deliveryAddress && (
                        <p className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          {selectedOrder.deliveryAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  {selectedOrder.scheduledFor && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Scheduled for {new Date(selectedOrder.scheduledFor).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                          </span>
                          <span className="text-slate-600">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tax</span>
                      <span>${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Delivery Fee</span>
                        <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.tip > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tip</span>
                        <span>${selectedOrder.tip.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4">
                    {selectedOrder.status === 'pending' && (
                      <Button 
                        className="w-full gap-2"
                        disabled={updatingStatus === selectedOrder.id}
                        onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      >
                        {updatingStatus === selectedOrder.id ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChefHat className="w-4 h-4" />
                        )}
                        Start Preparing
                      </Button>
                    )}
                    {(selectedOrder.status === 'preparing' || selectedOrder.status === 'confirmed') && (
                      <Button 
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        disabled={updatingStatus === selectedOrder.id}
                        onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      >
                        {updatingStatus === selectedOrder.id ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                        Mark as Ready
                      </Button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <Button 
                        className="w-full gap-2"
                        disabled={updatingStatus === selectedOrder.id}
                        onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      >
                        {updatingStatus === selectedOrder.id ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Complete Order
                      </Button>
                    )}
                    
                    {/* DoorDash Delivery Button */}
                    {selectedOrder.type === 'delivery' && 
                     !selectedOrder.doordashDeliveryId && 
                     selectedOrder.status !== 'completed' && 
                     selectedOrder.status !== 'cancelled' && (
                      <div className="space-y-2">
                        <Button 
                          className="w-full gap-2 bg-red-600 hover:bg-red-700"
                          onClick={() => requestDoorDashDelivery(selectedOrder.id)}
                          disabled={requestingDelivery}
                        >
                          {requestingDelivery ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Truck className="w-4 h-4" />
                          )}
                          Request DoorDash Driver
                        </Button>
                        {deliveryError && (
                          <p className="text-sm text-red-600">{deliveryError}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Show DoorDash Status if active */}
                    {selectedOrder.doordashDeliveryId && (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          DoorDash delivery in progress
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          ID: {selectedOrder.doordashDeliveryId}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => window.open(`tel:${selectedOrder.customerPhone}`)}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    </div>
                    {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={updatingStatus === selectedOrder.id}
                        onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">Select an order to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
