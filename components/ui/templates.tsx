'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StoreTemplate {
  id: string
  name: string
  description: string
  preview: React.ReactNode
  features: string[]
}

export const storeTemplates: StoreTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimal design with focus on food imagery',
    features: ['Hero image banner', 'Grid menu layout', 'Floating cart', 'Quick add buttons'],
    preview: (
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden p-3">
        {/* Header */}
        <div className="h-6 bg-slate-800 rounded-md mb-2 flex items-center px-2">
          <div className="w-4 h-3 bg-white/30 rounded-sm" />
          <div className="flex-1" />
          <div className="flex gap-1">
            <div className="w-6 h-3 bg-white/20 rounded-sm" />
            <div className="w-6 h-3 bg-white/20 rounded-sm" />
          </div>
        </div>
        {/* Hero */}
        <div className="h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-md mb-2 flex items-center justify-center">
          <div className="text-white/80 text-[8px] font-bold">HERO IMAGE</div>
        </div>
        {/* Categories */}
        <div className="flex gap-1 mb-2">
          <div className="h-4 w-12 bg-blue-500 rounded-full" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
          <div className="h-4 w-14 bg-slate-200 rounded-full" />
        </div>
        {/* Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-white rounded-md shadow-sm p-1">
              <div className="h-1/2 bg-slate-100 rounded-sm mb-1" />
              <div className="h-2 bg-slate-200 rounded-sm w-3/4 mb-0.5" />
              <div className="h-2 bg-blue-500 rounded-sm w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional restaurant menu with sidebar navigation',
    features: ['Side category menu', 'List view items', 'Detailed descriptions', 'Large images'],
    preview: (
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg overflow-hidden p-3">
        {/* Header */}
        <div className="h-6 bg-amber-900 rounded-md mb-2 flex items-center px-2">
          <div className="w-4 h-3 bg-white/30 rounded-sm" />
          <div className="flex-1" />
          <div className="w-8 h-3 bg-amber-700 rounded-sm" />
        </div>
        {/* Content */}
        <div className="flex gap-2 h-[calc(100%-2rem)]">
          {/* Sidebar */}
          <div className="w-1/4 bg-white rounded-md p-1.5 space-y-1">
            <div className="h-3 bg-amber-500 rounded-sm" />
            <div className="h-3 bg-amber-100 rounded-sm" />
            <div className="h-3 bg-amber-100 rounded-sm" />
            <div className="h-3 bg-amber-100 rounded-sm" />
          </div>
          {/* Items */}
          <div className="flex-1 space-y-1.5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-md p-1.5 flex gap-1.5">
                <div className="w-10 h-10 bg-amber-100 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-2 bg-slate-300 rounded-sm w-3/4 mb-1" />
                  <div className="h-1.5 bg-slate-200 rounded-sm w-full mb-1" />
                  <div className="h-2 bg-amber-600 rounded-sm w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-impact design with large visuals and animations',
    features: ['Full-width images', 'Animated transitions', 'Dark mode ready', 'Category cards'],
    preview: (
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden p-3">
        {/* Header */}
        <div className="h-6 bg-transparent border border-white/20 rounded-md mb-2 flex items-center px-2">
          <div className="w-4 h-3 bg-white/50 rounded-sm" />
          <div className="flex-1" />
          <div className="w-6 h-3 bg-purple-500 rounded-sm" />
        </div>
        {/* Hero */}
        <div className="h-20 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-md mb-2 flex items-end p-2">
          <div className="text-white/90 text-[8px] font-bold">FULL WIDTH HERO</div>
        </div>
        {/* Category cards */}
        <div className="grid grid-cols-3 gap-1.5">
          {['🍕', '🍔', '🍜'].map((emoji, i) => (
            <div key={i} className="aspect-[3/2] bg-white/10 rounded-md flex items-center justify-center">
              <span className="text-lg">{emoji}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Mobile-first design optimized for quick ordering',
    features: ['Single column', 'Quick add to cart', 'Sticky header', 'Bottom cart bar'],
    preview: (
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg overflow-hidden p-3">
        {/* Phone frame */}
        <div className="mx-auto w-2/3 bg-white rounded-xl shadow-lg overflow-hidden h-full">
          {/* Header */}
          <div className="h-5 bg-green-600 flex items-center justify-center">
            <div className="w-8 h-2 bg-white/40 rounded-sm" />
          </div>
          {/* Search */}
          <div className="p-1">
            <div className="h-4 bg-slate-100 rounded-md" />
          </div>
          {/* Items */}
          <div className="px-1 space-y-1">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-1 bg-slate-50 rounded-md p-1">
                <div className="w-6 h-6 bg-green-100 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-1.5 bg-slate-300 rounded-sm w-2/3" />
                  <div className="h-1.5 bg-green-500 rounded-sm w-1/3 mt-0.5" />
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
            ))}
          </div>
          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-green-600 rounded-t-lg mx-1" />
        </div>
      </div>
    )
  },
]

interface TemplateSelectorProps {
  selected: string
  onSelect: (id: string) => void
  primaryColor?: string
}

export function TemplateSelector({ selected, onSelect, primaryColor = '#2563eb' }: TemplateSelectorProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {storeTemplates.map(template => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template.id)}
          className={cn(
            "relative text-left p-4 rounded-xl border-2 transition-all duration-200",
            selected === template.id
              ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10"
              : "border-slate-200 hover:border-slate-300 hover:shadow-md"
          )}
        >
          {/* Selected indicator */}
          {selected === template.id && (
            <div 
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="w-4 h-4" />
            </div>
          )}
          
          {/* Preview */}
          <div className="mb-4">
            {template.preview}
          </div>
          
          {/* Info */}
          <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
          <p className="text-sm text-slate-500 mb-3">{template.description}</p>
          
          {/* Features */}
          <div className="flex flex-wrap gap-1.5">
            {template.features.map(feature => (
              <span 
                key={feature}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
