'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MenuPreview } from '@/components/ui/menu-preview'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  DollarSign,
  X,
  Save,
  Monitor,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Loader2,
  Utensils,
  AlertCircle
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  image: string | null
  isAvailable: boolean
  category?: { id: string; name: string }
}

interface Category {
  id: string
  name: string
  description: string | null
  sortOrder: number
  _count?: { menuItems: number }
  collapsed?: boolean
}

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, itemsRes] = await Promise.all([
        fetch('/api/menu/categories'),
        fetch('/api/menu/items')
      ])
      
      if (!catRes.ok || !itemsRes.ok) {
        throw new Error('Failed to load menu data')
      }
      
      const catData = await catRes.json()
      const itemsData = await itemsRes.json()
      
      setCategories(catData.categories || [])
      setMenuItems(itemsData.items || [])
      
      // Set default category for new items
      if (catData.categories?.length > 0 && !newItem.categoryId) {
        setNewItem(prev => ({ ...prev, categoryId: catData.categories[0].id }))
      }
    } catch (err) {
      console.error('Error loading menu:', err)
      setError('Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategoryCollapse = (categoryId: string) => {
    setCategories(categories.map(c => 
      c.id === categoryId ? { ...c, collapsed: !c.collapsed } : c
    ))
  }

  const getItemsInCategory = (categoryId: string) => {
    return menuItems.filter(item => item.categoryId === categoryId)
  }

  const filteredCategories = categories.filter(category => {
    if (!search) return true
    const items = getItemsInCategory(category.id)
    return category.name.toLowerCase().includes(search.toLowerCase()) ||
           items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  })

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/menu/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable })
      })
      if (!res.ok) throw new Error('Failed to update')
      setMenuItems(items => 
        items.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)
      )
    } catch (err) {
      console.error('Error toggling availability:', err)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const res = await fetch(`/api/menu/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setMenuItems(items => items.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error deleting item:', err)
    }
  }

  const deleteCategory = async (id: string) => {
    const itemCount = getItemsInCategory(id).length
    if (itemCount > 0) {
      alert(`Cannot delete category with ${itemCount} items. Move or delete items first.`)
      return
    }
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const res = await fetch(`/api/menu/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setCategories(categories.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error deleting category:', err)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory || newItem.categoryId,
          name: newItem.name,
          description: newItem.description || null,
          price: parseFloat(newItem.price),
          isAvailable: true,
        })
      })
      
      if (!res.ok) throw new Error('Failed to create item')
      
      const { item } = await res.json()
      setMenuItems(prev => [...prev, item])
      setNewItem({ name: '', description: '', price: '', categoryId: categories[0]?.id || '' })
      setShowAddModal(false)
      setSelectedCategory(null)
    } catch (err) {
      console.error('Error adding item:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/menu/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          categoryId: editingItem.categoryId,
          isAvailable: editingItem.isAvailable,
        })
      })
      
      if (!res.ok) throw new Error('Failed to update item')
      
      setMenuItems(items => items.map(i => i.id === editingItem.id ? editingItem : i))
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description || null,
        })
      })
      
      if (!res.ok) throw new Error('Failed to create category')
      
      const { category } = await res.json()
      setCategories(prev => [...prev, { ...category, _count: { menuItems: 0 } }])
      setNewCategory({ name: '', description: '' })
      setShowAddCategoryModal(false)
    } catch (err) {
      console.error('Error adding category:', err)
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-semibold mb-2">Failed to load menu</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Menu Management</h1>
            </div>
          </div>
        </header>
        
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Create your menu</h2>
          <p className="text-slate-600 mb-8">
            Start by adding categories (like "Appetizers", "Main Courses") then add your menu items.
          </p>
          <Button onClick={() => setShowAddCategoryModal(true)} size="lg" className="gap-2">
            <FolderPlus className="w-5 h-5" />
            Add First Category
          </Button>
        </div>

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Add Category</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddCategoryModal(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Category Name *</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., 🥗 Appetizers"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Start your meal right"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddCategoryModal(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleAddCategory} disabled={!newCategory.name || saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Category
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Menu Management</h1>
                <p className="text-sm text-slate-500">{categories.length} categories • {menuItems.length} items</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)} 
                className="gap-2"
              >
                <Monitor className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={() => setShowAddCategoryModal(true)} variant="outline" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Add Category
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10 h-12"
          />
        </div>

        {/* Categories and Items */}
        <div className="space-y-6">
          {filteredCategories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleCategoryCollapse(category.id)}
              >
                <div className="flex items-center gap-3">
                  {category.collapsed ? (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-sm text-slate-500">
                      {getItemsInCategory(category.id).length} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCategory(category.id)
                      setNewItem(prev => ({ ...prev, categoryId: category.id }))
                      setShowAddModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCategory(category.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
              
              {!category.collapsed && (
                <div className="divide-y divide-slate-100">
                  {getItemsInCategory(category.id).length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <p>No items in this category yet</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setNewItem(prev => ({ ...prev, categoryId: category.id }))
                          setShowAddModal(true)
                        }}
                        className="mt-2"
                      >
                        Add first item
                      </Button>
                    </div>
                  ) : (
                    getItemsInCategory(category.id).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <GripVertical className="w-5 h-5 text-slate-300 cursor-move" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${!item.isAvailable ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {item.name}
                              </span>
                              {!item.isAvailable && (
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                  Hidden
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900">${item.price.toFixed(2)}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAvailability(item)}
                              title={item.isAvailable ? 'Hide from menu' : 'Show on menu'}
                            >
                              {item.isAvailable ? (
                                <Eye className="w-4 h-4 text-slate-400" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="w-4 h-4 text-slate-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Add Menu Item</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowAddModal(false); setSelectedCategory(null) }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Category *</Label>
                  <select
                    value={selectedCategory || newItem.categoryId}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Item Name *</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Grilled Salmon"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="e.g., Fresh Atlantic salmon with lemon butter sauce"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); setSelectedCategory(null) }}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={handleAddItem} 
                    disabled={!newItem.name || !newItem.price || saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Edit Menu Item</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleUpdateItem} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Add Category</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddCategoryModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Category Name *</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., 🥗 Appetizers"
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tip: Add an emoji for visual appeal!</p>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Start your meal right"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddCategoryModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleAddCategory} disabled={!newCategory.name || saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Category
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <MenuPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          categories={categories.map(c => ({ id: c.id, name: c.name }))}
          items={menuItems.map(i => ({ 
            id: i.id, 
            name: i.name, 
            description: i.description || '', 
            price: i.price, 
            category: i.categoryId,
            available: i.isAvailable
          }))}
          template="modern"
          primaryColor="#2563eb"
          restaurantName="Your Restaurant"
        />
      )}
    </div>
  )
}
