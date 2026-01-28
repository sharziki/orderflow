'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ToastProvider, useToast } from '@/components/ui/toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Loader2,
  Utensils,
  AlertCircle,
  X,
  Smartphone,
  Monitor,
  RefreshCw,
  ImagePlus,
  Check,
  Settings2
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  image: string | null
  isAvailable: boolean
  isSoldOut: boolean
  sortOrder: number
  modifierGroupIds: string[]
}

interface ModifierGroup {
  id: string
  name: string
  isRequired: boolean
  minSelections: number
  maxSelections: number | null
  modifiers: { name: string; price: number }[]
}

interface Category {
  id: string
  name: string
  description: string | null
  sortOrder: number
  collapsed?: boolean
}

interface Tenant {
  id: string
  slug: string
  name: string
  primaryColor: string
  menuLayout: string
}

// Sortable Category Component
function SortableCategory({ 
  category, 
  items, 
  onToggleCollapse, 
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: { 
  category: Category
  items: MenuItem[]
  onToggleCollapse: (id: string) => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (id: string) => void
  onAddItem: (categoryId: string) => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200">
        <button 
          {...attributes} 
          {...listeners}
          className="p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </button>
        <button 
          onClick={() => onToggleCollapse(category.id)}
          className="p-1 hover:bg-slate-200 rounded"
        >
          {category.collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-900 truncate">{category.name}</span>
          <span className="ml-2 text-xs text-slate-500">{items.length} items</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditCategory(category)}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700"
            title="Edit category"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-600"
            title="Delete category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {!category.collapsed && (
        <div className="divide-y divide-slate-100">
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <SortableItem 
                key={item.id} 
                item={item}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </SortableContext>
          <button
            onClick={() => onAddItem(category.id)}
            className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      )}
    </div>
  )
}

// Sortable Item Component
function SortableItem({ 
  item, 
  onEdit, 
  onDelete,
}: { 
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isUnavailable = !item.isAvailable || item.isSoldOut

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-2 p-3 hover:bg-slate-50 group ${isUnavailable ? 'opacity-60' : ''}`}
    >
      <button 
        {...attributes} 
        {...listeners}
        className="p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </button>
      {item.image && (
        <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${isUnavailable ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {item.name}
          </span>
          {item.isSoldOut && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Sold out</span>
          )}
          {!item.isAvailable && !item.isSoldOut && (
            <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">Hidden</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
        )}
      </div>
      <span className="text-sm font-medium text-slate-700">${item.price.toFixed(2)}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700"
          title="Edit item"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-600"
          title="Delete item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// Edit Item Modal
function EditItemModal({
  item,
  categories,
  modifierGroups,
  onSave,
  onDelete,
  onClose,
  saving
}: {
  item: MenuItem | null
  categories: Category[]
  modifierGroups: ModifierGroup[]
  onSave: (item: Partial<MenuItem> & { id?: string }) => void
  onDelete?: (id: string) => void
  onClose: () => void
  saving: boolean
}) {
  const isNew = !item?.id
  const [formData, setFormData] = useState({
    id: item?.id || '',
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    categoryId: item?.categoryId || categories[0]?.id || '',
    image: item?.image || '',
    isAvailable: item?.isAvailable ?? true,
    isSoldOut: item?.isSoldOut ?? false,
    modifierGroupIds: item?.modifierGroupIds || []
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      
      if (res.ok) {
        const { url } = await res.json()
        setFormData(prev => ({ ...prev, image: url }))
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const toggleModifierGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      modifierGroupIds: prev.modifierGroupIds.includes(groupId)
        ? prev.modifierGroupIds.filter(id => id !== groupId)
        : [...prev.modifierGroupIds, groupId]
    }))
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.price) return
    onSave({
      ...formData,
      price: parseFloat(formData.price),
      description: formData.description || null,
    })
  }

  const handleDelete = () => {
    if (!item?.id || !onDelete) return
    if (confirm('Delete this item? This cannot be undone.')) {
      onDelete(item.id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{isNew ? 'Add Item' : 'Edit Item'}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Salmon Teriyaki"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Grilled salmon glazed with house teriyaki sauce, served with rice"
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Price */}
            <div>
              <Label>Price *</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <Label>Photo</Label>
              <div className="mt-2">
                {formData.image ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={formData.image} 
                      alt="Item" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 text-sm text-slate-600 truncate">
                      {formData.image.split('/').pop()}
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Upload New
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500">Upload Photo</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Modifiers Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Modifiers
                </Label>
                <Link 
                  href="/dashboard/settings?tab=modifiers" 
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Add Modifier Group
                </Link>
              </div>
              {modifierGroups.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                  No modifier groups yet. Create them in Settings → Modifiers.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {modifierGroups.map(group => {
                    const isLinked = formData.modifierGroupIds.includes(group.id)
                    return (
                      <button
                        key={group.id}
                        onClick={() => toggleModifierGroup(group.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          isLinked 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm text-slate-900">{group.name}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              {group.isRequired ? 'Required' : 'Optional'}
                              {group.maxSelections && `, max ${group.maxSelections}`}
                            </span>
                          </div>
                          {isLinked && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {group.modifiers.map(m => m.name).join(', ')}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sold Out Checkbox */}
            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="soldOut"
                checked={formData.isSoldOut}
                onChange={(e) => setFormData(prev => ({ ...prev, isSoldOut: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="soldOut" className="text-sm">
                <span className="font-medium text-slate-900">Sold out</span>
                <span className="text-slate-500 ml-1">(hides from customers)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              {!isNew && onDelete && (
                <Button 
                  variant="outline" 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  Delete Item
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || !formData.price || saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Edit Category Modal
function EditCategoryModal({
  category,
  onSave,
  onClose,
  saving
}: {
  category: Category | null
  onSave: (data: { id?: string; name: string; description: string | null }) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')

  const handleSubmit = () => {
    if (!name) return
    onSave({
      id: category?.id,
      name,
      description: description || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{category ? 'Edit Category' : 'Add Category'}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 🍣 Sushi Rolls"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Tip: Add an emoji!</p>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fresh hand-rolled sushi"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={!name || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {category ? 'Save' : 'Add Category'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Menu Editor Content (wrapped with ToastProvider)
function MenuEditorContent() {
  const { showToast } = useToast()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [addToCategoryId, setAddToCategoryId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  
  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'category' | 'item' | null>(null)

  // Preview state
  const [previewKey, setPreviewKey] = useState(0)
  const [showPreviewMobile, setShowPreviewMobile] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [authRes, catRes, itemsRes, modRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/menu/categories'),
        fetch('/api/menu/items'),
        fetch('/api/menu/modifier-groups')
      ])
      
      if (!authRes.ok) {
        window.location.href = '/login'
        return
      }
      
      const authData = await authRes.json()
      setTenant(authData.tenant)
      
      if (!catRes.ok || !itemsRes.ok) {
        throw new Error('Failed to load menu data')
      }
      
      const catData = await catRes.json()
      const itemsData = await itemsRes.json()
      const modData = modRes.ok ? await modRes.json() : { modifierGroups: [] }
      
      setCategories((catData.categories || []).sort((a: Category, b: Category) => a.sortOrder - b.sortOrder))
      setMenuItems((itemsData.items || []).sort((a: MenuItem, b: MenuItem) => a.sortOrder - b.sortOrder))
      setModifierGroups(modData.modifierGroups || [])
    } catch (err) {
      console.error('Error loading menu:', err)
      setError('Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const refreshPreview = useCallback(() => {
    setPreviewKey(k => k + 1)
  }, [])

  const getItemsInCategory = (categoryId: string) => {
    return menuItems
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const toggleCategoryCollapse = (categoryId: string) => {
    setCategories(categories.map(c => 
      c.id === categoryId ? { ...c, collapsed: !c.collapsed } : c
    ))
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    const isCategory = categories.some(c => c.id === active.id)
    setActiveDragType(isCategory ? 'category' : 'item')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveId(null)
      setActiveDragType(null)
      return
    }

    if (activeDragType === 'category') {
      const oldIndex = categories.findIndex(c => c.id === active.id)
      const newIndex = categories.findIndex(c => c.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex)
        setCategories(newCategories)
        await saveCategoryOrder(newCategories)
        showToast('Category order saved')
      }
    } else {
      const activeItem = menuItems.find(i => i.id === active.id)
      const overItem = menuItems.find(i => i.id === over.id)
      
      if (activeItem && overItem) {
        const newItems = [...menuItems]
        const oldIndex = newItems.findIndex(i => i.id === active.id)
        const newIndex = newItems.findIndex(i => i.id === over.id)
        
        if (activeItem.categoryId !== overItem.categoryId) {
          newItems[oldIndex] = { ...activeItem, categoryId: overItem.categoryId }
        }
        
        const reorderedItems = arrayMove(newItems, oldIndex, newIndex)
        setMenuItems(reorderedItems)
        await saveItemOrder(reorderedItems.filter(i => i.categoryId === overItem.categoryId), overItem.categoryId)
        showToast('Item order saved')
      }
    }

    setActiveId(null)
    setActiveDragType(null)
    refreshPreview()
  }

  const saveCategoryOrder = async (cats: Category[]) => {
    try {
      const res = await fetch('/api/menu/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: cats.map(c => c.id) })
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch (err) {
      showToast('Failed to save order', 'error')
    }
  }

  const saveItemOrder = async (items: MenuItem[], categoryId: string) => {
    try {
      const res = await fetch('/api/menu/items/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: items.map(i => i.id), categoryId })
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch (err) {
      showToast('Failed to save order', 'error')
    }
  }

  // CRUD operations
  const handleSaveItem = async (data: Partial<MenuItem> & { id?: string }) => {
    setSaving(true)
    try {
      const isNew = !data.id
      const url = isNew ? '/api/menu/items' : `/api/menu/items/${data.id}`
      const method = isNew ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error('Failed to save item')
      
      const { item } = await res.json()
      
      if (isNew) {
        setMenuItems(prev => [...prev, item])
        showToast('Item created')
      } else {
        setMenuItems(prev => prev.map(i => i.id === item.id ? item : i))
        showToast('Item updated')
      }
      
      setShowItemModal(false)
      setEditingItem(null)
      setAddToCategoryId(null)
      refreshPreview()
    } catch (err) {
      showToast('Failed to save item', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/menu/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setMenuItems(prev => prev.filter(i => i.id !== id))
      showToast('Item deleted')
      setShowItemModal(false)
      setEditingItem(null)
      refreshPreview()
    } catch (err) {
      showToast('Failed to delete item', 'error')
    }
  }

  const handleSaveCategory = async (data: { id?: string; name: string; description: string | null }) => {
    setSaving(true)
    try {
      const isNew = !data.id
      const url = isNew ? '/api/menu/categories' : `/api/menu/categories/${data.id}`
      const method = isNew ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error('Failed to save category')
      
      const { category } = await res.json()
      
      if (isNew) {
        setCategories(prev => [...prev, { ...category, _count: { menuItems: 0 } }])
        showToast('Category created')
      } else {
        setCategories(prev => prev.map(c => c.id === category.id ? { ...c, ...category } : c))
        showToast('Category updated')
      }
      
      setShowCategoryModal(false)
      setEditingCategory(null)
      refreshPreview()
    } catch (err) {
      showToast('Failed to save category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const itemCount = getItemsInCategory(id).length
    if (itemCount > 0) {
      showToast(`Cannot delete category with ${itemCount} items`, 'error')
      return
    }
    if (!confirm('Delete this category?')) return
    
    try {
      const res = await fetch(`/api/menu/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setCategories(prev => prev.filter(c => c.id !== id))
      showToast('Category deleted')
      refreshPreview()
    } catch (err) {
      showToast('Failed to delete category', 'error')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-semibold mb-2">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    )
  }

  const previewUrl = tenant?.slug ? `/store/${tenant.slug}?preview=true` : ''

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold text-slate-900">Menu Editor</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile preview toggle */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreviewMobile(!showPreviewMobile)}
                className="lg:hidden gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                {showPreviewMobile ? 'Editor' : 'Preview'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshPreview}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className={`w-full lg:w-1/2 border-r border-slate-200 bg-white overflow-y-auto ${showPreviewMobile ? 'hidden lg:block' : ''}`}>
          <div className="p-4">
            {/* Categories Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Categories</h2>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}
                className="gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Add Category
              </Button>
            </div>

            {/* Empty State */}
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Create your menu</h3>
                <p className="text-sm text-slate-600 mb-4">Start by adding categories</p>
                <Button onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add First Category
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {categories.map(category => (
                      <SortableCategory
                        key={category.id}
                        category={category}
                        items={getItemsInCategory(category.id)}
                        onToggleCollapse={toggleCategoryCollapse}
                        onEditCategory={(cat) => { setEditingCategory(cat); setShowCategoryModal(true) }}
                        onDeleteCategory={handleDeleteCategory}
                        onAddItem={(catId) => { setAddToCategoryId(catId); setEditingItem(null); setShowItemModal(true) }}
                        onEditItem={(item) => { setEditingItem(item); setShowItemModal(true) }}
                        onDeleteItem={handleDeleteItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className={`w-full lg:w-1/2 bg-slate-200 overflow-y-auto p-4 ${!showPreviewMobile ? 'hidden lg:block' : ''}`}>
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900 mb-1">Live Preview</h2>
            <p className="text-xs text-slate-600">
              Uses your branding, layout, and live menu data
            </p>
          </div>

          {/* Preview Frames */}
          <div className="flex gap-4">
            {/* Mobile Preview */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Mobile (375px)</span>
              </div>
              <div 
                className="bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-slate-800"
                style={{ width: 195, height: 420 }}
              >
                <div className="w-full h-full overflow-hidden">
                  <iframe
                    key={`mobile-${previewKey}`}
                    src={previewUrl}
                    className="origin-top-left"
                    style={{ 
                      width: 375,
                      height: 812,
                      transform: 'scale(0.52)',
                      border: 'none'
                    }}
                    title="Mobile Preview"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Preview */}
            <div className="flex-1 min-w-0 hidden xl:block">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Desktop (1024px)</span>
              </div>
              <div 
                className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-300"
                style={{ height: 420 }}
              >
                <div className="w-full h-full overflow-hidden">
                  <iframe
                    key={`desktop-${previewKey}`}
                    src={previewUrl}
                    className="origin-top-left w-full"
                    style={{ 
                      width: '192%',
                      height: '192%',
                      transform: 'scale(0.52)',
                      border: 'none'
                    }}
                    title="Desktop Preview"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Preview updates live</p>
            <p className="text-xs text-blue-600">
              Changes reflect within 1-2 seconds after saving.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showItemModal && (
        <EditItemModal
          item={editingItem || (addToCategoryId ? { categoryId: addToCategoryId } as MenuItem : null)}
          categories={categories}
          modifierGroups={modifierGroups}
          onSave={handleSaveItem}
          onDelete={editingItem?.id ? handleDeleteItem : undefined}
          onClose={() => { setShowItemModal(false); setEditingItem(null); setAddToCategoryId(null) }}
          saving={saving}
        />
      )}

      {showCategoryModal && (
        <EditCategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null) }}
          saving={saving}
        />
      )}
    </div>
  )
}

// Main Page with ToastProvider
export default function MenuEditorPage() {
  return (
    <ToastProvider>
      <MenuEditorContent />
    </ToastProvider>
  )
}
