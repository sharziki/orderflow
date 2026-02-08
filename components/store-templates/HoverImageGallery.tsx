'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HoverImageGalleryProps {
  images: string[]
  alt: string
  className?: string
  cycleInterval?: number // ms between image changes on hover
}

export function HoverImageGallery({
  images,
  alt,
  className = '',
  cycleInterval = 800,
}: HoverImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start cycling through images on hover
  const startCycling = useCallback(() => {
    if (images.length <= 1) return
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, cycleInterval)
  }, [images.length, cycleInterval])

  // Stop cycling and reset to first image
  const stopCycling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCurrentIndex(0)
  }, [])

  useEffect(() => {
    if (isHovering) {
      startCycling()
    } else {
      stopCycling()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isHovering, startCycling, stopCycling])

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImage}
          src={currentImage}
          alt={alt}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      
      {/* Image indicator dots - show on hover when multiple images */}
      {images.length > 1 && isHovering && (
        <motion.div
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50'
              }`}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
