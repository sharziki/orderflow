'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

interface FishItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  weight?: string
  origin?: string
}

interface FishMarketSliderProps {
  fishItems: FishItem[]
  onAddToCart: (item: FishItem) => void
}

export default function FishMarketSlider({ fishItems, onAddToCart }: FishMarketSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section id="fish-market" className="bg-gradient-to-b from-gray-50 to-white py-16 border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-[rgb(var(--color-primary))] rounded-full text-sm font-medium mb-3">
              <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-primary))] animate-pulse" />
              Fresh Daily
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Fresh Fish Market
            </h2>
            <p className="text-gray-600 max-w-2xl">
              Premium seafood sourced daily from sustainable fisheries. Each selection is hand-picked for quality and freshness.
            </p>
          </div>

          {/* Navigation Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {fishItems.map((fish) => (
              <div
                key={fish.id}
                className="flex-none w-80 snap-start group"
              >
                <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  {/* Image */}
                  <div className="relative h-56 bg-gradient-to-br from-blue-50 to-gray-50 overflow-hidden">
                    {fish.image ? (
                      <Image
                        src={fish.image}
                        alt={fish.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400">Fresh Fish</span>
                      </div>
                    )}
                    {/* Fresh Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      Fresh Today
                    </div>
                    {fish.origin && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
                        {fish.origin}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                        {fish.name}
                      </h3>
                      {fish.weight && (
                        <p className="text-sm text-gray-500 font-medium">{fish.weight}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {fish.description}
                      </p>
                    </div>

                    {/* Price & Add Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-2xl font-bold text-[rgb(var(--color-primary))]">
                          ${fish.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">per lb</div>
                      </div>
                      <button
                        onClick={() => onAddToCart(fish)}
                        className="group/btn inline-flex items-center gap-2 px-5 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Placeholder Items if needed */}
            {fishItems.length === 0 && (
              <div className="flex-none w-80 snap-start">
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">Fresh fish arriving soon!</p>
                </div>
              </div>
            )}
          </div>

          {/* Gradient Overlays for scroll indication */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>

        {/* Mobile Navigation Hint */}
        <div className="md:hidden text-center mt-4">
          <p className="text-sm text-gray-500">Swipe to see more</p>
        </div>
      </div>
    </section>
  )
}
