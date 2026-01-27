"use client"

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, AlertCircle, Check, X, Edit2 } from 'lucide-react'
import { normalizeAddress } from '@/lib/api-utils'

interface AddressPickerProps {
  onAddressSelect: (address: string, country: string, coordinates: { lat: number; lng: number }) => void
  initialValue?: string
  placeholder?: string
  required?: boolean
  showValidationMessage?: boolean // Control whether to show "Address Selected" message
}

interface AddressSuggestion {
  address: string
  location?: { lat: number; lng: number }
  components?: Record<string, any>
}

export default function AddressPicker({
  onAddressSelect,
  initialValue = '',
  placeholder = 'Start typing your delivery address',
  required = true,
  showValidationMessage = true
}: AddressPickerProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState(initialValue)
  const [isLocked, setIsLocked] = useState(!!initialValue)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch address suggestions from DoorDash API
  const fetchSuggestions = async (searchText: string) => {
    if (searchText.trim().length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/doordash/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_address: searchText,
          max_results: 5,
          country: 'US',
        }),
      })

      const data = await response.json()

      if (data.success && data.results && data.results.length > 0) {
        setSuggestions(data.results)
        setShowDropdown(true)
        setError(null)
      } else {
        setSuggestions([])
        setShowDropdown(false)
        if (searchText.length > 5) {
          setError('No addresses found. Please check your input.')
        }
      }
    } catch (err) {
      console.error('Address autocomplete error:', err)
      setError('Failed to fetch addresses. Please try again.')
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowDropdown(true)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer to fetch suggestions after 500ms of no typing
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 500)
  }

  // Handle address selection from dropdown
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    // Normalize address to DoorDash-compatible format
    const normalizedAddress = normalizeAddress(suggestion.address, suggestion.components)
    
    // Debug logging to see what's happening
    console.log('[AddressPicker] Original address:', suggestion.address)
    console.log('[AddressPicker] Normalized address:', normalizedAddress)
    console.log('[AddressPicker] Components:', suggestion.components)
    
    setInputValue(normalizedAddress)
    setSelectedAddress(normalizedAddress)
    setShowDropdown(false)
    setSuggestions([])
    setError(null)
    setIsLocked(true) // Lock the input after selection

    // Extract coordinates and country
    const coordinates = suggestion.location || { lat: 0, lng: 0 }
    const country = suggestion.components?.country || 'US'

    onAddressSelect(normalizedAddress, country, coordinates)
  }

  // Handle changing/unlocking the address
  const handleChangeAddress = () => {
    setIsLocked(false)
    setInputValue('')
    setSelectedAddress('')
    setError(null)
    setSuggestions([])
    // Reset validation in parent component
    onAddressSelect('', 'US', { lat: 0, lng: 0 })
    // Focus input after unlocking
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Test delivery address for demos - using close address on same street as pickup (607 SE 5th St)
  // Pickup: 607 SE 5th St, Bentonville, AR 72712
  // This address is very close (same street) to ensure it's within DoorDash distance limits
  const TEST_DELIVERY_ADDRESS = '609 SE 5th St, Bentonville, AR 72712'
  
  // Quick test addresses for development
  const TEST_ADDRESSES = [
    TEST_DELIVERY_ADDRESS,
    '400 E Main St, Louisville, KY 40202',
    '421 E Main St, Louisville, KY 40202',
  ]

  const useTestAddress = async (address: string) => {
    // For test addresses that are already in working format, use them as-is
    // Don't normalize test addresses - they're already in the correct format
    const testAddress = address.trim()
    
    setInputValue(testAddress)
    setSelectedAddress(testAddress)
    setShowDropdown(false)
    setError(null)
    setIsLocked(true)
    
    // Try to get coordinates for the test address
    try {
      const response = await fetch('/api/doordash/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_address: address,
          max_results: 1,
          country: 'US',
        }),
      })
      
      const data = await response.json()
      if (data.success && data.results && data.results.length > 0) {
        const result = data.results[0]
        // Use the test address as-is if it's already in working format, otherwise normalize API response
        const finalAddress = testAddress.match(/,\s*[A-Z]{2}\s+\d{5}/) 
          ? testAddress  // Already in working format, use test address
          : normalizeAddress(result.address, result.components)  // Normalize API response
        const coordinates = result.location || { lat: 36.3717, lng: -94.2084 } // Bentonville default
        console.log('[AddressPicker] Test address - using:', finalAddress)
        onAddressSelect(finalAddress, 'US', coordinates)
      } else {
        // Fallback: use test address as-is (it's already in working format)
        console.log('[AddressPicker] Test address - using fallback:', testAddress)
        onAddressSelect(testAddress, 'US', { lat: 36.3717, lng: -94.2084 })
      }
    } catch (err) {
      // Fallback: use test address as-is (it's already in working format)
      console.log('[AddressPicker] Test address - using fallback (error):', testAddress)
      onAddressSelect(testAddress, 'US', { lat: 36.3717, lng: -94.2084 })
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input field */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin className="h-5 w-5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && !isLocked) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          className={`input-field w-full pl-10 pr-24 ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          autoComplete="off"
          readOnly={isLocked}
          disabled={isLocked}
        />
        {isLoading && !isLocked && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {isLocked && (
          <button
            type="button"
            onClick={handleChangeAddress}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 flex items-center gap-1 transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            Change
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text - only show when not locked and no error */}
      {!isLocked && !error && inputValue.length === 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Start typing to see address suggestions from DoorDash
        </div>
      )}

      {/* No results message */}
      {!isLocked && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && !error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>No addresses found. Try a different search or check spelling.</span>
        </div>
      )}

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && !isLocked && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border-2 border-[rgb(var(--color-primary))]/30 bg-white shadow-2xl max-h-80 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-[rgb(var(--color-primary))]">
              ✓ Select a validated address:
            </p>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectAddress(suggestion)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0 group"
            >
              <MapPin className="h-5 w-5 text-[rgb(var(--color-primary))] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 group-hover:text-[rgb(var(--color-primary))] font-medium">
                  {suggestion.address}
                </p>
              </div>
              <Check className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Test address button - Always visible for demos */}
      {!isLocked && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => useTestAddress(TEST_DELIVERY_ADDRESS)}
            className="w-full px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-700 font-medium text-sm transition-colors flex items-center justify-center gap-2 group"
          >
            <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span>Fill Test Address (Demo)</span>
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {TEST_DELIVERY_ADDRESS}
          </p>
          
          {/* Additional test addresses for development */}
          {process.env.NODE_ENV === 'development' && TEST_ADDRESSES.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Other test addresses:</p>
              <div className="flex flex-wrap gap-2">
                {TEST_ADDRESSES.slice(1).map((address, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => useTestAddress(address)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors"
                  >
                    {address.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected address indicator - only show if enabled and delivery hasn't been checked yet */}
      {isLocked && selectedAddress && showValidationMessage && (
        <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700">Address Selected</p>
            <p className="text-xs text-blue-600">Please check delivery availability below</p>
          </div>
        </div>
      )}

      {/* Required field indicator */}
      {required && !isLocked && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <AlertCircle className="h-3 w-3" />
          <span>You must select a validated address from the dropdown to continue</span>
        </div>
      )}
    </div>
  )
}
