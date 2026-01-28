'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Gift, CreditCard, Check, ArrowLeft, Sparkles, Heart, Mail, User, Phone, MessageSquare, DollarSign, Lock, Shield, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_AMOUNTS = [25, 50, 75, 100, 150, 200]

function CheckoutForm({
  amount,
  customerInfo,
  notes,
  onSuccess
}: {
  amount: number
  customerInfo: { name: string; email: string; phone: string }
  notes: string
  onSuccess: (giftCard: any) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent?.status === 'succeeded') {
        const response = await fetch('/api/gift-cards/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm-purchase',
            paymentIntentId: paymentIntent.id,
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create gift card')
        }

        const { giftCard } = await response.json()
        onSuccess(giftCard)
        toast.success('Payment successful! Your gift card is ready!')
      }
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] text-white disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          Secure
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-4 h-4" />
          Encrypted
        </span>
        <span className="flex items-center gap-1.5">
          <CreditCard className="w-4 h-4" />
          Stripe
        </span>
      </div>
    </form>
  )
}

export default function PurchaseGiftCard() {
  const router = useRouter()
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purchasedCard, setPurchasedCard] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  
  // Gift recipient fields
  const [isGift, setIsGift] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')

  const getAmount = () => {
    if (isCustom) {
      return parseFloat(customAmount) || 0
    }
    return selectedAmount || 0
  }

  const handleContinueToPayment = async () => {
    const amount = getAmount()

    if (amount < 10) {
      toast.error('Minimum gift card amount is $10')
      return
    }

    if (amount > 500) {
      toast.error('Maximum gift card amount is $500')
      return
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Please provide your name and email')
      return
    }

    // Validate recipient fields if sending as gift
    if (isGift) {
      if (!recipientName.trim() || !recipientEmail.trim()) {
        toast.error('Please provide the recipient\'s name and email')
        return
      }
      // Basic email validation
      if (!/.+@.+\..+/.test(recipientEmail)) {
        toast.error('Please enter a valid recipient email address')
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-payment-intent',
          amount,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone
          },
          recipient: isGift ? {
            name: recipientName,
            email: recipientEmail
          } : null,
          notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initialize payment')
      }

      const { clientSecret } = await response.json()
      setClientSecret(clientSecret)
      setStep('payment')

    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initialize payment')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (giftCard: any) => {
    setPurchasedCard(giftCard)
    setStep('success')
  }

  // Success State
  if (step === 'success' && purchasedCard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-6 shadow-lg shadow-emerald-200">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              {isGift ? '🎁 Gift Sent!' : 'Purchase Complete!'}
            </h1>
            <p className="text-lg text-slate-600">
              {isGift 
                ? `We've emailed the gift card to ${recipientName || 'your recipient'}!`
                : 'Your gift card has been created successfully'
              }
            </p>
            {isGift && recipientEmail && (
              <p className="text-sm text-emerald-600 mt-2 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Sent to {recipientEmail}
              </p>
            )}
          </div>

          {/* Gift Card Display */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-8 border border-slate-100">
            {/* Card Header */}
            <div className="relative bg-gradient-to-br from-[rgb(var(--color-primary))] to-slate-800 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-white rounded-xl p-2">
                      <Image
                        src="/logo.svg"
                        alt="OrderFlow"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Blu Fish House</p>
                      <p className="text-sm text-white/70">Gift Card</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Active
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-6">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Gift Card Code</p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wide">
                    {purchasedCard.code}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Balance</p>
                    <p className="text-4xl sm:text-5xl font-bold">
                      ${purchasedCard.currentBalance.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60 mb-1">Valid</p>
                    <p className="font-medium">In-Store & Online</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Info */}
            <div className="p-6 bg-amber-50 border-t border-amber-100">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Important</h3>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {isGift ? 'The recipient will receive an email with their gift card' : 'Check your email for your gift card confirmation'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      Use at checkout in-store or online (covers food & tax, not delivery)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      Check your balance anytime at our website
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      This gift card never expires
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/')}
              className="h-12 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </button>
            <button
              onClick={() => window.print()}
              className="h-12 rounded-xl bg-[rgb(var(--color-primary))] text-white font-medium hover:bg-[rgb(var(--color-primary-hover))] transition-colors"
            >
              Print Gift Card
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Payment Step
  if (step === 'payment' && clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-xl mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => setStep('amount')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative w-16 h-16 bg-white rounded-2xl p-3 shadow-lg shadow-slate-200/50 mx-auto mb-6 border border-slate-100">
              <Image
                src="/logo.svg"
                alt="OrderFlow"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Complete Payment
            </h1>
            <p className="text-slate-600">
              Gift Card: <span className="font-semibold text-[rgb(var(--color-primary))]">${getAmount().toFixed(2)}</span>
            </p>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[rgb(var(--color-primary))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Payment Details</h2>
                <p className="text-sm text-slate-500">Enter your card information</p>
              </div>
            </div>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#0B3755',
                    colorBackground: '#ffffff',
                    colorText: '#1e293b',
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <CheckoutForm
                amount={getAmount()}
                customerInfo={{ name: customerName, email: customerEmail, phone: customerPhone }}
                notes={notes}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        </div>
      </div>
    )
  }

  // Main Purchase Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="bg-[rgb(var(--color-primary))] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Menu</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-14 h-14 bg-white rounded-xl p-2">
                  <Image
                    src="/logo.svg"
                    alt="OrderFlow"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="h-10 w-px bg-white/20" />
                <Gift className="w-8 h-8 text-white/80" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
                Gift Cards
              </h1>
              <p className="text-lg text-white/80 max-w-md">
                Give the gift of fresh seafood. Perfect for any occasion.
              </p>
            </div>

            {/* Preview Card */}
            <div className="hidden lg:block">
              <div className="relative w-72 h-44 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-[rgb(var(--color-primary))]" />
                  </div>
                  <span className="text-sm font-medium">Blu Fish House</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-xs text-white/60 mb-1">Gift Card Value</p>
                  <p className="text-3xl font-bold">${getAmount().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Amount Selection - Wider */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Select Amount</h2>
                  <p className="text-sm text-slate-500">Choose a preset or enter custom amount</p>
                </div>
              </div>

              {/* Preset Amounts Grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount)
                      setIsCustom(false)
                      setCustomAmount('')
                    }}
                    className={`relative p-5 rounded-xl border-2 font-semibold text-lg transition-all ${
                      selectedAmount === amount && !isCustom
                        ? 'border-[rgb(var(--color-primary))] bg-slate-50 text-[rgb(var(--color-primary))]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {selectedAmount === amount && !isCustom && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[rgb(var(--color-primary))] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="pt-6 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={isCustom}
                    onChange={(e) => {
                      setIsCustom(e.target.checked)
                      if (e.target.checked) {
                        setSelectedAmount(null)
                      } else {
                        setSelectedAmount(50)
                        setCustomAmount('')
                      }
                    }}
                    className="w-5 h-5 text-[rgb(var(--color-primary))] border-slate-300 rounded focus:ring-[rgb(var(--color-primary))] focus:ring-2"
                  />
                  <span className="font-medium text-slate-700">Enter custom amount</span>
                </label>
                {isCustom && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">$</span>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="5"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-4 text-xl font-medium border-2 border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Info Banner */}
              <div className="mt-8 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Min: $10
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Max: $500
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    In-store & Online
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Never expires
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info - Narrower */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Your Details</h2>
                  <p className="text-sm text-slate-500">We'll send your gift card here</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Full Name
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Phone
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  />
                </div>

                {/* Send as Gift Toggle */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={(e) => {
                        setIsGift(e.target.checked)
                        if (!e.target.checked) {
                          setRecipientName('')
                          setRecipientEmail('')
                        }
                      }}
                      className="w-5 h-5 text-[rgb(var(--color-primary))] border-slate-300 rounded focus:ring-[rgb(var(--color-primary))] focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="font-medium text-slate-700">Send as a gift to someone else</span>
                    </div>
                  </label>
                </div>

                {/* Recipient Fields - Only show if sending as gift */}
                {isGift && (
                  <div className="space-y-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                    <div className="flex items-center gap-2 text-pink-700 mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-semibold">Recipient Details</span>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Recipient's Name
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-white"
                        required={isGift}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        Recipient's Email
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-white"
                        required={isGift}
                      />
                      <p className="text-xs text-pink-600 mt-1">
                        We'll send the gift card directly to their email!
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    {isGift ? 'Gift Message' : 'Personal Note'}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isGift 
                      ? "Happy Birthday! Enjoy some delicious seafood on me! 🎉"
                      : "A note for your records..."
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Summary & CTA */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600 font-medium">Total</span>
                  <span className="text-3xl font-bold text-[rgb(var(--color-primary))]">
                    ${getAmount().toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  disabled={loading || getAmount() < 10}
                  className="w-full bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] text-white disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
