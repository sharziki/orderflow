# OrderFlow Components Guide

This document explains the key React components in OrderFlow and how they work together.

## 📋 Table of Contents

- [Component Architecture](#component-architecture)
- [UI Components](#ui-components)
- [Store Templates](#store-templates)
- [Menu Layouts](#menu-layouts)
- [Dashboard Components](#dashboard-components)
- [Modal Components](#modal-components)
- [Utility Components](#utility-components)
- [Component Patterns](#component-patterns)

---

## Component Architecture

### Server vs Client Components

OrderFlow follows Next.js 14 patterns for server and client components:

```
Server Components (default):
├── Fetch data directly
├── No client-side JavaScript
├── Great for static content
└── Used for: pages, layouts, data display

Client Components ('use client'):
├── Interactive (useState, useEffect)
├── Event handlers
├── Browser APIs
└── Used for: forms, modals, cart
```

### Component Location

```
components/
├── ui/                    # Base UI (shadcn)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── store-templates/       # Storefront themes
│   ├── ModernTemplate.tsx
│   ├── SliceTemplate.tsx
│   └── BluOriginalTemplate.tsx
├── menu-layouts/          # Menu display styles
│   ├── ClassicLayout.tsx
│   ├── MinimalLayout.tsx
│   └── GridCompactLayout.tsx
├── blu-template/          # Blu theme components
│   ├── FloatingCart.tsx
│   ├── MenuItemCard.tsx
│   └── LeftSidebar.tsx
└── [feature].tsx          # Feature components
```

---

## UI Components

Base UI components from shadcn/ui. Located in `components/ui/`.

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button disabled>Disabled</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter email" 
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <div>Modal content here</div>
  </DialogContent>
</Dialog>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select value={status} onValueChange={setStatus}>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pending">Pending</SelectItem>
    <SelectItem value="preparing">Preparing</SelectItem>
    <SelectItem value="ready">Ready</SelectItem>
  </SelectContent>
</Select>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="orders">
  <TabsList>
    <TabsTrigger value="orders">Orders</TabsTrigger>
    <TabsTrigger value="menu">Menu</TabsTrigger>
  </TabsList>
  <TabsContent value="orders">
    <OrdersList />
  </TabsContent>
  <TabsContent value="menu">
    <MenuEditor />
  </TabsContent>
</Tabs>
```

---

## Store Templates

Storefront themes that define the overall look. Located in `components/store-templates/`.

### ModernTemplate

Clean, minimalist design with floating cart.

```tsx
// components/store-templates/ModernTemplate.tsx
interface ModernTemplateProps {
  tenant: TenantWithMenu
  onAddToCart: (item: MenuItem, options: SelectedOption[]) => void
  cart: CartItem[]
  onCheckout: () => void
}

export function ModernTemplate({ tenant, onAddToCart, cart, onCheckout }: ModernTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative h-64 bg-gradient-to-b from-primary to-primary/80">
        <img src={tenant.logo} alt={tenant.name} className="h-20" />
        <h1 className="text-4xl font-bold text-white">{tenant.name}</h1>
      </header>
      
      {/* Category Navigation */}
      <nav className="sticky top-0 bg-white border-b">
        {tenant.categories.map(cat => (
          <a key={cat.id} href={`#${cat.id}`}>{cat.name}</a>
        ))}
      </nav>
      
      {/* Menu Items */}
      <main className="container mx-auto py-8">
        {tenant.categories.map(category => (
          <section key={category.id} id={category.id}>
            <h2>{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.menuItems.map(item => (
                <MenuItemCard 
                  key={item.id} 
                  item={item} 
                  onAdd={onAddToCart} 
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      
      {/* Floating Cart */}
      <FloatingCart cart={cart} onCheckout={onCheckout} />
    </div>
  )
}
```

### SliceTemplate

Bold, pizza-focused design.

### BluOriginalTemplate

Blue-themed professional design with sidebar navigation.

### Template Selection

```tsx
// components/store-templates/index.ts
export function getTemplate(templateName: string) {
  switch (templateName) {
    case 'modern':
      return ModernTemplate
    case 'slice':
      return SliceTemplate
    case 'blu-original':
      return BluOriginalTemplate
    default:
      return ModernTemplate
  }
}

// Usage in store page
const Template = getTemplate(tenant.template)
return <Template tenant={tenant} {...props} />
```

---

## Menu Layouts

How menu items are displayed within templates. Located in `components/menu-layouts/`.

### ClassicLayout

Traditional two-column layout with images.

```tsx
// components/menu-layouts/ClassicLayout.tsx
export function ClassicLayout({ items, onItemClick }: MenuLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map(item => (
        <div 
          key={item.id}
          className="flex gap-4 p-4 border rounded-lg cursor-pointer hover:shadow-lg"
          onClick={() => onItemClick(item)}
        >
          {item.image && (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-24 h-24 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="font-bold mt-2">${item.price.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### MinimalLayout

Text-only, elegant design.

### GridCompactLayout

Dense grid for many items.

### SliceLayout

Card-based with hover animations.

---

## Dashboard Components

Components used in the restaurant dashboard.

### OrdersTable

Displays and manages orders.

```tsx
// In dashboard/orders/page.tsx
function OrdersTable({ orders, onStatusChange }: OrdersTableProps) {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard 
          key={order.id}
          order={order}
          onStatusChange={(status) => onStatusChange(order.id, status)}
        />
      ))}
    </div>
  )
}

function OrderCard({ order, onStatusChange }: OrderCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono">{order.orderNumber}</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <span className="font-bold">${order.total.toFixed(2)}</span>
      </div>
      
      <div className="mt-2">
        <p className="font-medium">{order.customerName}</p>
        <p className="text-sm text-gray-500">{order.customerPhone}</p>
      </div>
      
      <div className="mt-3">
        <h4 className="text-sm font-medium">Items:</h4>
        {order.items.map((item, i) => (
          <p key={i} className="text-sm">
            {item.quantity}x {item.name} - ${item.price.toFixed(2)}
          </p>
        ))}
      </div>
      
      <div className="mt-4 flex gap-2">
        {order.status === 'pending' && (
          <Button onClick={() => onStatusChange('preparing')}>
            Start Preparing
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button onClick={() => onStatusChange('ready')}>
            Mark Ready
          </Button>
        )}
      </div>
    </div>
  )
}
```

### MenuEditor

CRUD interface for menu items.

```tsx
// Simplified structure
function MenuEditor() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Categories Sidebar */}
      <div className="col-span-1 space-y-2">
        {categories.map(cat => (
          <CategoryCard 
            key={cat.id}
            category={cat}
            onEdit={() => setEditingCategory(cat)}
            onDelete={() => handleDeleteCategory(cat.id)}
          />
        ))}
        <Button onClick={() => setIsAddingCategory(true)}>
          Add Category
        </Button>
      </div>
      
      {/* Items Grid */}
      <div className="col-span-3">
        <ItemsGrid 
          items={currentItems}
          onItemClick={setEditingItem}
        />
      </div>
      
      {/* Edit Modal */}
      <ItemEditModal
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveItem}
      />
    </div>
  )
}
```

---

## Modal Components

### OrderModal

Complete checkout flow.

```tsx
// components/OrderModal.tsx (simplified)
'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Elements } from '@stripe/react-stripe-js'

interface OrderModalProps {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  tenant: Tenant
  onSuccess: (order: Order) => void
}

export function OrderModal({ open, onClose, cart, tenant, onSuccess }: OrderModalProps) {
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  })
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * (tenant.taxRate / 100)
  const deliveryFee = orderType === 'delivery' ? tenant.deliveryFee : 0
  const total = subtotal + tax + deliveryFee
  
  async function handleSubmit() {
    // Create order first
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        tenantSlug: tenant.slug,
        type: orderType,
        ...customerInfo,
        items: cart,
      }),
    })
    
    if (orderRes.ok) {
      setStep('payment')
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {step === 'details' && (
          <OrderDetailsForm 
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            customerInfo={customerInfo}
            onCustomerInfoChange={setCustomerInfo}
            onSubmit={handleSubmit}
          />
        )}
        
        {step === 'payment' && (
          <Elements stripe={stripePromise}>
            <PaymentForm 
              amount={total}
              onSuccess={(order) => {
                onSuccess(order)
                onClose()
              }}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

### ItemOptionsModal

Select modifiers/variants for an item.

```tsx
// components/ItemOptionsModal.tsx
'use client'

interface ItemOptionsModalProps {
  item: MenuItem
  open: boolean
  onClose: () => void
  onAddToCart: (item: MenuItem, options: SelectedOption[], quantity: number) => void
}

export function ItemOptionsModal({ item, open, onClose, onAddToCart }: ItemOptionsModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(item.variants?.[0] || null)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  
  // Calculate price with modifiers
  const basePrice = selectedVariant?.price || item.price
  const modifierPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0)
  const totalPrice = (basePrice + modifierPrice) * quantity
  
  function handleAddToCart() {
    onAddToCart(item, [
      ...(selectedVariant ? [{ type: 'variant', ...selectedVariant }] : []),
      ...selectedModifiers,
    ], quantity)
    onClose()
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {/* Item Image & Info */}
        <div className="flex gap-4">
          {item.image && <img src={item.image} className="w-32 h-32 rounded" />}
          <div>
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
          </div>
        </div>
        
        {/* Variants */}
        {item.variants && (
          <div className="mt-4">
            <h3 className="font-medium">Size</h3>
            <div className="flex gap-2 mt-2">
              {item.variants.map(variant => (
                <button
                  key={variant.name}
                  className={cn(
                    'px-4 py-2 border rounded',
                    selectedVariant?.name === variant.name && 'border-primary bg-primary/10'
                  )}
                  onClick={() => setSelectedVariant(variant)}
                >
                  {variant.name} - ${variant.price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Modifier Groups */}
        {item.modifierGroups.map(group => (
          <ModifierGroupSelector
            key={group.id}
            group={group}
            selected={selectedModifiers.filter(m => m.groupId === group.id)}
            onChange={(mods) => updateModifiers(group.id, mods)}
          />
        ))}
        
        {/* Quantity */}
        <div className="flex items-center gap-4 mt-4">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
          <span className="font-bold">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)}>+</button>
        </div>
        
        {/* Add to Cart Button */}
        <Button onClick={handleAddToCart} className="w-full mt-4">
          Add to Cart - ${totalPrice.toFixed(2)}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Utility Components

### FloatingCart

Persistent cart button on storefront.

```tsx
// components/FloatingCart.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface FloatingCartProps {
  cart: CartItem[]
  total: number
  onClick: () => void
}

export function FloatingCart({ cart, total, onClick }: FloatingCartProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  if (itemCount === 0) return null
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
    >
      <button
        onClick={onClick}
        className="flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-full shadow-lg"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-medium">View Cart ({itemCount})</span>
        <span className="font-bold">${total.toFixed(2)}</span>
      </button>
    </motion.div>
  )
}
```

### RestaurantStatus

Shows if restaurant is open/closed.

```tsx
// components/RestaurantStatus.tsx
'use client'

import { isRestaurantOpen, getNextOpenTime } from '@/lib/restaurant-hours'

interface RestaurantStatusProps {
  businessHours: BusinessHours
  timezone: string
}

export function RestaurantStatus({ businessHours, timezone }: RestaurantStatusProps) {
  const isOpen = isRestaurantOpen(businessHours, timezone)
  const nextOpen = !isOpen ? getNextOpenTime(businessHours, timezone) : null
  
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm',
      isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        isOpen ? 'bg-green-500' : 'bg-red-500'
      )} />
      {isOpen ? 'Open Now' : `Opens ${nextOpen}`}
    </div>
  )
}
```

### PhoneInput

Formatted phone input with validation.

```tsx
// components/PhoneInput.tsx
'use client'

export function PhoneInput({ value, onChange }: PhoneInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Format as (XXX) XXX-XXXX
    const digits = e.target.value.replace(/\D/g, '')
    let formatted = ''
    
    if (digits.length > 0) formatted += '(' + digits.slice(0, 3)
    if (digits.length >= 3) formatted += ') ' + digits.slice(3, 6)
    if (digits.length >= 6) formatted += '-' + digits.slice(6, 10)
    
    onChange(formatted)
  }
  
  return (
    <Input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder="(555) 123-4567"
      maxLength={14}
    />
  )
}
```

### AddressAutocomplete

Google Places integration.

```tsx
// components/AddressAutocomplete.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect 
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  
  useEffect(() => {
    // Initialize Google Places Autocomplete
    if (window.google && inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      })
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        onSelect({
          address: place.formatted_address,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        })
      })
    }
  }, [])
  
  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter delivery address"
    />
  )
}
```

---

## Component Patterns

### Loading States

```tsx
function OrdersList() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }
  
  return <OrdersGrid orders={orders} />
}
```

### Error Handling

```tsx
function MenuPage() {
  const [error, setError] = useState<string | null>(null)
  
  async function loadMenu() {
    try {
      const res = await fetch('/api/menu')
      if (!res.ok) throw new Error('Failed to load menu')
      const data = await res.json()
      setMenu(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="mt-2 text-red-600">{error}</p>
        <Button onClick={loadMenu} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }
  
  return <MenuGrid menu={menu} />
}
```

### Optimistic Updates

```tsx
function OrderStatusButton({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status)
  const [updating, setUpdating] = useState(false)
  
  async function updateStatus(newStatus: string) {
    const previousStatus = status
    
    // Optimistic update
    setStatus(newStatus)
    setUpdating(true)
    
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) throw new Error('Failed to update')
    } catch {
      // Rollback on error
      setStatus(previousStatus)
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }
  
  return (
    <Button 
      onClick={() => updateStatus('preparing')}
      disabled={updating}
    >
      {updating ? <Spinner /> : 'Start Preparing'}
    </Button>
  )
}
```

### Form Validation

```tsx
import { z } from 'zod'

const orderSchema = z.object({
  customerName: z.string().min(2, 'Name is too short'),
  customerEmail: z.string().email('Invalid email'),
  customerPhone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone'),
})

function CheckoutForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  function validate(data: FormData) {
    const result = orderSchema.safeParse(data)
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return false
    }
    
    setErrors({})
    return true
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Input name="customerName" />
        {errors.customerName && (
          <p className="text-red-500 text-sm">{errors.customerName}</p>
        )}
      </div>
      {/* ... */}
    </form>
  )
}
```

---

## Animation Patterns

Using Framer Motion for smooth transitions:

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  {children}
</motion.div>

// List animations
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      layout
    >
      <ItemCard item={item} />
    </motion.div>
  ))}
</AnimatePresence>

// Hover animations
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

---

For more component details, check the source code in `components/`.
