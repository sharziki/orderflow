'use client'

import { Utensils } from 'lucide-react'

interface DerbyFlowLogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export default function DerbyFlowLogo({ size = 40, className = '', showText = false }: DerbyFlowLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Utensils className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
      {showText && (
        <span className="font-bold text-xl text-slate-900">DerbyFlow</span>
      )}
    </div>
  )
}
