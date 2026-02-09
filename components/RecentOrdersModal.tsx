'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Clock, 
  ShoppingBag, 
  ChevronRight, 
  RefreshCw,
  Store as StoreIcon,
  Truck,
  ArrowUpRight,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OrderItem {
  name: string
  quantity: number
  price: number
  options?: any[]
}

interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  type: 'pickup' | 'delivery'
  total: number
  subtotal: number
  tax: number
  tip: number
  deliveryFee: number
  createdAt: string
  completedAt: string | null
  items: OrderItem[]
  tenant?: {
    id: string
    slug: string
    name: string
    logo: string | null
  }
  reorderItems?: any[]
}

interface RecentOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  tenantSlug: string
  customerPhone: string
  primaryColor?: string
  onReorder?: (items: any[]) => void
}

export default function RecentOrdersModal({
  isOpen,
  onClose,
  tenantSlug,
  customerPhone,
  primaryColor = '#1a4fff',
  onReorder,
}: RecentOrdersModalProps) {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && customerPhone) {
      fetchOrders()
    }
  }, [isOpen, customerPhone, tenantSlug])

  const fetchOrders = async () => {
    if (!customerPhone) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        phone: customerPhone,
        tenantSlug: tenantSlug,
        limit: '20',
      })

      const res = await fetch(`/api/orders/history?${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load order history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'ready':
        return 'bg-blue-100 text-blue-700'
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'ready':
        return 'Ready'
      case 'out_for_delivery':
        return 'Out for Delivery'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const handleReorder = (order: RecentOrder) => {
    if (order.reorderItems && onReorder) {
      onReorder(order.reorderItems)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 flex flex-col"
          >
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div 
                className="px-6 py-5 flex items-center justify-between border-b"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                    <p className="text-sm text-gray-500">Your order history</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm">Loading orders...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Package className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={fetchOrders}
                      className="mt-3 text-sm font-medium hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Try again
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6">
                    <Package className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-base font-medium text-gray-600">No orders yet</p>
                    <p className="text-sm text-center mt-1">
                      Your order history will appear here after you place your first order.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {orders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                      >
                        {/* Order Header */}
                        <button
                          onClick={() => setExpandedOrderId(
                            expandedOrderId === order.id ? null : order.id
                          )}
                          className="w-full p-4 text-left hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  {order.orderNumber}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDate(order.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  {order.type === 'pickup' ? (
                                    <StoreIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <Truck className="w-3.5 h-3.5" />
                                  )}
                                  {order.type === 'pickup' ? 'Pickup' : 'Delivery'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                ${order.total.toFixed(2)}
                              </span>
                              <ChevronRight 
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  expandedOrderId === order.id ? 'rotate-90' : ''
                                }`} 
                              />
                            </div>
                          </div>

                          {/* Item preview when collapsed */}
                          {expandedOrderId !== order.id && (
                            <p className="text-sm text-gray-500 mt-2 truncate">
                              {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                            </p>
                          )}
                        </button>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedOrderId === order.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3">
                                {/* Items */}
                                <div className="bg-white rounded-lg p-3 space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-gray-700">
                                        <span className="font-medium">{item.quantity}x</span> {item.name}
                                      </span>
                                      <span className="text-gray-600">
                                        ${(item.price * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Price breakdown */}
                                <div className="text-sm space-y-1 text-gray-500 px-1">
                                  <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${order.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>${order.tax.toFixed(2)}</span>
                                  </div>
                                  {order.deliveryFee > 0 && (
                                    <div className="flex justify-between">
                                      <span>Delivery</span>
                                      <span>${order.deliveryFee.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {order.tip > 0 && (
                                    <div className="flex justify-between">
                                      <span>Tip</span>
                                      <span>${order.tip.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t">
                                    <span>Total</span>
                                    <span>${order.total.toFixed(2)}</span>
                                  </div>
                                </div>

                                {/* Reorder button */}
                                {onReorder && order.reorderItems && (
                                  <button
                                    onClick={() => handleReorder(order)}
                                    className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Reorder
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
