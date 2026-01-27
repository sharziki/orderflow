'use client'

import { useState, useEffect } from 'react'
import BluBentonvilleLayout from './BluBentonvilleLayout'
import SliceLayout from './SliceLayout'

// Layout metadata for the picker UI
export const MENU_LAYOUTS = {
  'blu-bentonville': {
    id: 'blu-bentonville',
    name: 'Blu Bentonville',
    description: 'Modern vertical cards with hover image effects',
    thumbnail: '🎨',
    features: ['Image hover swap', 'Grid layout', 'Category pills'],
  },
  'slice': {
    id: 'slice',
    name: 'Slice',
    description: 'Horizontal cards with collapsible categories',
    thumbnail: '🍕',
    features: ['Horizontal cards', 'Collapsible sections', 'Floating cart'],
  },
  // Future layouts:
  // 'doordash': { ... },
  // 'ubereats': { ... },
  // 'grubhub': { ... },
} as const

export type MenuLayoutId = keyof typeof MENU_LAYOUTS

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
}

interface Category {
  id: string
  name: string
}

interface MenuLayoutRendererProps {
  layout: MenuLayoutId
  restaurantName: string
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  onAddToCart?: (id: string) => void
}

// Main renderer component that switches between layouts
export function MenuLayoutRenderer({
  layout,
  restaurantName,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  onAddToCart
}: MenuLayoutRendererProps) {
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([])

  const handleAddToCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id)
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { id, qty: 1 }]
    })
    onAddToCart?.(id)
  }

  const commonProps = {
    restaurantName,
    primaryColor,
    secondaryColor,
    menuItems,
    categories,
    cart,
    onAddToCart: handleAddToCart,
  }

  switch (layout) {
    case 'blu-bentonville':
      return <BluBentonvilleLayout {...commonProps} />
    case 'slice':
      return <SliceLayout {...commonProps} />
    default:
      return <BluBentonvilleLayout {...commonProps} />
  }
}

// Layout picker component for the dashboard
interface LayoutPickerProps {
  selected: MenuLayoutId
  onSelect: (layout: MenuLayoutId) => void
  primaryColor?: string
}

export function LayoutPicker({ selected, onSelect, primaryColor = '#2563eb' }: LayoutPickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Object.values(MENU_LAYOUTS).map(layout => (
        <button
          key={layout.id}
          onClick={() => onSelect(layout.id as MenuLayoutId)}
          className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
            selected === layout.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          style={selected === layout.id ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{layout.thumbnail}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{layout.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{layout.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {layout.features.map(feature => (
                  <span 
                    key={feature}
                    className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export { BluBentonvilleLayout, SliceLayout }
