'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface SliceLayoutProps {
  restaurantName: string
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  cart: { id: string; qty: number }[]
  onAddToCart: (id: string) => void
}

function CategorySection({
  category,
  items,
  primaryColor,
  onAddToCart,
  defaultExpanded = true
}: {
  category: Category
  items: MenuItem[]
  primaryColor: string
  onAddToCart: (id: string) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="mb-6">
      {/* Category Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Items */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => onAddToCart(item.id)}
              className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Product Info - Left Side */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p 
                  className="text-lg font-bold mt-2"
                  style={{ color: primaryColor }}
                >
                  ${item.price.toFixed(2)}
                </p>
              </div>

              {/* Product Image - Right Side */}
              <div className="relative w-[100px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="100px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <span className="text-3xl">🍽️</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center py-8 text-gray-400">No items in this category</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function SliceLayout({
  restaurantName,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart
}: SliceLayoutProps) {
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.available && item.category === categoryId)
  }

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
            <p className="text-sm text-gray-500">Online Ordering</p>
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-medium">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* Restaurant Banner */}
      <div 
        className="h-32 flex items-end"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold" style={{ color: primaryColor }}>
              {restaurantName.charAt(0)}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{restaurantName}</h2>
              <p className="text-white/80 text-sm">🕐 Open Now • 25-40 min delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Category Nav */}
      <div className="sticky top-[73px] z-10 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <a
                key={cat.id}
                href={`#category-${cat.id}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {categories.map((category, idx) => (
          <div key={category.id} id={`category-${category.id}`}>
            <CategorySection
              category={category}
              items={getItemsForCategory(category.id)}
              primaryColor={primaryColor}
              onAddToCart={onAddToCart}
              defaultExpanded={idx < 3} // First 3 categories expanded by default
            />
          </div>
        ))}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              className="w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              View Cart ({cartCount} items) • ${cartTotal.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
