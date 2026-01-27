'use client'

import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface UpsellItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  category: 'drink' | 'side' | 'dessert'
}

interface UpsellSectionProps {
  onAddItem: (item: UpsellItem) => void
}

export default function UpsellSection({ onAddItem }: UpsellSectionProps) {
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  // Popular add-on items
  const upsellItems: UpsellItem[] = [
    // Drinks
    {
      id: 'upsell-drink-1',
      name: 'Fresh Lemonade',
      description: 'Homemade with real lemons',
      price: 3.99,
      image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop',
      category: 'drink'
    },
    {
      id: 'upsell-drink-2',
      name: 'Sweet Tea',
      description: 'Southern-style sweet tea',
      price: 2.99,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
      category: 'drink'
    },
    // Sides
    {
      id: 'upsell-side-1',
      name: 'Cajun Fries',
      description: 'Crispy fries with Cajun seasoning',
      price: 4.99,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
      category: 'side'
    },
    {
      id: 'upsell-side-2',
      name: 'Mac & Cheese',
      description: 'Creamy homemade mac and cheese',
      price: 5.99,
      image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&h=600&fit=crop',
      category: 'side'
    },
    {
      id: 'upsell-side-3',
      name: 'Hush Puppies',
      description: 'Golden fried cornmeal balls',
      price: 4.49,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=600&fit=crop',
      category: 'side'
    },
    // Desserts
    {
      id: 'upsell-dessert-1',
      name: 'Key Lime Pie',
      description: 'Tangy and sweet Florida classic',
      price: 6.99,
      image: 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=600&fit=crop',
      category: 'dessert'
    }
  ]

  const handleAddItem = (item: UpsellItem) => {
    setAddedItems(prev => new Set(prev).add(item.id))
    onAddItem(item)

    // Reset the "added" state after 2 seconds
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }, 2000)
  }

  const categories = [
    { key: 'drink', title: 'Add a Drink?', subtitle: 'Stay refreshed' },
    { key: 'side', title: 'Add Some Sides?', subtitle: 'Complete your meal' },
    { key: 'dessert', title: 'Add Dessert?', subtitle: 'Sweet finish' }
  ]

  return (
    <div className="space-y-6 py-4">
      {categories.map(({ key, title, subtitle }) => {
        const items = upsellItems.filter(item => item.category === key)

        return (
          <div key={key} className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(item => {
                const isAdded = addedItems.has(item.id)

                return (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-[rgb(var(--color-primary))] transition-all text-left group hover:shadow-md"
                  >
                    {item.image && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-[rgb(var(--color-primary))] transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-1">{item.description}</p>
                      <p className="text-sm font-bold text-[rgb(var(--color-primary))] mt-1">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className={`flex-shrink-0 transition-all ${isAdded ? 'scale-0' : 'scale-100'}`}>
                      <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))] text-white flex items-center justify-center group-hover:bg-[rgb(var(--color-primary-hover))] transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    {isAdded && (
                      <div className="flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center animate-in zoom-in">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
