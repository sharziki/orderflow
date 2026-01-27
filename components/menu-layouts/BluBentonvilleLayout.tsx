'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Plus, ShoppingCart } from 'lucide-react'
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

interface BluBentonvilleLayoutProps {
  restaurantName: string
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  cart: { id: string; qty: number }[]
  onAddToCart: (id: string) => void
}

// Item-specific hover images based on keywords in the name
const getHoverImageForItem = (name: string): string => {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('roll') || nameLower.includes('maki')) {
    return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('salmon')) {
    return "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('pizza')) {
    return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('burger')) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('salad')) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('pasta')) {
    return "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('wing')) {
    return "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('taco')) {
    return "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('chicken')) {
    return "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('steak') || nameLower.includes('beef')) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('soup')) {
    return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('dessert') || nameLower.includes('cake')) {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=600&fit=crop"
  }
  
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop"
}

function MenuCard({ 
  item, 
  primaryColor, 
  onAddToCart 
}: { 
  item: MenuItem
  primaryColor: string
  onAddToCart: (id: string) => void 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const secondaryImage = useMemo(() => getHoverImageForItem(item.name), [item.name])

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Hover Swap */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {item.image ? (
          <>
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <Image
                src={secondaryImage}
                alt={`${item.name} - alternate view`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </>
        ) : (
          <div 
            className="flex items-center justify-center h-full"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <span className="text-5xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {item.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div 
            className="text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            ${item.price.toFixed(2)}
          </div>
          <button
            onClick={() => onAddToCart(item.id)}
            className="inline-flex items-center justify-center w-10 h-10 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BluBentonvilleLayout({
  restaurantName,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart
}: BluBentonvilleLayoutProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const filteredItems = menuItems.filter(item => item.available && item.category === activeCategory)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <header 
        className="sticky top-0 z-20 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {restaurantName.charAt(0)}
            </div>
            <span className="text-white font-semibold text-xl">{restaurantName}</span>
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: secondaryColor }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <div 
        className="h-48 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurantName}</h1>
          <p className="text-gray-600">Fresh food, made with love</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="sticky top-[72px] z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeCategory === cat.id
                    ? "text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              primaryColor={primaryColor}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No items in this category yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
