'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  Clock,
  DollarSign,
  Package,
  Printer,
  RefreshCw,
  Search,
  Store,
  Truck,
  User
} from 'lucide-react'
import { browserPrint } from '@/lib/browser-print'
import { formatHTMLTicket } from '@/lib/ticket-formatter'
import toast, { Toaster } from 'react-hot-toast'

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
  type: 'pickup' | 'delivery'
  status: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  subtotal: number
  deliveryFee: number
  tax: number
  tip: number
  discount?: number
  total: number
  deliveryAddress?: string | null
  notes?: string | null
  createdAt: string
  completedAt?: string | null
  items: OrderItem[]
}

interface DayGroup {
  date: string
  label: string
  orders: Order[]
  totalRevenue: number
  orderCount: number
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders?limit=500&status=completed')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrders(data.orders || [])
      
      // Auto-expand today
      const today = new Date().toISOString().split('T')[0]
      setExpandedDays(new Set([today]))
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load order history')
    } finally {
      setLoading(false)
    }
  }

  // Group orders by day
  const groupOrdersByDay = (orders: Order[]): DayGroup[] => {
    const groups: Record<string, Order[]> = {}
    
    orders.forEach(order => {
      const date = new Date(order.completedAt || order.createdAt).toISOString().split('T')[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(order)
    })

    // Sort by date descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

    return sortedDates.map(date => {
      const dayOrders = groups[date]
      const totalRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0)
      
      // Format date label
      const dateObj = new Date(date + 'T12:00:00')
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let label: string
      if (date === today.toISOString().split('T')[0]) {
        label = 'Today'
      } else if (date === yesterday.toISOString().split('T')[0]) {
        label = 'Yesterday'
      } else {
        label = dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        })
      }

      return {
        date,
        label,
        orders: dayOrders,
        totalRevenue,
        orderCount: dayOrders.length
      }
    })
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery)
    
    const orderDate = new Date(order.completedAt || order.createdAt).toISOString().split('T')[0]
    const matchesDate = !selectedDate || orderDate === selectedDate

    return matchesSearch && matchesDate
  })

  const dayGroups = groupOrdersByDay(filteredOrders)

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const handlePrintOrder = async (order: Order) => {
    try {
      const htmlContent = formatHTMLTicket(order)
      const result = await browserPrint.printViaBrowser(htmlContent)
      if (result.success) {
        toast.success(`Printing ${order.orderNumber}`)
      } else {
        toast.error('Print failed')
      }
    } catch (error) {
      toast.error('Print failed')
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Calculate totals
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = filteredOrders.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">Loading order history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Order History</h1>
                <p className="text-sm text-gray-500">View completed orders by day</p>
              </div>
            </div>

            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Filters & Stats */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search & Date Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order List by Day */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {dayGroups.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No completed orders found</p>
            <p className="text-gray-400 text-sm mt-1">Orders will appear here once they're marked as completed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayGroups.map(group => (
              <div key={group.date} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(group.date)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="font-semibold text-gray-900">{group.label}</h2>
                      <p className="text-sm text-gray-500">
                        {group.orderCount} order{group.orderCount !== 1 ? 's' : ''} • ${group.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedDays.has(group.date) ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Orders in this day */}
                {expandedDays.has(group.date) && (
                  <div className="border-t divide-y">
                    {group.orders.map(order => (
                      <div key={order.id} className="bg-gray-50">
                        {/* Order Header */}
                        <button
                          onClick={() => toggleOrder(order.id)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              order.type === 'pickup' 
                                ? 'bg-purple-100 text-purple-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {order.type === 'pickup' ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  {order.orderNumber}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-600">{order.customerName}</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatTime(order.completedAt || order.createdAt)}
                                <span className="mx-2">•</span>
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedOrders.has(order.id) ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>

                        {/* Order Details */}
                        {expandedOrders.has(order.id) && (
                          <div className="px-6 pb-4 bg-white border-t">
                            <div className="grid md:grid-cols-2 gap-6 py-4">
                              {/* Customer Info */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {order.customerName}
                                  </p>
                                  <p>{order.customerPhone}</p>
                                  {order.customerEmail && <p>{order.customerEmail}</p>}
                                  {order.deliveryAddress && (
                                    <p className="text-gray-500">{order.deliveryAddress}</p>
                                  )}
                                </div>
                              </div>

                              {/* Items */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
                                <div className="space-y-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        <span className="font-medium">{item.quantity}×</span> {item.name}
                                      </span>
                                      <span className="text-gray-500">
                                        ${(item.price * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="py-3 border-t">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {order.notes}
                                </p>
                              </div>
                            )}

                            {/* Totals & Actions */}
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="text-sm text-gray-500 space-x-4">
                                <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
                                <span>Tax: ${order.tax.toFixed(2)}</span>
                                {order.tip > 0 && <span>Tip: ${order.tip.toFixed(2)}</span>}
                                {order.deliveryFee > 0 && <span>Delivery: ${order.deliveryFee.toFixed(2)}</span>}
                              </div>
                              <button
                                onClick={() => handlePrintOrder(order)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                                Print
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
