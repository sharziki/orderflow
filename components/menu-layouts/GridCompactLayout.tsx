'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, ShoppingCart, Clock, Star } from 'lucide-react'

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

interface GridCompactLayoutProps {
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

export default function GridCompactLayout({
  restaurantName,
  logoUrl,
  storeHours,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart
}: GridCompactLayoutProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)

  const filteredItems = menuItems.filter(item => item.available && item.category === activeCategory)

  return (
    <div className="min-h-full bg-gray-100">
      {/* App-style Header */}
      <header 
        className="sticky top-0 z-20"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm bg-white flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-xl font-bold" style={{ color: primaryColor }}>
                    {restaurantName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="text-white">
                <h1 className="font-bold text-lg leading-tight">{restaurantName}</h1>
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> 4.8
                  </span>
                  <span>•</span>
                  {storeHours ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {storeHours.isOpen !== false ? 'Open' : 'Closed'} · {storeHours.open} - {storeHours.close}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 15-25 min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Category Chips */}
      <div className="sticky top-[72px] z-10 bg-white shadow-sm">
        <div className="flex gap-2 p-3 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Grid */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
                {/* Quick Add Button */}
                <button
                  onClick={() => onAddToCart(item.id)}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Plus className="w-4 h-4" style={{ color: primaryColor }} />
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                  {item.description}
                </p>
                <p 
                  className="font-bold text-sm"
                  style={{ color: primaryColor }}
                >
                  ${item.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">No items in this category</p>
          </div>
        )}
      </div>

      {/* Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg safe-area-pb">
          <button
            className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-between px-6"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {cartCount} items
            </span>
            <span>${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
