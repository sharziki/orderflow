'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Minus, ShoppingCart, Clock, ChevronRight, Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface StoreHours {
  open: string
  close: string
  isOpen?: boolean
}

interface StepBuilderLayoutProps {
  restaurantName: string
  logoUrl?: string
  storeHours?: StoreHours
  primaryColor: string
  secondaryColor: string
  menuItems: MenuItem[]
  categories: Category[]
  cart: { id: string; qty: number }[]
  onAddToCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
  onOpenItemModal?: (item: MenuItem) => void
}

// Step indicator component
function StepIndicator({ 
  steps, 
  currentStep, 
  primaryColor 
}: { 
  steps: string[]
  currentStep: number
  primaryColor: string
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              index < currentStep 
                ? "text-white" 
                : index === currentStep 
                  ? "text-white ring-4 ring-opacity-30"
                  : "bg-gray-200 text-gray-500"
            )}
            style={index <= currentStep ? { 
              backgroundColor: primaryColor,
              boxShadow: `0 0 0 4px ${primaryColor}30`
            } : {}}
          >
            {index < currentStep ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "w-8 h-1 rounded-full",
                index < currentStep ? "" : "bg-gray-200"
              )}
              style={index < currentStep ? { backgroundColor: primaryColor } : {}}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Item selection card for build-your-own
function SelectionCard({ 
  item, 
  isSelected,
  primaryColor,
  onSelect,
  onOpenItemModal
}: { 
  item: MenuItem
  isSelected: boolean
  primaryColor: string
  onSelect: () => void
  onOpenItemModal?: (item: MenuItem) => void
}) {
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border-2",
        isSelected 
          ? "shadow-lg scale-[1.02]" 
          : "shadow-sm hover:shadow-md border-transparent hover:border-gray-200"
      )}
      style={isSelected ? { borderColor: primaryColor } : {}}
      onClick={onSelect}
    >
      {/* Selection Checkmark */}
      {isSelected && (
        <div 
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl">🥗</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
        {item.price > 0 && (
          <span 
            className="text-sm font-bold"
            style={{ color: primaryColor }}
          >
            +${item.price.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  )
}

// Regular grid card for browse mode
function MenuCard({ 
  item, 
  primaryColor,
  qty,
  onAddToCart,
  onRemoveFromCart,
  onOpenItemModal
}: { 
  item: MenuItem
  primaryColor: string
  qty: number
  onAddToCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
  onOpenItemModal?: (item: MenuItem) => void
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
      onClick={() => onOpenItemModal?.(item)}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-5xl">🌯</span>
          </div>
        )}
        
        {qty > 0 && (
          <div 
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            {qty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
        
        <div className="flex items-center justify-between">
          <span 
            className="text-lg font-bold"
            style={{ color: primaryColor }}
          >
            ${item.price.toFixed(2)}
          </span>
          
          {qty > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.id); }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="font-bold w-5 text-center">{qty}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(item.id); }}
                className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(item.id); }}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StepBuilderLayout({
  restaurantName,
  logoUrl,
  storeHours,
  primaryColor,
  secondaryColor,
  menuItems,
  categories,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenItemModal
}: StepBuilderLayoutProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [buildMode, setBuildMode] = useState(false)
  const [buildStep, setBuildStep] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  
  const filteredItems = menuItems.filter(item => item.available && item.category === activeCategory)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, cartItem) => {
    const menuItem = menuItems.find(m => m.id === cartItem.id)
    return sum + (menuItem?.price || 0) * cartItem.qty
  }, 0)
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty || 0

  // Build mode uses categories as steps
  const buildSteps = categories.map(c => c.name)
  const currentStepItems = buildMode 
    ? menuItems.filter(item => item.available && item.category === categories[buildStep]?.id)
    : filteredItems

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleNextStep = () => {
    if (buildStep < categories.length - 1) {
      setBuildStep(buildStep + 1)
    } else {
      // Finish building - add all selected items to cart
      selectedItems.forEach(id => onAddToCart(id))
      setBuildMode(false)
      setBuildStep(0)
      setSelectedItems(new Set())
    }
  }

  const handlePrevStep = () => {
    if (buildStep > 0) {
      setBuildStep(buildStep - 1)
    } else {
      setBuildMode(false)
      setSelectedItems(new Set())
    }
  }

  return (
    <div className="min-h-full bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {restaurantName.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-bold text-gray-900 text-lg">{restaurantName}</span>
              {storeHours && (
                <span className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {storeHours.open} - {storeHours.close}
                </span>
              )}
            </div>
          </div>
          
          <button 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">{cartCount}</span>
            {cartTotal > 0 && (
              <span className="text-gray-500 text-sm">${cartTotal.toFixed(2)}</span>
            )}
          </button>
        </div>
      </header>

      {/* Build Your Own Banner */}
      {!buildMode && (
        <div 
          className="py-8 text-center"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">Build Your Own</h2>
          <p className="text-white/80 mb-4">Customize your perfect meal, step by step</p>
          <button
            onClick={() => { setBuildMode(true); setBuildStep(0); }}
            className="px-8 py-3 bg-white rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
            style={{ color: primaryColor }}
          >
            Start Building
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Build Mode */}
      {buildMode ? (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Step Header */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handlePrevStep}
              className="w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Step {buildStep + 1} of {categories.length}</p>
              <h3 className="text-2xl font-bold text-gray-900">Choose Your {categories[buildStep]?.name}</h3>
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator 
            steps={buildSteps} 
            currentStep={buildStep} 
            primaryColor={primaryColor} 
          />

          {/* Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {currentStepItems.map(item => (
              <SelectionCard
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                primaryColor={primaryColor}
                onSelect={() => toggleSelection(item.id)}
                onOpenItemModal={onOpenItemModal}
              />
            ))}
          </div>

          {/* Continue Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedItems.size} selected in this step
              </div>
              <button
                onClick={handleNextStep}
                className="px-8 py-3 rounded-full text-white font-bold flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {buildStep < categories.length - 1 ? (
                  <>
                    Next: {categories[buildStep + 1]?.name}
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Add to Order
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Category Pills */}
          <div className="sticky top-[68px] z-10 bg-white border-b">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      activeCategory === cat.id
                        ? "text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                    style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Regular Menu Grid */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <MenuCard
                  key={item.id}
                  item={item}
                  primaryColor={primaryColor}
                  qty={getQty(item.id)}
                  onAddToCart={onAddToCart}
                  onRemoveFromCart={onRemoveFromCart}
                  onOpenItemModal={onOpenItemModal}
                />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <span className="text-5xl mb-4 block">🌯</span>
                <p className="text-lg">No items in this category</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cart Bar (when not in build mode) */}
      {!buildMode && cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl z-30">
          <div className="max-w-6xl mx-auto">
            <button 
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              View Order ({cartCount}) · ${cartTotal.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
