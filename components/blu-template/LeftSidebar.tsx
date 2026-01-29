'use client'

import { Search, X, Store, Truck, SlidersHorizontal, MapPin, Edit2, Clock, Phone } from 'lucide-react'

interface StoreInfo {
  name: string
  tagline?: string
  logo?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  isOpen: boolean
  primaryColor: string
  deliveryEnabled: boolean
}

interface LeftSidebarProps {
  store: StoreInfo
  categories: string[]
  selectedCategory: string
  activeSection: string
  onCategoryChange: (category: string) => void
  onCategoryClick: (category: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  orderType: 'pickup' | 'delivery'
  onOrderTypeChange: (type: 'pickup' | 'delivery') => void
  deliveryAddress?: string
  onEditDeliveryAddress?: () => void
}

export default function LeftSidebar({
  store,
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
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: store.primaryColor }}
              >
                {store.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 
                className="text-lg font-bold"
                style={{ color: store.primaryColor }}
              >
                {store.name}
              </h2>
              {store.tagline && (
                <p className="text-xs text-gray-500">{store.tagline}</p>
              )}
            </div>
          </div>
          
          {/* Restaurant Status */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            {store.isOpen ? (
              <span className="flex items-center gap-1.5 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Open now
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Closed
              </span>
            )}
            {store.phone && (
              <a href={`tel:${store.phone}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <Phone className="w-3 h-3" />
                {store.phone}
              </a>
            )}
          </div>
          
          {store.address && (
            <p className="mt-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3 inline mr-1" />
              {store.address}, {store.city}, {store.state}
            </p>
          )}
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
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
              style={{ '--tw-ring-color': store.primaryColor } as any}
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
          <div className={`grid gap-2 p-1 bg-gray-100 rounded-lg ${store.deliveryEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={() => onOrderTypeChange('pickup')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                orderType === 'pickup'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={orderType === 'pickup' ? { color: store.primaryColor } : {}}
            >
              <Store className="h-4 w-4" />
              Pickup
            </button>
            {store.deliveryEnabled && (
              <button
                onClick={() => onOrderTypeChange('delivery')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                  orderType === 'delivery'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={orderType === 'delivery' ? { color: store.primaryColor } : {}}
              >
                <Truck className="h-4 w-4" />
                Delivery
              </button>
            )}
          </div>

          {/* Delivery Address Display */}
          {orderType === 'delivery' && deliveryAddress && (
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
              const isActive = selectedCategory === 'All'
                ? activeSection === category || (category === 'All' && activeSection === 'All')
                : selectedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => {
                    if (selectedCategory === 'All' && category !== 'All') {
                      onCategoryClick(category)
                    } else {
                      onCategoryChange(category)
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive ? { backgroundColor: store.primaryColor } : {}}
                >
                  {category}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
