'use client'

import { ShoppingCart, Plus, Minus, X, Clock, MapPin, Phone, ChevronRight } from 'lucide-react'
import { StoreTemplateProps } from './types'

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
}: StoreTemplateProps) {
  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)
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

      {/* Menu Sections */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {categories.map((category) => (
          <div
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">{category.name}</h2>
            <div className="grid gap-4">
              {category.menuItems.map((item) => {
                const inCart = cart.find(c => c.menuItem.id === item.id)
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start"
                  >
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
                      {item.image && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {inCart ? (
                        <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-semibold">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
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
