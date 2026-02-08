'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { 
  Store, 
  Category, 
  CartItem, 
  MenuItem,
  Menu,
  ModifierGroup,
  SelectedModifier,
  ModernTemplate,
  SliceTemplate,
  BluBentonvilleTemplate,
  BluOriginalTemplate,
} from '@/components/store-templates'
import ItemOptionsModal from '@/components/ItemOptionsModal'

export default function StorePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const layoutOverride = searchParams.get('layout') // For preview in settings
  
  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
  // Item modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)
  
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

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

  // Clear cart on page load (fresh start on every visit/refresh)
  useEffect(() => {
    // Clear any persisted cart data on refresh
    localStorage.removeItem(`cart_${slug}`)
    localStorage.removeItem(`orderType_${slug}`)
    setCart([])
    setOrderType('pickup')
  }, [slug])

  const fetchStore = async (menuId?: string) => {
    try {
      const url = menuId 
        ? `/api/store/${slug}?menuId=${menuId}` 
        : `/api/store/${slug}`
      const res = await fetch(url)
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
      setModifierGroups(data.modifierGroups || [])
      setMenus(data.menus || [])
      setSelectedMenuId(data.selectedMenuId || null)
      if (data.categories?.length > 0) {
        setActiveCategory(data.categories[0].id)
      }
    } catch (err) {
      setError('Failed to load store')
    } finally {
      setLoading(false)
    }
  }

  // Handle menu change
  const handleMenuChange = async (menuId: string) => {
    setSelectedMenuId(menuId)
    setLoading(true)
    await fetchStore(menuId)
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

  // Open item modal (mandatory before adding to cart)
  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item)
    setEditingCartIndex(null)
    setEditingCartItem(null)
    setIsModalOpen(true)
  }

  // Edit cart item (reopen modal with existing selections)
  const editCartItem = (cartItem: CartItem, index: number) => {
    setSelectedItem(cartItem.menuItem)
    setEditingCartIndex(index)
    setEditingCartItem(cartItem)
    setIsModalOpen(true)
  }

  const closeItemModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
    setEditingCartIndex(null)
    setEditingCartItem(null)
  }

  const addToCart = (
    item: MenuItem, 
    quantity: number = 1, 
    selectedModifiers: SelectedModifier[] = [], 
    specialRequests: string = ''
  ) => {
    if (editingCartIndex !== null) {
      // Editing existing cart item
      setCart(prev => prev.map((c, idx) => 
        idx === editingCartIndex 
          ? { menuItem: item, quantity, selectedModifiers, specialRequests }
          : c
      ))
    } else {
      // Adding new item - always add as new entry (modifiers may differ)
      setCart(prev => [...prev, { menuItem: item, quantity, selectedModifiers, specialRequests }])
    }
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItem.id === itemId) {
          const newQty = Math.max(0, c.quantity + delta)
          return { ...c, quantity: newQty }
        }
        return c
      }).filter(c => c.quantity > 0)
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId))
  }

  // Note: Cart is intentionally NOT persisted to localStorage
  // It clears on page refresh for a fresh start each visit
  // Only saved when going to checkout

  const goToCheckout = () => {
    localStorage.setItem(`cart_${slug}`, JSON.stringify(cart))
    localStorage.setItem(`orderType_${slug}`, orderType)
    window.location.href = `/store/${slug}/checkout`
  }

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

  // Get modifier groups for an item
  const getModifierGroupsForItem = (item: MenuItem): ModifierGroup[] => {
    if (!item.modifierGroupIds || item.modifierGroupIds.length === 0) {
      return []
    }
    return modifierGroups.filter(mg => item.modifierGroupIds!.includes(mg.id))
  }

  // Template props
  const templateProps = {
    store,
    categories,
    menus,
    selectedMenuId,
    onMenuChange: handleMenuChange,
    cart,
    cartOpen,
    orderType,
    activeCategory,
    modifierGroups,
    setCartOpen,
    setOrderType: setOrderType as (type: 'pickup' | 'delivery') => void,
    setActiveCategory,
    addToCart,
    updateQuantity,
    removeFromCart,
    scrollToCategory,
    goToCheckout,
    categoryRefs,
    navRef,
    onOpenItemModal: openItemModal,
    onEditCartItem: editCartItem,
  }

  // Render appropriate template based on layoutOverride, store.menuLayout, or store.template
  const layout = layoutOverride || (store as any).menuLayout || store.template
  
  const renderTemplate = () => {
    switch (layout) {
      case 'blu-bentonville':
      case 'blu-original':
      case 'sidebar':
        return <BluOriginalTemplate {...templateProps} />
      case 'slice':
        return <SliceTemplate {...templateProps} />
      case 'wide':
        return <BluBentonvilleTemplate {...templateProps} />
      case 'classic':
      case 'modern':
      default:
        return <ModernTemplate {...templateProps} />
    }
  }

  return (
    <>
      {renderTemplate()}
      
      {/* Item Options Modal - Used for all templates */}
      {selectedItem && (
        <ItemOptionsModal
          isOpen={isModalOpen}
          onClose={closeItemModal}
          item={selectedItem}
          modifierGroups={getModifierGroupsForItem(selectedItem)}
          existingModifiers={editingCartItem?.selectedModifiers}
          existingQuantity={editingCartItem?.quantity}
          existingSpecialRequests={editingCartItem?.specialRequests}
          onAddToCart={(item, quantity, selectedOptions, specialRequests) => {
            // Transform selectedOptions to SelectedModifier format
            const modifiers: SelectedModifier[] = selectedOptions.map(opt => ({
              groupId: opt.groupId,
              groupName: opt.groupName || '',
              optionName: opt.optionName || '',
              price: opt.price || 0
            }))
            addToCart(item, quantity, modifiers, specialRequests)
            closeItemModal()
          }}
          primaryColor={store.primaryColor}
        />
      )}
    </>
  )
}
