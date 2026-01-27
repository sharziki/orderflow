'use client'

import { cn } from '@/lib/utils'

// Base shimmer animation
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]",
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

// Add shimmer keyframes via style tag (or add to global CSS)
export function ShimmerStyles() {
  return (
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  )
}

// Menu Item Card Skeleton
export function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Shimmer className="aspect-square w-full" />
      <div className="p-5 space-y-3">
        <Shimmer className="h-5 w-3/4 rounded" />
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-2/3 rounded" />
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <Shimmer className="h-7 w-20 rounded" />
          <Shimmer className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Menu Grid Skeleton
export function MenuGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MenuItemSkeleton key={i} />
      ))}
    </div>
  )
}

// Category Skeleton
export function CategorySkeleton() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 bg-slate-50 flex items-center gap-3">
        <Shimmer className="h-5 w-5 rounded" />
        <div className="flex-1">
          <Shimmer className="h-5 w-40 rounded mb-1" />
          <Shimmer className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}

// Menu Management Skeleton (Dashboard)
export function MenuManagementSkeleton() {
  return (
    <div className="space-y-6">
      <Shimmer className="h-12 w-full rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </div>
  )
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Shimmer className="h-5 w-24 rounded" />
          <Shimmer className="h-4 w-32 rounded" />
        </div>
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2 pt-3 border-t">
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-3/4 rounded" />
      </div>
      <div className="flex justify-between items-center pt-3">
        <Shimmer className="h-6 w-16 rounded" />
        <Shimmer className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  )
}

// Orders List Skeleton
export function OrdersListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <Shimmer className="h-12 w-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Shimmer className="h-4 w-20 rounded" />
              <Shimmer className="h-7 w-16 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Shimmer className="h-5 w-full max-w-[120px] rounded" />
        </td>
      ))}
    </tr>
  )
}

// Settings Form Skeleton
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer className="h-4 w-24 rounded" />
          <Shimmer className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Shimmer className="h-10 w-32 rounded-lg" />
    </div>
  )
}

// Full Page Loading Skeleton
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Shimmer className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Shimmer className="h-5 w-40 rounded" />
                <Shimmer className="h-4 w-24 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="h-9 w-24 rounded-lg" />
              <Shimmer className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStatsSkeleton />
      </div>
    </div>
  )
}

// Storefront Menu Skeleton
export function StorefrontMenuSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <Shimmer className="h-40 w-full rounded-none" />
      
      {/* Category nav skeleton */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>
      
      {/* Menu grid skeleton */}
      <div className="px-4">
        <MenuGridSkeleton count={6} />
      </div>
    </div>
  )
}
