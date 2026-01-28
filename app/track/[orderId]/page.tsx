'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'
type OrderType = 'pickup' | 'delivery'

interface OrderItem {
  id: string
  name: string
  description?: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  type: OrderType
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress?: string | null
  items: OrderItem[]
  subtotal: number
  tax: number
  tip: number
  deliveryFee: number
  discount: number
  total: number
  notes?: string | null
  doordashDeliveryId?: string | null
  createdAt: string
  updatedAt: string
}

export default function TrackOrderPage() {
  const params = useParams()
  const rawOrderId = params?.orderId
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId || typeof orderId !== 'string') {
      setError('No order ID provided')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)

        if (response.status === 410) {
          setError('This tracking link has expired (older than 2 hours)')
          setLoading(false)
          return
        }

        if (response.status === 404) {
          setError('Order not found')
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }

        const data = await response.json()
        setOrder(data)
        setError(null)
      } catch (err) {
        setError('Failed to load order. Please try again.')
        console.error('Error fetching order:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    // Set up real-time subscription to order updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('[Tracking] Real-time update received:', payload)
          fetchOrder()
        }
      )
      .subscribe()

    // Poll every 30 seconds as backup
    const pollInterval = setInterval(fetchOrder, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [orderId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Pickup order steps
  const pickupSteps = [
    { id: 'confirmed', label: 'Order Confirmed', icon: '✓' },
    { id: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { id: 'ready', label: 'Ready for Pickup', icon: '🔔' },
    { id: 'completed', label: 'Picked Up', icon: '✅' }
  ]

  // Delivery order steps
  const deliverySteps = [
    { id: 'confirmed', label: 'Order Confirmed', icon: '✓' },
    { id: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { id: 'ready', label: 'Ready for Dasher', icon: '📦' },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: '🚗' },
    { id: 'completed', label: 'Delivered', icon: '🏠' }
  ]

  const getStepIndex = (status: OrderStatus, isDelivery: boolean): number => {
    const steps = isDelivery ? deliverySteps : pickupSteps
    
    // Map status to step index
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 0
      case 'preparing':
        return 1
      case 'ready':
        return 2
      case 'out_for_delivery':
        return isDelivery ? 3 : 2
      case 'completed':
        return isDelivery ? 4 : 3
      case 'cancelled':
        return -1
      default:
        return 0
    }
  }

  const getStatusMessage = (status: OrderStatus, isDelivery: boolean): string => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is being confirmed.'
      case 'confirmed':
        return 'Your order has been confirmed! The kitchen will start preparing it soon.'
      case 'preparing':
        return 'Your order is being prepared! 👨‍🍳'
      case 'ready':
        return isDelivery 
          ? 'Your order is ready! A DoorDash driver will pick it up soon. 📦'
          : 'Your order is ready for pickup! 🎉'
      case 'out_for_delivery':
        return 'Your order is on the way! The Dasher is heading to you. 🚗'
      case 'completed':
        return isDelivery 
          ? 'Your order has been delivered! Enjoy your meal! 🙏'
          : 'Order completed. Thank you for dining with us! 🙏'
      case 'cancelled':
        return 'This order has been cancelled.'
      default:
        return 'Order status unknown.'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--color-primary))] to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6 bg-white rounded-2xl p-4 shadow-2xl">
            <Image
              src="/bluefishlogo.png"
              alt="Blu Fish House"
              fill
              className="object-contain animate-pulse"
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 mx-auto mb-4 bg-white rounded-2xl p-3 shadow-lg">
              <Image
                src="/bluefishlogo.png"
                alt="Blu Fish House"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Blu Fish House</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-xl font-semibold mb-2">Error</div>
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const isDelivery = order.type === 'delivery'
  const steps = isDelivery ? deliverySteps : pickupSteps
  const currentStepIndex = getStepIndex(order.status, isDelivery)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4 bg-white rounded-2xl p-4 shadow-lg">
            <Image
              src="/bluefishlogo.png"
              alt="Blu Fish House"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-1 text-gray-900">Blu Fish House</h1>
          <p className="text-lg text-gray-600 mb-2">Track Your Order</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold shadow-md">
            Order #{order.orderNumber}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Placed at {formatTime(order.createdAt)}
          </p>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              isDelivery 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {isDelivery ? '🚗 Delivery' : '🏪 Pickup'}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-md border border-gray-200">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
                <div
                  className="h-full bg-[rgb(var(--color-primary))] transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors shadow-md text-lg ${
                        currentStepIndex >= index
                          ? 'bg-[rgb(var(--color-primary))] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStepIndex >= index ? step.icon : index + 1}
                    </div>
                    <div className={`text-xs text-center max-w-[70px] ${
                      currentStepIndex >= index ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Status Message */}
            <div className="mt-8 text-center">
              <p className={`text-lg font-medium ${
                order.status === 'completed' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {getStatusMessage(order.status, isDelivery)}
              </p>
              
              {/* DoorDash info for delivery orders */}
              {isDelivery && order.doordashDeliveryId && (
                <p className="text-sm text-gray-500 mt-2">
                  📱 You'll receive SMS updates from DoorDash with Dasher details and real-time tracking.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cancelled Status */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-red-600 text-xl font-semibold mb-2">Order Cancelled</div>
              <p className="text-red-700">This order has been cancelled. Please contact the restaurant for more information.</p>
            </div>
          </div>
        )}

        {/* Delivery Address for delivery orders */}
        {isDelivery && order.deliveryAddress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="font-semibold text-blue-900">Delivering to:</h3>
                <p className="text-blue-800">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Order Details</h2>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer:</span>
              <span className="text-gray-900 font-medium">{order.customerName}</span>
            </div>
            {order.customerPhone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phone:</span>
                <span className="text-gray-900 font-medium">{order.customerPhone}</span>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Special Instructions:</span> {order.notes}
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold mb-3 text-gray-900">Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="flex justify-between text-sm">
                  <span className="text-gray-900">
                    <span className="text-gray-600">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="text-gray-900 font-medium">${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="text-gray-900">${order.tax.toFixed(2)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="text-gray-900">${order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tip:</span>
                <span className="text-gray-900">${order.tip.toFixed(2)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Gift Card Discount:</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-[rgb(var(--color-primary))]">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="text-center text-sm text-gray-600">
          <p className="flex items-center justify-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 inline-flex">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Updates in real-time
          </p>
          <p className="mt-3 text-gray-500">Tracking link expires 2 hours after order placement</p>
        </div>
      </div>
    </div>
  )
}
