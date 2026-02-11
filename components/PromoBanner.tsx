'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ExternalLink, Sparkles, Gift, Zap, Star, Flame, ArrowRight } from 'lucide-react'

export interface PromoBannerData {
  id: string
  type: string
  style: string
  title?: string | null
  subtitle?: string | null
  buttonText?: string | null
  buttonLink?: string | null
  imageUrl?: string | null
  bgColor?: string | null
  textColor?: string | null
  gradientFrom?: string | null
  gradientTo?: string | null
  position: string
  animation?: string | null
  isDismissible?: boolean
  isActive: boolean
}

interface PromoBannerProps {
  banner: PromoBannerData
  onDismiss?: (id: string) => void
  primaryColor?: string
}

function SparkleBackground({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.2}s`,
            opacity: 0.3
          }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      ))}
    </div>
  )
}

function MarqueeText({ text, speed = 30 }: { text: string; speed?: number }) {
  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <div 
        className="flex"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {[...Array(4)].map((_, i) => (
          <span key={i} className="flex items-center gap-8 px-4">
            <Star className="w-4 h-4 fill-current" />
            <span>{text}</span>
            <Star className="w-4 h-4 fill-current" />
            <span>{text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PromoBanner({ banner, onDismiss, primaryColor = '#2563eb' }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dismissed = localStorage.getItem(`banner_dismissed_${banner.id}`)
    if (dismissed) {
      setIsDismissed(true)
      return
    }
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [banner.id])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(`banner_dismissed_${banner.id}`, 'true')
    setTimeout(() => {
      setIsDismissed(true)
      onDismiss?.(banner.id)
    }, 300)
  }

  const handleClick = () => {
    if (!banner.buttonLink) return
    if (banner.buttonLink.startsWith('http')) {
      window.open(banner.buttonLink, '_blank')
    } else {
      window.location.href = banner.buttonLink
    }
  }

  if (isDismissed) return null

  const bgColor = banner.bgColor || primaryColor
  const textColor = banner.textColor || '#ffffff'
  const gradientFrom = banner.gradientFrom || bgColor
  const gradientTo = banner.gradientTo || '#7c3aed'

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0 translate-y-4'
    switch (banner.animation) {
      case 'slide': return 'opacity-100 translate-y-0 transition-all duration-500 ease-out'
      case 'pulse': return 'opacity-100 animate-pulse'
      case 'none': return 'opacity-100'
      default: return 'opacity-100 translate-y-0 transition-all duration-500 ease-out'
    }
  }

  if (banner.type === 'marquee') {
    return (
      <div
        ref={bannerRef}
        className={`relative overflow-hidden py-2 ${getAnimationClass()}`}
        style={{ 
          background: `linear-gradient(90deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          color: textColor
        }}
      >
        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <MarqueeText text={banner.title || 'Special Offer!'} />
        {banner.isDismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  if (banner.type === 'floating' || banner.position === 'floating') {
    return (
      <div
        ref={bannerRef}
        className={`fixed bottom-4 right-4 z-50 max-w-sm ${getAnimationClass()}`}
      >
        <div
          className="relative p-4 rounded-2xl shadow-2xl backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
          style={{
            background: banner.type === 'image' && banner.imageUrl 
              ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${banner.imageUrl})`
              : `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: textColor
          }}
          onClick={handleClick}
        >
          <SparkleBackground color={textColor} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1">
              {banner.title && <h3 className="font-bold text-sm">{banner.title}</h3>}
              {banner.subtitle && <p className="text-xs opacity-80">{banner.subtitle}</p>}
            </div>
            {banner.buttonLink && <ArrowRight className="w-5 h-5" />}
          </div>
          {banner.isDismissible && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss() }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (banner.style === 'hero') {
    return (
      <div
        ref={bannerRef}
        className={`relative overflow-hidden ${getAnimationClass()}`}
        style={{
          background: banner.type === 'image' && banner.imageUrl
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${banner.imageUrl})`
            : banner.type === 'solid'
              ? bgColor
              : `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: textColor
        }}
      >
        <SparkleBackground color={textColor} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                {banner.title && <h2 className="text-xl sm:text-2xl font-bold">{banner.title}</h2>}
                {banner.subtitle && <p className="text-sm opacity-80 mt-0.5">{banner.subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {banner.buttonLink && banner.buttonText && (
                <button
                  onClick={handleClick}
                  className="flex-shrink-0 px-6 py-3 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap flex items-center gap-2"
                  style={{ color: gradientFrom }}
                >
                  {banner.buttonText}
                  {banner.buttonLink.startsWith('http') ? <ExternalLink className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              {banner.isDismissible && (
                <button onClick={handleDismiss} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (banner.style === 'split' && banner.imageUrl) {
    return (
      <div
        ref={bannerRef}
        className={`relative overflow-hidden ${getAnimationClass()}`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-stretch">
            <div className="md:w-1/3 h-48 md:h-auto">
              <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div 
              className="md:w-2/3 p-6 md:p-8 flex items-center"
              style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wide opacity-80">Limited Time</span>
                </div>
                {banner.title && <h2 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h2>}
                {banner.subtitle && <p className="opacity-80 mb-4">{banner.subtitle}</p>}
                {banner.buttonLink && banner.buttonText && (
                  <button
                    onClick={handleClick}
                    className="px-6 py-3 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg inline-flex items-center gap-2"
                    style={{ color: gradientFrom }}
                  >
                    {banner.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              {banner.isDismissible && (
                <button onClick={handleDismiss} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (banner.style === 'pill') {
    return (
      <div ref={bannerRef} className={`flex justify-center py-3 ${getAnimationClass()}`} style={{ backgroundColor: '#f9fafb' }}>
        <div
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform"
          style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`, color: textColor }}
          onClick={handleClick}
        >
          <Sparkles className="w-4 h-4" />
          {banner.title && <span className="font-semibold text-sm">{banner.title}</span>}
          {banner.subtitle && <span className="text-xs opacity-80 hidden sm:inline">{banner.subtitle}</span>}
          {banner.buttonLink && <ChevronRight className="w-4 h-4" />}
          {banner.isDismissible && (
            <button onClick={(e) => { e.stopPropagation(); handleDismiss() }} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (banner.style === 'minimal') {
    return (
      <div
        ref={bannerRef}
        className={`border-b ${getAnimationClass()}`}
        style={{ backgroundColor: bgColor, borderColor: `${gradientFrom}30`, color: textColor }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: gradientFrom }} />
            <span>
              {banner.title}
              {banner.subtitle && <span className="opacity-70"> — {banner.subtitle}</span>}
            </span>
            {banner.buttonLink && banner.buttonText && (
              <button onClick={handleClick} className="font-semibold hover:underline flex items-center gap-1" style={{ color: gradientFrom }}>
                {banner.buttonText}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {banner.isDismissible && (
              <button onClick={handleDismiss} className="p-1 hover:bg-gray-200 rounded-full transition-colors ml-2">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={bannerRef}
      className={`relative overflow-hidden ${getAnimationClass()}`}
      style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`, color: textColor }}
    >
      <SparkleBackground color={textColor} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              {banner.title && <h2 className="text-xl sm:text-2xl font-bold">{banner.title}</h2>}
              {banner.subtitle && <p className="text-sm opacity-80 mt-0.5">{banner.subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {banner.buttonLink && banner.buttonText && (
              <button
                onClick={handleClick}
                className="flex-shrink-0 px-6 py-3 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap flex items-center gap-2"
                style={{ color: gradientFrom }}
              >
                {banner.buttonText}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {banner.isDismissible && (
              <button onClick={handleDismiss} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PromoBannerContainer({ 
  banners, 
  position = 'top',
  primaryColor = '#2563eb'
}: { 
  banners: PromoBannerData[]
  position?: 'top' | 'middle' | 'bottom' | 'floating'
  primaryColor?: string
}) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const filteredBanners = banners.filter(b => b.position === position && !dismissedIds.includes(b.id))
  if (filteredBanners.length === 0) return null

  return (
    <div className={position === 'floating' ? '' : 'space-y-0'}>
      {filteredBanners.map(banner => (
        <PromoBanner
          key={banner.id}
          banner={banner}
          primaryColor={primaryColor}
          onDismiss={(id) => setDismissedIds(prev => [...prev, id])}
        />
      ))}
    </div>
  )
}
