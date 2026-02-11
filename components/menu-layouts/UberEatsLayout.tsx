'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingBag, Plus, Minus, Clock, Star, ChevronDown } from 'lucide-react'

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

interface UberEatsLayoutProps {
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

export default function UberEatsLayout({
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
}: UberEatsLayoutProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '')
  const [isCategoryBarSticky, setIsCategoryBarSticky] = useState(false)
  const categoryBarRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find(m => m.id === cartItem.id)
    return sum + (item ? item.price * cartItem.qty : 0)
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.available && item.category === categoryId)
  }

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    const element = sectionRefs.current[categoryId]
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  // Handle sticky category bar
  useEffect(() => {
    const handleScroll = () => {
      if (categoryBarRef.current) {
        const rect = categoryBarRef.current.getBoundingClientRect()
        setIsCategoryBarSticky(rect.top <= 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection observer for active category
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace('uber-section-', ''))
          }
        })
      },
      { rootMargin: '-100px 0px -60% 0px' }
    )

    categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [categories])

  return (
    <div className="min-h-full bg-white">
      {/* Hero Header */}
      <header className="relative bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            {logoUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border-4 border-white">
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{restaurantName}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span className="font-medium">4.8</span>
                  <span className="text-gray-400">(200+)</span>
                </div>
                <span className="text-gray-300">•</span>
                <span>$$</span>
                <span className="text-gray-300">•</span>
                <span>American</span>
              </div>
              {storeHours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {storeHours.isOpen !== false ? (
                    <span className="text-green-600 font-medium">Open now</span>
                  ) : (
                    <span className="text-red-500">Closed</span>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{storeHours.open} – {storeHours.close}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Category Bar */}
      <div 
        ref={categoryBarRef}
        className={`bg-white border-b border-gray-100 z-30 transition-shadow ${
          isCategoryBarSticky ? 'sticky top-0 shadow-md' : ''
        }`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((category, idx) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {categories.map((category) => {
          const items = getItemsForCategory(category.id)
          if (items.length === 0) return null

          return (
            <section 
              key={category.id}
              id={`uber-section-${category.id}`}
              ref={(el) => { sectionRefs.current[category.id] = el }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                <span className="text-sm text-gray-500">{items.length} items</span>
              </div>

              {/* Large Image Grid - UberEats Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const qty = getQty(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => onOpenItemModal?.(item)}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      {/* Large Hero Image */}
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag className="w-12 h-12" />
                          </div>
                        )}
                        
                        {/* Quick Add Button Overlay */}
                        <div 
                          className="absolute bottom-3 right-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {qty > 0 ? (
                            <div className="flex items-center gap-1 bg-white rounded-full shadow-lg px-1 py-1">
                              <button
                                onClick={() => onRemoveFromCart(item.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center font-bold text-sm">{qty}</span>
                              <button
                                onClick={() => onAddToCart(item.id)}
                                className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onAddToCart(item.id)}
                              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <Plus className="w-5 h-5" style={{ color: primaryColor }} />
                            </button>
                          )}
                        </div>

                        {/* Quantity Badge */}
                        {qty > 0 && (
                          <div 
                            className="absolute top-3 left-3 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {qty}
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 leading-tight flex-1">
                            {item.name}
                          </h3>
                          <span className="font-bold text-gray-900 flex-shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Bottom Cart Bar - Uber Style */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8">
          <div className="max-w-lg mx-auto">
            <button
              className="w-full py-4 px-6 rounded-xl text-white font-bold flex items-center justify-between shadow-2xl transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: '#000' }}
            >
              <div className="flex items-center gap-3">
                <span 
                  className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </span>
                <span>View cart</span>
              </div>
              <span className="text-lg">${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
