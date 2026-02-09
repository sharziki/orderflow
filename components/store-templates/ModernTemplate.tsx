'use client'

import { ShoppingCart, Plus, Minus, X, Clock, MapPin, Phone, ChevronRight, History } from 'lucide-react'
import { StoreTemplateProps } from './types'
import { HoverImageGallery } from './HoverImageGallery'

export function ModernTemplate({
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
  onOpenRecentOrders,
}: StoreTemplateProps) {
  // Calculate cart total including modifier prices
  const cartTotal = cart.reduce((sum, c) => {
    const itemPrice = c.menuItem.price
    const modifiersPrice = (c.selectedModifiers || []).reduce((mSum, mod) => mSum + mod.price, 0)
    return sum + (itemPrice + modifiersPrice) * c.quantity
  }, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)
  const primaryColor = store.primaryColor || '#2563eb'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header 
        className="text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Logo/Initial */}
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold overflow-hidden">
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
                {onOpenRecentOrders && (
                  <button
                    onClick={onOpenRecentOrders}
                    className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                  >
                    <History className="w-4 h-4" />
                    Recent Orders
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
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
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
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
      <div 
        ref={navRef}
        className="sticky top-0 bg-white shadow-sm z-20"
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

      {/* Menu Sections - 2x2 Grid on Mobile */}
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
            {/* Mobile: 2x2 grid, Desktop: single column list */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
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
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
                          <p className="font-bold text-base" style={{ color: primaryColor }}>
                            ${item.price.toFixed(2)}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenItemModal?.(item); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Row Layout */}
                    <div className="hidden sm:flex p-4 justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        <p className="font-bold mt-2" style={{ color: primaryColor }}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {allImages.length > 0 && (
                          <HoverImageGallery
                            images={allImages}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg bg-slate-100"
                          />
                        )}
                        {inCartCount > 0 ? (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {inCartCount}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenItemModal?.(item); }}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={goToCheckout}
              className="w-full py-4 rounded-2xl text-white font-bold shadow-xl flex items-center justify-between px-6"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
              </div>
              <span>${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
