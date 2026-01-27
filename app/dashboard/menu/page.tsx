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
  ChevronDown,
  ChevronRight,
  FolderPlus,
  MoreHorizontal,
  Copy,
  Layers
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  sectionId: string
  imageUrl?: string
  available: boolean
}

interface Section {
  id: string
  name: string
  description?: string
  collapsed?: boolean
  sortOrder: number
}

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  
  // Restaurant settings (would come from API)
  const restaurantSettings = {
    name: 'Demo Restaurant',
    template: 'modern' as const,
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
  }

  const [sections, setSections] = useState<Section[]>([
    { id: 'appetizers', name: '🥗 Appetizers', description: 'Start your meal right', sortOrder: 1 },
    { id: 'mains', name: '🍝 Main Courses', description: 'Hearty entrees', sortOrder: 2 },
    { id: 'pizza', name: '🍕 Pizza', description: 'Wood-fired & delicious', sortOrder: 3 },
    { id: 'sides', name: '🥔 Sides', description: 'Perfect additions', sortOrder: 4 },
    { id: 'desserts', name: '🍰 Desserts', description: 'Sweet endings', sortOrder: 5 },
    { id: 'drinks', name: '🥤 Beverages', description: 'Refreshing drinks', sortOrder: 6 },
  ])

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    // Appetizers
    { id: '1', name: 'Caesar Salad', description: 'Crisp romaine, parmesan, croutons, house-made dressing', price: 12.99, sectionId: 'appetizers', available: true },
    { id: '2', name: 'Garlic Bread', description: 'Toasted with butter and herbs, served with marinara', price: 6.99, sectionId: 'appetizers', available: true },
    { id: '3', name: 'Bruschetta', description: 'Fresh tomatoes, basil, garlic on toasted ciabatta', price: 9.99, sectionId: 'appetizers', available: true },
    { id: '4', name: 'Mozzarella Sticks', description: 'Golden fried with marinara dipping sauce', price: 8.99, sectionId: 'appetizers', available: true },
    { id: '5', name: 'Calamari Fritti', description: 'Crispy fried calamari with spicy aioli', price: 14.99, sectionId: 'appetizers', available: true },
    
    // Mains
    { id: '6', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce, asparagus', price: 24.99, sectionId: 'mains', available: true },
    { id: '7', name: 'Ribeye Steak', description: '12oz prime cut, grilled to perfection with herb butter', price: 34.99, sectionId: 'mains', available: true },
    { id: '8', name: 'Chicken Parmesan', description: 'Breaded chicken with marinara and melted mozzarella', price: 19.99, sectionId: 'mains', available: true },
    { id: '9', name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce, option to add chicken or shrimp', price: 16.99, sectionId: 'mains', available: true },
    { id: '10', name: 'Lobster Ravioli', description: 'Handmade pasta, lobster filling, rose cream sauce', price: 28.99, sectionId: 'mains', available: true },
    
    // Pizza
    { id: '11', name: 'Margherita', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 14.99, sectionId: 'pizza', available: true },
    { id: '12', name: 'Pepperoni', description: 'Classic pepperoni with mozzarella cheese', price: 16.99, sectionId: 'pizza', available: true },
    { id: '13', name: 'BBQ Chicken', description: 'Grilled chicken, red onion, BBQ sauce, cilantro', price: 18.99, sectionId: 'pizza', available: true },
    { id: '14', name: 'Meat Lovers', description: 'Pepperoni, sausage, bacon, ham', price: 19.99, sectionId: 'pizza', available: true },
    
    // Sides
    { id: '15', name: 'Mashed Potatoes', description: 'Creamy with butter and chives', price: 5.99, sectionId: 'sides', available: true },
    { id: '16', name: 'Grilled Vegetables', description: 'Seasonal vegetables with herbs', price: 6.99, sectionId: 'sides', available: true },
    { id: '17', name: 'French Fries', description: 'Crispy golden fries with sea salt', price: 4.99, sectionId: 'sides', available: true },
    { id: '18', name: 'House Salad', description: 'Mixed greens, tomato, cucumber, balsamic', price: 7.99, sectionId: 'sides', available: true },
    
    // Desserts
    { id: '19', name: 'Chocolate Lava Cake', description: 'Warm cake with molten chocolate center, vanilla ice cream', price: 9.99, sectionId: 'desserts', available: true },
    { id: '20', name: 'Tiramisu', description: 'Classic Italian dessert with espresso and mascarpone', price: 8.99, sectionId: 'desserts', available: true },
    { id: '21', name: 'New York Cheesecake', description: 'Creamy cheesecake with berry compote', price: 8.99, sectionId: 'desserts', available: true },
    { id: '22', name: 'Gelato', description: 'Three scoops, ask for todays flavors', price: 6.99, sectionId: 'desserts', available: true },
    
    // Drinks
    { id: '23', name: 'Soft Drinks', description: 'Coke, Diet Coke, Sprite, Lemonade', price: 2.99, sectionId: 'drinks', available: true },
    { id: '24', name: 'Iced Tea', description: 'Fresh brewed, sweetened or unsweetened', price: 2.99, sectionId: 'drinks', available: true },
    { id: '25', name: 'Italian Soda', description: 'Choice of flavors with cream', price: 4.99, sectionId: 'drinks', available: true },
    { id: '26', name: 'Espresso', description: 'Double shot', price: 3.99, sectionId: 'drinks', available: true },
    { id: '27', name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 4.99, sectionId: 'drinks', available: true },
  ])

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    sectionId: sections[0]?.id || '',
  })

  const [newSection, setNewSection] = useState({
    name: '',
    description: '',
  })

  const toggleSectionCollapse = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    ))
  }

  const getItemsInSection = (sectionId: string) => {
    return menuItems.filter(item => item.sectionId === sectionId)
  }

  const filteredSections = sections.filter(section => {
    if (!search) return true
    const items = getItemsInSection(section.id)
    return section.name.toLowerCase().includes(search.toLowerCase()) ||
           items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
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

  const deleteSection = (id: string) => {
    const itemCount = getItemsInSection(id).length
    if (itemCount > 0) {
      alert(`Cannot delete section with ${itemCount} items. Move or delete items first.`)
      return
    }
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== id))
    }
  }

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) return
    
    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      sectionId: selectedSection || newItem.sectionId,
      available: true,
    }
    
    setMenuItems(prev => [...prev, item])
    setNewItem({ name: '', description: '', price: '', sectionId: sections[0]?.id || '' })
    setShowAddModal(false)
    setSelectedSection(null)
  }

  const handleAddSection = () => {
    if (!newSection.name) return
    
    const section: Section = {
      id: Date.now().toString(),
      name: newSection.name,
      description: newSection.description,
      sortOrder: sections.length + 1,
    }
    
    setSections(prev => [...prev, section])
    setNewSection({ name: '', description: '' })
    setShowAddSectionModal(false)
  }

  // For preview compatibility
  const categoriesForPreview = sections.map(s => ({ id: s.id, name: s.name }))
  const itemsForPreview = menuItems.map(i => ({ ...i, category: i.sectionId }))

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
                <p className="text-sm text-slate-500">{sections.length} sections • {menuItems.length} items</p>
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
              <Button onClick={() => setShowAddSectionModal(true)} variant="outline" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Add Section
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
            placeholder="Search sections or items..."
            className="pl-10 h-12"
          />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {filteredSections.map((section, index) => {
            const items = getItemsInSection(section.id).filter(item => 
              !search || item.name.toLowerCase().includes(search.toLowerCase())
            )
            
            return (
              <Card key={section.id} className="overflow-hidden">
                {/* Section Header */}
                <div 
                  className="px-4 py-3 bg-slate-50 border-b flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSectionCollapse(section.id)}
                >
                  <GripVertical className="w-5 h-5 text-slate-300 cursor-grab" />
                  <button className="p-1">
                    {section.collapsed ? (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{section.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                        {items.length} items
                      </span>
                    </div>
                    {section.description && (
                      <p className="text-sm text-slate-500">{section.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSection(section.id)
                        setNewItem(prev => ({ ...prev, sectionId: section.id }))
                        setShowAddModal(true)
                      }}
                      className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSection(section)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSection(section.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Section Items */}
                {!section.collapsed && (
                  <div className="divide-y">
                    {items.length === 0 ? (
                      <div className="p-8 text-center">
                        <Layers className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 mb-3">No items in this section</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSection(section.id)
                            setNewItem(prev => ({ ...prev, sectionId: section.id }))
                            setShowAddModal(true)
                          }}
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add First Item
                        </Button>
                      </div>
                    ) : (
                      items.map(item => (
                        <div 
                          key={item.id} 
                          className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${
                            !item.available ? 'opacity-50' : ''
                          }`}
                        >
                          <GripVertical className="w-5 h-5 text-slate-300 cursor-grab flex-shrink-0" />
                          
                          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900">{item.name}</h4>
                            <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-slate-900">${item.price.toFixed(2)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.available 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.available ? 'Available' : 'Hidden'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAvailability(item.id)}
                              className={item.available ? 'text-green-600' : 'text-slate-400'}
                            >
                              {item.available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                              <Edit className="w-5 h-5 text-slate-400" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteItem(item.id)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            )
          })}

          {/* Add Section Card */}
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="w-full p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
          >
            <FolderPlus className="w-5 h-5" />
            Add New Section
          </button>
        </div>
      </div>

      {/* Menu Preview */}
      {showPreview && (
        <MenuPreview
          template={restaurantSettings.template}
          restaurantName={restaurantSettings.name}
          primaryColor={restaurantSettings.primaryColor}
          secondaryColor={restaurantSettings.secondaryColor}
          menuItems={itemsForPreview}
          categories={categoriesForPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Section</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddSectionModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Name</Label>
                <Input
                  value={newSection.name}
                  onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Lunch Specials"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newSection.description}
                  onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Available 11am-3pm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddSectionModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSection} className="gap-2">
                  <FolderPlus className="w-4 h-4" />
                  Add Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Add Menu Item</CardTitle>
                {selectedSection && (
                  <p className="text-sm text-slate-500 mt-1">
                    Adding to: {sections.find(s => s.id === selectedSection)?.name}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setShowAddModal(false); setSelectedSection(null); }}>
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
                
                {!selectedSection && (
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <select
                      value={newItem.sectionId}
                      onChange={(e) => setNewItem(prev => ({ ...prev, sectionId: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background"
                    >
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setShowAddModal(false); setSelectedSection(null); }}>
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
