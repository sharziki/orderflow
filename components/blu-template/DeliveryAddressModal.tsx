"use client"

import { useState } from 'react'
import { X, MapPin, Truck } from 'lucide-react'
import AddressPicker from '@/components/AddressPicker'

interface DeliveryAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onAddressConfirmed: (address: string, coordinates: { lat: number; lng: number }) => void
  onSwitchToPickup: () => void
}

export default function DeliveryAddressModal({
  isOpen,
  onClose,
  onAddressConfirmed,
  onSwitchToPickup
}: DeliveryAddressModalProps) {
  const [selectedAddress, setSelectedAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  if (!isOpen) return null

  const handleAddressSelect = (address: string, country: string, coords: { lat: number; lng: number }) => {
    setSelectedAddress(address)
    setCoordinates(coords)
  }

  const handleContinue = () => {
    if (!selectedAddress || !coordinates) {
      return
    }

    // Just confirm the address - no checking
    onAddressConfirmed(selectedAddress, coordinates)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white text-gray-900 shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Delivery Address</h2>
              <p className="text-xs text-blue-100">Where should we deliver your order?</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[rgb(var(--color-primary))] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-semibold mb-1">Delivery powered by DoorDash</p>
                <p className="text-xs text-gray-600">
                  Please enter your delivery address. We'll verify it's within our delivery area before you start shopping.
                </p>
              </div>
            </div>
          </div>

          {/* Address Picker with DoorDash Autocomplete */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Address *
            </label>
            <AddressPicker
              onAddressSelect={handleAddressSelect}
              initialValue={selectedAddress}
              placeholder="Start typing your delivery address or use test address button"
              required={true}
              showValidationMessage={true}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-3">
          <button
            onClick={handleContinue}
            disabled={!selectedAddress}
            className="btn-primary w-full"
          >
            Continue Shopping
          </button>

          <button
            onClick={onSwitchToPickup}
            className="btn-secondary w-full"
          >
            Switch to Pickup Instead
          </button>

          <p className="text-xs text-center text-gray-600">
            You can change your delivery address anytime before checkout
          </p>
        </div>
      </div>
    </div>
  )
}
