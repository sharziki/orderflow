'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, ChevronDown, ChevronUp, Clock, Plus, Minus } from 'lucide-react'

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

interface SliceLayoutProps {
  restaurantName: string
  logoUrl?: string
  storeHours?: StoreHours
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  cart: { id: string; qty: number }[]
  onAddToCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
}

function CategorySection({
  category,
  items,
  primaryColor,
  cart,
  onAddToCart,
  onRemoveFromCart,
  defaultExpanded = true
}: {
  category: Category
  items: MenuItem[]
  primaryColor: string
  cart: { id: string; qty: number }[]
  onAddToCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

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
          {items.map(item => {
            const qty = getQty(item.id)
            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
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
                  <div className="flex items-center justify-between mt-2">
                    <p 
                      className="text-lg font-bold"
                      style={{ color: primaryColor }}
                    >
                      ${item.price.toFixed(2)}
                    </p>
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.id) }}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-6 text-center font-semibold">{qty}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddToCart(item.id) }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddToCart(item.id) }}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
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
            )
          })}

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
  logoUrl,
  storeHours,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart,
  onRemoveFromCart
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
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
              <p className="text-sm text-gray-500">Online Ordering</p>
            </div>
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
        className="h-36 flex items-end"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 w-full">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="w-16 h-16 bg-white rounded-xl shadow-lg overflow-hidden flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold" style={{ color: primaryColor }}>
                {restaurantName.charAt(0)}
              </div>
            )}
            <div className="text-white">
              <h2 className="text-2xl font-bold">{restaurantName}</h2>
              {storeHours ? (
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {storeHours.isOpen !== false ? (
                    <span className="text-green-300">Open</span>
                  ) : (
                    <span className="text-red-300">Closed</span>
                  )}
                  {' · '}{storeHours.open} - {storeHours.close}
                </p>
              ) : (
                <p className="text-white/80 text-sm">🕐 Open Now • 25-40 min delivery</p>
              )}
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
              cart={cart}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
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
