'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Clock, MapPin, Phone } from 'lucide-react'

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

interface ToastLayoutProps {
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
  onOpenItemModal?: (item: any) => void
}

export default function ToastLayout({
  restaurantName,
  logoUrl,
  storeHours,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenItemModal
}: ToastLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || '')

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.available && item.category === categoryId)
  }

  const activeItems = getItemsForCategory(activeTab)

  // Toast orange theme
  const toastOrange = '#ff6900'

  return (
    <div className="min-h-full bg-gray-50">
      {/* Toast-style Header Bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          {/* Top Bar */}
          <div className="py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-4">
              {logoUrl && (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  {storeHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {storeHours.isOpen !== false ? (
                        <span className="text-green-600 font-medium">Open</span>
                      ) : (
                        <span className="text-red-500">Closed</span>
                      )}
                      <span className="ml-1">{storeHours.open} - {storeHours.close}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-500">Your Order</p>
                <p className="font-bold text-gray-900">${cartTotal.toFixed(2)}</p>
              </div>
              <button 
                className="relative flex items-center gap-2 px-5 py-3 rounded-lg text-white font-semibold transition-colors"
                style={{ backgroundColor: toastOrange }}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 rounded-full text-xs font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category Tabs - POS Style */}
          <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === category.id
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={activeTab === category.id ? { backgroundColor: toastOrange } : {}}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu List - Traditional POS Style */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Category Header */}
          <div 
            className="px-5 py-3 border-b border-gray-100"
            style={{ backgroundColor: toastOrange + '10' }}
          >
            <h2 
              className="font-bold text-lg"
              style={{ color: toastOrange }}
            >
              {categories.find(c => c.id === activeTab)?.name || 'Menu'}
            </h2>
            <p className="text-sm text-gray-500">{activeItems.length} items</p>
          </div>

          {/* Item List */}
          <div className="divide-y divide-gray-100">
            {activeItems.map((item) => {
              const qty = getQty(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenItemModal?.(item)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  {/* Image */}
                  {item.image && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
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
                    <h3 className="font-semibold text-gray-900 mb-0.5">{item.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-1">{item.description}</p>
                    <p 
                      className="font-bold text-base"
                      style={{ color: toastOrange }}
                    >
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Add to Cart Controls */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => onRemoveFromCart(item.id)}
                          className="w-9 h-9 rounded-md bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">{qty}</span>
                        <button
                          onClick={() => onAddToCart(item.id)}
                          className="w-9 h-9 rounded-md text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: toastOrange }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(item.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all hover:shadow-md"
                        style={{ borderColor: toastOrange, color: toastOrange }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {activeItems.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No items in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast-style Order Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Your Order</p>
                <p className="font-bold text-lg text-gray-900">{cartCount} items</p>
              </div>
              <button
                className="flex items-center gap-3 px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: toastOrange }}
              >
                <span>Checkout</span>
                <span className="px-3 py-1 bg-white/20 rounded-md">${cartTotal.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
