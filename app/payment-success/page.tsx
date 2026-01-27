'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [finalizing, setFinalizing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const finalize = async () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('pendingOrder') : null
        if (!raw) {
          setFinalizing(false)
          return
        }
        const { orderData, deliveryFeeCents } = JSON.parse(raw)
        console.log('[PaymentSuccess] Finalizing order from pendingOrder...')
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...orderData, deliveryFeeCents: deliveryFeeCents ?? null }),
        })
        const json = await res.json()
        console.log('[PaymentSuccess] Finalization response:', json)
        if (json?.success) {
          setOrderId(json.orderId)
          try { localStorage.removeItem('pendingOrder') } catch {}

          // Redirect to tracking page immediately after 1.5 seconds
          console.log('[PaymentSuccess] Redirecting to tracking page...')
          setTimeout(() => {
            router.push(`/track/${json.orderId}`)
          }, 1500)
        } else {
          setError('Order finalization failed. Please contact support.')
        }
      } catch (e) {
        console.error('[PaymentSuccess] Error:', e)
        setError('An error occurred while finalizing your order.')
      } finally {
        setFinalizing(false)
      }
    }
    finalize()
  }, [router])

  const trackingUrl = orderId && typeof window !== 'undefined'
    ? `${window.location.origin}/track/${orderId}`
    : ''

  const copyToClipboard = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
          <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Payment Confirmed</h1>
        <p className="muted mt-2">
          {finalizing
            ? 'Finalizing your order…'
            : (error
              ? error
              : orderId
                ? 'Redirecting to order tracking...'
                : 'Your order has been placed successfully!')}
        </p>

        {!finalizing && !error && orderId && (
          <div className="mt-6 bg-neutral-900 rounded-lg p-4 border border-neutral-800">
            <h2 className="text-sm font-semibold mb-2 text-neutral-300">Track Your Order</h2>
            <p className="text-xs text-neutral-400 mb-3">
              Use this link to track your order status in real-time
            </p>

            <div className="bg-neutral-950 rounded p-3 mb-3 break-all text-xs text-neutral-300 font-mono">
              {trackingUrl}
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => router.push(`/track/${orderId}`)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Track Now
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-3">
              This tracking link expires 2 hours after order placement
            </p>
          </div>
        )}

        <button onClick={() => router.push('/')} className="btn-primary mt-6">
          Back to Menu
        </button>
      </div>
    </div>
  )
}


