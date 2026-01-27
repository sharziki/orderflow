'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, Loader2, MapPin, User, Mail, Phone, Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Store {
  name: string
  primaryColor: string
  taxRate: number
}

function CheckoutForm({ 
  amount, 
  orderId,
  primaryColor,
  onSuccess 
}: { 
  amount: number
  orderId: string
  primaryColor: string
  onSuccess: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/${window.location.pathname.split('/')[2]}/order-confirmed?orderId=${orderId}`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setProcessing(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'info' | 'payment'>('info')
  const [clientSecret, setClientSecret] = useState('')
  const [orderId, setOrderId] = useState('')

  const [cart, setCart] = useState<any[]>([])
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  const primaryColor = store?.primaryColor || '#2563eb'

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem(`cart_${slug}`)
    const savedOrderType = localStorage.getItem(`orderType_${slug}`)
    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedOrderType) setOrderType(savedOrderType as 'pickup' | 'delivery')

    // Fetch store info
    fetch(`/api/store/${slug}`)
      .then(res => res.json())
      .then(data => {
        setStore(data.store)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  const tax = subtotal * (store?.taxRate || 0)
  const total = subtotal + tax

  const handleContinueToPayment = async () => {
    if (!form.name || !form.email || !form.phone) {
      alert('Please fill in all required fields')
      return
    }

    if (orderType === 'delivery' && !form.address) {
      alert('Please enter a delivery address')
      return
    }

    setSubmitting(true)

    try {
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: slug,
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          items: cart.map(c => ({
            id: c.menuItem.id,
            name: c.menuItem.name,
            price: c.menuItem.price,
            quantity: c.quantity,
          })),
          orderType,
          deliveryAddress: orderType === 'delivery' ? form.address : null,
          notes: form.notes,
          subtotal,
          tax,
          total,
        })
      })

      if (!orderRes.ok) {
        throw new Error('Failed to create order')
      }

      const { order } = await orderRes.json()
      setOrderId(order.id)

      // Create payment intent
      const paymentRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          tenantSlug: slug,
        })
      })

      if (!paymentRes.ok) {
        throw new Error('Failed to create payment')
      }

      const { clientSecret: secret } = await paymentRes.json()
      setClientSecret(secret)
      setStep('payment')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = () => {
    // Clear cart
    localStorage.removeItem(`cart_${slug}`)
    localStorage.removeItem(`orderType_${slug}`)
    router.push(`/store/${slug}/order-confirmed?orderId=${orderId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
          <button
            onClick={() => router.push(`/store/${slug}`)}
            className="text-blue-600 hover:underline"
          >
            Go back to menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => step === 'payment' ? setStep('info') : router.back()}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">
            {step === 'info' ? 'Checkout' : 'Payment'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {cart.map((item) => (
              <div key={item.menuItem.id} className="flex justify-between">
                <span className="text-slate-600">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="font-medium">
                  ${(item.menuItem.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {step === 'info' ? (
          /* Customer Info Form */
          <div className="space-y-6">
            {/* Order Type */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Order Type</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all ${
                    orderType === 'pickup'
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={orderType === 'pickup' ? { backgroundColor: primaryColor } : {}}
                >
                  Pickup
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all ${
                    orderType === 'delivery'
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={orderType === 'delivery' ? { backgroundColor: primaryColor } : {}}
                >
                  Delivery
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h2 className="font-semibold text-slate-900 mb-3">Delivery Address</h2>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Main St, Apt 4B, City, State ZIP"
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Special Instructions</h2>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any allergies or special requests?"
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinueToPayment}
              disabled={submitting}
              className="w-full py-4 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </button>
          </div>
        ) : (
          /* Payment Form */
          clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                amount={total}
                orderId={orderId}
                primaryColor={primaryColor}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )
        )}
      </main>
    </div>
  )
}
