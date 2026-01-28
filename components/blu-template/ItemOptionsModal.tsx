'use client'

import { useState, useMemo } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import Image from 'next/image'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
}

interface OptionGroup {
  id: string
  name: string
  required: boolean
  maxSelections?: number
  options: {
    id: string
    name: string
    price: number
  }[]
}

interface ItemOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem
  onAddToCart: (item: MenuItem, quantity: number, selectedOptions: any[], specialRequests: string) => void
}

// Helper to determine what options an item should have based on name/description/category
const getOptionsForItem = (item: MenuItem): OptionGroup[] => {
  const nameLower = item.name.toLowerCase()
  const descLower = item.description.toLowerCase()
  const options: OptionGroup[] = []

  // Cooking style for fish, seafood, chicken, shrimp entrees
  const needsCookingStyle = 
    item.category === 'Catch Of The Day' ||
    descLower.includes('grilled, fried or blackened') ||
    descLower.includes('grilled, fried, or blackened') ||
    descLower.includes('grilled (gf), fried or blackened')

  if (needsCookingStyle) {
    options.push({
      id: 'cooking',
      name: 'Cooking Style',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'grilled', name: 'Grilled', price: 0 },
        { id: 'fried', name: 'Fried', price: 0 },
        { id: 'blackened', name: 'Blackened', price: 0 },
      ]
    })
  }

  // Tacos - cooking style
  if (nameLower.includes('taco') && !nameLower.includes('carne asada')) {
    options.push({
      id: 'cooking',
      name: 'Cooking Style',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'grilled', name: 'Grilled', price: 0 },
        { id: 'fried', name: 'Fried', price: 0 },
        { id: 'blackened', name: 'Blackened', price: 0 },
      ]
    })
  }

  // Spicy Roll - fish choice
  if (nameLower === 'spicy roll') {
    options.push({
      id: 'fish',
      name: 'Choose Your Fish',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'tuna', name: 'Tuna', price: 0 },
        { id: 'salmon', name: 'Salmon', price: 0 },
        { id: 'yellowtail', name: 'Yellowtail', price: 0 },
        { id: 'crab', name: 'Crab', price: 0 },
      ]
    })
  }

  // Tekkamaki Roll - choice
  if (nameLower.includes('tekkamaki')) {
    options.push({
      id: 'filling',
      name: 'Choose Your Filling',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'tuna', name: 'Tuna', price: 0 },
        { id: 'salmon', name: 'Salmon', price: 0 },
        { id: 'yellowtail', name: 'Yellowtail', price: 0 },
        { id: 'veggie', name: 'Veggie', price: 0 },
        { id: 'avocado', name: 'Avocado', price: 0 },
        { id: 'cucumber', name: 'Cucumber', price: 0 },
      ]
    })
  }

  // Hand Roll Combo - choices
  if (nameLower.includes('hand roll combo')) {
    options.push({
      id: 'roll1',
      name: 'First Hand Roll',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'spicy-tuna', name: 'Spicy Tuna', price: 0 },
        { id: 'yellowtail', name: 'Yellowtail', price: 0 },
        { id: 'crab', name: 'Crab', price: 0 },
        { id: 'salmon', name: 'Salmon', price: 0 },
      ]
    })
    options.push({
      id: 'roll2',
      name: 'Second Hand Roll',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'spicy-tuna', name: 'Spicy Tuna', price: 0 },
        { id: 'yellowtail', name: 'Yellowtail', price: 0 },
        { id: 'crab', name: 'Crab', price: 0 },
        { id: 'salmon', name: 'Salmon', price: 0 },
      ]
    })
  }

  // Alfredo Pasta - protein choice
  if (nameLower.includes('alfredo') && !nameLower.includes('cajun')) {
    options.push({
      id: 'protein',
      name: 'Choose Your Protein',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'none', name: 'No Protein', price: 0 },
        { id: 'salmon', name: 'Salmon', price: 6 },
        { id: 'shrimp', name: 'Shrimp', price: 5 },
        { id: 'chicken', name: 'Chicken', price: 4 },
        { id: 'veggie', name: 'Vegetables', price: 3 },
      ]
    })
  }

  // Hawaiian Poke Bowl - fish choice
  if (nameLower.includes('poke') && (nameLower.includes('bowl') || nameLower.includes('kit'))) {
    options.push({
      id: 'fish',
      name: 'Choose Your Fish',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'tuna', name: 'Tuna', price: 0 },
        { id: 'salmon', name: 'Salmon', price: 0 },
      ]
    })
  }

  // Soup - size choice
  if (nameLower.includes('chowder') || nameLower.includes('bisque') || nameLower.includes('gumbo')) {
    options.push({
      id: 'size',
      name: 'Size',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'cup', name: 'Cup', price: 0 },
        { id: 'bowl', name: 'Bowl', price: 3 },
      ]
    })
  }

  // Po'Boy - seafood choice
  if (nameLower.includes('po\' boy') || nameLower.includes('poboy') || nameLower.includes("po' boy")) {
    options.push({
      id: 'seafood',
      name: 'Choose Your Seafood',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'shrimp', name: 'Shrimp', price: 0 },
        { id: 'oyster', name: 'Oyster', price: 0 },
        { id: 'catfish', name: 'Catfish', price: 0 },
      ]
    })
  }

  // Crab Cakes - cooking style
  if (nameLower.includes('crab cake')) {
    options.push({
      id: 'cooking',
      name: 'Cooking Style',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'grilled', name: 'Grilled', price: 0 },
        { id: 'fried', name: 'Fried', price: 0 },
      ]
    })
  }

  // Live Maine Lobster - preparation
  if (nameLower.includes('live maine lobster') && !nameLower.includes('market')) {
    options.push({
      id: 'prep',
      name: 'Preparation',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'steamed', name: 'Steamed', price: 0 },
        { id: 'grilled', name: 'Grilled', price: 0 },
      ]
    })
  }

  // Fish Market items - typically sold by weight, but for online just quantity
  // No special options needed

  return options
}

export default function ItemOptionsModal({
  isOpen,
  onClose,
  item,
  onAddToCart
}: ItemOptionsModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [specialRequests, setSpecialRequests] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<{[key: string]: string}>({})

  // Get relevant options for this specific item
  const optionGroups = useMemo(() => getOptionsForItem(item), [item])

  if (!isOpen) return null

  const handleOptionSelect = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: optionId
    }))
  }

  const calculateTotal = () => {
    let total = item.price * quantity

    optionGroups.forEach(group => {
      const selectedOptionId = selectedOptions[group.id]
      if (selectedOptionId) {
        const option = group.options.find(opt => opt.id === selectedOptionId)
        if (option) {
          total += option.price * quantity
        }
      }
    })

    return total
  }

  const handleAddToCart = () => {
    const options = Object.entries(selectedOptions).map(([groupId, optionId]) => {
      const group = optionGroups.find(g => g.id === groupId)
      const option = group?.options.find(opt => opt.id === optionId)
      return {
        groupId,
        groupName: group?.name,
        optionId,
        optionName: option?.name,
        price: option?.price || 0
      }
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

  const canAddToCart = optionGroups
    .filter(group => group.required)
    .every(group => selectedOptions[group.id])

  const hasOptions = optionGroups.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-lg bg-white text-gray-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 p-5 sm:p-6 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 text-white">
          <h2 className="text-xl sm:text-2xl font-bold">
            {hasOptions ? 'Customize Your Order' : 'Add to Order'}
          </h2>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Item Info */}
          <div className="flex gap-4">
            {item.image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
              <p className="text-xl font-bold text-[rgb(var(--color-primary))] mt-2">
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Option Groups - Only show if there are options */}
          {optionGroups.map(group => (
            <div key={group.id} className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">{group.name}</h4>
                {group.required && (
                  <span className="text-xs font-semibold text-[rgb(var(--color-primary))] bg-blue-50 px-2.5 py-1 rounded-full">
                    Required
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(group.id, option.id)}
                    className={`flex flex-col items-start justify-between p-3 rounded-lg border transition-all touch-manipulation ${
                      selectedOptions[group.id] === option.id
                        ? 'border-[rgb(var(--color-primary))] bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 w-full mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                        selectedOptions[group.id] === option.id
                          ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]'
                          : 'border-gray-300'
                      }`}>
                        {selectedOptions[group.id] === option.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-medium text-sm text-gray-900 text-left">{option.name}</span>
                    </div>
                    {option.price > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-[rgb(var(--color-primary))] ml-6">
                        <Plus className="w-3 h-3" />
                        ${option.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Special Requests */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-base sm:text-lg font-bold text-gray-900 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] resize-none text-gray-900 placeholder-gray-400"
              rows={2}
              placeholder="Any allergies or special requests?"
            />
          </div>

          {/* Quantity */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-base sm:text-lg font-bold text-gray-900 mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-300 hover:border-[rgb(var(--color-primary))] hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4 text-gray-700" />
              </button>
              <span className="text-2xl font-bold w-16 text-center text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-300 hover:border-[rgb(var(--color-primary))] hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 p-4 sm:p-6 safe-area-inset-bottom">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base sm:text-lg font-bold text-gray-900">Total:</span>
            <span className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-primary))]">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="btn-primary w-full"
          >
            Add to Cart
          </button>
          {!canAddToCart && hasOptions && (
            <p className="text-sm text-[rgb(var(--color-primary))] font-semibold text-center mt-3">
              Please select all required options
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
