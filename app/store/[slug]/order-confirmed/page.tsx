'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, MapPin, Phone, Loader2, RefreshCw, Download, FlaskConical } from 'lucide-react'
import { downloadReceipt } from '@/lib/pdf-receipt'
import Confetti from 'react-confetti'

interface Order {
  id: string
  orderNumber: string
  status: string
  type: 'pickup' | 'delivery'
  customerName: string
  total: number
  items: any[]
  createdAt: string
}

interface Store {
  name: string
  address: string
  phone: string
  primaryColor: string
}

const STATUS_STEPS = {
  pickup: [
    { key: 'confirmed', label: 'Order Confirmed', icon: '✓' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready for Pickup', icon: '🔔' },
    { key: 'completed', label: 'Picked Up', icon: '✅' },
  ],
  delivery: [
    { key: 'confirmed', label: 'Order Confirmed', icon: '✓' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Out for Delivery', icon: '🚗' },
    { key: 'completed', label: 'Delivered', icon: '🏠' },
  ],
}

export default function OrderConfirmedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const orderId = searchParams.get('orderId')

  const [order, setOrder] = useState<Order | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)

  const primaryColor = store?.primaryColor || '#2563eb'

  useEffect(() => {
    if (!orderId) return

    const fetchData = async () => {
      try {
        const [orderRes, storeRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch(`/api/store/${slug}`)
        ])

        if (orderRes.ok) {
          const orderData = await orderRes.json()
          setOrder(orderData.order || orderData)
        }

        if (storeRes.ok) {
          const storeData = await storeRes.json()
          setStore(storeData.store)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Poll for updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order || data)
        }
      } catch (err) {}
    }, 15000)

    // Hide confetti after a few seconds
    setTimeout(() => setShowConfetti(false), 5000)

    return () => clearInterval(interval)
  }, [orderId, slug])

  const getStatusIndex = (status: string): number => {
    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 1,
      ready: 2,
      out_for_delivery: 2,
      completed: 3,
    }
    return statusMap[status] ?? 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Order not found</h1>
          <a href={`/store/${slug}`} className="text-blue-600 hover:underline">
            Return to menu
          </a>
        </div>
      </div>
    )
  }

  const steps = STATUS_STEPS[order.type] || STATUS_STEPS.pickup
  const currentStep = getStatusIndex(order.status)
  const isDemoOrder = order.orderNumber?.startsWith('TEST-')

  return (
    <div className="min-h-screen bg-slate-50">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Demo Order Banner */}
        {isDemoOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Demo Test Order</p>
                <p className="text-sm text-amber-700">This is a test order. No real payment was processed and no delivery will occur.</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Header */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-600">
            Thank you for your order from {store?.name}
          </p>
        </div>

        {/* Order Number */}
        <div 
          className={`text-center py-4 rounded-xl text-white mb-6 ${isDemoOrder ? 'relative overflow-hidden' : ''}`}
          style={{ backgroundColor: isDemoOrder ? '#d97706' : primaryColor }}
        >
          {isDemoOrder && (
            <div className="absolute top-0 right-0 bg-white/20 px-3 py-1 rounded-bl-lg text-xs font-bold">
              DEMO
            </div>
          )}
          <p className="text-white/70 text-sm">Order Number</p>
          <p className="text-2xl font-bold">#{order.orderNumber}</p>
        </div>

        {/* Status Tracker */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Order Status</h2>
            <button 
              onClick={() => window.location.reload()}
              className="text-slate-500 hover:text-slate-700 p-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-5 right-5 h-1 bg-slate-200">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                  backgroundColor: primaryColor
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-colors ${
                      i <= currentStep
                        ? 'text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                    style={i <= currentStep ? { backgroundColor: primaryColor } : {}}
                  >
                    {i <= currentStep ? step.icon : i + 1}
                  </div>
                  <p className={`text-xs mt-2 text-center max-w-[80px] ${
                    i <= currentStep ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Current Status Message */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-center">
            {order.status === 'preparing' && (
              <p className="text-slate-700">🍳 Your order is being prepared!</p>
            )}
            {order.status === 'ready' && order.type === 'pickup' && (
              <p className="text-green-700 font-semibold">🔔 Your order is ready for pickup!</p>
            )}
            {order.status === 'ready' && order.type === 'delivery' && (
              <p className="text-slate-700">🚗 Your order is on its way!</p>
            )}
            {order.status === 'completed' && (
              <p className="text-green-700 font-semibold">✅ Order completed. Enjoy!</p>
            )}
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <p className="text-slate-700">Your order has been received!</p>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Order Details</h2>
          
          <div className="space-y-3">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 mt-4 pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span style={{ color: primaryColor }}>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pickup/Delivery Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">
            {order.type === 'pickup' ? 'Pickup Location' : 'Delivery Info'}
          </h2>

          {order.type === 'pickup' && store && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">{store.name}</p>
                  <p className="text-sm text-slate-600">{store.address}</p>
                </div>
              </div>
              {store.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <a 
                    href={`tel:${store.phone}`} 
                    className="text-blue-600 hover:underline"
                  >
                    {store.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {order.type === 'delivery' && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Estimated Delivery</p>
                <p className="text-sm text-slate-600">30-45 minutes</p>
              </div>
            </div>
          )}
        </div>

        {/* Download Receipt */}
        <div className="mt-6">
          <button
            onClick={() => {
              if (!order || !store) return
              downloadReceipt({
                restaurantName: store.name,
                restaurantAddress: store.address,
                restaurantPhone: store.phone,
                orderNumber: order.orderNumber,
                orderDate: new Date(order.createdAt),
                customerName: order.customerName,
                orderType: order.type,
                items: order.items?.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  options: item.options?.map((o: any) => o.name) || [],
                })) || [],
                subtotal: order.total * 0.9, // Approximate
                tax: order.total * 0.1, // Approximate
                total: order.total,
              })
            }}
            className="w-full py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </button>
        </div>

        {/* Back to Menu */}
        <div className="mt-4 text-center">
          <a
            href={`/store/${slug}`}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Back to Menu
          </a>
        </div>
      </div>
    </div>
  )
}
