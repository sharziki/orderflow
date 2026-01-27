'use client'

import { Fish, X } from 'lucide-react'
import { useState } from 'react'

interface StickyFishMarketAlertProps {
  onViewFishMarket: () => void
  isVisible: boolean
}

export default function StickyFishMarketAlert({ onViewFishMarket, isVisible }: StickyFishMarketAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || !isVisible) return null

  return (
    <div className="fixed top-0 left-0 lg:left-80 right-0 z-40 animate-slide-down">
      <div className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center">
                <Fish className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex items-center">
                <p className="text-sm font-semibold truncate leading-none">
                  Fresh Fish Market Now Open! Premium seafood delivered daily
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onViewFishMarket}
                className="px-4 py-1.5 bg-white text-[rgb(var(--color-primary))] rounded-md text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Shop Now
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
