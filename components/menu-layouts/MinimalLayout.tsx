'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, ShoppingBag, Search, Clock } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
}

interface Category {
  id: string
  name: string
}

interface StoreHours {
  open: string
  close: string
  isOpen?: boolean
}

interface MinimalLayoutProps {
  restaurantName: string
  logoUrl?: string
  storeHours?: StoreHours
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  cart: { id: string; qty: number }[]
  onAddToCart: (id: string) => void
}

export default function MinimalLayout({
  restaurantName,
  logoUrl,
  storeHours,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart
}: MinimalLayoutProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = item.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return item.available && matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-full bg-white">
      {/* Clean Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              {restaurantName}
            </h1>
          </div>
          <button 
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 text-xs text-white rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6">
        {/* Store Hours Banner */}
        {storeHours && (
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {storeHours.isOpen !== false ? (
                <span className="text-green-600 font-medium">Open</span>
              ) : (
                <span className="text-red-500 font-medium">Closed</span>
              )}
              <span className="text-gray-400">·</span>
              <span>{storeHours.open} - {storeHours.close}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:bg-white transition-all"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-8 border-b border-gray-100 mb-8 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`pb-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeCategory === cat.id
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {cat.name}
              {activeCategory === cat.id && (
                <span 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Menu Items - Minimal List Style */}
        <div className="pb-24">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="group py-6 border-b border-gray-50 last:border-0"
            >
              <div className="flex gap-6">
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => onAddToCart(item.id)}
                      className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p 
                    className="text-sm font-medium mt-3"
                    style={{ color: primaryColor }}
                  >
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                {/* Optional Image */}
                {item.image && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400">No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button
            className="px-8 py-4 rounded-full text-white font-medium shadow-xl hover:shadow-2xl transition-all flex items-center gap-3"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag className="w-5 h-5" />
            View Order ({cartCount})
          </button>
        </div>
      )}
    </div>
  )
}
