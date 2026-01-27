'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import OrderModal from '@/components/OrderModal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Clock,
  MapPin,
  Phone,
  Truck,
  Store,
  ChevronRight,
  Search,
  Utensils,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string | null
  options: any
  calories: number | null
}

interface Category {
  id: string
  name: string
  menuItems: MenuItem[]
}

interface StoreInfo {
  id: string
  name: string
  slug: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  logo: string | null
  template: string
  primaryColor: string
  secondaryColor: string
  pickupEnabled: boolean
  deliveryEnabled: boolean
  taxRate: number
  deliveryFee: number
  minOrderAmount: number
  isOpen: boolean
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  options: any[]
  specialRequests: string
}

export default function StorePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [showCheckout, setShowCheckout] = useState(false)
  
  // Fetch store data
  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch(`/api/store/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Restaurant not found')
          } else {
            setError('Failed to load restaurant')
          }
          return
        }
        const data = await res.json()
        setStore(data.store)
        setCategories(data.categories)
        
        // Set default order type
        if (data.store.pickupEnabled) {
          setOrderType('pickup')
        } else if (data.store.deliveryEnabled) {
          setOrderType('delivery')
        }
      } catch (err) {
        setError('Failed to load restaurant')
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) fetchStore()
  }, [slug])
  
  // Filter items
  const filteredCategories = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      menuItems: cat.menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(cat => 
      (!selectedCategory || cat.id === selectedCategory) && 
      cat.menuItems.length > 0
    )
  }, [categories, searchQuery, selectedCategory])
  
  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) {
        return prev.map(c => 
          c.menuItem.id === item.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, { menuItem: item, quantity: 1, options: [], specialRequests: '' }]
    })
  }
  
  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(c =>
          c.menuItem.id === itemId
            ? { ...c, quantity: c.quantity - 1 }
            : c
        )
      }
      return prev.filter(c => c.menuItem.id !== itemId)
    })
  }
  
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  }, [cart])
  
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])
  
  const tax = store ? cartTotal * (store.taxRate / 100) : 0
  const deliveryFee = orderType === 'delivery' && store ? store.deliveryFee : 0
  const orderTotal = cartTotal + tax + deliveryFee
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }
  
  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h1>
          <p className="text-slate-600">{error || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: store.primaryColor }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{store.name}</h1>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Badge variant={store.isOpen ? 'default' : 'secondary'} className="text-xs">
                    {store.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                  <span>{store.city}, {store.state}</span>
                </div>
              </div>
            </div>
            
            {/* Cart Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              className="gap-2 bg-white text-slate-900 hover:bg-white/90"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Order Type Toggle */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {store.pickupEnabled && (
              <Button
                variant={orderType === 'pickup' ? 'default' : 'outline'}
                onClick={() => setOrderType('pickup')}
                className="gap-2"
              >
                <Store className="w-4 h-4" />
                Pickup
              </Button>
            )}
            {store.deliveryEnabled && (
              <Button
                variant={orderType === 'delivery' ? 'default' : 'outline'}
                onClick={() => setOrderType('delivery')}
                className="gap-2"
              >
                <Truck className="w-4 h-4" />
                Delivery
                {store.deliveryFee > 0 && (
                  <span className="text-xs opacity-70">+${store.deliveryFee.toFixed(2)}</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      {/* Categories Nav */}
      <div className="bg-white border-b sticky top-[73px] z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-2 overflow-x-auto">
            <Button
              variant={selectedCategory === null ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
              size="sm"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                onClick={() => setSelectedCategory(cat.id)}
                className="whitespace-nowrap"
                size="sm"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Menu */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No items found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <h2 className="text-xl font-bold text-slate-900 mb-4">{category.name}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.menuItems.map(item => {
                    const inCart = cart.find(c => c.menuItem.id === item.id)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Card className="overflow-hidden h-full">
                          {item.image && (
                            <div className="h-40 bg-slate-100 relative">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-slate-900">{item.name}</h3>
                              <span className="font-bold" style={{ color: store.primaryColor }}>
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                {item.description}
                              </p>
                            )}
                            {inCart ? (
                              <div className="flex items-center justify-between">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="font-semibold">{inCart.quantity}</span>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  style={{ backgroundColor: store.primaryColor }}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                className="w-full"
                                onClick={() => addToCart(item)}
                                style={{ backgroundColor: store.primaryColor }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold">Your Order</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Your cart is empty</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.map(item => (
                      <div key={item.menuItem.id} className="flex gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.menuItem.name}</p>
                          <p className="text-sm text-slate-500">
                            ${item.menuItem.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(item.menuItem.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => addToCart(item.menuItem)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax ({store.taxRate}%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                    
                    {store.minOrderAmount > 0 && cartTotal < store.minOrderAmount && (
                      <p className="text-sm text-amber-600">
                        Minimum order: ${store.minOrderAmount.toFixed(2)}
                      </p>
                    )}
                    
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={cartTotal < (store.minOrderAmount || 0)}
                      style={{ backgroundColor: store.primaryColor }}
                      onClick={() => setShowCheckout(true)}
                    >
                      Checkout • ${orderTotal.toFixed(2)}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Checkout Modal */}
      <OrderModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart.map(item => ({
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description || '',
          price: item.menuItem.price,
          category: '',
          quantity: item.quantity
        }))}
        onUpdateCart={(newCart) => {
          // Transform back if needed - for now just close modal on changes
          setCart(prev => prev.map(item => {
            const updated = newCart.find(c => c.id === item.menuItem.id)
            return updated ? { ...item, quantity: updated.quantity } : item
          }).filter(item => {
            const inNewCart = newCart.find(c => c.id === item.menuItem.id)
            return inNewCart && inNewCart.quantity > 0
          }))
        }}
        total={orderTotal}
        preselectedOrderType={orderType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
      />
    </div>
  )
}
