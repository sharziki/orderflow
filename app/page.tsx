'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import OrderModal from '@/components/OrderModal'
import DeliveryAddressModal from '@/components/DeliveryAddressModal'
import LeftSidebar from '@/components/LeftSidebar'
import MenuItemCard from '@/components/MenuItemCard'
import FishMarketCTA from '@/components/FishMarketCTA'
import StickyFishMarketAlert from '@/components/StickyFishMarketAlert'
import RestaurantStatus from '@/components/RestaurantStatus'
import ItemOptionsModal from '@/components/ItemOptionsModal'
import FloatingCart from '@/components/FloatingCart'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  secondaryImage?: string
}

interface CartItem extends MenuItem {
  quantity: number
  options?: any[]
  specialRequests?: string
}

interface FishItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  weight?: string
  origin?: string
}

type OrderType = 'PICKUP' | 'DELIVERY'

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Delivery state
  const [orderType, setOrderType] = useState<OrderType>('PICKUP')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)

  // View state: 'menu' or 'fish-market'
  const [currentView, setCurrentView] = useState<'menu' | 'fish-market'>('menu')

  // Sticky alert visibility
  const [showStickyAlert, setShowStickyAlert] = useState(false)

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Item options modal state
  const [isItemOptionsModalOpen, setIsItemOptionsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  // Dynamic section title based on scroll
  const [activeSection, setActiveSection] = useState<string>('All')
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Separate fish market items from menu items
  const fishMarketItems = useMemo(() => {
    return menuItems
      .filter(item => item.category === 'Fresh Fish Market')
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image || '/placeholder-fish-market.jpg',
      }))
  }, [menuItems])

  // Regular menu items (excluding Fresh Fish Market)
  const regularMenuItems = useMemo(() => {
    return menuItems.filter(item => item.category !== 'Fresh Fish Market')
  }, [menuItems])

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      const data = await response.json()
      setMenuItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching menu:', error)
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  // Type guard to check if item is MenuItem
  const isMenuItem = (item: MenuItem | FishItem): item is MenuItem => {
    return 'category' in item
  }

  const addToCart = (item: MenuItem | FishItem, quantity: number = 1, options?: any[], specialRequests?: string) => {
    setCart(prev => {
      // Convert fish item to cart item format
      const cartItem: CartItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: isMenuItem(item) ? item.category : 'Fresh Fish',
        image: isMenuItem(item) ? item.image : item.image,
        quantity,
        options,
        specialRequests
      }
      return [...prev, cartItem]
    })
  }

  const handleOpenItemOptions = (item: MenuItem) => {
    setSelectedItem(item)
    setIsItemOptionsModalOpen(true)
  }

  const handleAddToCartWithOptions = (item: MenuItem, quantity: number, options: any[], specialRequests: string) => {
    addToCart(item, quantity, options, specialRequests)
    setIsItemOptionsModalOpen(false)
    setSelectedItem(null)
  }

  const switchToFishMarket = () => {
    setCurrentView('fish-market')
    setSelectedCategory('All')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Scroll listener for sticky alert
  useEffect(() => {
    const handleScroll = () => {
      // Show alert after scrolling 200px and only when on menu view
      setShowStickyAlert(window.scrollY > 200 && currentView === 'menu')
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentView])

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId)
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      }
      return prev.filter(cartItem => cartItem.id !== itemId)
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleOrderTypeChange = (newType: OrderType) => {
    if (newType === 'DELIVERY') {
      setShowDeliveryModal(true)
    } else {
      setOrderType('PICKUP')
      setDeliveryAddress('')
      setDeliveryCoordinates(null)
    }
  }

  const handleDeliveryAddressConfirmed = (address: string, coordinates: { lat: number; lng: number }) => {
    setDeliveryAddress(address)
    setDeliveryCoordinates(coordinates)
    setOrderType('DELIVERY')
    setShowDeliveryModal(false)

    try {
      localStorage.setItem('deliveryAddress', address)
      localStorage.setItem('deliveryCoordinates', JSON.stringify(coordinates))
    } catch (e) {
      console.error('Failed to save delivery address to localStorage:', e)
    }
  }

  const handleSwitchToPickup = () => {
    setOrderType('PICKUP')
    setDeliveryAddress('')
    setDeliveryCoordinates(null)
    setShowDeliveryModal(false)

    try {
      localStorage.removeItem('deliveryAddress')
      localStorage.removeItem('deliveryCoordinates')
    } catch (e) {
      console.error('Failed to clear delivery address from localStorage:', e)
    }
  }

  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem('deliveryAddress')
      const savedCoords = localStorage.getItem('deliveryCoordinates')
      if (savedAddress && savedCoords) {
        setDeliveryAddress(savedAddress)
        setDeliveryCoordinates(JSON.parse(savedCoords))
        setOrderType('DELIVERY')
      }
    } catch (e) {
      console.error('Failed to load delivery address from localStorage:', e)
    }
  }, [])

  // Get unique categories based on current view (exclude Fresh Fish Market from main menu)
  const categories = useMemo(() => {
    if (currentView === 'fish-market') {
      // For fish market, we can use fish types or just "All"
      return ['All']
    }
    const cats = Array.from(new Set(regularMenuItems.map(item => item.category))).sort()
    return ['All', ...cats]
  }, [regularMenuItems, currentView])

  // Get current items based on view
  const currentItems = useMemo(() => {
    if (currentView === 'fish-market') {
      return fishMarketItems.map(fish => ({
        id: fish.id,
        name: fish.name,
        description: fish.description,
        price: fish.price,
        category: 'Fresh Fish Market',
        image: fish.image,
        secondaryImage: fish.image
      }))
    }
    return regularMenuItems
  }, [currentView, regularMenuItems, fishMarketItems])

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return currentItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [currentItems, searchQuery, selectedCategory])

  // Group items by category for section rendering
  const itemsByCategory = useMemo(() => {
    const grouped: { [key: string]: typeof filteredItems } = {}

    if (selectedCategory !== 'All' || currentView === 'fish-market') {
      // Don't group if filtering
      return { [selectedCategory]: filteredItems }
    }

    filteredItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })

    return grouped
  }, [filteredItems, selectedCategory, currentView])

  // Set initial active section when items load
  useEffect(() => {
    if (currentView === 'menu' && selectedCategory === 'All') {
      const categories = Object.keys(itemsByCategory)
      if (categories.length > 0 && activeSection === 'All') {
        setActiveSection(categories[0])
      }
    }
  }, [itemsByCategory, currentView, selectedCategory, activeSection])

  // Intersection Observer for dynamic section titles
  useEffect(() => {
    if (currentView === 'fish-market' || selectedCategory !== 'All') {
      // Don't observe if filtering or in fish market
      return
    }

    // Wait a tick for refs to be populated after render
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -70% 0px', // Trigger when section reaches near top
        threshold: 0
      }

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionCategory = entry.target.getAttribute('data-category')
            if (sectionCategory) {
              setActiveSection(sectionCategory)
            }
          }
        })
      }

      const observer = new IntersectionObserver(observerCallback, observerOptions)

      // Observe all section markers
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref) observer.observe(ref)
      })

      // Store observer for cleanup
      observerRef.current = observer
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [currentView, selectedCategory, itemsByCategory])

  // Reset to first category when scrolled to top
  useEffect(() => {
    const handleScrollTop = () => {
      if (window.scrollY < 100 && currentView === 'menu' && selectedCategory === 'All') {
        const firstCategory = Object.keys(itemsByCategory)[0]
        if (firstCategory && activeSection !== firstCategory) {
          setActiveSection(firstCategory)
        }
      }
    }

    window.addEventListener('scroll', handleScrollTop)
    return () => window.removeEventListener('scroll', handleScrollTop)
  }, [currentView, selectedCategory, itemsByCategory, activeSection])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Image
            src="/bluefishlogo.png"
            alt="Blu Fish House Logo"
            width={80}
            height={80}
            className="object-contain mx-auto mb-4 animate-pulse"
            priority
          />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--color-primary))] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* CTA Banner - At the very top */}
      {currentView === 'menu' && (
        <div className="lg:ml-80">
          <FishMarketCTA onViewFishMarket={switchToFishMarket} />
        </div>
      )}

      {/* Sticky Fish Market Alert (shows on scroll) */}
      <StickyFishMarketAlert
        onViewFishMarket={switchToFishMarket}
        isVisible={showStickyAlert}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Layout: Sidebar + Content */}
      <div className="relative min-h-screen">
        {/* Left Sidebar - Desktop: always visible, Mobile: slide-in overlay */}
        <div className={`
          fixed lg:fixed top-0 left-0 h-screen z-40 w-80
          transform transition-transform duration-300 ease-in-out bg-white
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <LeftSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            activeSection={activeSection}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat)
              setIsMobileSidebarOpen(false)
            }}
            onCategoryClick={(cat) => {
              // Scroll to category section
              if (cat === 'All') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                const section = sectionRefs.current[cat]
                if (section) {
                  const yOffset = -150 // Account for sticky header
                  const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset
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

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 lg:ml-80">
          {/* View Toggle */}
          <div className="mb-8 flex items-center justify-between">
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {
                  setCurrentView('menu')
                  setSelectedCategory('All')
                }}
                className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  currentView === 'menu'
                    ? 'bg-white shadow-sm text-[rgb(var(--color-primary))]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Our Menu
              </button>
              <button
                onClick={() => {
                  setCurrentView('fish-market')
                  setSelectedCategory('All')
                }}
                className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  currentView === 'fish-market'
                    ? 'bg-white shadow-sm text-[rgb(var(--color-primary))]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Fresh Fish Market
              </button>
            </div>
          </div>

          {/* Section Header - Sticky Title */}
          <div className="mb-8 sticky top-16 bg-gray-50 py-4 z-30 border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {currentView === 'menu'
                ? (selectedCategory === 'All' ? (activeSection !== 'All' ? activeSection : 'Our Menu') : selectedCategory)
                : 'Fresh Fish Market'}
            </h2>
            <p className="text-sm text-gray-600">
              {(() => {
                // When viewing all categories and a specific section is active, show count for that section
                if (currentView === 'menu' && selectedCategory === 'All' && activeSection !== 'All' && itemsByCategory[activeSection]) {
                  const sectionCount = itemsByCategory[activeSection].length
                  return `${sectionCount} ${sectionCount === 1 ? 'item' : 'items'}`
                }
                // Otherwise show total filtered items
                return `${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'}`
              })()}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Product Grid - Grouped by Category */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found matching your search.</p>
            </div>
          ) : selectedCategory !== 'All' || currentView === 'fish-market' ? (
            // Single section when filtering
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={(item) => addToCart(item, 1)}
                  onOpenOptions={handleOpenItemOptions}
                />
              ))}
            </div>
          ) : (
            // Multiple sections when showing all
            <div className="space-y-16">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`} className="relative">
                  {/* Section Marker for Intersection Observer - positioned above the title */}
                  <div
                    ref={(el) => { sectionRefs.current[category] = el }}
                    data-category={category}
                    className="absolute -top-32 h-1 w-full"
                  />

                  {/* Category Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-[rgb(var(--color-primary))]">
                    {category}
                  </h3>

                  {/* Items Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={(item) => addToCart(item, 1)}
                        onOpenOptions={handleOpenItemOptions}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Cart Button */}
      <FloatingCart
        itemCount={getCartItemCount()}
        onClick={() => setIsOrderModalOpen(true)}
      />

      {/* Mobile Menu Button - Fixed at top-left */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full shadow-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-24 lg:ml-80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/bluefishlogo.png"
                alt="Blu Fish House Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-lg font-bold text-[rgb(var(--color-primary))] font-[family-name:var(--font-lato)]">
                Blu Fish House
              </span>
            </div>
            <p className="text-center text-sm text-gray-600">
              The closest thing to eating by the ocean in Arkansas
            </p>
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Blu Fish House. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        cart={cart}
        onUpdateCart={setCart}
        total={getCartTotal()}
        preselectedOrderType={orderType}
        preselectedDeliveryAddress={deliveryAddress}
      />

      <DeliveryAddressModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onAddressConfirmed={handleDeliveryAddressConfirmed}
        onSwitchToPickup={handleSwitchToPickup}
      />

      {selectedItem && (
        <ItemOptionsModal
          isOpen={isItemOptionsModalOpen}
          onClose={() => {
            setIsItemOptionsModalOpen(false)
            setSelectedItem(null)
          }}
          item={selectedItem}
          onAddToCart={handleAddToCartWithOptions}
        />
      )}
    </div>
  )
}
