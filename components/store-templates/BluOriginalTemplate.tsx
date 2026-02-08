'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ShoppingCart, Menu, X, Plus, Minus } from 'lucide-react'
import { StoreTemplateProps, MenuItem, Category } from './types'
import LeftSidebar from '@/components/blu-template/LeftSidebar'
import AddressPicker from '@/components/AddressPicker'
import OrderModal from '@/components/OrderModal'
import { HoverImageGallery } from './HoverImageGallery'

// MenuItemCard component - Mobile: Compact 2x2 grid card
function MenuItemCard({ 
  item, 
  onOpenModal,
  primaryColor,
  inCart
}: { 
  item: MenuItem
  onOpenModal: () => void
  primaryColor: string
  inCart?: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Collect all images: prefer images array, fallback to single image
  const allImages = item.images && item.images.length > 0 
    ? item.images 
    : (item.image ? [item.image] : [])

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer"
      onClick={onOpenModal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      {allImages.length > 0 && (
        <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-100">
          <HoverImageGallery
            images={allImages}
            alt={item.name}
            className="w-full h-full"
          />
          {/* In cart badge */}
          {inCart && inCart > 0 && (
            <div 
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {inCart}
            </div>
          )}
          {/* Hover overlay - Desktop only */}
          <div className={`hidden sm:flex absolute inset-0 bg-black/40 items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <span
              className="px-4 py-2 rounded-full text-white font-semibold shadow-lg text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {inCart ? 'Edit Item' : 'Add to Cart'}
            </span>
          </div>
        </div>
      )}

      {/* Content - More compact on mobile */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-2 sm:line-clamp-none group-hover:text-gray-700">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 flex-1 hidden sm:block">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <span 
            className="font-bold text-base sm:text-lg"
            style={{ color: primaryColor }}
          >
            ${item.price.toFixed(2)}
          </span>
          {/* Mobile add button */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
            className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
          </button>
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
  onOpenItemModal,
  onEditCartItem,
}: StoreTemplateProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeSection, setActiveSection] = useState('All')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const primaryColor = store.primaryColor || '#1e3a5f'

  // Calculate cart total including modifier prices
  const cartTotal = cart.reduce((sum, c) => {
    const itemPrice = c.menuItem.price
    const modifiersPrice = (c.selectedModifiers || []).reduce((mSum, mod) => mSum + mod.price, 0)
    return sum + (itemPrice + modifiersPrice) * c.quantity
  }, 0)
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
          {/* Section Header - show store name when viewing full menu, category name when filtered */}
          <div className="mb-8 sticky top-0 bg-gray-50 py-4 z-30 border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {selectedCategory === 'All' ? store.name : selectedCategory}
            </h2>
            <p className="text-sm text-gray-600">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Product Grid - 2x2 on mobile, 2 cols on tablet, 3 on desktop */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found matching your search.</p>
            </div>
          ) : selectedCategory !== 'All' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredItems.map((item) => {
                // Count total quantity of this item across all cart entries
                const inCartCount = cart.filter(c => c.menuItem.id === item.id).reduce((sum, c) => sum + c.quantity, 0)
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onOpenModal={() => onOpenItemModal?.(item)}
                    primaryColor={primaryColor}
                    inCart={inCartCount}
                  />
                )
              })}
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {Object.entries(itemsByCategory).map(([categoryName, items]) => {
                // Find the category object to get description
                const categoryObj = categories.find(c => c.name === categoryName)
                return (
                <div key={categoryName} className="relative">
                  <div
                    ref={(el) => { sectionRefs.current[categoryName] = el }}
                    data-category={categoryName}
                    className="absolute -top-32 h-1 w-full"
                  />
                  <h3 
                    className="text-lg sm:text-2xl font-bold text-gray-900 pb-2 sm:pb-3 border-b-2"
                    style={{ borderColor: primaryColor }}
                  >
                    {categoryName}
                  </h3>
                  {categoryObj?.description && (
                    <p className="text-gray-500 text-sm sm:text-base mt-2 mb-4 sm:mb-6">{categoryObj.description}</p>
                  )}
                  {!categoryObj?.description && <div className="mb-4 sm:mb-6" />}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {items.map((item) => {
                      // Count total quantity of this item across all cart entries
                      const inCartCount = cart.filter(c => c.menuItem.id === item.id).reduce((sum, c) => sum + c.quantity, 0)
                      return (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onOpenModal={() => onOpenItemModal?.(item)}
                          primaryColor={primaryColor}
                          inCart={inCartCount}
                        />
                      )
                    })}
                  </div>
                </div>
              )})}
            </div>
          )}
        </main>
      </div>

      {/* Floating Cart */}
      <FloatingCart
        itemCount={cartCount}
        total={cartTotal}
        onClick={() => setShowOrderModal(true)}
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

      {/* Order Modal */}
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        cart={cart.map(c => ({
          id: c.menuItem.id,
          name: c.menuItem.name,
          description: c.menuItem.description || '',
          price: c.menuItem.price,
          category: '',
          quantity: c.quantity,
        }))}
        onUpdateCart={(newCart) => {
          // Transform back to store template format
          // For now, just clear cart on order completion
          if (newCart.length === 0) {
            // Cart was cleared (order completed)
            window.location.reload()
          }
        }}
        total={cartTotal}
        preselectedOrderType={orderType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
        preselectedDeliveryAddress={deliveryAddress}
      />
    </div>
  )
}
