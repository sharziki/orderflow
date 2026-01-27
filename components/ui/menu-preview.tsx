'use client'

import { useState } from 'react'
import { X, ShoppingCart, Plus, Minus, Clock, MapPin, Phone, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  available: boolean
}

interface Category {
  id: string
  name: string
}

interface MenuPreviewProps {
  template: 'modern' | 'classic' | 'bold' | 'compact'
  restaurantName: string
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  onClose: () => void
}

export function MenuPreview({
  template,
  restaurantName,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  onClose
}: MenuPreviewProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [cart, setCart] = useState<{id: string, qty: number}[]>([])

  const filteredItems = menuItems.filter(item => item.available && item.category === activeCategory)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const addToCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id)
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { id, qty: 1 }]
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900">Live Preview</h2>
            <p className="text-sm text-slate-500">
              {template.charAt(0).toUpperCase() + template.slice(1)} Template • {menuItems.length} items
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg border p-1">
              <button className="px-3 py-1.5 text-sm rounded-md bg-slate-100 text-slate-900">Desktop</button>
              <button className="px-3 py-1.5 text-sm rounded-md text-slate-500">Tablet</button>
              <button className="px-3 py-1.5 text-sm rounded-md text-slate-500">Mobile</button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
            
            {/* MODERN TEMPLATE */}
            {template === 'modern' && (
              <div>
                {/* Header */}
                <div 
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">
                      {restaurantName.charAt(0)}
                    </div>
                    <span className="text-white font-semibold text-lg">{restaurantName}</span>
                  </div>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{cartCount}</span>
                  </button>
                </div>

                {/* Hero */}
                <div 
                  className="h-48 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` }}
                >
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{restaurantName}</h1>
                    <p className="text-slate-600">Fresh food, made with love</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="px-6 py-4 border-b overflow-x-auto">
                  <div className="flex gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                          activeCategory === cat.id
                            ? "text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                        style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Grid */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white border rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div 
                        className="h-32 rounded-lg mb-3 flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}10` }}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-4xl">🍽️</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold" style={{ color: primaryColor }}>${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CLASSIC TEMPLATE */}
            {template === 'classic' && (
              <div>
                {/* Header */}
                <div 
                  className="px-6 py-5 text-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <h1 className="text-2xl font-serif font-bold text-white">{restaurantName}</h1>
                  <div className="flex items-center justify-center gap-4 mt-2 text-white/80 text-sm">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 123 Main St</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> (555) 123-4567</span>
                  </div>
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-56 border-r bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Menu</h3>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors",
                          activeCategory === cat.id
                            ? "text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                        style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Items */}
                  <div className="flex-1 p-6">
                    <h2 className="text-xl font-serif font-bold text-slate-900 mb-4 pb-2 border-b">
                      {categories.find(c => c.id === activeCategory)?.name}
                    </h2>
                    <div className="space-y-4">
                      {filteredItems.map(item => (
                        <div key={item.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                          <div 
                            className="w-24 h-24 rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}15` }}
                          >
                            <span className="text-3xl">🍽️</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                              </div>
                              <span className="font-bold text-lg" style={{ color: primaryColor }}>
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-medium"
                              style={{ backgroundColor: secondaryColor }}
                            >
                              Add to Order
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOLD TEMPLATE */}
            {template === 'bold' && (
              <div className="bg-slate-900">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
                  <span className="text-white font-bold text-xl">{restaurantName}</span>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{cartCount} items</span>
                  </button>
                </div>

                {/* Hero */}
                <div 
                  className="h-56 flex items-end p-8"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{restaurantName}</h1>
                    <p className="text-white/80">Order online for pickup or delivery</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="p-6 grid grid-cols-4 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "p-4 rounded-xl text-center transition-all",
                        activeCategory === cat.id
                          ? "ring-2 ring-offset-2 ring-offset-slate-900"
                          : "bg-white/5 hover:bg-white/10"
                      )}
                      style={activeCategory === cat.id ? { backgroundColor: primaryColor, ringColor: primaryColor } : {}}
                    >
                      <span className="text-2xl mb-2 block">
                        {cat.name === 'Appetizers' ? '🥗' : cat.name === 'Main Courses' ? '🍝' : cat.name === 'Desserts' ? '🍰' : '🍹'}
                      </span>
                      <span className={cn("font-medium", activeCategory === cat.id ? "text-white" : "text-white/70")}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Items */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors group cursor-pointer"
                      onClick={() => addToCart(item.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-20 h-20 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}30` }}
                        >
                          <span className="text-3xl">🍽️</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{item.name}</h3>
                          <p className="text-sm text-white/50 line-clamp-1">{item.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold" style={{ color: primaryColor }}>${item.price.toFixed(2)}</span>
                            <Plus className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPACT TEMPLATE */}
            {template === 'compact' && (
              <div className="max-w-md mx-auto bg-white">
                {/* Header */}
                <div 
                  className="px-4 py-3 flex items-center justify-between sticky top-0 z-10"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white font-semibold">{restaurantName}</span>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>25-35 min</span>
                  </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b">
                  <input
                    type="text"
                    placeholder="Search menu..."
                    className="w-full px-4 py-2.5 bg-slate-100 rounded-lg text-sm"
                  />
                </div>

                {/* Categories Scroll */}
                <div className="px-3 py-2 border-b overflow-x-auto">
                  <div className="flex gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
                          activeCategory === cat.id
                            ? "text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                        style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y">
                  {filteredItems.map(item => (
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <span className="text-2xl">🍽️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                        <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bottom Cart Bar */}
                {cartCount > 0 && (
                  <div 
                    className="sticky bottom-0 p-3 text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{cartCount} items</span>
                        <span className="text-white/70 ml-2">in cart</span>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg">
                        View Cart <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
