'use client'

import { Fish } from 'lucide-react'

interface FishMarketCTAProps {
  onViewFishMarket: () => void
}

export default function FishMarketCTA({ onViewFishMarket }: FishMarketCTAProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Fish className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Fresh Fish Market Now Open!</h2>
              <p className="text-sm text-blue-100">Premium seafood delivered daily • 50+ varieties available</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onViewFishMarket}
            className="flex-shrink-0 px-6 py-3 bg-white text-[rgb(var(--color-primary))] rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap"
          >
            Shop Fish Market
          </button>
        </div>
      </div>
    </div>
  )
}
