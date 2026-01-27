'use client'

import { useState, useEffect } from 'react'
import { X, Monitor, Tablet, Smartphone } from 'lucide-react'
import { MenuLayoutRenderer, LayoutPicker, MENU_LAYOUTS, type MenuLayoutId } from '@/components/menu-layouts'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

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
}

interface MenuPreviewProps {
  template?: 'modern' | 'classic' | 'bold' | 'compact' // Legacy support
  layout?: MenuLayoutId // New layout system
  restaurantName: string
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  onClose: () => void
  onLayoutChange?: (layout: MenuLayoutId) => void
  enableRealtime?: boolean
  restaurantId?: string
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'

const viewModeWidths: Record<ViewMode, string> = {
  desktop: 'max-w-5xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
}

export function MenuPreview({
  template,
  layout: initialLayout,
  restaurantName,
  primaryColor,
  secondaryColor,
  menuItems: initialItems,
  categories: initialCategories,
  onClose,
  onLayoutChange,
  enableRealtime = false,
  restaurantId
}: MenuPreviewProps) {
  // Map legacy templates to new layouts or use provided layout
  const getLayoutFromTemplate = (): MenuLayoutId => {
    if (initialLayout) return initialLayout
    // Legacy template mapping
    switch (template) {
      case 'modern':
      case 'bold':
        return 'blu-bentonville'
      case 'classic':
      case 'compact':
        return 'slice'
      default:
        return 'blu-bentonville'
    }
  }

  const [currentLayout, setCurrentLayout] = useState<MenuLayoutId>(getLayoutFromTemplate())
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [showLayoutPicker, setShowLayoutPicker] = useState(false)
  const [menuItems, setMenuItems] = useState(initialItems)
  const [categories, setCategories] = useState(initialCategories)

  // Update local state when props change
  useEffect(() => {
    setMenuItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  // Realtime subscription for menu items
  useEffect(() => {
    if (!enableRealtime || !restaurantId) return

    const channel = supabase
      .channel(`menu-preview-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'MenuItem',
          filter: `restaurantId=eq.${restaurantId}`
        },
        (payload) => {
          console.log('[MenuPreview] Realtime update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any
            setMenuItems(prev => [...prev, {
              id: newItem.id,
              name: newItem.name,
              description: newItem.description || '',
              price: newItem.price,
              category: newItem.categoryId,
              imageUrl: newItem.image,
              available: newItem.isAvailable
            }])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any
            setMenuItems(prev => prev.map(item => 
              item.id === updated.id 
                ? {
                    ...item,
                    name: updated.name,
                    description: updated.description || '',
                    price: updated.price,
                    category: updated.categoryId,
                    imageUrl: updated.image,
                    available: updated.isAvailable
                  }
                : item
            ))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any
            setMenuItems(prev => prev.filter(item => item.id !== deleted.id))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Category',
          filter: `restaurantId=eq.${restaurantId}`
        },
        (payload) => {
          console.log('[MenuPreview] Category update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newCat = payload.new as any
            setCategories(prev => [...prev, { id: newCat.id, name: newCat.name }])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any
            setCategories(prev => prev.map(cat => 
              cat.id === updated.id ? { ...cat, name: updated.name } : cat
            ))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any
            setCategories(prev => prev.filter(cat => cat.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enableRealtime, restaurantId])

  const handleLayoutChange = (layout: MenuLayoutId) => {
    setCurrentLayout(layout)
    onLayoutChange?.(layout)
    setShowLayoutPicker(false)
  }

  // Transform menu items for the layout renderer
  const transformedItems = menuItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.imageUrl,
    available: item.available
  }))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900">Live Preview</h2>
            <p className="text-sm text-slate-500">
              {MENU_LAYOUTS[currentLayout].name} Layout • {menuItems.length} items
              {enableRealtime && <span className="ml-2 text-green-600">● Live</span>}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Layout Picker Toggle */}
            <button
              onClick={() => setShowLayoutPicker(!showLayoutPicker)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                showLayoutPicker 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-white border text-slate-700 hover:bg-slate-50"
              )}
            >
              {MENU_LAYOUTS[currentLayout].thumbnail} {MENU_LAYOUTS[currentLayout].name}
            </button>

            {/* View Mode Switcher */}
            <div className="flex bg-white rounded-lg border p-1">
              <button 
                onClick={() => setViewMode('desktop')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'desktop' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('tablet')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'tablet' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('mobile')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'mobile' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout Picker Panel */}
        {showLayoutPicker && (
          <div className="px-6 py-4 border-b bg-slate-50">
            <h3 className="font-medium text-slate-900 mb-3">Choose Layout Template</h3>
            <LayoutPicker 
              selected={currentLayout} 
              onSelect={handleLayoutChange}
              primaryColor={primaryColor}
            />
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-slate-200 p-6">
          <div className={cn(
            "mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300",
            viewModeWidths[viewMode],
            viewMode === 'mobile' && "max-h-[600px]"
          )}>
            <div className={cn(
              "overflow-auto",
              viewMode === 'mobile' ? "h-[600px]" : "h-full"
            )}>
              <MenuLayoutRenderer
                layout={currentLayout}
                restaurantName={restaurantName}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                menuItems={transformedItems}
                categories={categories}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
