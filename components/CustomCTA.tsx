'use client'

import { ExternalLink, ChevronRight } from 'lucide-react'

interface CustomCTAProps {
  text: string
  subtext?: string | null
  link?: string | null
  buttonText?: string | null
  primaryColor?: string
  onNavigate?: (link: string) => void
}

export default function CustomCTA({ 
  text, 
  subtext, 
  link, 
  buttonText = 'Learn More',
  primaryColor = '#2563eb',
  onNavigate 
}: CustomCTAProps) {
  const isExternal = link?.startsWith('http')
  
  const handleClick = () => {
    if (!link) return
    if (onNavigate) {
      onNavigate(link)
    } else if (isExternal) {
      window.open(link, '_blank')
    } else {
      window.location.href = link
    }
  }

  // Generate a lighter variant of the primary color for gradient
  const getLighterColor = (hex: string) => {
    // Convert hex to RGB, lighten, and create a complementary color
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    
    // Shift towards blue for a nice gradient effect
    const r2 = Math.min(255, Math.round(r * 0.7))
    const g2 = Math.min(255, Math.round(g * 0.8))
    const b2 = Math.min(255, Math.round(b * 1.2))
    
    return `rgb(${r2}, ${g2}, ${b2})`
  }

  return (
    <div 
      className="relative overflow-hidden text-white"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${getLighterColor(primaryColor)} 100%)`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{text}</h2>
              {subtext && (
                <p className="text-sm text-white/80 mt-0.5">{subtext}</p>
              )}
            </div>
          </div>

          {/* CTA Button */}
          {link && (
            <button
              onClick={handleClick}
              className="flex-shrink-0 px-6 py-3 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap flex items-center gap-2"
              style={{ color: primaryColor }}
            >
              {buttonText}
              {isExternal ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
