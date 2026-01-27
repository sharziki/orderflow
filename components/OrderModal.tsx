'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Truck, Store, CreditCard, MapPin, Check, Gift, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import AddressPicker from './AddressPicker'
import PhoneInput from './PhoneInput'
import ScheduledOrderModal from './ScheduledOrderModal'
import UpsellSection from './UpsellSection'
import { getRestaurantStatus, formatTime } from '@/lib/restaurant-hours'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
  finalTotal: number
  orderData: any
  onSuccess: () => void
  onBack: () => void
  deliveryFeeCents: number | null
  appliedGiftCard: {
    code: string
    balance: number
    amountToUse: number
  } | null
  priceBreakdown: {
    subtotal: number
    tax: number
    deliveryFee: number
    merchantDeliveryFee: number
    tip: number
    giftCardDiscount: number
    stripeFee: number
    orderType: 'PICKUP' | 'DELIVERY'
  }
}

function CheckoutForm({ finalTotal, orderData, onSuccess, onBack, deliveryFeeCents, appliedGiftCard, priceBreakdown }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Helper function to redeem gift card after successful order
  const redeemGiftCard = async (orderId: string) => {
    if (!appliedGiftCard) return

    try {
      console.log('[Checkout] Redeeming gift card:', appliedGiftCard.code, 'Amount:', appliedGiftCard.amountToUse)
      const redeemResponse = await fetch(`/api/gift-cards/${encodeURIComponent(appliedGiftCard.code)}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: appliedGiftCard.amountToUse,
          orderId: orderId,
          notes: `Online order redemption - Order #${orderId.slice(-6).toUpperCase()}`,
          adminName: 'online_checkout'
        })
      })

      if (!redeemResponse.ok) {
        const errorData = await redeemResponse.json()
        console.error('[Checkout] Gift card redemption failed:', errorData)
        // Don't fail the order, just log the error
      } else {
        const redeemData = await redeemResponse.json()
        console.log('[Checkout] Gift card redeemed:', redeemData)
      }
    } catch (err) {
      console.error('[Checkout] Gift card redemption error:', err)
      // Don't fail the order, just log the error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage('')

    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setErrorMessage(submitError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Persist pending order in case Stripe performs a redirect
      try {
        const pending = {
          orderData,
          deliveryFeeCents: deliveryFeeCents ?? null,
          appliedGiftCard: appliedGiftCard ?? null,
        }
        localStorage.setItem('pendingOrder', JSON.stringify(pending))
      } catch {}

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Payment successful, now create the order
      console.log('[Checkout] Creating order with data:', { orderData, deliveryFeeCents, appliedGiftCard })
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          deliveryFeeCents: deliveryFeeCents ?? null,
          giftCardCode: appliedGiftCard?.code || null,
          giftCardAmountUsed: appliedGiftCard?.amountToUse || 0,
        }),
      })

      if (!orderResponse.ok) {
        const text = await orderResponse.text().catch(() => '')
        console.error('[Checkout] Order API non-OK:', orderResponse.status, text)
        setErrorMessage('Order API error. Please try again.')
        setIsProcessing(false)
        return
      }

      const result = await orderResponse.json().catch((e) => {
        console.error('[Checkout] Failed to parse order JSON:', e)
        return { success: false, error: 'Invalid server response' }
      })

      console.log('[Checkout] Order API response:', result)

      if (result.success) {
        // Redeem gift card if applied
        if (appliedGiftCard) {
          await redeemGiftCard(result.orderId)
        }
        
        try { localStorage.removeItem('pendingOrder') } catch {}
        // Redirect to tracking page immediately
        window.location.href = `/track/${result.orderId}`
      } else {
        setErrorMessage(result?.error || 'Order creation failed. Please contact support.')
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <PaymentElement />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Detailed Price Breakdown */}
      <div className="space-y-2 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-900">
            <span>Subtotal:</span>
            <span>${priceBreakdown.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (10.25%):</span>
            <span>${priceBreakdown.tax.toFixed(2)}</span>
          </div>
          {priceBreakdown.orderType === 'DELIVERY' && (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>DoorDash Delivery Fee:</span>
                <span>${priceBreakdown.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Merchant Delivery Fee:</span>
                <span>${priceBreakdown.merchantDeliveryFee.toFixed(2)}</span>
              </div>
              {priceBreakdown.tip > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tip for Dasher:</span>
                  <span>${priceBreakdown.tip.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {priceBreakdown.giftCardDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Gift Card Discount:</span>
              <span>-${priceBreakdown.giftCardDiscount.toFixed(2)}</span>
            </div>
          )}
          {priceBreakdown.stripeFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Credit Card Processing (Stripe):</span>
              <span>${priceBreakdown.stripeFee.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-3 mt-3">
          <span>Total to Pay:</span>
          <span className="text-[rgb(var(--color-primary))]">${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex-1"
          disabled={isProcessing}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn-primary flex-1"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay ${finalTotal.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

interface CartItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  quantity: number
}

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateCart: (cart: CartItem[]) => void
  total: number
  preselectedOrderType?: 'PICKUP' | 'DELIVERY'
  preselectedDeliveryAddress?: string
}

export default function OrderModal({
  isOpen,
  onClose,
  cart,
  onUpdateCart,
  total,
  preselectedOrderType = 'PICKUP',
  preselectedDeliveryAddress = ''
}: OrderModalProps) {
  const [step, setStep] = useState(1) // 1: Cart, 2: Customer Info, 3: Review & Quote, 4: Payment, 5: Confirmation
  const [orderType, setOrderType] = useState<'PICKUP' | 'DELIVERY'>(preselectedOrderType)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [deliveryAddress, setDeliveryAddress] = useState(preselectedDeliveryAddress)
  const [deliveryCountry, setDeliveryCountry] = useState('US')
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [addressValidated, setAddressValidated] = useState(!!preselectedDeliveryAddress)
  const [apartmentUnit, setApartmentUnit] = useState('')
  const [gateCodeInstructions, setGateCodeInstructions] = useState('')
  const [customerPhoneFormatted, setCustomerPhoneFormatted] = useState('')
  const [customerPhoneCountryCode, setCustomerPhoneCountryCode] = useState('+1')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [orderId, setOrderId] = useState('')
  const [deliveryFeeCents, setDeliveryFeeCents] = useState<number | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [tipCents, setTipCents] = useState<number>(0)
  const [tipInputValue, setTipInputValue] = useState<string>('0.00')
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [acceptedDeliveryId, setAcceptedDeliveryId] = useState<string | null>(null)
  const [showScheduledOrderModal, setShowScheduledOrderModal] = useState(false)
  const [scheduledPickupTime, setScheduledPickupTime] = useState<Date | null>(null)
  
  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string
    balance: number
    amountToUse: number
  } | null>(null)

  const formatPhoneForDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    // Format as groups: 3 3 4 (US-like) or spaced every 3 for longer
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`
    if (digits.length <= 10) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
    // For international/longer numbers, group every 3 after first 3-3-4
    const first = `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}`
    const rest = digits.slice(10).match(/.{1,3}/g)?.join(' ') ?? ''
    return rest ? `${first} ${rest}` : first
  }

  const handlePhoneChange = (value: string) => {
    setCustomerInfo({ ...customerInfo, phone: formatPhoneForDisplay(value) })
  }

  // Format gift card code for API (adds proper dashes)
  const formatGiftCardCode = (rawCode: string): string => {
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

  // Validate and apply gift card
  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) {
      setGiftCardError('Please enter a gift card code')
      return
    }

    setGiftCardLoading(true)
    setGiftCardError(null)

    try {
      const formattedCode = formatGiftCardCode(giftCardCode)
      const response = await fetch(`/api/gift-cards/${encodeURIComponent(formattedCode)}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Gift card not found. Please check the code.')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to validate gift card')
      }

      const data = await response.json()

      if (!data.valid) {
        throw new Error(data.message || 'This gift card cannot be used')
      }

      const giftCard = data.giftCard
      const balance = giftCard.currentBalance

      if (balance <= 0) {
        throw new Error('This gift card has no remaining balance')
      }

      // Calculate how much to use from the gift card
      // Gift card can only cover subtotal + tax (NOT delivery fees)
      // Use the full balance or the eligible amount, whichever is less
      const amountToUse = Math.min(balance, giftCardEligibleAmount)

      setAppliedGiftCard({
        code: giftCard.code,
        balance: balance,
        amountToUse: amountToUse
      })

      setGiftCardCode('') // Clear input after applying

    } catch (err) {
      console.error('Gift card error:', err)
      setGiftCardError(err instanceof Error ? err.message : 'Failed to apply gift card')
    } finally {
      setGiftCardLoading(false)
    }
  }

  // Remove applied gift card
  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null)
    setGiftCardError(null)
  }

  // Handle order when gift card covers the full amount (no Stripe payment needed)
  const handleGiftCardOnlyOrder = async () => {
    if (!appliedGiftCard) return

    setIsSubmitting(true)

    try {
      console.log('[Checkout] Creating gift-card-only order')
      
      const orderData = {
        customer: customerInfo,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          price: item.price
        })),
        orderType,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
        deliveryCoordinates: orderType === 'DELIVERY' ? deliveryCoordinates : null,
        apartmentUnit: orderType === 'DELIVERY' ? apartmentUnit : null,
        gateCodeInstructions: orderType === 'DELIVERY' ? gateCodeInstructions : null,
        notes,
        tipCents,
        doordashAcceptedDeliveryId: acceptedDeliveryId,
        scheduledPickupTime: scheduledPickupTime?.toISOString() || null,
        giftCardCode: appliedGiftCard.code,
        giftCardAmountUsed: appliedGiftCard.amountToUse,
        deliveryFeeCents: deliveryFeeCents ?? null,
      }

      // Create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!orderResponse.ok) {
        const text = await orderResponse.text().catch(() => '')
        console.error('[Checkout] Order API non-OK:', orderResponse.status, text)
        toast.error('Order creation failed. Please try again.')
        return
      }

      const result = await orderResponse.json()
      console.log('[Checkout] Order created:', result)

      if (result.success) {
        // Redeem the gift card
        try {
          console.log('[Checkout] Redeeming gift card:', appliedGiftCard.code)
          const redeemResponse = await fetch(`/api/gift-cards/${encodeURIComponent(appliedGiftCard.code)}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: appliedGiftCard.amountToUse,
              orderId: result.orderId,
              notes: `Online order redemption - Order #${result.orderId.slice(-6).toUpperCase()}`,
              adminName: 'online_checkout'
            })
          })

          if (!redeemResponse.ok) {
            const errorData = await redeemResponse.json()
            console.error('[Checkout] Gift card redemption failed:', errorData)
          } else {
            const redeemData = await redeemResponse.json()
            console.log('[Checkout] Gift card redeemed:', redeemData)
          }
        } catch (err) {
          console.error('[Checkout] Gift card redemption error:', err)
        }

        // Clear cart and redirect to tracking
        onUpdateCart([])
        window.location.href = `/track/${result.orderId}`
      } else {
        toast.error(result.error || 'Order creation failed. Please try again.')
      }
    } catch (err) {
      console.error('[Checkout] Gift-card-only order error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const tax = total * 0.1025 // 10.25% tax
  const deliveryFee = orderType === 'DELIVERY' ? ((deliveryFeeCents ?? 0) / 100) : 0
  const merchantDeliveryFee = orderType === 'DELIVERY' ? 1.00 : 0
  const tip = tipCents / 100
  
  // Gift card can ONLY be applied to subtotal + tax (NOT delivery fees or tips)
  const giftCardEligibleAmount = total + tax
  
  // Gift card discount (only applied to eligible amount: subtotal + tax)
  const giftCardDiscount = appliedGiftCard?.amountToUse || 0
  
  // Amount of food+tax remaining after gift card
  const foodTaxAfterGiftCard = Math.max(0, giftCardEligibleAmount - giftCardDiscount)
  
  // Delivery charges are always paid by card (not covered by gift card)
  const deliveryCharges = deliveryFee + merchantDeliveryFee + tip
  
  // Total amount that needs to be charged to card (food remaining + all delivery charges)
  const amountToChargeCard = foodTaxAfterGiftCard + deliveryCharges
  
  // Stripe fee: 2.9% + $0.30 (only on the amount actually charged to card)
  // If nothing needs to be charged to card, no Stripe fee
  const stripeFee = amountToChargeCard > 0 ? (amountToChargeCard * 0.029) + 0.30 : 0
  
  // Final total to pay via card (includes Stripe fee)
  const finalTotal = amountToChargeCard + stripeFee
  
  // Total order value before any discounts (for display purposes)
  const orderTotal = total + tax + deliveryCharges + stripeFee

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onUpdateCart(cart.filter(item => item.id !== itemId))
    } else {
      onUpdateCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const handleOrderTypeSelect = (type: 'PICKUP' | 'DELIVERY') => {
    setOrderType(type)
    setStep(3)
  }

  const handleContinueToPayment = async () => {
    // Check if restaurant is open
    const restaurantStatus = getRestaurantStatus()
    if (!restaurantStatus.isOpen && orderType === 'PICKUP' && !scheduledPickupTime) {
      setShowScheduledOrderModal(true)
      return
    }

    if (!orderType || !customerInfo.name || !customerInfo.email) {
      toast.error('Please fill in your name and email')
      return
    }

    // Basic email validation
    const emailValid = /.+@.+\..+/.test(customerInfo.email)
    if (!emailValid) {
      toast.error('Please enter a valid email address')
      return
    }

    // Optional phone validation (digits >= 10 if provided, but phone is fully optional)
    if (customerInfo.phone && customerInfo.phone.trim()) {
      const phoneDigits = customerInfo.phone.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        toast.error('Please enter a valid 10-digit phone number (e.g., 555-123-4567)')
        return
      }
    }

    if (orderType === 'DELIVERY' && !deliveryAddress) {
      toast.error('Please enter a delivery address')
      return
    }

    if (orderType === 'DELIVERY' && !addressValidated) {
      toast.error('Please select an address from the suggestions to verify it')
      return
    }

    setIsSubmitting(true)

    try {
      // If delivery, fetch live DoorDash quote first (for delivery fee)
      if (orderType === 'DELIVERY' && deliveryFeeCents === null) {
        setQuoteLoading(true)
        setQuoteError(null)
        const toCents = (n: number) => Math.round(n * 100)
        const externalId = quoteId ?? `quote_${Date.now()}`
        setQuoteId(externalId)
        // Split customer name for DoorDash contact fields
        const nameParts = customerInfo.name.trim().split(/\s+/)
        const givenName = nameParts[0] || 'Customer'
        const familyName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

        // Build delivery instructions for quote
        let quoteInstructions = []
        if (apartmentUnit) quoteInstructions.push(`Unit: ${apartmentUnit}`)
        if (gateCodeInstructions) quoteInstructions.push(gateCodeInstructions)
        if (notes) quoteInstructions.push(notes)
        const quoteInstructionsText = quoteInstructions.length > 0
          ? quoteInstructions.join('. ')
          : 'Please call upon arrival'

        // Build full address with apartment/unit
        const fullAddress = apartmentUnit
          ? `${deliveryAddress}, ${apartmentUnit}`
          : deliveryAddress

        console.log('[OrderModal] Creating quote with:', {
          deliveryAddress,
          fullAddress,
          apartmentUnit,
          deliveryCoordinates,
          orderType
        })

        // Ensure phone number is valid E.164 format or use fallback
        // E.164 format: +[country code][number], e.g., +14795551234
        // CRITICAL: DoorDash requires strict E.164 format - no spaces, dashes, or other characters
        let phoneToUse = '+14792735400' // Default fallback (Arkansas area code)
        
        // Helper to strictly normalize phone to E.164
        // CRITICAL: Must produce a VALID phone number, not just correct format
        const normalizeToE164 = (phone: string): string | null => {
          if (!phone) return null
          // Extract ONLY digits
          const digits = phone.replace(/\D/g, '')
          if (!digits || digits.length < 10) return null
          
          // US number without country code (exactly 10 digits)
          if (digits.length === 10) {
            return `+1${digits}`
          }
          // US number with country code (exactly 11 digits starting with 1)
          if (digits.length === 11 && digits.startsWith('1')) {
            return `+${digits}`
          }
          // REJECT numbers with wrong digit count for US
          // If it looks like a US number but has wrong length, return null to use fallback
          if (digits.startsWith('1') && digits.length !== 11) {
            console.warn('[OrderModal] Invalid US phone digit count:', digits.length)
            return null
          }
          // For other international, must be 10-15 digits AND not look like malformed US
          if (digits.length >= 10 && digits.length <= 15 && !digits.startsWith('1')) {
            return `+${digits}`
          }
          // Invalid - return null to trigger fallback
          console.warn('[OrderModal] Phone validation failed:', { digits, length: digits.length })
          return null
        }
        
        // Try multiple sources for phone (in order of priority)
        // 1. customerPhoneFormatted (E.164 from PhoneInput)
        // 2. customerInfo.phone (display format with spaces)  
        // 3. Default fallback
        const phoneSources = [
          customerPhoneFormatted,
          customerInfo.phone,
          customerPhoneCountryCode + customerInfo.phone?.replace(/\D/g, ''),
        ].filter(Boolean)
        
        for (const source of phoneSources) {
          const normalized = normalizeToE164(source)
          if (normalized) {
            phoneToUse = normalized
            break
          }
        }
        
        // ALWAYS ensure the phone is strictly E.164 format (no spaces, only +digits)
        phoneToUse = phoneToUse.replace(/[^\d+]/g, '')
        if (!phoneToUse.startsWith('+')) {
          phoneToUse = '+' + phoneToUse
        }
        
        console.log('[OrderModal] Phone debug:', { 
          customerPhoneFormatted, 
          customerInfoPhone: customerInfo.phone,
          customerPhoneCountryCode,
          phoneSources,
          phoneToUse,
          isValidE164: /^\+\d{10,15}$/.test(phoneToUse)
        })

        const quoteRes = await fetch('/api/doordash/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            external_delivery_id: externalId,
            // Let server enforce restaurant pickup details; send placeholders
            pickup_address: null,
            pickup_business_name: null,
            pickup_phone_number: phoneToUse,
            dropoff_address: fullAddress,
            dropoff_phone_number: phoneToUse,
            dropoff_instructions: quoteInstructionsText,
            dropoff_contact_given_name: givenName,
            dropoff_contact_family_name: familyName,
            dropoff_contact_send_notifications: true,
            dropoff_location: deliveryCoordinates,
            order_value: toCents(total),
            currency: 'USD',
            tip: tipCents,
            items: cart.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              price: toCents(item.price),
            })),
          }),
        })
        const quoteJson = await quoteRes.json()
        console.log('Quote response:', quoteJson)
        if (!quoteJson.success) {
          // Parse DoorDash field_errors for detailed validation messages
          let errorMessage = quoteJson.error?.message || quoteJson.error || 'Delivery not serviceable or quote failed'

          // Check for specific field validation errors
          if (quoteJson.error?.field_errors && Array.isArray(quoteJson.error.field_errors)) {
            const fieldErrors = quoteJson.error.field_errors
              .map((fe: any) => `${fe.field}: ${fe.error}`)
              .join('; ')

            if (fieldErrors) {
              errorMessage = `Address validation failed: ${fieldErrors}. Please select an address from the dropdown suggestions.`
            }
          } else if (quoteJson.error?.code === 'validation_error') {
            errorMessage = 'Address validation failed. Please select a valid address from the dropdown suggestions, or click one of the test address buttons.'
          }

          console.log('Quote error:', errorMessage)
          setQuoteError(errorMessage)
          setIsSubmitting(false)
          setQuoteLoading(false)
          return
        }
        setDeliveryFeeCents(quoteJson.quote.fee)
        setQuoteLoading(false)
      }

      // For pickup orders, check if gift card covers everything
      if (orderType === 'PICKUP') {
        // If gift card covers the full food+tax amount, skip payment and create order directly
        // (For pickup, there are no delivery charges, so gift card can cover everything)
        if (appliedGiftCard && foodTaxAfterGiftCard === 0) {
          await handleGiftCardOnlyOrder()
          return
        }

        const paymentResponse = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: finalTotal,
            subtotal: total,
            tax: tax,
            deliveryFee: 0,
          }),
        })

        const paymentData = await paymentResponse.json()

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Failed to create payment intent')
        }

        setClientSecret(paymentData.clientSecret)
        setStep(4) // Move to payment step
      }
      // For delivery orders, the calling function will handle moving to step 3 (quote review)
      
    } catch (error) {
      console.error('Payment setup error:', error)
      toast.error('Payment setup failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setOrderType(preselectedOrderType)
    setCustomerInfo({ name: '', email: '', phone: '' })
    setDeliveryAddress(preselectedDeliveryAddress)
    setDeliveryCountry('US')
    setDeliveryCoordinates(null)
    setAddressValidated(!!preselectedDeliveryAddress)
    setApartmentUnit('')
    setGateCodeInstructions('')
    setCustomerPhoneFormatted('')
    setCustomerPhoneCountryCode('+1')
    setNotes('')
    setIsSubmitting(false)
    setClientSecret('')
    setOrderId('')
    setDeliveryFeeCents(null)
    setQuoteError(null)
    setQuoteId(null)
    setAcceptedDeliveryId(null)
    setScheduledPickupTime(null)
    setTipCents(0)
    setTipInputValue('0.00')
    // Reset gift card state
    setGiftCardCode('')
    setGiftCardLoading(false)
    setGiftCardError(null)
    setAppliedGiftCard(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white text-gray-900 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 text-white">
          <h2 className="text-2xl font-bold">
            {step === 1 && 'Your Cart'}
            {step === 2 && 'Customer Information'}
            {step === 3 && 'Review & Quote'}
            {step === 4 && 'Payment'}
            {step === 5 && 'Order Confirmed'}
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 text-sm">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-full p-1.5 hover:bg-gray-200 transition-colors text-gray-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-full p-1.5 hover:bg-gray-200 transition-colors text-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Subtotal:</span>
                      <span className="text-[rgb(var(--color-primary))]">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary mt-4 w-full"
                    disabled={cart.length === 0}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Scheduled Pickup Time Display */}
              {scheduledPickupTime && orderType === 'PICKUP' && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800">Scheduled Pickup</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {scheduledPickupTime.toLocaleString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setScheduledPickupTime(null)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <PhoneInput
                  value={customerInfo.phone}
                  onChange={(fullNumber, formatted, countryCode, country) => {
                    setCustomerInfo({...customerInfo, phone: formatted})
                    setCustomerPhoneFormatted(fullNumber)
                    setCustomerPhoneCountryCode(countryCode)
                  }}
                  defaultCountry={deliveryCountry}
                />
              </div>
              {orderType === 'DELIVERY' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Delivery Address *
                  </label>
                  {preselectedDeliveryAddress ? (
                    <div className="relative">
                      <div className="input-field w-full bg-gray-100 cursor-not-allowed text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="flex-1">{preselectedDeliveryAddress}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-700">Address validated. Return to menu to change delivery address.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <AddressPicker
                        onAddressSelect={(address, country, coordinates) => {
                          setDeliveryAddress(address)
                          setDeliveryCountry(country)
                          setDeliveryCoordinates(coordinates)
                          setAddressValidated(true)
                        }}
                        initialValue={deliveryAddress}
                        placeholder="Start typing your delivery address"
                      />
                      {deliveryAddress && !addressValidated && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Please select an address from the dropdown or click a test address button</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Apartment/Unit Number - only show after address is selected */}
                  {orderType === 'DELIVERY' && deliveryAddress && (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Apartment, Suite, or Unit # (Optional)
                      </label>
                      <input
                        type="text"
                        value={apartmentUnit}
                        onChange={(e) => setApartmentUnit(e.target.value)}
                        placeholder="Apt 4B, Suite 200, etc."
                        className="input-field w-full"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-500 mt-1">Help the driver find your exact location</p>
                    </div>
                  )}

                  {/* Gate Code/Access Instructions - only show after address is selected */}
                  {orderType === 'DELIVERY' && deliveryAddress && (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Gate Code / Access Instructions (Optional)
                      </label>
                      <textarea
                        value={gateCodeInstructions}
                        onChange={(e) => setGateCodeInstructions(e.target.value)}
                        placeholder="e.g., Gate code #1234, Call upon arrival, Ring doorbell for building access, etc."
                        className="input-field w-full min-h-[80px] resize-y"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">Include gate codes, building access, parking instructions, or any special delivery notes</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Optional Tip for Dasher
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">$</span>
                      <input
                        type="text"
                        value={tipInputValue}
                        onChange={(e) => {
                          const rawValue = e.target.value
                          // Allow empty string, numbers, and one decimal point
                          if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                            setTipInputValue(rawValue)
                            // Update tipCents as user types
                            const dollars = parseFloat(rawValue || '0')
                            if (!isNaN(dollars)) {
                              setTipCents(Math.max(0, Math.round(dollars * 100)))
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Format to 2 decimal places on blur
                          const dollars = parseFloat(e.target.value || '0')
                          if (isNaN(dollars) || dollars < 0) {
                            setTipInputValue('0.00')
                            setTipCents(0)
                          } else {
                            setTipInputValue(dollars.toFixed(2))
                            setTipCents(Math.round(dollars * 100))
                          }
                        }}
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Special Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Any special requests or notes?"
                />
              </div>

              {/* Gift Card Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-[rgb(var(--color-primary))]" />
                  <label className="text-sm font-semibold text-gray-700">
                    Have a Gift Card?
                  </label>
                </div>

                {appliedGiftCard ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-800">Gift Card Applied</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1 font-mono">{appliedGiftCard.code}</p>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Card Balance: <span className="font-semibold">${appliedGiftCard.balance.toFixed(2)}</span></p>
                          <p>Applied to Order: <span className="font-semibold text-green-800">-${appliedGiftCard.amountToUse.toFixed(2)}</span></p>
                          {appliedGiftCard.balance > appliedGiftCard.amountToUse && (
                            <p className="text-xs mt-1 text-green-600">
                              Remaining balance after purchase: ${(appliedGiftCard.balance - appliedGiftCard.amountToUse).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveGiftCard}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardCode}
                        onChange={(e) => {
                          setGiftCardCode(e.target.value.toUpperCase())
                          setGiftCardError(null)
                        }}
                        placeholder="Enter gift card code (e.g., GIFT-XXXX-XXXX-XXXX)"
                        className="input-field flex-1 font-mono text-sm uppercase"
                        disabled={giftCardLoading}
                      />
                      <button
                        type="button"
                        onClick={handleApplyGiftCard}
                        disabled={giftCardLoading || !giftCardCode.trim()}
                        className="px-4 py-2 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {giftCardLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                    {giftCardError && (
                      <p className="text-sm text-red-600">{giftCardError}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Enter your gift card code to apply it to food & tax{orderType === 'DELIVERY' && ' (does not cover delivery fees)'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-900">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {orderType === 'PICKUP' ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax (10.25%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    {appliedGiftCard && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Gift Card Discount:</span>
                        <span>-${appliedGiftCard.amountToUse.toFixed(2)}</span>
                      </div>
                    )}
                    {amountToChargeCard > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Credit Card Processing (Stripe):</span>
                        <span>${stripeFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold">
                      <span>Total to Pay:</span>
                      <span className="text-[rgb(var(--color-primary))]">
                        {finalTotal > 0 ? `$${finalTotal.toFixed(2)}` : '$0.00'}
                      </span>
                    </div>
                    {appliedGiftCard && foodTaxAfterGiftCard === 0 && (
                      <p className="text-sm text-green-600 text-center">
                        🎉 Your food order is fully covered by your gift card!
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax (10.25%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Estimated DoorDash Fee:</span>
                      <span>~$9.75</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Merchant Delivery Fee:</span>
                      <span>${merchantDeliveryFee.toFixed(2)}</span>
                    </div>
                    {appliedGiftCard && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Gift Card Discount:</span>
                        <span>-${appliedGiftCard.amountToUse.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Estimated Stripe Fee:</span>
                      <span>~${(stripeFee || 1.00).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold">
                      <span>Estimated Total:</span>
                      <span className="text-[rgb(var(--color-primary))]">
                        ${(total + tax + 9.75 + merchantDeliveryFee + (stripeFee || 1.00) - (appliedGiftCard?.amountToUse || 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Final delivery fee will be calculated based on your address
                      {appliedGiftCard && ' • Gift card covers food & tax only'}
                    </p>
                  </>
                )}
              </div>
              {/* Upsell Section */}
              <div className="border-t border-gray-200 pt-6">
                <UpsellSection
                  onAddItem={(item) => {
                    // Add upsell item to cart
                    const cartItem = {
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      price: item.price,
                      category: item.category,
                      image: item.image,
                      quantity: 1
                    }
                    onUpdateCart([...cart, cartItem])
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    if (orderType === 'PICKUP') {
                      // For pickup, go directly to payment (or create order if gift card covers all)
                      await handleContinueToPayment()
                    } else {
                      // For delivery, get quote and go to review step
                      await handleContinueToPayment()
                      if (!quoteError) {
                        setStep(3)
                      }
                    }
                  }}
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      {orderType === 'DELIVERY' ? 'Getting quote...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      {appliedGiftCard && orderType === 'PICKUP' && foodTaxAfterGiftCard === 0 ? (
                        <>
                          <Gift className="h-4 w-4" />
                          Place Order (Gift Card)
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          {orderType === 'DELIVERY' ? 'Get Delivery Quote' : 'Proceed to Payment'}
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-gray-600">Review your delivery quote and costs before payment.</p>
              {quoteLoading && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  <div className="flex items-center gap-2 text-[rgb(var(--color-primary))]">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[rgb(var(--color-primary))]"></div>
                    Fetching delivery quote…
                  </div>
                </div>
              )}
              {quoteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {quoteError}
                </div>
              )}
              {!quoteLoading && !quoteError && deliveryFeeCents !== null && (
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-900">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (10.25%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>DoorDash Delivery Fee:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tip for Dasher:</span>
                    <span>${tip.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Merchant Delivery Fee:</span>
                    <span>${merchantDeliveryFee.toFixed(2)}</span>
                  </div>
                  {appliedGiftCard && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Gift Card Discount:</span>
                      <span>-${appliedGiftCard.amountToUse.toFixed(2)}</span>
                    </div>
                  )}
                  {amountToChargeCard > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Credit Card Processing (Stripe):</span>
                      <span>${stripeFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold">
                    <span>Total to Pay:</span>
                    <span className="text-[rgb(var(--color-primary))]">
                      {finalTotal > 0 ? `$${finalTotal.toFixed(2)}` : '$0.00'}
                    </span>
                  </div>
                  {appliedGiftCard && foodTaxAfterGiftCard === 0 && (
                    <p className="text-sm text-green-600 text-center">
                      🎉 Food & tax covered by gift card! You only pay delivery fees.
                    </p>
                  )}
                  {appliedGiftCard && foodTaxAfterGiftCard > 0 && (
                    <p className="text-xs text-yellow-600 text-center mt-1">
                      Gift cards cover food & tax only, not delivery fees
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary flex-1"
                >
                  Edit Details
                </button>
                <button
                  onClick={async () => {
                    if (quoteLoading || quoteError || deliveryFeeCents === null) {
                      toast.error('Please wait for the delivery quote to load')
                      return
                    }

                    // Accept quote to convert into a live delivery before payment
                    try {
                      if (orderType === 'DELIVERY' && quoteId) {
                        const acceptRes = await fetch('/api/doordash/quote', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            external_delivery_id: quoteId,
                            tip: tipCents,
                            dropoff_phone_number: customerPhoneFormatted || undefined,
                          }),
                        })
                        const acceptJson = await acceptRes.json()
                        if (!acceptJson.success) {
                          toast.error('Could not confirm delivery. Please try again.')
                          return
                        }
                        setAcceptedDeliveryId(acceptJson.delivery?.delivery_id ?? null)
                      }

                      // For delivery orders, customer always needs to pay delivery charges via card
                      // Gift card only covers food+tax, NOT delivery fees
                      // So we always need Stripe payment for delivery orders

                      // Create payment intent and move to Payment step (4)
                      const paymentResponse = await fetch('/api/create-payment-intent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          amount: finalTotal,
                          subtotal: total,
                          tax: tax,
                          deliveryFee: deliveryFee,
                        }),
                      })
                      const paymentData = await paymentResponse.json()

                      if (!paymentResponse.ok) {
                        throw new Error(paymentData.error || 'Failed to create payment intent')
                      }

                      setClientSecret(paymentData.clientSecret)
                      setStep(4)
                    } catch (e) {
                      toast.error('Payment setup failed. Please try again.')
                    }
                  }}
                  disabled={quoteLoading || !!quoteError || deliveryFeeCents === null}
                  className="btn-primary flex-1"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {step === 4 && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: 'rgb(11, 55, 85)',
                    colorBackground: '#ffffff',
                    colorText: '#1f2937',
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <CheckoutForm
                finalTotal={finalTotal}
                deliveryFeeCents={deliveryFeeCents}
                appliedGiftCard={appliedGiftCard}
                priceBreakdown={{
                  subtotal: total,
                  tax: tax,
                  deliveryFee: deliveryFee,
                  merchantDeliveryFee: merchantDeliveryFee,
                  tip: tip,
                  giftCardDiscount: giftCardDiscount,
                  stripeFee: stripeFee,
                  orderType: orderType,
                }}
                orderData={{
                  customer: customerInfo,
                  items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price
                  })),
                  orderType,
                  deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
                  deliveryCoordinates: orderType === 'DELIVERY' ? deliveryCoordinates : null,
                  apartmentUnit: orderType === 'DELIVERY' ? apartmentUnit : null,
                  gateCodeInstructions: orderType === 'DELIVERY' ? gateCodeInstructions : null,
                  notes,
                  tipCents,
                  doordashAcceptedDeliveryId: acceptedDeliveryId,
                  scheduledPickupTime: scheduledPickupTime?.toISOString() || null,
                  giftCardCode: appliedGiftCard?.code || null,
                  giftCardAmountUsed: appliedGiftCard?.amountToUse || 0,
                }}
                onSuccess={() => {
                  setStep(5)
                  onUpdateCart([])
                }}
                onBack={() => setStep(2)}
              />
            </Elements>
          )}

          {step === 5 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-200">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">
                {orderType === 'PICKUP'
                  ? 'Your order is being prepared. Please come to our restaurant to pick it up.'
                  : 'Your order is being prepared and will be delivered to your address.'
                }
              </p>
              <button
                onClick={handleClose}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Scheduled Order Modal */}
        <ScheduledOrderModal
          isOpen={showScheduledOrderModal}
          onClose={() => setShowScheduledOrderModal(false)}
          onSchedule={(time) => {
            setScheduledPickupTime(time)
            setShowScheduledOrderModal(false)
          }}
          opensAt={formatTime(getRestaurantStatus().opensAt || '11:00')}
        />
      </div>
    </div>
  )
}
