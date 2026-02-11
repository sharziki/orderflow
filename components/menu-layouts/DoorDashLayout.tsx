'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface DoorDashLayoutProps {
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

export default function DoorDashLayout({
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
}: DoorDashLayoutProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const categoryRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => 
      item.available && 
      item.category === categoryId &&
      (searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryRef.current) {
      const scrollAmount = 200
      categoryRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    const element = sectionRefs.current[categoryId]
    if (element) {
      const headerOffset = 140
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  // Intersection observer to update active category on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace('section-', ''))
          }
        })
      },
      { rootMargin: '-150px 0px -50% 0px' }
    )

    categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [categories])

  return (
    <div className="min-h-full bg-white">
      {/* DoorDash-style Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          {/* Top Row: Restaurant Info */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg text-gray-900">{restaurantName}</h1>
                {storeHours && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {storeHours.isOpen !== false ? (
                      <span className="text-green-600 font-medium">Open</span>
                    ) : (
                      <span className="text-gray-500">Closed</span>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{storeHours.open} - {storeHours.close}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <button 
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>${cartTotal.toFixed(2)}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full text-xs font-bold flex items-center justify-center shadow"
                  style={{ color: primaryColor }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Horizontal Scrolling Category Pills */}
          <div className="relative pb-3">
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div 
              ref={categoryRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => scrollToCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={activeCategory === category.id ? { backgroundColor: primaryColor } : {}}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {categories.map((category) => {
          const items = getItemsForCategory(category.id)
          if (items.length === 0) return null

          return (
            <section 
              key={category.id} 
              id={`section-${category.id}`}
              ref={(el) => { sectionRefs.current[category.id] = el }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
              
              {/* Compact Item Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item) => {
                  const qty = getQty(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => onOpenItemModal?.(item)}
                      className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-gray-700">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">
                            ${item.price.toFixed(2)}
                          </span>
                          
                          {/* Quick Add Buttons */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {qty > 0 ? (
                              <>
                                <button
                                  onClick={() => onRemoveFromCart(item.id)}
                                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                                <span className="w-6 text-center font-bold text-sm">{qty}</span>
                                <button
                                  onClick={() => onAddToCart(item.id)}
                                  className="w-7 h-7 rounded-full text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => onAddToCart(item.id)}
                                className="w-7 h-7 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                                style={{ borderColor: primaryColor, color: primaryColor }}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail */}
                      {item.image && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          {qty > 0 && (
                            <div 
                              className="absolute top-1 right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {qty}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <div className="max-w-lg mx-auto">
            <button
              className="w-full py-4 px-6 rounded-full text-white font-bold flex items-center justify-between shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">
                  {cartCount}
                </span>
                <span>View Cart</span>
              </span>
              <span className="text-lg">${cartTotal.toFixed(2)}</span>
            </button>
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
