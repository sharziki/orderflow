import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  )
}

export { Skeleton }

// Common skeleton patterns
export function MenuItemSkeleton() {
  return (
    <div className="p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-4 h-4" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="divide-y divide-slate-100">
        <MenuItemSkeleton />
        <MenuItemSkeleton />
        <MenuItemSkeleton />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-5 w-16 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-3 w-20 mb-4" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-200 h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-5" />
          <div className="flex gap-2 ml-4">
            <Skeleton className="w-28 h-8 rounded-lg" />
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-28 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex flex-col lg:flex-row flex-1">
        <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <CategorySkeleton />
          <CategorySkeleton />
        </div>
        <div className="flex-1 bg-slate-200 p-8 flex items-center justify-center">
          <Skeleton className="w-[375px] h-[600px] rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  )
}
