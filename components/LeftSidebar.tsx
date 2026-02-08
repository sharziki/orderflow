'use client'

import { Search, X, Store, Truck, SlidersHorizontal, MapPin, Edit2 } from 'lucide-react'
import Image from 'next/image'
import RestaurantStatus from '@/components/RestaurantStatus'

interface LeftSidebarProps {
  categories: string[]
  selectedCategory: string
  activeSection: string
  onCategoryChange: (category: string) => void
  onCategoryClick: (category: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  orderType: 'PICKUP' | 'DELIVERY'
  onOrderTypeChange: (type: 'PICKUP' | 'DELIVERY') => void
  deliveryAddress?: string
  onEditDeliveryAddress?: () => void
}

export default function LeftSidebar({
  categories,
  selectedCategory,
  activeSection,
  onCategoryChange,
  onCategoryClick,
  searchQuery,
  onSearchChange,
  orderType,
  onOrderTypeChange,
  deliveryAddress,
  onEditDeliveryAddress
}: LeftSidebarProps) {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto scrollbar-hide">
      <div className="p-6 space-y-6">
        {/* Logo Section */}
        <div className="pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/logo.svg"
              alt="DerbyFlow"
              width={48}
              height={48}
              className="object-contain flex-shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[rgb(var(--color-primary))]">Blu Fish House</h2>
              <p className="text-xs text-gray-500">Fresh. Local. Delicious.</p>
            </div>
          </div>
          <div className="mt-2">
            <RestaurantStatus />
          </div>
        </div>

        {/* Search Bar */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Search Menu
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Order Type Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Order Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => onOrderTypeChange('PICKUP')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                orderType === 'PICKUP'
                  ? 'bg-white shadow-sm text-[rgb(var(--color-primary))]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="h-4 w-4" />
              Pickup
            </button>
            <button
              onClick={() => onOrderTypeChange('DELIVERY')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                orderType === 'DELIVERY'
                  ? 'bg-white shadow-sm text-[rgb(var(--color-primary))]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="h-4 w-4" />
              Delivery
            </button>
          </div>

          {/* Delivery Address Display */}
          {orderType === 'DELIVERY' && deliveryAddress && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-900 mb-1">Delivering to:</p>
                  <p className="text-xs text-green-700 line-clamp-2">{deliveryAddress}</p>
                </div>
                {onEditDeliveryAddress && (
                  <button
                    onClick={onEditDeliveryAddress}
                    className="flex-shrink-0 p-1 text-green-600 hover:text-green-800 transition-colors"
                    aria-label="Edit delivery address"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Categories
          </label>
          <nav className="space-y-1">
            {categories.map((category) => {
              // Determine if this category is active (either selected for filtering or currently visible while scrolling)
              const isActive = selectedCategory === 'All'
                ? activeSection === category || (category === 'All' && activeSection === 'All')
                : selectedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => {
                    if (selectedCategory === 'All' && category !== 'All') {
                      // Smooth scroll to section when viewing all
                      onCategoryClick(category)
                    } else {
                      // Filter by category
                      onCategoryChange(category)
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgb(var(--color-primary))] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Filters Section (Placeholder) */}
        <div>
          <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>More Filters</span>
            </div>
            <span className="text-xs text-gray-500">Coming Soon</span>
          </button>
        </div>

        {/* Info Section */}
        <div className="pt-6 border-t border-gray-100">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-primary))] mb-2">
              Fresh Daily
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              All our seafood is sourced daily from trusted suppliers to ensure maximum freshness and quality.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
