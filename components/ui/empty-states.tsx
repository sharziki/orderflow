'use client'

import { ReactNode } from 'react'
import { 
  Utensils, 
  ShoppingBag, 
  FolderOpen, 
  Gift, 
  Bell,
  Search,
  Users,
  CreditCard,
  Truck,
  Plus
} from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      <div className="flex gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            <Plus className="w-4 h-4" />
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// Pre-built empty states for common scenarios

export function NoMenuItems({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<Utensils className="w-10 h-10 text-slate-400" />}
      title="No menu items yet"
      description="Start building your menu by adding your first item. Customers will see these when ordering."
      action={{ label: 'Add First Item', onClick: onAdd }}
    />
  )
}

export function NoCategories({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="w-10 h-10 text-slate-400" />}
      title="No categories yet"
      description="Categories help organize your menu. Create categories like 'Appetizers', 'Mains', or 'Drinks'."
      action={{ label: 'Add Category', onClick: onAdd }}
    />
  )
}

export function NoOrders({ type = 'all' }: { type?: 'all' | 'active' | 'completed' }) {
  const messages = {
    all: {
      title: "No orders yet",
      description: "When customers place orders, they'll appear here. Share your store link to start receiving orders!"
    },
    active: {
      title: "No active orders",
      description: "You're all caught up! New orders will appear here in real-time."
    },
    completed: {
      title: "No completed orders",
      description: "Completed orders will appear here for your records."
    }
  }
  
  const { title, description } = messages[type || 'all']
  
  return (
    <EmptyState
      icon={<ShoppingBag className="w-10 h-10 text-slate-400" />}
      title={title}
      description={description}
    />
  )
}

export function NoGiftCards({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<Gift className="w-10 h-10 text-slate-400" />}
      title="No gift cards yet"
      description="Gift cards are a great way to boost sales. Create gift cards for customers to purchase and redeem."
      action={{ label: 'Create Gift Card', onClick: onAdd }}
    />
  )
}

export function NoSearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<Search className="w-10 h-10 text-slate-400" />}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
      action={{ label: 'Clear Search', onClick: onClear }}
    />
  )
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={<Bell className="w-10 h-10 text-slate-400" />}
      title="No notifications"
      description="You're all caught up! New notifications will appear here."
    />
  )
}

export function NoCustomers() {
  return (
    <EmptyState
      icon={<Users className="w-10 h-10 text-slate-400" />}
      title="No customers yet"
      description="Customer information will appear here once people start placing orders."
    />
  )
}

export function StripeNotConnected({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={<CreditCard className="w-10 h-10 text-slate-400" />}
      title="Connect Stripe to accept payments"
      description="Set up Stripe to securely accept credit card payments from your customers."
      action={{ label: 'Connect Stripe', onClick: onConnect }}
    />
  )
}

export function DeliveryNotConfigured({ onSetup }: { onSetup: () => void }) {
  return (
    <EmptyState
      icon={<Truck className="w-10 h-10 text-slate-400" />}
      title="Delivery not configured"
      description="Connect DoorDash Drive to offer delivery to your customers."
      action={{ label: 'Set Up Delivery', onClick: onSetup }}
    />
  )
}

export function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={<ShoppingBag className="w-10 h-10 text-slate-400" />}
      title="Your cart is empty"
      description="Browse the menu and add items to your cart to place an order."
      action={{ label: 'Browse Menu', onClick: onBrowse }}
    />
  )
}

// Generic empty state for custom use
export { EmptyState }
