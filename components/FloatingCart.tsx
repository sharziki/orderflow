'use client'

import { ShoppingCart } from 'lucide-react'

interface FloatingCartProps {
  itemCount: number
  onClick: () => void
}

export default function FloatingCart({ itemCount, onClick }: FloatingCartProps) {
  if (itemCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-[rgb(var(--color-primary))] text-white rounded-full shadow-2xl hover:shadow-3xl transition-shadow duration-200 hover:scale-105 active:scale-95"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <ShoppingCart className="h-6 w-6 text-white" strokeWidth={2.5} />
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[rgb(var(--color-primary))] text-xs font-bold">
          {itemCount}
        </span>
      </div>
    </button>
  )
}
