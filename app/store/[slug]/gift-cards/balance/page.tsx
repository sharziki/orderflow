'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, ArrowLeft, Gift, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, History, DollarSign, Calendar, TrendingDown, TrendingUp, RefreshCw, Loader2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface StoreInfo {
  name: string
  slug: string
  logo: string | null
}

// Helper to format code for API call (adds proper dashes as stored in database)
function formatCodeForApi(rawCode: string): string {
  const cleaned = rawCode.replace(/[^A-Z0-9]/g, '')
  
  if (cleaned.startsWith('GIFT')) {
    const rest = cleaned.slice(4)
    if (rest.length > 0) {
      const parts = rest.match(/.{1,4}/g) || []
      return 'GIFT-' + parts.join('-')
    }
    return cleaned
  }
  
  const parts = cleaned.match(/.{1,4}/g) || []
  return parts.join('-')
}

export default function CheckGiftCardBalance() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [giftCard, setGiftCard] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch store info
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/store/${slug}`)
        if (!response.ok) throw new Error('Store not found')
        const data = await response.json()
        setStore({
          name: data.store.name,
          slug: data.store.slug,
          logo: data.store.logo,
        })
      } catch (error) {
        console.error('Error fetching store:', error)
        toast.error('Store not found')
        router.push('/')
      } finally {
        setLoadingStore(false)
      }
    }
    fetchStore()
  }, [slug, router])

  const handleCheckBalance = async () => {
    if (!code.trim()) {
      toast.error('Please enter a gift card code')
      return
    }

    setLoading(true)
    setError(null)
    setGiftCard(null)

    try {
      const formattedCode = formatCodeForApi(code.toUpperCase())
      const response = await fetch(`/api/gift-cards/${encodeURIComponent(formattedCode)}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Gift card not found. Please check the code and try again.')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check gift card balance')
      }

      const data = await response.json()
      setGiftCard(data)

      if (!data.valid) {
        setError(data.message)
      }

    } catch (err) {
      console.error('Error checking balance:', err)
      const message = err instanceof Error ? err.message : 'Failed to check gift card balance'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeInput = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(cleaned)
  }

  const formatCodeDisplay = (code: string) => {
    if (!code) return ''
    if (code.startsWith('GIFT')) {
      const rest = code.slice(4)
      const parts = rest.match(/.{1,4}/g) || []
      return 'GIFT-' + parts.join('-')
    }
    const parts = code.match(/.{1,4}/g) || []
    return parts.join('-')
  }

  const handleReset = () => {
    setCode('')
    setGiftCard(null)
    setError(null)
  }

  if (loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(var(--color-primary))] mx-auto mb-4" />
          <p className="text-slate-600">Loading store...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <p className="text-xl text-slate-600">Store not found</p>
          <button onClick={() => router.push('/')} className="mt-4 text-[rgb(var(--color-primary))]">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="bg-[rgb(var(--color-primary))] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <button
            onClick={() => router.push(`/store/${slug}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Menu</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 bg-white rounded-xl p-2">
              {store.logo ? (
                <Image src={store.logo} alt={store.name} fill className="object-contain" />
              ) : (
                <Gift className="w-full h-full text-[rgb(var(--color-primary))]" />
              )}
            </div>
            <div className="h-10 w-px bg-white/20" />
            <Search className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            Check Balance
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Enter your gift card code to view your current balance.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Enter Gift Card Code</h2>
              <p className="text-sm text-slate-500">Your code is on your gift card receipt</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gift Card Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatCodeDisplay(code)}
                  onChange={(e) => handleCodeInput(e.target.value)}
                  placeholder="GIFT-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-4 text-lg font-mono border-2 border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all uppercase tracking-wider"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCheckBalance()
                    }
                  }}
                />
                {code && (
                  <button
                    onClick={handleReset}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Clear"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Enter the code exactly as it appears on your gift card
              </p>
            </div>

            <button
              onClick={handleCheckBalance}
              disabled={loading || !code.trim()}
              className="w-full bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] text-white disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Balance
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  Card Not Found
                </h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try another code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invalid Card Display */}
        {giftCard && !giftCard.valid && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-1">
                  Card Unavailable
                </h3>
                <p className="text-amber-700">{giftCard.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gift Card Display */}
        {giftCard && giftCard.valid && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            {/* Card Visual */}
            <div className="relative bg-gradient-to-br from-[rgb(var(--color-primary))] to-slate-800 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-white rounded-xl p-2">
                      {store.logo ? (
                        <Image src={store.logo} alt={store.name} fill className="object-contain" />
                      ) : (
                        <Gift className="w-full h-full text-[rgb(var(--color-primary))]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{store.name}</p>
                      <p className="text-sm text-white/70">Gift Card</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    giftCard.giftCard.status === 'ACTIVE' 
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-500/20 text-slate-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      giftCard.giftCard.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`} />
                    {giftCard.giftCard.status}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-6">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Gift Card Code</p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wide">
                    {giftCard.giftCard.code}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Current Balance</p>
                    <p className="text-4xl sm:text-5xl font-bold">
                      ${giftCard.giftCard.currentBalance.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60 mb-1">Original Value</p>
                    <p className="text-2xl font-semibold">
                      ${giftCard.giftCard.initialAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="p-5 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 mb-1">Purchased</p>
                <p className="font-medium text-slate-900 text-sm">
                  {new Date(giftCard.giftCard.purchasedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="p-5 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 mb-1">Total Spent</p>
                <p className="font-medium text-slate-900 text-sm">
                  ${(giftCard.giftCard.initialAmount - giftCard.giftCard.currentBalance).toFixed(2)}
                </p>
              </div>
              <div className="p-5 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 mb-1">Last Used</p>
                <p className="font-medium text-slate-900 text-sm">
                  {giftCard.giftCard.lastUsedAt 
                    ? new Date(giftCard.giftCard.lastUsedAt).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="m-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Use your gift card at checkout to pay for food and tax. 
                  Delivery fees are not covered by gift cards.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Help Section - Only show when no results */}
        {!giftCard && !error && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Need Help?</h3>
                <p className="text-sm text-slate-500">Common questions about gift cards</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-900 mb-1">Where is my gift card code?</p>
                <p className="text-sm text-slate-600">Your code is printed on your gift card receipt or was sent to your email after purchase.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-900 mb-1">Are codes case-sensitive?</p>
                <p className="text-sm text-slate-600">No, codes are not case-sensitive. You can enter them in any format.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-900 mb-1">Where can I use my gift card?</p>
                <p className="text-sm text-slate-600">Gift cards can be used for online orders at checkout. Enter your code in the gift card field.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-900 mb-1">Do gift cards expire?</p>
                <p className="text-sm text-slate-600">No, {store.name} gift cards never expire.</p>
              </div>
            </div>

            {/* Purchase CTA */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Don't have a gift card?</p>
                  <p className="text-sm text-slate-500">Purchase one for yourself or as a gift</p>
                </div>
                <button
                  onClick={() => router.push(`/store/${slug}/gift-cards/purchase`)}
                  className="px-6 py-3 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Buy Gift Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check Another Card Button - Show when card is displayed */}
        {(giftCard || error) && (
          <div className="mt-8 text-center">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Check Another Card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
