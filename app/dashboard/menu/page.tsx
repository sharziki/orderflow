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
  Settings2,
  Package,
  Store,
  Clock,
  Camera,
  Palette
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  image: string | null
  images: string[] // Multiple images for hover animations
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
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
  logo?: string | null
  phone?: string | null
  address?: string | null
  businessHours?: Record<string, { open: string; close: string; closed: boolean }>
  ctaEnabled?: boolean
  ctaText?: string | null
  ctaSubtext?: string | null
  ctaLink?: string | null
  ctaButtonText?: string | null
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
}

// Layout options for preview (must match store page layout param)
const PREVIEW_LAYOUTS = [
  { id: 'wide', name: 'Modern Cards' },
  { id: 'blu-bentonville', name: 'Sidebar' },
  { id: 'slice', name: 'Slice' },
  { id: 'modern', name: 'Modern' },
  { id: 'classic', name: 'Classic' },
] as const

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
  saving,
  onEditModifierGroup,
  onAddModifierGroup
}: {
  item: MenuItem | null
  categories: Category[]
  modifierGroups: ModifierGroup[]
  onSave: (item: Partial<MenuItem> & { id?: string }) => void
  onDelete?: (id: string) => void
  onClose: () => void
  saving: boolean
  onEditModifierGroup?: (group: ModifierGroup) => void
  onAddModifierGroup?: () => void
}) {
  const isNew = !item?.id
  // Migrate legacy single image to images array
  const initialImages = item?.images?.length ? item.images : (item?.image ? [item.image] : [])
  const [formData, setFormData] = useState({
    id: item?.id || '',
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    categoryId: item?.categoryId || categories[0]?.id || '',
    image: item?.image || '',
    images: initialImages,
    isAvailable: item?.isAvailable ?? true,
    isSoldOut: item?.isSoldOut ?? false,
    modifierGroupIds: item?.modifierGroupIds || []
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []
      
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd
        })
        
        if (res.ok) {
          const { url } = await res.json()
          uploadedUrls.push(url)
        }
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
          // Set first image as primary for backwards compatibility
          image: prev.images.length === 0 ? uploadedUrls[0] : prev.image
        }))
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index)
      return {
        ...prev,
        images: newImages,
        // Update primary image if removed
        image: newImages[0] || ''
      }
    })
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newImages = [...prev.images]
      const [removed] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, removed)
      return {
        ...prev,
        images: newImages,
        image: newImages[0] || ''
      }
    })
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
      image: formData.images[0] || null, // Primary image for backwards compatibility
      images: formData.images,
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

            {/* Photo Upload - Multiple Images */}
            <div>
              <Label className="flex items-center gap-2">
                Photos
                <span className="text-xs text-slate-400 font-normal">(first image is default, hover cycles through others)</span>
              </Label>
              <div className="mt-2 space-y-3">
                {/* Image Grid */}
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, index) => (
                      <div 
                        key={img} 
                        className={`relative group ${index === 0 ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                      >
                        <img 
                          src={img} 
                          alt={`Item ${index + 1}`} 
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute -top-1 -left-1 bg-blue-500 text-white text-[10px] px-1 rounded">
                            Main
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => moveImage(index, 0)}
                              className="p-1 bg-white/90 rounded text-slate-700 hover:bg-white"
                              title="Make primary"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => removeImage(index)}
                            className="p-1 bg-white/90 rounded text-red-500 hover:bg-white"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <ImagePlus className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {formData.images.length > 0 ? 'Add More Photos' : 'Upload Photos'}
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
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
                  Modifiers (Upcharges)
                </Label>
                {onAddModifierGroup && (
                  <button 
                    type="button"
                    onClick={onAddModifierGroup}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Modifier Group
                  </button>
                )}
              </div>
              {modifierGroups.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                  No modifier groups yet. Click "+ Add Modifier Group" to create one.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {modifierGroups.map(group => {
                    const isLinked = formData.modifierGroupIds.includes(group.id)
                    return (
                      <div
                        key={group.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isLinked 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleModifierGroup(group.id)}
                            className="flex-1 text-left"
                          >
                            <span className="font-medium text-sm text-slate-900">{group.name}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              {group.isRequired ? 'Required' : 'Optional'}
                              {group.maxSelections && `, max ${group.maxSelections}`}
                            </span>
                          </button>
                          <div className="flex items-center gap-2">
                            {onEditModifierGroup && (
                              <button
                                type="button"
                                onClick={() => onEditModifierGroup(group)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit modifier group"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isLinked && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {group.modifiers.map(m => `${m.name}${m.price > 0 ? ` (+$${m.price.toFixed(2)})` : ''}`).join(', ')}
                        </div>
                      </div>
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

// Modifier Group Modal
function ModifierGroupModal({
  modifierGroup,
  onSave,
  onDelete,
  onClose,
  saving
}: {
  modifierGroup: ModifierGroup | null
  onSave: (data: {
    id?: string
    name: string
    modifiers: { name: string; price: number }[]
    isRequired: boolean
    minSelections: number
    maxSelections: number | null
  }) => void
  onDelete?: (id: string) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName] = useState(modifierGroup?.name || '')
  const [isRequired, setIsRequired] = useState(modifierGroup?.isRequired || false)
  const [minSelections, setMinSelections] = useState(modifierGroup?.minSelections || 0)
  const [maxSelections, setMaxSelections] = useState<number | ''>(modifierGroup?.maxSelections || '')
  const [modifiers, setModifiers] = useState<{ name: string; price: number }[]>(
    modifierGroup?.modifiers || [{ name: '', price: 0 }]
  )

  const addModifier = () => {
    setModifiers([...modifiers, { name: '', price: 0 }])
  }

  const removeModifier = (index: number) => {
    if (modifiers.length > 1) {
      setModifiers(modifiers.filter((_, i) => i !== index))
    }
  }

  const updateModifier = (index: number, field: 'name' | 'price', value: string | number) => {
    setModifiers(modifiers.map((m, i) => 
      i === index ? { ...m, [field]: field === 'price' ? parseFloat(value as string) || 0 : value } : m
    ))
  }

  const handleSubmit = () => {
    // Filter out empty modifiers
    const validModifiers = modifiers.filter(m => m.name.trim())
    if (!name.trim() || validModifiers.length === 0) return

    onSave({
      id: modifierGroup?.id,
      name: name.trim(),
      modifiers: validModifiers,
      isRequired,
      minSelections,
      maxSelections: maxSelections === '' ? null : maxSelections
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {modifierGroup ? 'Edit Modifier Group' : 'Add Modifier Group'}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Group Name */}
            <div>
              <Label>Group Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Toppings, Sides, Size"
                className="mt-1"
              />
            </div>

            {/* Options/Modifiers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options (Upcharges)</Label>
                <button
                  type="button"
                  onClick={addModifier}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Option
                </button>
              </div>
              <div className="space-y-2">
                {modifiers.map((mod, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={mod.name}
                      onChange={(e) => updateModifier(index, 'name', e.target.value)}
                      placeholder="Option name (e.g., Extra Cheese)"
                      className="flex-1"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mod.price || ''}
                        onChange={(e) => updateModifier(index, 'price', e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                    {modifiers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeModifier(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Set price to 0 for free options
              </p>
            </div>

            {/* Selection Rules */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Required
                </Label>
                <p className="text-xs text-slate-500 mt-1">Customer must select</p>
              </div>
              <div>
                <Label>Min Selections</Label>
                <Input
                  type="number"
                  min="0"
                  value={minSelections}
                  onChange={(e) => setMinSelections(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Max Selections (leave empty for unlimited)</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxSelections}
                  onChange={(e) => setMaxSelections(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {modifierGroup?.id && onDelete && (
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(modifierGroup.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!name.trim() || modifiers.filter(m => m.name.trim()).length === 0 || saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {modifierGroup ? 'Save' : 'Create'}
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
  
  // Modifier groups modal state
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null)
  const [savingModifier, setSavingModifier] = useState(false)
  
  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'category' | 'item' | null>(null)

  // Preview state
  const [previewKey, setPreviewKey] = useState(0)
  const [showPreviewMobile, setShowPreviewMobile] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop')
  const [previewLayout, setPreviewLayout] = useState<string>('blu-bentonville')
  
  // Store settings state
  const [showStoreSettings, setShowStoreSettings] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeLogo, setStoreLogo] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  
  // CTA Settings
  const [ctaEnabled, setCtaEnabled] = useState(false)
  const [ctaText, setCtaText] = useState('')
  const [ctaSubtext, setCtaSubtext] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [ctaButtonText, setCtaButtonText] = useState('')

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
      const t = authData.tenant
      setTenant(t)
      setPreviewLayout(t?.menuLayout || 'blu-bentonville')
      
      // Populate store settings
      setStoreName(t?.name || '')
      setStorePhone(t?.phone || '')
      setStoreAddress(t?.address || '')
      setStoreLogo(t?.logo || null)
      setPrimaryColor(t?.primaryColor || '#2563eb')
      setBusinessHours(t?.businessHours || {})
      
      // Populate CTA settings
      setCtaEnabled(t?.ctaEnabled || false)
      setCtaText(t?.ctaText || '')
      setCtaSubtext(t?.ctaSubtext || '')
      setCtaLink(t?.ctaLink || '')
      setCtaButtonText(t?.ctaButtonText || 'Learn More')
      
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

  // Store settings functions
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo must be less than 5MB', 'error')
      return
    }
    
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        const { url } = await res.json()
        setStoreLogo(url)
        // Auto-save logo
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo: url })
        })
        showToast('Logo updated')
        refreshPreview()
      } else {
        showToast('Failed to upload logo', 'error')
      }
    } catch (err) {
      showToast('Upload failed', 'error')
    } finally {
      setUploadingLogo(false)
    }
  }

  const saveStoreSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          phone: storePhone,
          address: storeAddress,
          primaryColor,
          businessHours,
          ctaEnabled,
          ctaText,
          ctaSubtext,
          ctaLink,
          ctaButtonText
        })
      })
      
      if (res.ok) {
        showToast('Settings saved')
        setTenant(prev => prev ? { 
          ...prev, 
          name: storeName, 
          phone: storePhone, 
          address: storeAddress,
          primaryColor,
          businessHours 
        } : null)
        refreshPreview()
      } else {
        showToast('Failed to save settings', 'error')
      }
    } catch (err) {
      showToast('Save failed', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const updateBusinessHour = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day] || { open: '09:00', close: '21:00', closed: false },
        [field]: value
      }
    }))
  }

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

  // Modifier group handlers
  const handleSaveModifierGroup = async (data: {
    id?: string
    name: string
    modifiers: { name: string; price: number }[]
    isRequired: boolean
    minSelections: number
    maxSelections: number | null
  }) => {
    setSavingModifier(true)
    try {
      const url = data.id 
        ? `/api/menu/modifier-groups/${data.id}` 
        : '/api/menu/modifier-groups'
      const method = data.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      const result = await res.json()
      
      if (data.id) {
        setModifierGroups(prev => prev.map(g => g.id === data.id ? result.modifierGroup : g))
        showToast('Modifier group updated')
      } else {
        setModifierGroups(prev => [...prev, result.modifierGroup])
        showToast('Modifier group created')
      }
      
      setShowModifierModal(false)
      setEditingModifierGroup(null)
      refreshPreview()
    } catch (err) {
      showToast('Failed to save modifier group', 'error')
    } finally {
      setSavingModifier(false)
    }
  }

  const handleDeleteModifierGroup = async (id: string) => {
    if (!confirm('Delete this modifier group? It will be removed from all items.')) return
    
    try {
      const res = await fetch(`/api/menu/modifier-groups/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setModifierGroups(prev => prev.filter(g => g.id !== id))
      showToast('Modifier group deleted')
      setShowModifierModal(false)
      setEditingModifierGroup(null)
      refreshPreview()
    } catch (err) {
      showToast('Failed to delete modifier group', 'error')
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

  const previewUrl = tenant?.slug ? `/store/${tenant.slug}?preview=true&layout=${previewLayout}` : ''

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
          <div className="p-4 space-y-4">
            {/* Store Settings Section */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowStoreSettings(!showStoreSettings)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-900">Store Settings</span>
                </div>
                {showStoreSettings ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              
              {showStoreSettings && (
                <div className="p-4 border-t border-slate-200 space-y-4">
                  {/* Logo */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      {storeLogo ? (
                        <div className="relative">
                          <img
                            src={storeLogo}
                            alt="Logo"
                            className="w-16 h-16 rounded-lg object-cover border-2 border-slate-200"
                          />
                          <button
                            onClick={() => {
                              setStoreLogo(null)
                              fetch('/api/settings', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ logo: null })
                              }).then(() => {
                                showToast('Logo removed')
                                refreshPreview()
                              })
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-0.5 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          ) : (
                            <>
                              <Camera className="w-5 h-5 text-slate-400" />
                              <span className="text-[10px] text-slate-500">Upload</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {storeLogo ? 'Change' : 'Add logo'}
                      </button>
                    </div>
                  </div>

                  {/* Store Name */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Store Name</Label>
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Your Restaurant"
                      className="mt-1"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Phone</Label>
                    <Input
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Address</Label>
                    <Input
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="123 Main St, City, State"
                      className="mt-1"
                    />
                  </div>

                  {/* Brand Color */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Brand Color</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Business Hours
                    </Label>
                    <div className="mt-2 space-y-2">
                      {DAYS.map(day => {
                        const hours = businessHours[day] || { open: '09:00', close: '21:00', closed: false }
                        return (
                          <div key={day} className="flex items-center gap-2 text-sm">
                            <span className="w-10 text-slate-600 font-medium">{DAY_LABELS[day]}</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!hours.closed}
                                onChange={(e) => updateBusinessHour(day, 'closed', !e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600"
                              />
                            </label>
                            {!hours.closed ? (
                              <>
                                <input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => updateBusinessHour(day, 'open', e.target.value)}
                                  className="px-2 py-1 border border-slate-200 rounded text-xs"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => updateBusinessHour(day, 'close', e.target.value)}
                                  className="px-2 py-1 border border-slate-200 rounded text-xs"
                                />
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs">Closed</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom CTA Banner */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium text-slate-700">Promo Banner</Label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ctaEnabled}
                          onChange={(e) => setCtaEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-sm text-slate-600">Enable</span>
                      </label>
                    </div>
                    
                    {ctaEnabled && (
                      <div className="space-y-3 p-3 bg-slate-100 rounded-lg">
                        <div>
                          <Label className="text-xs text-slate-600">Headline</Label>
                          <Input
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            placeholder="e.g., Fresh Fish Market Now Open!"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Subtext (optional)</Label>
                          <Input
                            value={ctaSubtext}
                            onChange={(e) => setCtaSubtext(e.target.value)}
                            placeholder="e.g., Premium seafood delivered daily"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Link URL (optional)</Label>
                          <Input
                            value={ctaLink}
                            onChange={(e) => setCtaLink(e.target.value)}
                            placeholder="e.g., /fish-market or https://..."
                            className="mt-1 text-sm"
                          />
                        </div>
                        {ctaLink && (
                          <div>
                            <Label className="text-xs text-slate-600">Button Text</Label>
                            <Input
                              value={ctaButtonText}
                              onChange={(e) => setCtaButtonText(e.target.value)}
                              placeholder="e.g., Shop Now"
                              className="mt-1 text-sm"
                            />
                          </div>
                        )}
                        
                        {/* Preview */}
                        {ctaText && (
                          <div className="mt-3">
                            <Label className="text-xs text-slate-600 mb-2 block">Preview</Label>
                            <div 
                              className="rounded-lg p-3 text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <h4 className="font-bold text-sm">{ctaText}</h4>
                                  {ctaSubtext && <p className="text-xs opacity-80">{ctaSubtext}</p>}
                                </div>
                                {ctaLink && (
                                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium whitespace-nowrap">
                                    {ctaButtonText || 'Learn More'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={saveStoreSettings}
                    disabled={savingSettings}
                    className="w-full gap-2"
                  >
                    {savingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              )}
            </div>

            {/* Categories Header */}
            <div className="flex items-center justify-between">
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-slate-900">Live Preview</h2>
                {tenant && !tenant.deliveryEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    <Package className="w-3 h-3" />
                    Pickup Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Uses your branding, layout, and live menu data
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout style picker */}
              <select
                value={previewLayout}
                onChange={(e) => setPreviewLayout(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
              >
                {PREVIEW_LAYOUTS.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
              {/* Device Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
              </div>
            </div>
          </div>

          {/* Preview Frame - Only show selected device */}
          <div className="flex justify-center">
            {previewDevice === 'mobile' ? (
              /* Mobile Preview */
              <div>
                <div 
                  className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl"
                >
                  {/* Notch */}
                  <div className="w-24 h-5 bg-slate-900 rounded-b-xl mx-auto relative -top-2 z-10" />
                  <div 
                    className="bg-white rounded-[2rem] overflow-hidden relative -mt-2"
                    style={{ width: 375, height: 700 }}
                  >
                    <iframe
                      key={`mobile-${previewKey}`}
                      src={previewUrl}
                      className="w-full h-full"
                      style={{ border: 'none' }}
                      title="Mobile Preview"
                    />
                  </div>
                  {/* Home indicator */}
                  <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
                </div>
              </div>
            ) : (
              /* Desktop Preview (1440px) */
              <div className="w-full" style={{ maxWidth: '100%' }}>
                <div className="bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-600 rounded px-3 py-1 text-slate-400 text-xs text-center">
                        {tenant?.slug ? `orderflow.co/${tenant.slug}` : 'your-store.orderflow.co'}
                      </div>
                    </div>
                  </div>
                  {/* Content - scaled to fit */}
                  <div 
                    className="bg-white overflow-hidden"
                    style={{ height: 450 }}
                  >
                    <div className="w-full h-full overflow-hidden">
                      <iframe
                        key={`desktop-${previewKey}`}
                        src={previewUrl}
                        className="origin-top-left"
                        style={{ 
                          width: 1440,
                          height: 900,
                          transform: 'scale(0.5)',
                          transformOrigin: 'top left',
                          border: 'none'
                        }}
                        title="Desktop Preview"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Info */}
          <div className="mt-4 space-y-3">
            {tenant && !tenant.deliveryEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Pickup Only Mode
                </p>
                <p className="text-xs text-amber-600">
                  Delivery is disabled. Customers can only order for pickup.
                  <Link href="/dashboard/settings" className="ml-1 underline hover:no-underline">
                    Enable delivery →
                  </Link>
                </p>
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Preview updates live</p>
              <p className="text-xs text-blue-600">
                Changes reflect within 1-2 seconds after saving.
              </p>
            </div>
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
          onEditModifierGroup={(group) => {
            setEditingModifierGroup(group)
            setShowModifierModal(true)
          }}
          onAddModifierGroup={() => {
            setEditingModifierGroup(null)
            setShowModifierModal(true)
          }}
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

      {/* Modifier Group Modal */}
      {showModifierModal && (
        <ModifierGroupModal
          modifierGroup={editingModifierGroup}
          onSave={handleSaveModifierGroup}
          onDelete={editingModifierGroup?.id ? handleDeleteModifierGroup : undefined}
          onClose={() => { setShowModifierModal(false); setEditingModifierGroup(null) }}
          saving={savingModifier}
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
