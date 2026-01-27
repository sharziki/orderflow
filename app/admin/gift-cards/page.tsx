'use client'

import { useState, useEffect } from 'react'
import { Gift, Search, DollarSign, CheckCircle, XCircle, ArrowLeft, Minus } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface GiftCard {
  id: string
  code: string
  initialAmount: number
  currentBalance: number
  purchasedBy: string | null
  purchasedAt: string
  lastUsedAt: string | null
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'
  notes: string | null
  customer?: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

// Helper to extract gift message from notes (notes contain both message and payment intent)
function getGiftMessage(notes: string | null): string | null {
  if (!notes) return null
  // Notes format: "User message\nPayment Intent: pi_xxxx"
  const lines = notes.split('\n')
  const messageLines = lines.filter(line => !line.startsWith('Payment Intent:'))
  const message = messageLines.join('\n').trim()
  return message || null
}

// Helper to get display name for gift card purchaser
function getPurchaserDisplay(card: GiftCard): { name: string; email: string | null; phone: string | null; hasInfo: boolean } {
  if (card.customer?.name) {
    return { 
      name: card.customer.name, 
      email: card.customer.email || null, 
      phone: card.customer.phone || null,
      hasInfo: true 
    }
  }
  // Try to extract from purchasedBy if it's a string (legacy data)
  if (card.purchasedBy && typeof card.purchasedBy === 'string' && !card.customer) {
    return { name: 'Unknown Customer', email: null, phone: null, hasInfo: false }
  }
  return { name: 'No purchaser info', email: null, phone: null, hasInfo: false }
}

export default function AdminGiftCards() {
  const router = useRouter()
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCode, setSearchCode] = useState('')
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemNotes, setRedeemNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    try {
      const response = await fetch('/api/gift-cards')
      if (!response.ok) {
        throw new Error('Failed to fetch gift cards')
      }
      const data = await response.json()
      setGiftCards(data)
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      toast.error('Failed to load gift cards')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchCard = async () => {
    if (!searchCode.trim()) {
      toast.error('Please enter a gift card code')
      return
    }

    // Format code properly with dashes as stored in database: GIFT-XXXX-XXXX-XXXX
    const formatCodeForApi = (rawCode: string): string => {
      const cleaned = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '')
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
    
    const normalizedCode = formatCodeForApi(searchCode)
    
    try {
      const response = await fetch(`/api/gift-cards/${encodeURIComponent(normalizedCode)}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Gift card not found')
          return
        }
        throw new Error('Failed to fetch gift card')
      }

      const data = await response.json()
      if (data.giftCard) {
        // Find the full card in our list or fetch it
        const card = giftCards.find(c => c.code === data.giftCard.code)
        if (card) {
          setSelectedCard(card)
        } else {
          // Refresh list to get this card
          await fetchGiftCards()
          const updatedCard = giftCards.find(c => c.code === data.giftCard.code)
          if (updatedCard) {
            setSelectedCard(updatedCard)
          }
        }
        toast.success('Gift card found')
      }
    } catch (error) {
      console.error('Error searching gift card:', error)
      toast.error('Failed to find gift card')
    }
  }

  const handleRedeemGiftCard = async () => {
    if (!selectedCard) return

    const amount = parseFloat(redeemAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > selectedCard.currentBalance) {
      toast.error(`Amount exceeds available balance ($${selectedCard.currentBalance.toFixed(2)})`)
      return
    }

    setProcessing(true)

    try {
      const response = await fetch(`/api/gift-cards/${selectedCard.code}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          notes: redeemNotes.trim() || `In-store redemption of $${amount.toFixed(2)}`,
          adminName: 'Admin' // You could get this from auth context
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to redeem gift card')
      }

      const data = await response.json()
      toast.success(data.message)

      // Refresh gift cards and close modal
      await fetchGiftCards()
      setShowRedeemModal(false)
      setRedeemAmount('')
      setRedeemNotes('')
      setSelectedCard(null)

    } catch (error) {
      console.error('Error redeeming gift card:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to redeem gift card')
    } finally {
      setProcessing(false)
    }
  }

  const activeCards = giftCards.filter(c => c.status === 'ACTIVE' && c.currentBalance > 0)
  const redeemedCards = giftCards.filter(c => c.status === 'REDEEMED' || c.currentBalance === 0)

  const totalActive = activeCards.reduce((sum, card) => sum + card.currentBalance, 0)
  const totalRedeemed = giftCards.reduce((sum, card) => sum + (card.initialAmount - card.currentBalance), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[rgb(var(--color-primary))] to-blue-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading Gift Cards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 shadow-lg sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 bg-white rounded-lg p-2 shadow-md">
                <Image
                  src="/bluefishlogo.png"
                  alt="Blu Fish House"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gift Card Management</h1>
                <p className="text-sm text-blue-100">Manage and redeem gift cards</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors border border-white/20 backdrop-blur-sm font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-white">
            <p className="text-sm text-gray-600 font-medium mb-2">Total Gift Cards</p>
            <p className="text-3xl font-bold text-[rgb(var(--color-primary))]">{giftCards.length}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-green-50 to-white">
            <p className="text-sm text-gray-600 font-medium mb-2">Active Balance</p>
            <p className="text-3xl font-bold text-green-600">${totalActive.toFixed(2)}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-yellow-50 to-white">
            <p className="text-sm text-gray-600 font-medium mb-2">Active Cards</p>
            <p className="text-3xl font-bold text-yellow-600">{activeCards.length}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-gray-50 to-white">
            <p className="text-sm text-gray-600 font-medium mb-2">Total Redeemed</p>
            <p className="text-3xl font-bold text-gray-600">${totalRedeemed.toFixed(2)}</p>
          </div>
        </div>

        {/* Search Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <h2 className="text-xl font-bold text-gray-900">Search Gift Card</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Enter gift card code (e.g., GIFT-XXXX-XXXX-XXXX)"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono uppercase"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchCard()
                }
              }}
            />
            <button
              onClick={handleSearchCard}
              className="btn-primary px-6"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* Selected Card - Quick Redeem */}
        {selectedCard && (
          <div className="card p-6 mb-6 border-2 border-[rgb(var(--color-primary))] bg-blue-50/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Selected Gift Card</h3>
                <p className="text-sm text-gray-600">Code: <span className="font-mono font-semibold">{selectedCard.code}</span></p>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-green-600">${selectedCard.currentBalance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Initial Amount</p>
                <p className="text-lg font-semibold text-gray-900">${selectedCard.initialAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-sm font-semibold ${
                  selectedCard.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {selectedCard.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchaser</p>
                <p className="text-sm font-medium text-gray-900">
                  {getPurchaserDisplay(selectedCard).name}
                </p>
                {getPurchaserDisplay(selectedCard).email && (
                  <p className="text-xs text-gray-500">{getPurchaserDisplay(selectedCard).email}</p>
                )}
                {getPurchaserDisplay(selectedCard).phone && (
                  <p className="text-xs text-gray-500">{getPurchaserDisplay(selectedCard).phone}</p>
                )}
              </div>
            </div>
            
            {/* Gift Message */}
            {getGiftMessage(selectedCard.notes) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-600 font-medium mb-1">Gift Message:</p>
                <p className="text-sm text-yellow-800">{getGiftMessage(selectedCard.notes)}</p>
              </div>
            )}

            {selectedCard.status === 'ACTIVE' && selectedCard.currentBalance > 0 && (
              <button
                onClick={() => setShowRedeemModal(true)}
                className="btn-primary w-full"
              >
                <DollarSign className="w-5 h-5" />
                Redeem Amount
              </button>
            )}
          </div>
        )}

        {/* Active Gift Cards */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Active Gift Cards ({activeCards.length})</h2>
          </div>

          {activeCards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active gift cards</p>
          ) : (
            <div className="space-y-3">
              {activeCards.map((card) => {
                const purchaser = getPurchaserDisplay(card)
                const giftMessage = getGiftMessage(card.notes)
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[rgb(var(--color-primary))] transition-colors cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-gray-900">{card.code}</p>
                      <div className="text-sm text-gray-600">
                        <span className={purchaser.hasInfo ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {purchaser.name}
                        </span>
                        {purchaser.email && (
                          <span className="text-gray-500"> • {purchaser.email}</span>
                        )}
                        {purchaser.phone && (
                          <span className="text-gray-500"> • {purchaser.phone}</span>
                        )}
                        <span> • Purchased {new Date(card.purchasedAt).toLocaleDateString()}</span>
                      </div>
                      {giftMessage && (
                        <p className="text-xs text-yellow-700 mt-1 truncate">
                          Message: "{giftMessage}"
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xl font-bold text-green-600">${card.currentBalance.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">of ${card.initialAmount.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Redeemed Gift Cards */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Redeemed Gift Cards ({redeemedCards.length})</h2>
          </div>

          {redeemedCards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No redeemed gift cards</p>
          ) : (
            <div className="space-y-3">
              {redeemedCards.slice(0, 10).map((card) => {
                const purchaser = getPurchaserDisplay(card)
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-gray-700">{card.code}</p>
                      <div className="text-sm text-gray-600">
                        <span className={purchaser.hasInfo ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                          {purchaser.name}
                        </span>
                        {purchaser.email && (
                          <span className="text-gray-500"> • {purchaser.email}</span>
                        )}
                        {purchaser.phone && (
                          <span className="text-gray-500"> • {purchaser.phone}</span>
                        )}
                        <span> • Redeemed {card.lastUsedAt ? new Date(card.lastUsedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-lg font-bold text-gray-600">${card.currentBalance.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Used: ${(card.initialAmount - card.currentBalance).toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Redeem Modal */}
      {showRedeemModal && selectedCard && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setShowRedeemModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full shadow-2xl">
              <div className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 p-6 rounded-t-lg">
                <h2 className="text-2xl font-bold text-white">Redeem Gift Card</h2>
                <p className="text-blue-100 text-sm mt-1">Deduct amount from gift card balance</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Gift Card Code</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{selectedCard.code}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-3xl font-bold text-green-600">${selectedCard.currentBalance.toFixed(2)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Redeem *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                    <input
                      type="number"
                      min="0"
                      max={selectedCard.currentBalance}
                      step="0.01"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining balance: ${(selectedCard.currentBalance - (parseFloat(redeemAmount) || 0)).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={redeemNotes}
                    onChange={(e) => setRedeemNotes(e.target.value)}
                    placeholder="Order details, customer notes, etc."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRedeemModal(false)
                      setRedeemAmount('')
                      setRedeemNotes('')
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRedeemGiftCard}
                    disabled={processing || !redeemAmount || parseFloat(redeemAmount) <= 0}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Minus className="w-5 h-5" />
                        Redeem ${parseFloat(redeemAmount || '0').toFixed(2)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

