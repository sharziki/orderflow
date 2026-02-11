'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, ShoppingCart, Clock, Star, Flame } from 'lucide-react'
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

interface StoreHours {
  open: string
  close: string
  isOpen?: boolean
}

interface BoldComboLayoutProps {
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
  onOpenItemModal?: (item: MenuItem) => void
}

function ComboCard({ 
  item, 
  primaryColor,
  secondaryColor,
  qty,
  onAddToCart,
  onRemoveFromCart,
  onOpenItemModal,
  isFeatured = false
}: { 
  item: MenuItem
  primaryColor: string
  secondaryColor: string
  qty: number
  onAddToCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
  onOpenItemModal?: (item: MenuItem) => void
  isFeatured?: boolean
}) {
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
        isFeatured ? "shadow-2xl ring-4" : "shadow-lg hover:shadow-xl"
      )}
      style={isFeatured ? { boxShadow: `0 0 0 4px ${primaryColor}` } : {}}
      onClick={() => onOpenItemModal?.(item)}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div 
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
          style={{ backgroundColor: primaryColor }}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          Most Popular
        </div>
      )}

      {/* Large Image */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200",
        isFeatured ? "h-72" : "h-56"
      )}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div 
            className="flex items-center justify-center h-full"
            style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` }}
          >
            <span className="text-7xl">🍗</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Price Badge */}
        <div 
          className="absolute bottom-4 right-4 px-4 py-2 rounded-xl text-white font-black text-2xl shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          ${item.price.toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className={cn(
          "font-black text-gray-900 mb-2 leading-tight",
          isFeatured ? "text-2xl" : "text-xl"
        )}>
          {item.name}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {item.description}
        </p>

        {/* Add to Cart Section */}
        <div className="flex items-center gap-3">
          {qty > 0 ? (
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.id); }}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center">{qty}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(item.id); }}
                className="w-12 h-12 rounded-xl text-white flex items-center justify-center transition-all hover:scale-105 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(item.id); }}
              className="flex-1 py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-5 h-5" />
              Add to Order
            </button>
          )}
        </div>
      </div>

      {/* Quantity Badge */}
      {qty > 0 && (
        <div 
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
          style={{ backgroundColor: secondaryColor }}
        >
          {qty}
        </div>
      )}
    </div>
  )
}

export default function BoldComboLayout({
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
}: BoldComboLayoutProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const filteredItems = menuItems.filter(item => item.available && item.category === activeCategory)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const menuItem = menuItems.find(m => m.id === cartItem.id)
    return sum + (menuItem?.price || 0) * cartItem.qty
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  return (
    <div 
      className="min-h-full"
      style={{ backgroundColor: '#f8f5f0' }}
    >
      {/* Bold Header */}
      <header 
        className="sticky top-0 z-20 shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 shadow-md">
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                <Flame className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
            )}
            <div>
              <span className="text-white font-black text-2xl tracking-tight block">{restaurantName}</span>
              {storeHours && (
                <span className="text-white/80 text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {storeHours.isOpen !== false ? 'Open' : 'Closed'} · {storeHours.open} - {storeHours.close}
                </span>
              )}
            </div>
          </div>
          
          {/* Cart Button */}
          <button 
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white text-gray-900 font-bold shadow-lg hover:scale-105 transition-transform"
          >
            <ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} />
            <span>{cartCount} items</span>
            {cartTotal > 0 && (
              <span className="px-3 py-1 rounded-lg text-white text-sm" style={{ backgroundColor: primaryColor }}>
                ${cartTotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div 
        className="py-12 text-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <h1 className="text-white text-5xl md:text-6xl font-black tracking-tight mb-3">ONE LOVE.</h1>
        <p className="text-white/90 text-xl">Quality you can taste in every bite</p>
      </div>

      {/* Category Tabs */}
      <div className="bg-white shadow-sm sticky top-[88px] z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-3 font-bold text-sm uppercase tracking-wide whitespace-nowrap transition-all rounded-lg",
                  activeCategory === cat.id
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items - Big Cards */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((item, index) => (
            <ComboCard
              key={item.id}
              item={item}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              qty={getQty(item.id)}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              onOpenItemModal={onOpenItemModal}
              isFeatured={index === 0}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🍗</span>
            <p className="text-gray-500 text-lg">No items in this category</p>
          </div>
        )}
      </div>

      {/* Fixed Cart Bar (Mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl md:hidden z-30">
          <button 
            className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="w-5 h-5" />
            View Order ({cartCount}) · ${cartTotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  )
}
