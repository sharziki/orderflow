'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Minus, Check } from 'lucide-react'
import Image from 'next/image'
import { MenuItem, ModifierGroup, SelectedModifier } from './store-templates/types'

interface ItemOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem
  modifierGroups?: ModifierGroup[]
  existingModifiers?: SelectedModifier[]
  existingQuantity?: number
  existingSpecialRequests?: string
  onAddToCart: (
    item: MenuItem, 
    quantity: number, 
    selectedOptions: SelectedModifier[], 
    specialRequests: string
  ) => void
  primaryColor?: string
}

export default function ItemOptionsModal({
  isOpen,
  onClose,
  item,
  modifierGroups = [],
  existingModifiers = [],
  existingQuantity = 1,
  existingSpecialRequests = '',
  onAddToCart,
  primaryColor = '#1e3a5f'
}: ItemOptionsModalProps) {
  const [quantity, setQuantity] = useState(existingQuantity)
  const [specialRequests, setSpecialRequests] = useState(existingSpecialRequests)
  const [selectedOptions, setSelectedOptions] = useState<{[groupId: string]: string[]}>({})

  // Initialize with existing modifiers when editing
  useEffect(() => {
    if (existingModifiers && existingModifiers.length > 0) {
      const grouped: {[groupId: string]: string[]} = {}
      existingModifiers.forEach(mod => {
        if (!grouped[mod.groupId]) grouped[mod.groupId] = []
        grouped[mod.groupId].push(mod.optionName)
      })
      setSelectedOptions(grouped)
    } else {
      setSelectedOptions({})
    }
    setQuantity(existingQuantity)
    setSpecialRequests(existingSpecialRequests)
  }, [existingModifiers, existingQuantity, existingSpecialRequests, item.id])

  if (!isOpen) return null

  const handleOptionToggle = (groupId: string, optionName: string, maxSelections: number | null) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[groupId] || []
      const isSelected = currentSelections.includes(optionName)

      if (isSelected) {
        // Deselect
        return {
          ...prev,
          [groupId]: currentSelections.filter(name => name !== optionName)
        }
      } else {
        // Select
        if (maxSelections === 1) {
          // Single selection - replace
          return {
            ...prev,
            [groupId]: [optionName]
          }
        } else if (maxSelections && currentSelections.length >= maxSelections) {
          // At max - replace oldest
          return {
            ...prev,
            [groupId]: [...currentSelections.slice(1), optionName]
          }
        } else {
          // Add to selections
          return {
            ...prev,
            [groupId]: [...currentSelections, optionName]
          }
        }
      }
    })
  }

  const calculateTotal = () => {
    let total = item.price * quantity

    // Add modifier prices
    modifierGroups.forEach(group => {
      const selections = selectedOptions[group.id] || []
      selections.forEach(optionName => {
        const modifier = group.modifiers.find(m => m.name === optionName)
        if (modifier) {
          total += modifier.price * quantity
        }
      })
    })

    return total
  }

  const handleAddToCart = () => {
    const options: SelectedModifier[] = []
    
    modifierGroups.forEach(group => {
      const selections = selectedOptions[group.id] || []
      selections.forEach(optionName => {
        const modifier = group.modifiers.find(m => m.name === optionName)
        options.push({
          groupId: group.id,
          groupName: group.name,
          optionName: optionName,
          price: modifier?.price || 0
        })
      })
    })

    onAddToCart(item, quantity, options, specialRequests)
    handleClose()
  }

  const handleClose = () => {
    setQuantity(1)
    setSpecialRequests('')
    setSelectedOptions({})
    onClose()
  }

  // Validate required modifiers
  const canAddToCart = useMemo(() => {
    for (const group of modifierGroups) {
      if (group.isRequired) {
        const selections = selectedOptions[group.id] || []
        if (selections.length < group.minSelections) {
          return false
        }
      }
    }
    return true
  }, [modifierGroups, selectedOptions])

  const hasModifiers = modifierGroups.length > 0
  const isEditing = existingModifiers && existingModifiers.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white text-gray-900 shadow-2xl animate-slide-up sm:animate-none">
        {/* Header */}
        <div 
          className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <h2 className="text-lg sm:text-xl font-bold">
            {isEditing ? 'Edit Item' : hasModifiers ? 'Customize Your Order' : 'Add to Order'}
          </h2>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors p-1 -mr-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Item Info */}
          <div className="flex gap-4">
            {item.image && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              )}
              <p 
                className="text-xl font-bold mt-2"
                style={{ color: primaryColor }}
              >
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Modifier Groups */}
          {modifierGroups.map(group => {
            const selections = selectedOptions[group.id] || []
            const isSingleSelect = group.maxSelections === 1
            
            return (
              <div key={group.id} className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-gray-500">{group.description}</p>
                    )}
                    {group.maxSelections && group.maxSelections > 1 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Select up to {group.maxSelections}
                      </p>
                    )}
                  </div>
                  {group.isRequired && (
                    <span 
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ 
                        color: primaryColor,
                        backgroundColor: `${primaryColor}15`
                      }}
                    >
                      Required
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {group.modifiers.map(modifier => {
                    const isSelected = selections.includes(modifier.name)
                    
                    return (
                      <button
                        key={modifier.name}
                        onClick={() => handleOptionToggle(group.id, modifier.name, group.maxSelections)}
                        className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all touch-manipulation ${
                          isSelected
                            ? 'shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        style={isSelected ? { 
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`
                        } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              isSingleSelect ? '' : 'rounded-md'
                            }`}
                            style={isSelected ? {
                              borderColor: primaryColor,
                              backgroundColor: primaryColor
                            } : {
                              borderColor: '#d1d5db'
                            }}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 text-left">{modifier.name}</span>
                        </div>
                        {modifier.price > 0 && (
                          <span 
                            className="flex items-center gap-1 text-sm font-semibold"
                            style={{ color: primaryColor }}
                          >
                            +${modifier.price.toFixed(2)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Special Requests */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-base sm:text-lg font-bold text-gray-900 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 transition-all"
              style={{ 
                // @ts-ignore
                '--tw-ring-color': primaryColor 
              } as React.CSSProperties}
              rows={2}
              placeholder="Any allergies or special requests?"
            />
          </div>

          {/* Quantity */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-base sm:text-lg font-bold text-gray-900 mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-2xl font-bold w-12 text-center text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Plus className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 p-4 sm:p-6 pb-safe">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base sm:text-lg font-bold text-gray-900">Total:</span>
            <span 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: primaryColor }}
            >
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            {isEditing ? 'Update Cart' : 'Add to Cart'}
          </button>
          {!canAddToCart && hasModifiers && (
            <p 
              className="text-sm font-semibold text-center mt-3"
              style={{ color: primaryColor }}
            >
              Please select all required options
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .pb-safe {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}
