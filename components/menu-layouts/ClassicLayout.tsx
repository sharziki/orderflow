'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Clock } from 'lucide-react'

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

interface ClassicLayoutProps {
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

export default function ClassicLayout({
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
}: ClassicLayoutProps) {
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.available && item.category === categoryId)
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: '#faf8f5' }}>
      {/* Elegant Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              {logoUrl && (
                <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden border-2 border-gray-100">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-1">Welcome to</p>
              <h1 
                className="text-2xl font-serif font-medium"
                style={{ color: primaryColor }}
              >
                {restaurantName}
              </h1>
              {storeHours && (
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {storeHours.isOpen !== false ? (
                    <span className="text-green-600">Open</span>
                  ) : (
                    <span className="text-red-500">Closed</span>
                  )}
                  <span>·</span>
                  <span>{storeHours.open} - {storeHours.close}</span>
                </div>
              )}
            </div>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors absolute right-6"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {categories.map((category, idx) => {
          const items = getItemsForCategory(category.id)
          if (items.length === 0) return null

          return (
            <section key={category.id} className="mb-12">
              {/* Category Header - Elegant Style */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-gray-300" />
                  <h2 
                    className="text-xl font-serif font-medium uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    {category.name}
                  </h2>
                  <div className="h-px w-12 bg-gray-300" />
                </div>
              </div>

              {/* Menu Items - Classic List */}
              <div className="space-y-1">
                {items.map(item => {
                  const qty = getQty(item.id)
                  return (
                    <div
                      key={item.id}
                      className="group flex items-start gap-4 py-4 border-b border-dashed border-gray-200 hover:bg-white/50 px-4 -mx-4 rounded-lg transition-colors"
                    >
                      {/* Optional Image */}
                      {item.image && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-base font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {/* Dotted line */}
                            <div className="w-8 border-b border-dotted border-gray-300 hidden sm:block" />
                            <span 
                              className="font-serif font-medium"
                              style={{ color: primaryColor }}
                            >
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Add/Remove Buttons */}
                      <div className="flex items-center gap-2">
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => onRemoveFromCart(item.id)}
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-all hover:bg-gray-200"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="w-5 text-center font-medium">{qty}</span>
                            <button
                              onClick={() => onAddToCart(item.id)}
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                              style={{ backgroundColor: primaryColor, color: 'white' }}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onAddToCart(item.id)}
                            className="flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Classic Bottom Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <button
              className="w-full py-4 rounded-lg text-white font-medium flex items-center justify-between px-6 transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                View Order
              </span>
              <span className="flex items-center gap-3">
                <span className="text-white/70">{cartCount} items</span>
                <span className="font-serif text-lg">${cartTotal.toFixed(2)}</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
