'use client'

import { ShoppingCart, Plus, Minus, X, Clock, MapPin, Phone, ChevronRight, Star, Percent } from 'lucide-react'
import { StoreTemplateProps } from './types'
import { HoverImageGallery } from './HoverImageGallery'

export function SliceTemplate({
  store,
  categories,
  cart,
  cartOpen,
  orderType,
  activeCategory,
  setCartOpen,
  setOrderType,
  setActiveCategory,
  addToCart,
  updateQuantity,
  removeFromCart,
  scrollToCategory,
  goToCheckout,
  categoryRefs,
  navRef,
  onOpenItemModal,
  onEditCartItem,
}: StoreTemplateProps) {
  // Calculate cart total including modifier prices
  const cartTotal = cart.reduce((sum, c) => {
    const itemPrice = c.menuItem.price
    const modifiersPrice = (c.selectedModifiers || []).reduce((mSum, mod) => mSum + mod.price, 0)
    return sum + (itemPrice + modifiersPrice) * c.quantity
  }, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)
  const primaryColor = store.primaryColor || '#dc2626'

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div 
        className="h-48 md:h-64 relative"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Could add hero image here */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Back button / branding */}
        <div className="absolute top-4 left-4">
          <span className="text-white/80 text-sm font-medium">Powered by DerbyFlow</span>
        </div>

        {/* Discount Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
            <Percent className="w-4 h-4" />
            5% off online orders
          </div>
        </div>
      </div>

      {/* Store Info Card - overlapping hero */}
      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{store.name}</h1>
              <p className="text-slate-500 text-sm mt-1">Pizza • Italian • Wings</p>
              
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1 text-slate-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-slate-400">(120+)</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className={`font-medium ${store.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                  {store.isOpen ? 'Open' : 'Closed'}
                </span>
                {store.address && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 truncate">{store.address}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Type Tabs */}
          <div className="flex gap-2 mt-6 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                orderType === 'pickup'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="block">Pickup</span>
              <span className="block text-xs text-slate-500 font-normal">15-20 min</span>
            </button>
            {store.deliveryEnabled && (
              <button
                onClick={() => setOrderType('delivery')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  orderType === 'delivery'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="block">Delivery</span>
                <span className="block text-xs text-slate-500 font-normal">30-45 min</span>
              </button>
            )}
          </div>

          {/* Delivery Info */}
          {orderType === 'delivery' && store.deliveryEnabled && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Delivery fee</span>
                <span className="font-semibold">${store.deliveryFee.toFixed(2)}</span>
              </div>
              {store.minOrderAmount > 0 && (
                <div className="flex justify-between text-slate-600 mt-1">
                  <span>Minimum order</span>
                  <span className="font-semibold">${store.minOrderAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Category Nav */}
      <div 
        ref={navRef}
        className="sticky top-0 bg-white border-b border-slate-200 z-20 mt-6"
      >
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Sections - 2x2 on mobile */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {categories.map((category) => (
          <div
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-1">{category.name}</h2>
            {category.description && (
              <p className="text-slate-500 text-sm mb-4">{category.description}</p>
            )}
            {!category.description && <div className="mb-4" />}
            {/* 2x2 on mobile, list on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              {category.menuItems.map((item) => {
                // Count total quantity of this item across all cart entries
                const inCartCount = cart.filter(c => c.menuItem.id === item.id).reduce((sum, c) => sum + c.quantity, 0)
                // Collect all images: prefer images array, fallback to single image
                const allImages = item.images && item.images.length > 0 
                  ? item.images 
                  : (item.image ? [item.image] : [])
                return (
                  <div
                    key={item.id}
                    onClick={() => onOpenItemModal?.(item)}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                  >
                    {/* Mobile Card Layout */}
                    <div className="sm:hidden">
                      {allImages.length > 0 && (
                        <div className="relative aspect-square bg-slate-100">
                          <HoverImageGallery
                            images={allImages}
                            alt={item.name}
                            className="w-full h-full"
                          />
                          {inCartCount > 0 && (
                            <div 
                              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {inCartCount}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{item.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-base" style={{ color: primaryColor }}>
                            ${item.price.toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenItemModal?.(item); }}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold active:scale-95 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Row Layout */}
                    <div className="hidden sm:flex p-4 gap-4">
                      {/* Item Image with hover cycling */}
                      {allImages.length > 0 && (
                        <div className="relative">
                          <HoverImageGallery
                            images={allImages}
                            alt={item.name}
                            className="w-24 h-24 rounded-lg flex-shrink-0 bg-slate-100"
                          />
                          {inCartCount > 0 && (
                            <div 
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {inCartCount}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold" style={{ color: primaryColor }}>
                            ${item.price.toFixed(2)}
                          </span>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenItemModal?.(item); }}
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {inCartCount > 0 ? 'Edit' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={goToCheckout}
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>View Cart ({cartCount})</span>
              <span className="ml-auto">${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
