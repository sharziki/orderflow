'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MenuPreview } from '@/components/ui/menu-preview'
import {
  ArrowLeft,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  DollarSign,
  Utensils,
  X,
  Save,
  Upload,
  Monitor,
  Smartphone
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  available: boolean
}

interface Category {
  id: string
  name: string
  itemCount: number
}

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
  // Restaurant settings (would come from API)
  const restaurantSettings = {
    name: 'Demo Restaurant',
    template: 'modern' as const,
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
  }

  // Sample data
  const [categories] = useState<Category[]>([
    { id: 'appetizers', name: 'Appetizers', itemCount: 8 },
    { id: 'mains', name: 'Main Courses', itemCount: 12 },
    { id: 'sides', name: 'Sides', itemCount: 6 },
    { id: 'desserts', name: 'Desserts', itemCount: 4 },
    { id: 'drinks', name: 'Drinks', itemCount: 10 },
  ])

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'Caesar Salad', description: 'Crisp romaine, parmesan, croutons', price: 12.99, category: 'appetizers', available: true },
    { id: '2', name: 'Garlic Bread', description: 'Toasted with butter and herbs', price: 6.99, category: 'appetizers', available: true },
    { id: '3', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter', price: 24.99, category: 'mains', available: true },
    { id: '4', name: 'Ribeye Steak', description: '12oz prime cut, grilled to perfection', price: 34.99, category: 'mains', available: false },
    { id: '5', name: 'Chocolate Lava Cake', description: 'Warm cake with molten center', price: 9.99, category: 'desserts', available: true },
  ])

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'appetizers',
  })

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleAvailability = (id: string) => {
    setMenuItems(items => 
      items.map(item => 
        item.id === id ? { ...item, available: !item.available } : item
      )
    )
  }

  const deleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setMenuItems(items => items.filter(item => item.id !== id))
    }
  }

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) return
    
    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      available: true,
    }
    
    setMenuItems(prev => [...prev, item])
    setNewItem({ name: '', description: '', price: '', category: 'appetizers' })
    setShowAddModal(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Menu Management</h1>
                <p className="text-sm text-slate-500">{menuItems.length} items</p>
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
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    activeCategory === 'all' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <span className="font-medium">All Items</span>
                  <span className="text-sm text-slate-500">{menuItems.length}</span>
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      activeCategory === cat.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-sm text-slate-500">
                      {menuItems.filter(i => i.category === cat.id).length}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
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

            {/* Items Grid */}
            <div className="grid gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className={`transition-all ${!item.available ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-6 flex-shrink-0 pt-2 cursor-grab">
                        <GripVertical className="w-5 h-5 text-slate-300" />
                      </div>
                      
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                            <p className="text-lg font-bold text-slate-900 mt-2">${item.price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAvailability(item.id)}
                              className={item.available ? 'text-green-600' : 'text-slate-400'}
                            >
                              {item.available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                              <Edit className="w-5 h-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteItem(item.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.available 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {categories.find(c => c.id === item.category)?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No items found</h3>
                  <p className="text-slate-500 mt-1">Try a different search or add a new item</p>
                  <Button onClick={() => setShowAddModal(true)} className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Item
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Preview */}
      {showPreview && (
        <MenuPreview
          template={restaurantSettings.template}
          restaurantName={restaurantSettings.name}
          primaryColor={restaurantSettings.primaryColor}
          secondaryColor={restaurantSettings.secondaryColor}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Menu Item</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Margherita Pizza"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Fresh tomatoes, mozzarella, basil"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-background"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} className="gap-2">
                  <Save className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
