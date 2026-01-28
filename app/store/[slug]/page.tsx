'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { 
  Store, 
  Category, 
  CartItem, 
  MenuItem,
  ModernTemplate,
  SliceTemplate,
  BluBentonvilleTemplate,
} from '@/components/store-templates'

export default function StorePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
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

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${slug}`)
    const savedOrderType = localStorage.getItem(`orderType_${slug}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch {}
    }
    if (savedOrderType === 'delivery' || savedOrderType === 'pickup') {
      setOrderType(savedOrderType)
    }
  }, [slug])

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/store/${slug}`)
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
      if (data.categories?.length > 0) {
        setActiveCategory(data.categories[0].id)
      }
    } catch (err) {
      setError('Failed to load store')
    } finally {
      setLoading(false)
    }
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

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItem.id === itemId) {
          const newQty = c.quantity + delta
          return newQty > 0 ? { ...c, quantity: newQty } : c
        }
        return c
      }).filter(c => c.quantity > 0)
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId))
  }

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(cart))
      localStorage.setItem(`orderType_${slug}`, orderType)
    }
  }, [cart, orderType, slug])

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

  // Template props
  const templateProps = {
    store,
    categories,
    cart,
    cartOpen,
    orderType,
    activeCategory,
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
  }

  // Render appropriate template based on store.menuLayout or store.template
  const layout = (store as any).menuLayout || store.template
  
  switch (layout) {
    case 'blu-bentonville':
      return <BluBentonvilleTemplate {...templateProps} />
    case 'slice':
      return <SliceTemplate {...templateProps} />
    case 'classic':
      return <ModernTemplate {...templateProps} />
    case 'bold':
      return <ModernTemplate {...templateProps} />
    case 'modern':
    default:
      return <ModernTemplate {...templateProps} />
  }
}
