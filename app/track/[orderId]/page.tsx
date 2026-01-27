'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

interface MenuItem {
  id: string
  name: string
  price: number
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  menu_item: MenuItem
}

interface Customer {
  name: string
  phone: string
}

interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  tax: number
  deliveryFee?: number
  merchantDeliveryFee?: number
  stripeFee: number
  finalAmount: number
  orderType: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
  createdAt: string
  customer: Customer
  items: OrderItem[]
  notes?: string
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
      console.log('[Tracking] No valid order ID:', orderId)
      setError('No order ID provided')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        console.log('[Tracking] Fetching order:', orderId)
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
        console.log('[Tracking] Order data:', data)
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
    console.log('[Tracking] Setting up real-time subscription for order:', orderId)
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('[Tracking] Real-time update received:', payload)
          // Refetch order to get complete data with relations
          fetchOrder()
        }
      )
      .subscribe()

    return () => {
      console.log('[Tracking] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const getStatusStep = (status: OrderStatus): number => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 1
      case 'PREPARING':
        return 2
      case 'READY':
        return 3
      case 'COMPLETED':
        return 4
      case 'CANCELLED':
        return 0
      default:
        return 0
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

  const currentStep = getStatusStep(order.status)
  const isCancelled = order.status === 'CANCELLED'

  const steps = [
    { label: 'Order Confirmed', step: 1 },
    { label: 'Preparing', step: 2 },
    { label: 'Ready for Pickup', step: 3 },
    { label: 'Completed', step: 4 }
  ]

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
            Order #{order.id.slice(-6)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Placed at {formatTime(order.createdAt)}
          </p>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-md border border-gray-200">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
                <div
                  className="h-full bg-[rgb(var(--color-primary))] transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((item) => (
                  <div key={item.step} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors shadow-md ${
                        currentStep >= item.step
                          ? 'bg-[rgb(var(--color-primary))] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep >= item.step ? '✓' : item.step}
                    </div>
                    <div className={`text-xs text-center max-w-[80px] ${
                      currentStep >= item.step ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Status Message */}
            <div className="mt-8 text-center">
              {currentStep === 1 && (
                <p className="text-lg text-blue-600 font-medium">Your order has been confirmed and will be prepared soon.</p>
              )}
              {currentStep === 2 && (
                <p className="text-lg text-blue-600 font-medium">Your order is being prepared! 👨‍🍳</p>
              )}
              {currentStep === 3 && (
                <p className="text-lg text-green-600 font-medium">Your order is ready for pickup! 🎉</p>
              )}
              {currentStep === 4 && (
                <p className="text-lg text-gray-600 font-medium">Order completed. Thank you! 🙏</p>
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

        {/* Order Details */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Order Details</h2>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer:</span>
              <span className="text-gray-900 font-medium">{order.customer.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phone:</span>
              <span className="text-gray-900 font-medium">{order.customer.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Order Type:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {order.orderType}
              </span>
            </div>
            {order.orderType === 'DELIVERY' && order.deliveryAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Address:</span>
                <span className="text-gray-900 font-medium text-right max-w-[60%]">
                  {order.deliveryAddress}
                </span>
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
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-900">
                    <span className="text-gray-600">{item.quantity}x</span> {item.menu_item.name}
                  </span>
                  <span className="text-gray-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="text-gray-900">${order.tax.toFixed(2)}</span>
            </div>
            {order.orderType === 'DELIVERY' && (
              <>
                {(order.deliveryFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">DoorDash Delivery Fee:</span>
                    <span className="text-gray-900">${(order.deliveryFee ?? 0).toFixed(2)}</span>
                  </div>
                )}
                {(order.merchantDeliveryFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Merchant Delivery Fee:</span>
                    <span className="text-gray-900">${(order.merchantDeliveryFee ?? 0).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Processing Fee:</span>
              <span className="text-gray-900">${order.stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-[rgb(var(--color-primary))]">${order.finalAmount.toFixed(2)}</span>
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
