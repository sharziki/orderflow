'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ShoppingCart, Plus, Minus, X, Clock, MapPin, Phone, ChevronRight, Loader2 } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
}

interface Category {
  id: string
  name: string
  menuItems: MenuItem[]
}

interface Store {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  logo: string | null
  primaryColor: string
  template: string
  pickupEnabled: boolean
  deliveryEnabled: boolean
  taxRate: number
  isOpen: boolean
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
}

const THEMES: Record<string, { font: string; radius: string; button: string }> = {
  modern: { font: 'font-sans', radius: 'rounded-xl', button: 'rounded-lg' },
  classic: { font: 'font-serif', radius: 'rounded-md', button: 'rounded-md' },
  bold: { font: 'font-sans', radius: 'rounded-2xl', button: 'rounded-full' },
  minimal: { font: 'font-sans', radius: 'rounded-none', button: 'rounded-sm' },
}

export default function StorePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

  const theme = THEMES[store?.template || 'modern'] || THEMES.modern
  const primaryColor = store?.primaryColor || '#2563eb'

  useEffect(() => {
    fetchStore()
  }, [slug])

  // Scroll spy for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200
      
      for (const category of categories) {
        const el = categoryRefs.current[category.id]
        if (el) {
          const top = el.offsetTop
          const bottom = top + el.offsetHeight
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveCategory(category.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [categories])

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/store/${slug}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Restaurant not found')
        } else {
          setError('Failed to load store')
        }
        setLoading(false)
        return
      }
      
      const data = await res.json()
      setStore(data.store)
      setCategories(data.categories || [])
      if (data.categories?.length > 0) {
        setActiveCategory(data.categories[0].id)
      }
    } catch (err) {
      setError('Failed to load store')
    } finally {
      setLoading(false)
    }
  }

  const scrollToCategory = (categoryId: string) => {
    const el = categoryRefs.current[categoryId]
    if (el) {
      const navHeight = navRef.current?.offsetHeight || 0
      window.scrollTo({
        top: el.offsetTop - navHeight - 20,
        behavior: 'smooth'
      })
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItem.id === itemId) {
          const newQty = c.quantity + delta
          return newQty > 0 ? { ...c, quantity: newQty } : c
        }
        return c
      }).filter(c => c.quantity > 0)
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Restaurant not found</h1>
          <p className="text-slate-600">This store doesn't exist or is not available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${theme.font}`}>
      {/* Header */}
      <header 
        className="text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Logo/Initial */}
            <div className={`w-16 h-16 bg-white/20 ${theme.radius} flex items-center justify-center text-2xl font-bold`}>
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                store.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <div className="flex items-center gap-4 text-white/80 text-sm mt-1">
                {store.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {store.address}
                  </span>
                )}
                {store.isOpen ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Open now
                  </span>
                ) : (
                  <span className="text-white/60">Closed</span>
                )}
              </div>
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 py-3 ${theme.radius} font-semibold transition-all ${
                orderType === 'pickup'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span className="block text-sm">Pickup</span>
              <span className="block text-xs opacity-70">15-20 min</span>
            </button>
            {store.deliveryEnabled && (
              <button
                onClick={() => setOrderType('delivery')}
                className={`flex-1 py-3 ${theme.radius} font-semibold transition-all ${
                  orderType === 'delivery'
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span className="block text-sm">Delivery</span>
                <span className="block text-xs opacity-70">30-45 min</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sticky Category Nav */}
      <nav 
        ref={navRef}
        className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-sm"
      >
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`px-4 py-2 ${theme.button} font-medium text-sm whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={activeCategory === category.id ? { backgroundColor: primaryColor } : {}}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menu Items */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {categories.map((category) => (
          <div 
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">{category.name}</h2>
            <div className="space-y-3">
              {category.menuItems.map((item) => (
                <div 
                  key={item.id}
                  className={`bg-white border border-slate-200 ${theme.radius} p-4 flex justify-between items-start hover:shadow-md transition-shadow`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="font-bold mt-2" style={{ color: primaryColor }}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className={`w-10 h-10 flex items-center justify-center text-white ${theme.button} flex-shrink-0 hover:opacity-90 transition-opacity`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {category.menuItems.length === 0 && (
                <p className="text-slate-400 text-sm italic py-4">No items in this category</p>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-4 text-white font-semibold ${theme.radius} shadow-xl flex items-center gap-4 hover:opacity-90 transition-all z-50`}
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
          </div>
          <span className="border-l border-white/30 pl-4">
            ${cartTotal.toFixed(2)}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Slide-out Cart */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setCartOpen(false)}
          />
          
          {/* Cart Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Your Order</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menuItem.id} className="flex items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{item.menuItem.name}</h4>
                        <p className="text-sm text-slate-500">${item.menuItem.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-4 space-y-4">
                {/* Order Type */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderType('pickup')}
                    className={`flex-1 py-2 ${theme.button} text-sm font-medium transition-all ${
                      orderType === 'pickup'
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                    style={orderType === 'pickup' ? { backgroundColor: primaryColor } : {}}
                  >
                    Pickup
                  </button>
                  {store.deliveryEnabled && (
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={`flex-1 py-2 ${theme.button} text-sm font-medium transition-all ${
                        orderType === 'delivery'
                          ? 'text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      style={orderType === 'delivery' ? { backgroundColor: primaryColor } : {}}
                    >
                      Delivery
                    </button>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax ({((store.taxRate || 0) * 100).toFixed(2)}%)</span>
                    <span className="font-medium">${(cartTotal * (store.taxRate || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      ${(cartTotal * (1 + (store.taxRate || 0))).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className={`w-full py-4 text-white font-semibold ${theme.radius} hover:opacity-90 transition-opacity`}
                  style={{ backgroundColor: primaryColor }}
                >
                  Checkout • ${(cartTotal * (1 + (store.taxRate || 0))).toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </>
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
