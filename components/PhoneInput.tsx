'use client'

import { useState, useEffect } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (phone: string, formatted: string, countryCode: string, country: string) => void
  defaultCountry?: string
  placeholder?: string
}

const COUNTRY_PHONE_FORMATS = {
  US: {
    code: '+1',
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '')
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`
      if (digits.length <= 10) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
      return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}`
    },
    placeholder: '(555) 123-4567'
  },
  CA: {
    code: '+1',
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '')
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`
      if (digits.length <= 10) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
      return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}`
    },
    placeholder: '(555) 123-4567'
  },
  GB: {
    code: '+44',
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '')
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0,4)} ${digits.slice(4)}`
      if (digits.length <= 10) return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7)}`
      return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7,10)}`
    },
    placeholder: '7700 900123'
  },
  AU: {
    code: '+61',
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '')
      if (digits.length <= 2) return digits
      if (digits.length <= 6) return `${digits.slice(0,2)} ${digits.slice(2)}`
      if (digits.length <= 9) return `${digits.slice(0,2)} ${digits.slice(2,6)} ${digits.slice(6)}`
      return `${digits.slice(0,2)} ${digits.slice(2,6)} ${digits.slice(6,9)}`
    },
    placeholder: '412 345 678'
  }
}

export default function PhoneInput({ value, onChange, defaultCountry = 'US', placeholder }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry)

  const format = COUNTRY_PHONE_FORMATS[selectedCountry as keyof typeof COUNTRY_PHONE_FORMATS] || COUNTRY_PHONE_FORMATS.US
  const defaultPlaceholder = placeholder || format.placeholder

  useEffect(() => {
    // Set country code based on country
    setCountryCode(format.code)
    
    // Format existing value
    if (value) {
      const formatted = format.format(value)
      setDisplayValue(formatted)
    }
  }, [selectedCountry, value, format])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    let digits = inputValue.replace(/\D/g, '')
    
    // For US/CA (+1), limit to 10 digits max (exclude country code from input)
    // This prevents users from accidentally entering country code twice
    if ((selectedCountry === 'US' || selectedCountry === 'CA') && digits.length > 10) {
      // If starts with 1 and has 11 digits, assume they included country code - strip it
      if (digits.startsWith('1') && digits.length === 11) {
        digits = digits.slice(1)
      } else {
        // Otherwise just truncate to 10 digits
        digits = digits.slice(0, 10)
      }
    }
    
    const formatted = format.format(digits)
    setDisplayValue(formatted)
    
    // Create full international number
    const fullNumber = format.code + digits
    onChange(fullNumber, formatted, format.code, selectedCountry)
  }

  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry)
    const newFormat = COUNTRY_PHONE_FORMATS[newCountry as keyof typeof COUNTRY_PHONE_FORMATS] || COUNTRY_PHONE_FORMATS.US
    setCountryCode(newFormat.code)
    
    // Reformat existing digits with new country format
    const digits = displayValue.replace(/\D/g, '')
    const formatted = newFormat.format(digits)
    setDisplayValue(formatted)
    
    const fullNumber = newFormat.code + digits
    onChange(fullNumber, formatted, newFormat.code, newCountry)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="input-field w-24 text-sm"
        >
          <option value="US">🇺🇸 US</option>
          <option value="CA">🇨🇦 CA</option>
          <option value="GB">🇬🇧 GB</option>
          <option value="AU">🇦🇺 AU</option>
        </select>
        <div className="flex-1">
          <input
            type="tel"
            value={displayValue}
            onChange={handleChange}
            placeholder={defaultPlaceholder}
            className="input-field w-full"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-400">
        Selected: {countryCode} {displayValue}
      </p>
    </div>
  )
}
