'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Utensils,
  ShoppingBag,
  Settings,
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Loader2,
  Rocket,
  Check,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react'

// Theme definitions
const THEMES = {
  modern: { name: 'Modern', font: 'font-sans', radius: 'rounded-xl', button: 'rounded-lg' },
  classic: { name: 'Classic', font: 'font-serif', radius: 'rounded-md', button: 'rounded-md' },
  bold: { name: 'Bold', font: 'font-sans', radius: 'rounded-2xl', button: 'rounded-full' },
  minimal: { name: 'Minimal', font: 'font-sans', radius: 'rounded-none', button: 'rounded-sm' },
}

interface Category {
  id: string
  name: string
  sortOrder: number
  collapsed?: boolean
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  isAvailable: boolean
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  type: 'pickup' | 'delivery'
  status: string
  total: number
  items: any[]
  createdAt: string
}

interface StoreSettings {
  name: string
  slug: string
  primaryColor: string
  template: string
  stripeOnboardingComplete: boolean
  isLive: boolean
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  
  // Menu state
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEMES>('modern')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [orderFilter, setOrderFilter] = useState<'new' | 'preparing' | 'ready' | 'completed'>('new')
  
  // Edit state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null)
  const [newItemForm, setNewItemForm] = useState({ name: '', description: '', price: '' })

  // Launch modal
  const [showLaunchModal, setShowLaunchModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [catRes, itemsRes, statusRes] = await Promise.all([
        fetch('/api/menu/categories'),
        fetch('/api/menu/items'),
        fetch('/api/dashboard/launch-status')
      ])
      
      if (catRes.ok) {
        const data = await catRes.json()
        setCategories(data.categories || [])
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json()
        setMenuItems(data.items || [])
      }
      if (statusRes.ok) {
        const data = await statusRes.json()
        setSettings({
          name: data.storeName,
          slug: data.storeSlug,
          primaryColor: '#2563eb',
          template: 'modern',
          stripeOnboardingComplete: data.stripeOnboardingComplete,
          isLive: data.isLive,
        })
        setSelectedTheme('modern')
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders()
      const interval = setInterval(loadOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  const getItemsInCategory = (categoryId: string) => {
    return menuItems.filter(item => item.categoryId === categoryId)
  }

  const handleAddCategory = async () => {
    const name = prompt('Category name (e.g., "🍕 Pizza"):')
    if (!name) return
    
    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (res.ok) {
        const { category } = await res.json()
        setCategories([...categories, category])
      }
    } catch (err) {
      console.error('Error adding category:', err)
    }
  }

  const handleAddItem = async (categoryId: string) => {
    if (!newItemForm.name || !newItemForm.price) return
    
    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          name: newItemForm.name,
          description: newItemForm.description || null,
          price: parseFloat(newItemForm.price),
          isAvailable: true,
        })
      })
      if (res.ok) {
        const { item } = await res.json()
        setMenuItems([...menuItems, item])
        setNewItemForm({ name: '', description: '', price: '' })
        setAddingToCategory(null)
      }
    } catch (err) {
      console.error('Error adding item:', err)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return
    try {
      await fetch(`/api/menu/items/${id}`, { method: 'DELETE' })
      setMenuItems(menuItems.filter(i => i.id !== id))
    } catch (err) {
      console.error('Error deleting item:', err)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'new') return o.status === 'pending' || o.status === 'confirmed'
    if (orderFilter === 'preparing') return o.status === 'preparing'
    if (orderFilter === 'ready') return o.status === 'ready'
    return o.status === 'completed'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 h-14 flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">OrderFlow</span>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 ml-4">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'menu' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menu Builder
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'orders' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orders
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {settings?.isLive ? (
            <a href={`/store/${settings.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View Store
              </Button>
            </a>
          ) : (
            <Button 
              size="sm" 
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setShowLaunchModal(true)}
            >
              <Rocket className="w-4 h-4" />
              Launch Store
            </Button>
          )}
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'menu' ? (
          <>
            {/* Left Panel - Editor */}
            <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-hidden">
              {/* Theme Picker */}
              <div className="p-4 border-b border-slate-200">
                <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Theme</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSelectedTheme(theme)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        selectedTheme === theme 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {THEMES[theme].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories & Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Utensils className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">No menu items yet</h3>
                    <p className="text-sm text-slate-500 mb-4">Start by adding a category</p>
                    <Button onClick={handleAddCategory} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Category
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer"
                          onClick={() => setCategories(categories.map(c => 
                            c.id === category.id ? { ...c, collapsed: !c.collapsed } : c
                          ))}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-slate-400" />
                            {category.collapsed ? (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-medium text-slate-900">{category.name}</span>
                            <span className="text-xs text-slate-400">
                              ({getItemsInCategory(category.id).length})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddingToCategory(category.id)
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {!category.collapsed && (
                          <div className="divide-y divide-slate-100">
                            {getItemsInCategory(category.id).map((item) => (
                              <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className={`font-medium text-sm truncate ${!item.isAvailable ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">${item.price.toFixed(2)}</span>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Add item form */}
                            {addingToCategory === category.id && (
                              <div className="p-3 bg-blue-50 space-y-2">
                                <Input
                                  placeholder="Item name"
                                  value={newItemForm.name}
                                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                                  className="h-9"
                                />
                                <Input
                                  placeholder="Description (optional)"
                                  value={newItemForm.description}
                                  onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                                  className="h-9"
                                />
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={newItemForm.price}
                                      onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                                      className="h-9 pl-7"
                                    />
                                  </div>
                                  <Button size="sm" onClick={() => handleAddItem(category.id)}>Add</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setAddingToCategory(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {getItemsInCategory(category.id).length === 0 && addingToCategory !== category.id && (
                              <div className="p-4 text-center text-sm text-slate-500">
                                No items yet
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <Button variant="outline" className="w-full gap-2" onClick={handleAddCategory}>
                      <Plus className="w-4 h-4" />
                      Add Category
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="flex-1 bg-slate-200 flex flex-col items-center justify-center p-8">
              {/* Preview Controls */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>

              {/* Phone/Desktop Frame */}
              <div className={`bg-white shadow-2xl overflow-hidden ${
                previewMode === 'mobile' 
                  ? 'w-[375px] rounded-[2.5rem] p-3' 
                  : 'w-full max-w-4xl rounded-lg'
              }`}>
                <div className={`bg-slate-50 overflow-y-auto ${
                  previewMode === 'mobile' 
                    ? 'rounded-[2rem] h-[700px]' 
                    : 'h-[600px]'
                }`}>
                  {/* Preview Header */}
                  <div 
                    className="p-4 text-white"
                    style={{ backgroundColor: settings?.primaryColor || '#2563eb' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
                        {settings?.name?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <h2 className={`font-bold ${THEMES[selectedTheme].font}`}>
                          {settings?.name || 'Your Restaurant'}
                        </h2>
                        <p className="text-white/70 text-sm">Open until 10pm</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Type Toggle */}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <div className={`flex-1 bg-white border-2 border-slate-300 ${THEMES[selectedTheme].radius} p-3 text-center`}>
                        <p className="font-semibold text-slate-900">Pickup</p>
                        <p className="text-xs text-slate-500">15 min</p>
                      </div>
                      <div className={`flex-1 bg-slate-50 border border-slate-200 ${THEMES[selectedTheme].radius} p-3 text-center`}>
                        <p className="font-semibold text-slate-400">Delivery</p>
                        <p className="text-xs text-slate-400">30-45 min</p>
                      </div>
                    </div>
                  </div>

                  {/* Category Nav */}
                  <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                    {categories.map((cat, i) => (
                      <div 
                        key={cat.id}
                        className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap ${THEMES[selectedTheme].button} ${
                          i === 0 
                            ? 'text-white' 
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        style={i === 0 ? { backgroundColor: settings?.primaryColor || '#2563eb' } : {}}
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>

                  {/* Menu Items */}
                  <div className="p-4 space-y-4">
                    {categories.map((category) => (
                      <div key={category.id}>
                        <h3 className={`font-bold text-slate-900 mb-3 ${THEMES[selectedTheme].font}`}>
                          {category.name}
                        </h3>
                        <div className="space-y-2">
                          {getItemsInCategory(category.id).filter(i => i.isAvailable).map((item) => (
                            <div 
                              key={item.id} 
                              className={`bg-white border border-slate-200 ${THEMES[selectedTheme].radius} p-3 flex justify-between`}
                            >
                              <div>
                                <p className={`font-medium text-slate-900 ${THEMES[selectedTheme].font}`}>{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold" style={{ color: settings?.primaryColor || '#2563eb' }}>
                                  ${item.price.toFixed(2)}
                                </p>
                                <button 
                                  className={`text-xs text-white px-3 py-1 ${THEMES[selectedTheme].button} mt-1`}
                                  style={{ backgroundColor: settings?.primaryColor || '#2563eb' }}
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ))}
                          {getItemsInCategory(category.id).length === 0 && (
                            <p className="text-sm text-slate-400 italic">No items in this category</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {categories.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <p>Add categories and items to see your menu here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                Live preview — changes update instantly
              </p>
            </div>
          </>
        ) : (
          /* Orders Tab */
          <div className="flex-1 p-6">
            {/* Order Filters */}
            <div className="flex gap-2 mb-6">
              {(['new', 'preparing', 'ready', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    orderFilter === filter 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'new' && orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length > 0 && (
                    <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900">#{order.orderNumber}</p>
                      <p className="text-sm text-slate-600">{order.customerName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.type === 'pickup' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.type}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-3">
                    {order.items?.length || 0} items • ${order.total?.toFixed(2)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button size="sm" className="flex-1" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                        Accept
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button size="sm" className="flex-1" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button size="sm" className="flex-1" onClick={() => handleUpdateOrderStatus(order.id, 'completed')}>
                        Complete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

              {filteredOrders.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No {orderFilter} orders</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Launch Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ready to launch?</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                {menuItems.length > 0 ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-slate-700">
                  Menu has items ({menuItems.length} items in {categories.length} categories)
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {settings?.stripeOnboardingComplete ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-slate-700">
                  Stripe connected
                  {!settings?.stripeOnboardingComplete && (
                    <span className="text-slate-400 ml-1">(required)</span>
                  )}
                </span>
                {!settings?.stripeOnboardingComplete && (
                  <Link href="/dashboard/go-live">
                    <Button size="sm" variant="outline">Connect →</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-slate-500">Your store URL:</p>
              <p className="font-medium text-slate-900">orderflow.co/{settings?.slug}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLaunchModal(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 gap-2"
                disabled={menuItems.length === 0 || !settings?.stripeOnboardingComplete}
                onClick={async () => {
                  await fetch('/api/dashboard/launch', { method: 'POST' })
                  setSettings(s => s ? { ...s, isLive: true } : null)
                  setShowLaunchModal(false)
                }}
              >
                <Rocket className="w-4 h-4" />
                Launch Store
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
