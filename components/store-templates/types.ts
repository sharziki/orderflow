export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
}

export interface Category {
  id: string
  name: string
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
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface StoreTemplateProps {
  store: Store
  categories: Category[]
  cart: CartItem[]
  cartOpen: boolean
  orderType: 'pickup' | 'delivery'
  activeCategory: string | null
  setCartOpen: (open: boolean) => void
  setOrderType: (type: 'pickup' | 'delivery') => void
  setActiveCategory: (id: string | null) => void
  addToCart: (item: MenuItem) => void
  updateQuantity: (itemId: string, delta: number) => void
  removeFromCart: (itemId: string) => void
  scrollToCategory: (categoryId: string) => void
  goToCheckout: () => void
  categoryRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  navRef: React.RefObject<HTMLDivElement>
}
