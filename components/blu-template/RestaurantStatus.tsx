'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { getRestaurantStatus, formatTime, formatNextOpenTime } from '@/lib/restaurant-hours'

export default function RestaurantStatus() {
  const [status, setStatus] = useState(getRestaurantStatus())

  useEffect(() => {
    // Update status every minute
    const interval = setInterval(() => {
      setStatus(getRestaurantStatus())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (status.isOpen) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-200 rounded-full">
        <div className="flex h-2 w-2 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <span className="text-xs font-semibold text-green-700 whitespace-nowrap">Open Now</span>
        {status.closesAt && (
          <span className="hidden sm:inline text-xs text-green-600">Closes at {formatTime(status.closesAt)}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-200 rounded-full">
      <div className="flex h-2 w-2 relative flex-shrink-0">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </div>
      <span className="text-xs font-semibold text-green-700 whitespace-nowrap">Schedule Order</span>
      {status.nextOpenTime && (
        <span className="hidden sm:inline text-xs text-green-600">Opens {formatNextOpenTime(status.nextOpenTime)}</span>
      )}
    </div>
  )
}
