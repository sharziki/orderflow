'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Clock, 
  MapPin, 
  Phone,
  ChevronRight,
  Search,
  Truck,
  Store as StoreIcon
} from 'lucide-react'
import { StoreTemplateProps } from './types'
import AddressPicker from '@/components/AddressPicker'
import { HoverImageGallery } from './HoverImageGallery'
import CustomCTA from '@/components/CustomCTA'
import MenuSelector from '@/components/MenuSelector'

export function BluBentonvilleTemplate({
  store,
  categories,
  menus = [],
  selectedMenuId,
  onMenuChange,
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
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLat, setDeliveryLat] = useState<number>()
  const [deliveryLng, setDeliveryLng] = useState<number>()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Calculate cart total including modifier prices
  const cartTotal = cart.reduce((sum, c) => {
    const itemPrice = c.menuItem.price
    const modifiersPrice = (c.selectedModifiers || []).reduce((mSum, mod) => mSum + mod.price, 0)
    return sum + (itemPrice + modifiersPrice) * c.quantity
  }, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)
  const primaryColor = store.primaryColor || '#1a4fff'
  const secondaryColor = store.secondaryColor || '#9eff3e'

  // Filter items by search
  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        menuItems: cat.menuItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.menuItems.length > 0)
    : categories

  // Save delivery address to localStorage
  useEffect(() => {
    if (deliveryAddress) {
      localStorage.setItem(`deliveryAddress_${store.slug}`, JSON.stringify({
        address: deliveryAddress,
        lat: deliveryLat,
        lng: deliveryLng
      }))
    }
  }, [deliveryAddress, deliveryLat, deliveryLng, store.slug])

  // Load delivery address from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`deliveryAddress_${store.slug}`)
    if (saved) {
      try {
        const { address, lat, lng } = JSON.parse(saved)
        setDeliveryAddress(address || '')
        setDeliveryLat(lat)
        setDeliveryLng(lng)
      } catch {}
    }
  }, [store.slug])

  const handleAddressChange = (address: string, lat?: number, lng?: number) => {
    setDeliveryAddress(address)
    if (lat) setDeliveryLat(lat)
    if (lng) setDeliveryLng(lng)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <header className="relative">
        {/* Background gradient - Light theme */}
        <div 
          className="absolute inset-0 h-64"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, #4C75FF 100%)` 
          }}
        />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Restaurant Info */}
            <div className="flex items-start gap-5">
              {/* Logo */}
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-2xl shadow-xl overflow-hidden flex-shrink-0">
                {store.logo ? (
                  <img 
                    src={store.logo} 
                    alt={store.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-4xl lg:text-5xl font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {store.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="text-white pt-2">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">{store.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 text-sm">
                  {store.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {store.address}, {store.city}, {store.state}
                    </span>
                  )}
                  {store.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {store.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {store.isOpen ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-100 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Open now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-100 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-red-400 rounded-full" />
                      Closed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 flex gap-2">
              <button
                onClick={() => setOrderType('pickup')}
                className={`flex-1 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                  orderType === 'pickup'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <StoreIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Pickup</div>
                  <div className="text-xs opacity-70">15-20 min</div>
                </div>
              </button>
              {store.deliveryEnabled && (
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex-1 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    orderType === 'delivery'
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">Delivery</div>
                    <div className="text-xs opacity-70">30-45 min</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Delivery Address Input - Uses DoorDash API for validation */}
          {orderType === 'delivery' && store.deliveryEnabled && (
            <div className="mt-6 max-w-xl bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Delivery Address
              </label>
              <AddressPicker
                onAddressSelect={(address, country, coords) => {
                  setDeliveryAddress(address)
                  setDeliveryLat(coords.lat)
                  setDeliveryLng(coords.lng)
                }}
                initialValue={deliveryAddress}
                placeholder="Enter your delivery address"
                showValidationMessage={false}
              />
            </div>
          )}
        </div>
      </header>

      {/* Custom CTA Banner */}
      {store.ctaEnabled && store.ctaText && (
        <CustomCTA
          text={store.ctaText}
          subtext={store.ctaSubtext}
          link={store.ctaLink}
          buttonText={store.ctaButtonText}
          primaryColor={primaryColor}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Menu Selector (if multiple menus) */}
        {menus.length > 1 && onMenuChange && (
          <div className="mb-6">
            <MenuSelector
              menus={menus}
              selectedMenuId={selectedMenuId || null}
              onMenuChange={onMenuChange}
              primaryColor={primaryColor}
            />
          </div>
        )}
        <div className="flex gap-8">
          {/* Menu Column */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Sticky Category Nav */}
            <div 
              ref={navRef}
              className="sticky top-0 bg-white z-20 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm"
            >
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Sections - 2x2 on mobile */}
            <div className="py-6 space-y-10">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  ref={(el) => { categoryRefs.current[category.id] = el }}
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600 text-sm sm:text-base mb-4">{category.description}</p>
                  )}
                  {!category.description && <div className="mb-4" />}
                  
                  {/* 2x2 grid on mobile, 2 cols on desktop */}
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
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
                          className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-400 cursor-pointer group flex flex-col sm:flex-row"
                        >
                          {/* Image */}
                          {allImages.length > 0 && (
                            <div className="relative">
                              <HoverImageGallery
                                images={allImages}
                                alt={item.name}
                                className="w-full aspect-square sm:w-28 sm:h-28 flex-shrink-0"
                              />
                              {/* In cart badge */}
                              {inCartCount > 0 && (
                                <div 
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                                  style={{ backgroundColor: '#9eff3e', color: '#000' }}
                                >
                                  {inCartCount}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 p-3 sm:p-4 flex flex-col">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-2">{item.name}</h3>
                              {item.description && (
                                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 hidden sm:block">{item.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 sm:mt-3">
                              <span 
                                className="font-bold text-base sm:text-lg"
                                style={{ color: primaryColor }}
                              >
                                ${item.price.toFixed(2)}
                              </span>
                              
                              {/* Mobile: Simple + button, Desktop: Show count or + */}
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenItemModal?.(item); }}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:block w-96 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div 
                className="p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #4C75FF 100%)` }}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="font-bold text-lg">Your Order</span>
                  {cartCount > 0 && (
                    <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
                      {cartCount} item{cartCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Your cart is empty</p>
                    <p className="text-sm mt-1 text-gray-400">Add items to get started</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {cart.map((item, index) => {
                      const itemPrice = item.menuItem.price
                      const modifiersPrice = (item.selectedModifiers || []).reduce((sum, mod) => sum + mod.price, 0)
                      const totalPrice = (itemPrice + modifiersPrice) * item.quantity
                      
                      return (
                        <div 
                          key={`${item.menuItem.id}-${index}`} 
                          className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors"
                          onClick={() => onEditCartItem?.(item, index)}
                        >
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, -1)}
                              className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, 1)}
                              className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.menuItem.name}</p>
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <p className="text-xs text-gray-500 truncate">
                                {item.selectedModifiers.map(m => m.optionName).join(', ')}
                              </p>
                            )}
                            {item.specialRequests && (
                              <p className="text-xs text-gray-400 italic truncate">{item.specialRequests}</p>
                            )}
                          </div>
                          <span className="font-semibold" style={{ color: primaryColor }}>
                            ${totalPrice.toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.menuItem.id); }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex justify-between text-lg font-bold mb-4 text-gray-900">
                    <span>Subtotal</span>
                    <span style={{ color: primaryColor }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={goToCheckout}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #4C75FF 100%)` }}
                  >
                    Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 lg:hidden z-30">
          <button
            onClick={goToCheckout}
            className="w-full py-4 rounded-2xl text-white font-bold shadow-2xl flex items-center justify-between px-6"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #4C75FF 100%)` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-lg font-bold">${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Uses existing AddressPicker component with DoorDash API integration
