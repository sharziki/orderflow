'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  secondaryImage?: string
}

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
  onOpenOptions?: (item: MenuItem) => void
}

// Item-specific hover images based on keywords in the name
const getHoverImageForItem = (name: string): string => {
  const nameLower = name.toLowerCase()
  
  // Sushi Rolls
  if (nameLower.includes('roll') || nameLower.includes('maki')) {
    return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop"
  }
  
  // Specific fish types
  if (nameLower.includes('tuna') || nameLower.includes('ahi')) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('salmon')) {
    return "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('snapper')) {
    return "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('halibut') || nameLower.includes('cod') || nameLower.includes('haddock')) {
    return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('swordfish')) {
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('mahi')) {
    return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('grouper') || nameLower.includes('bass')) {
    return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('catfish')) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop"
  }
  
  // Shellfish
  if (nameLower.includes('lobster')) {
    return "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('crab')) {
    return "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('shrimp') || nameLower.includes('prawn')) {
    return "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('scallop')) {
    return "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('oyster')) {
    return "https://images.unsplash.com/photo-1606731219412-2b5ef2e0a71b?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('clam') || nameLower.includes('mussel')) {
    return "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('calamari') || nameLower.includes('squid') || nameLower.includes('octopus') || nameLower.includes('tako')) {
    return "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('eel') || nameLower.includes('unagi')) {
    return "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&h=600&fit=crop"
  }
  
  // Nigiri & Sashimi
  if (nameLower.includes('nigiri')) {
    return "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('sashimi')) {
    return "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&h=600&fit=crop"
  }
  
  // Tacos & Sandwiches
  if (nameLower.includes('taco')) {
    return "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('sandwich') || nameLower.includes('po\' boy') || nameLower.includes('poboy')) {
    return "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800&h=600&fit=crop"
  }
  
  // Soups & Salads
  if (nameLower.includes('soup') || nameLower.includes('chowder') || nameLower.includes('bisque') || nameLower.includes('gumbo') || nameLower.includes('miso')) {
    return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('salad')) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop"
  }
  
  // Pasta & Rice
  if (nameLower.includes('pasta') || nameLower.includes('linguine') || nameLower.includes('alfredo') || nameLower.includes('ravioli')) {
    return "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('mac') && nameLower.includes('cheese')) {
    return "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('risotto') || nameLower.includes('paella')) {
    return "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('rice') || nameLower.includes('pilaf')) {
    return "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&h=600&fit=crop"
  }
  
  // Fried items
  if (nameLower.includes('fried') || nameLower.includes('tempura') || nameLower.includes('chips') || nameLower.includes('fish n\'')) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('hush pupp')) {
    return "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=600&fit=crop"
  }
  
  // Edamame
  if (nameLower.includes('edamame')) {
    return "https://images.unsplash.com/photo-1564894809611-1742fc40ed80?w=800&h=600&fit=crop"
  }
  
  // Chicken
  if (nameLower.includes('chicken')) {
    return "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&h=600&fit=crop"
  }
  
  // Poke bowls
  if (nameLower.includes('poke') || nameLower.includes('chirashi')) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop"
  }
  
  // Bento
  if (nameLower.includes('bento')) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop"
  }
  
  // Nachos
  if (nameLower.includes('nacho')) {
    return "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&h=600&fit=crop"
  }
  
  // Sides
  if (nameLower.includes('veggie') || nameLower.includes('vegetable')) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('potato') || nameLower.includes('mash')) {
    return "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=800&h=600&fit=crop"
  }
  if (nameLower.includes('slaw')) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop"
  }
  
  // Seaweed
  if (nameLower.includes('seaweed')) {
    return "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&h=600&fit=crop"
  }
  
  // Carpaccio
  if (nameLower.includes('carpaccio')) {
    return "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&h=600&fit=crop"
  }
  
  // Grits
  if (nameLower.includes('grits')) {
    return "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop"
  }
  
  // Seafood tower / clambake / platters
  if (nameLower.includes('tower') || nameLower.includes('clambake') || nameLower.includes('platter') || nameLower.includes('boat')) {
    return "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop"
  }
  
  // Default seafood image
  return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=600&fit=crop"
}

export default function MenuItemCard({ item, onAddToCart, onOpenOptions }: MenuItemCardProps) {
  const handleAddClick = () => {
    if (onOpenOptions) {
      onOpenOptions(item)
    } else {
      onAddToCart(item)
    }
  }
  const [isHovered, setIsHovered] = useState(false)

  // Generate secondary image based on item name for relevance
  const secondaryImage = useMemo(() => {
    if (item.secondaryImage) return item.secondaryImage
    return getHoverImageForItem(item.name)
  }, [item.name, item.secondaryImage])

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Hover Swap */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {/* Main Image */}
        {item.image && (
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Secondary Image (shown on hover) */}
        {item.image && (
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <Image
              src={secondaryImage}
              alt={`${item.name} - alternate view`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Fallback if no image */}
        {!item.image && (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400 text-sm">No image available</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm">
          {item.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {item.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-2xl font-bold text-[rgb(var(--color-primary))]">
              ${item.price.toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center w-10 h-10 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            aria-label={onOpenOptions ? 'Customize item' : 'Add to cart'}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
