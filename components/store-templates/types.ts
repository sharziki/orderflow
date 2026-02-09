export interface Modifier {
  name: string
  price: number
}

export interface ModifierGroup {
  id: string
  name: string
  description?: string | null
  modifiers: Modifier[]
  minSelections: number
  maxSelections: number | null
  isRequired: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  images?: string[] // Multiple images for hover animations
  modifierGroupIds?: string[]
}

export interface Category {
  id: string
  name: string
  description: string | null
  menuItems: MenuItem[]
}

export interface Store {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip?: string | null
  logo: string | null
  primaryColor: string
  secondaryColor: string
  template: string
  menuLayout?: string
  pickupEnabled: boolean
  deliveryEnabled: boolean
  taxRate: number
  deliveryFee: number
  minOrderAmount: number
  isOpen: boolean
  businessHours?: any
  // CTA fields
  ctaEnabled?: boolean
  ctaText?: string | null
  ctaSubtext?: string | null
  ctaLink?: string | null
  ctaButtonText?: string | null
}

export interface Menu {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  isDefault?: boolean
}

export interface SelectedModifier {
  groupId: string
  groupName: string
  optionName: string
  price: number
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedModifiers?: SelectedModifier[]
  specialRequests?: string
}

export interface StoreTemplateProps {
  store: Store
  categories: Category[]
  menus?: Menu[]
  selectedMenuId?: string | null
  onMenuChange?: (menuId: string) => void
  cart: CartItem[]
  cartOpen: boolean
  orderType: 'pickup' | 'delivery'
  activeCategory: string | null
  modifierGroups?: ModifierGroup[]
  setCartOpen: (open: boolean) => void
  setOrderType: (type: 'pickup' | 'delivery') => void
  setActiveCategory: (id: string | null) => void
  addToCart: (item: MenuItem, quantity?: number, selectedModifiers?: SelectedModifier[], specialRequests?: string) => void
  updateQuantity: (itemId: string, delta: number) => void
  removeFromCart: (itemId: string) => void
  scrollToCategory: (categoryId: string) => void
  goToCheckout: () => void
  categoryRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  navRef: React.RefObject<HTMLDivElement>
  onOpenItemModal?: (item: MenuItem) => void
  onEditCartItem?: (cartItem: CartItem, index: number) => void
  onOpenRecentOrders?: () => void
}
