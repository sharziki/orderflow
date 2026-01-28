'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, ShoppingCart, Sparkles, Clock } from 'lucide-react'

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

interface DarkModeLayoutProps {
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

export default function DarkModeLayout({
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
}: DarkModeLayoutProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  const filteredItems = menuItems.filter(item => item.available && item.category === activeCategory)

  return (
    <div className="min-h-full bg-black">
      {/* Gradient Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {restaurantName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-white font-bold text-lg">{restaurantName}</h1>
                {storeHours ? (
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {storeHours.isOpen !== false ? (
                      <span className="text-green-400">Open</span>
                    ) : (
                      <span className="text-red-400">Closed</span>
                    )}
                    <span className="text-gray-600">·</span>
                    <span>{storeHours.open} - {storeHours.close}</span>
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Premium Selection
                  </p>
                )}
              </div>
            </div>
            <button 
              className="relative px-4 py-2 rounded-full text-white font-medium text-sm"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              {cartCount}
            </button>
          </div>
        </div>
      </header>

      {/* Category Pills */}
      <div className="sticky top-[72px] z-10 bg-black/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                style={activeCategory === cat.id ? { 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const qty = getQty(item.id)
            return (
              <div
                key={item.id}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` }}
                    >
                      <span className="text-5xl">🍽️</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Price Badge */}
                  <div 
                    className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-white text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    ${item.price.toFixed(2)}
                  </div>

                  {/* Quantity Badge */}
                  {qty > 0 && (
                    <div 
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      {qty}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={() => onRemoveFromCart(item.id)}
                            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center transition-all hover:bg-white/20"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-medium w-5 text-center">{qty}</span>
                          <button
                            onClick={() => onAddToCart(item.id)}
                            className="flex-shrink-0 w-9 h-9 rounded-xl text-white flex items-center justify-center transition-transform hover:scale-110"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onAddToCart(item.id)}
                          className="flex-shrink-0 w-10 h-10 rounded-xl text-white flex items-center justify-center transition-transform hover:scale-110"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No items in this category</p>
          </div>
        )}
      </div>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4">
          <div className="max-w-5xl mx-auto">
            <button
              className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-4 shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>View Cart ({cartCount})</span>
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
