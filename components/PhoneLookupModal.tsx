'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Phone, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhoneLookupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (phone: string) => void
  primaryColor?: string
}

export default function PhoneLookupModal({
  isOpen,
  onClose,
  onSubmit,
  primaryColor = '#1a4fff',
}: PhoneLookupModalProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Extract just the digits
    const digits = phone.replace(/\D/g, '')
    
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    onSubmit(digits)
    setPhone('')
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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div 
                className="px-6 py-5 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">View Recent Orders</h2>
                    <p className="text-sm text-gray-500">Enter your phone number</p>
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
              <form onSubmit={handleSubmit} className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Enter the phone number you used when placing your orders to view your order history.
                </p>

                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    ref={inputRef}
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-medium transition-colors focus:outline-none ${
                      error 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    style={{ 
                      borderColor: error ? undefined : (phone.length >= 14 ? primaryColor : undefined)
                    }}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={phone.replace(/\D/g, '').length < 10}
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  View My Orders
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  We'll only show orders placed with this phone number.
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
