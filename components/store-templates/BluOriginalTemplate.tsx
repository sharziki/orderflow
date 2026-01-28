'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ShoppingCart, Menu, X, Plus, Minus } from 'lucide-react'
import { StoreTemplateProps, MenuItem } from './types'
import LeftSidebar from '@/components/blu-template/LeftSidebar'
import AddressPicker from '@/components/AddressPicker'

// MenuItemCard component
function MenuItemCard({ 
  item, 
  onAddToCart,
  primaryColor,
  inCart,
  onUpdateQuantity
}: { 
  item: MenuItem
  onAddToCart: () => void
  primaryColor: string
  inCart?: number
  onUpdateQuantity: (delta: number) => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      {item.image && (
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
          {/* Quick add button overlay */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {inCart ? (
              <div className="flex items-center gap-2 bg-white rounded-full p-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(-1) }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold">{inCart}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(1) }}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAddToCart}
                className="px-6 py-2 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: primaryColor }}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span 
            className="font-bold text-lg"
            style={{ color: primaryColor }}
          >
            ${item.price.toFixed(2)}
          </span>
          {!item.image && (
            inCart ? (
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => onUpdateQuantity(-1)}
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-semibold text-sm">{inCart}</span>
                <button
                  onClick={() => onUpdateQuantity(1)}
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAddToCart}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-5 h-5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// Floating cart button
function FloatingCart({ 
  itemCount, 
  total,
  onClick,
  primaryColor
}: { 
  itemCount: number
  total: number
  onClick: () => void
  primaryColor: string
}) {
  if (itemCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-bold shadow-2xl hover:shadow-3xl transition-all"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold"
          style={{ color: primaryColor }}
        >
          {itemCount}
        </span>
      </div>
      <span>View Cart · ${total.toFixed(2)}</span>
    </button>
  )
}

// Delivery Address Modal
function DeliveryAddressModal({
  isOpen,
  onClose,
  onAddressConfirmed,
  onSwitchToPickup,
  primaryColor
}: {
  isOpen: boolean
  onClose: () => void
  onAddressConfirmed: (address: string, coords: { lat: number; lng: number }) => void
  onSwitchToPickup: () => void
  primaryColor: string
}) {
  const [selectedAddress, setSelectedAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  if (!isOpen) return null

  const handleAddressSelect = (address: string, country: string, coords: { lat: number; lng: number }) => {
    setSelectedAddress(address)
    setCoordinates(coords)
  }

  const handleContinue = () => {
    if (selectedAddress && coordinates) {
      onAddressConfirmed(selectedAddress, coordinates)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div>
            <h2 className="text-xl font-bold">Delivery Address</h2>
            <p className="text-sm text-white/80">Where should we deliver your order?</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AddressPicker
            onAddressSelect={handleAddressSelect}
            initialValue={selectedAddress}
            placeholder="Start typing your delivery address"
            showValidationMessage={true}
          />
        </div>

        {/* Footer */}
        <div className="border-t p-6 space-y-3">
          <button
            onClick={handleContinue}
            disabled={!selectedAddress}
            className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            Continue Shopping
          </button>
          <button
            onClick={onSwitchToPickup}
            className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Switch to Pickup Instead
          </button>
        </div>
      </div>
    </div>
  )
}

export function BluOriginalTemplate({
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeSection, setActiveSection] = useState('All')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const primaryColor = store.primaryColor || '#1e3a5f'

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  // Get all menu items flattened
  const allItems = useMemo(() => {
    return categories.flatMap(cat => 
      cat.menuItems.map(item => ({ ...item, category: cat.name }))
    )
  }, [categories])

  // Get unique category names
  const categoryNames = useMemo(() => {
    return ['All', ...categories.map(c => c.name)]
  }, [categories])

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [allItems, searchQuery, selectedCategory])

  // Group by category
  const itemsByCategory = useMemo(() => {
    if (selectedCategory !== 'All') {
      return { [selectedCategory]: filteredItems }
    }
    const grouped: { [key: string]: typeof filteredItems } = {}
    filteredItems.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    })
    return grouped
  }, [filteredItems, selectedCategory])

  // Handle order type change
  const handleOrderTypeChange = (type: 'pickup' | 'delivery') => {
    if (type === 'delivery' && !deliveryAddress) {
      setShowDeliveryModal(true)
    }
    setOrderType(type)
  }

  // Handle delivery address confirmed
  const handleDeliveryAddressConfirmed = (address: string, coords: { lat: number; lng: number }) => {
    setDeliveryAddress(address)
    setDeliveryCoordinates(coords)
    setOrderType('delivery')
    setShowDeliveryModal(false)
    // Save to localStorage
    localStorage.setItem(`deliveryAddress_${store.slug}`, JSON.stringify({ address, coords }))
  }

  // Load saved delivery address
  useEffect(() => {
    const saved = localStorage.getItem(`deliveryAddress_${store.slug}`)
    if (saved) {
      try {
        const { address, coords } = JSON.parse(saved)
        setDeliveryAddress(address)
        setDeliveryCoordinates(coords)
      } catch {}
    }
  }, [store.slug])

  // Intersection observer for section tracking
  useEffect(() => {
    if (selectedCategory !== 'All') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const category = entry.target.getAttribute('data-category')
            if (category) setActiveSection(category)
          }
        })
      },
      { rootMargin: '-100px 0px -70% 0px' }
    )

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [selectedCategory, itemsByCategory])

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Layout */}
      <div className="relative min-h-screen">
        {/* Left Sidebar - Always visible on tablet/desktop (md+), slide-in on mobile */}
        <div className={`
          fixed top-0 left-0 h-screen z-40 w-80
          transform transition-transform duration-300 ease-in-out bg-white
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <LeftSidebar
            store={{
              name: store.name,
              logo: store.logo,
              phone: store.phone,
              address: store.address,
              city: store.city,
              state: store.state,
              isOpen: store.isOpen,
              primaryColor,
              deliveryEnabled: store.deliveryEnabled,
            }}
            categories={categoryNames}
            selectedCategory={selectedCategory}
            activeSection={activeSection}
            onCategoryChange={setSelectedCategory}
            onCategoryClick={(cat) => {
              if (cat === 'All') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                const section = sectionRefs.current[cat]
                if (section) {
                  const y = section.getBoundingClientRect().top + window.pageYOffset - 150
                  window.scrollTo({ top: y, behavior: 'smooth' })
                }
              }
              setIsMobileSidebarOpen(false)
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            orderType={orderType}
            onOrderTypeChange={handleOrderTypeChange}
            deliveryAddress={deliveryAddress}
            onEditDeliveryAddress={() => setShowDeliveryModal(true)}
          />
        </div>

        {/* Main Content */}
        <main className="p-4 sm:p-6 md:p-8 md:ml-80">
          {/* Section Header */}
          <div className="mb-8 sticky top-0 bg-gray-50 py-4 z-30 border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {selectedCategory === 'All' ? (activeSection !== 'All' ? activeSection : 'Menu') : selectedCategory}
            </h2>
            <p className="text-sm text-gray-600">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Product Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found matching your search.</p>
            </div>
          ) : selectedCategory !== 'All' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const inCart = cart.find(c => c.menuItem.id === item.id)
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => addToCart(item)}
                    primaryColor={primaryColor}
                    inCart={inCart?.quantity}
                    onUpdateQuantity={(delta) => updateQuantity(item.id, delta)}
                  />
                )
              })}
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="relative">
                  <div
                    ref={(el) => { sectionRefs.current[category] = el }}
                    data-category={category}
                    className="absolute -top-32 h-1 w-full"
                  />
                  <h3 
                    className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2"
                    style={{ borderColor: primaryColor }}
                  >
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map((item) => {
                      const inCart = cart.find(c => c.menuItem.id === item.id)
                      return (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAddToCart={() => addToCart(item)}
                          primaryColor={primaryColor}
                          inCart={inCart?.quantity}
                          onUpdateQuantity={(delta) => updateQuantity(item.id, delta)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Cart */}
      <FloatingCart
        itemCount={cartCount}
        total={cartTotal}
        onClick={goToCheckout}
        primaryColor={primaryColor}
      />

      {/* Mobile Menu Button - Only on phones, hidden on tablet+ */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full shadow-lg"
      >
        {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-24 md:ml-80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-8 h-8 rounded object-cover" />
              ) : (
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <span 
                className="text-lg font-bold"
                style={{ color: primaryColor }}
              >
                {store.name}
              </span>
            </div>
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} {store.name}. Powered by OrderFlow.
            </p>
          </div>
        </div>
      </footer>

      {/* Delivery Address Modal */}
      <DeliveryAddressModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false)
          if (!deliveryAddress) setOrderType('pickup')
        }}
        onAddressConfirmed={handleDeliveryAddressConfirmed}
        onSwitchToPickup={() => {
          setOrderType('pickup')
          setDeliveryAddress('')
          setShowDeliveryModal(false)
        }}
        primaryColor={primaryColor}
      />
    </div>
  )
}
