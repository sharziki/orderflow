'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { 
  Clock, CheckCircle, XCircle, Truck, Store, RefreshCw, ChefHat, Package, 
  Bell, BellOff, Printer, ArrowLeft, Volume2, VolumeX, Phone, User, MapPin, Settings
} from 'lucide-react'
import { browserPrint } from '@/lib/browser-print'
import { formatHTMLTicket } from '@/lib/ticket-formatter'
import toast, { Toaster } from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import PrinterSettingsModal from '@/components/PrinterSettingsModal'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
  options?: any[]
  specialRequests?: string
}

interface Order {
  id: string
  orderNumber: string
  type: 'pickup' | 'delivery'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  customerName: string
  customerEmail?: string
  customerPhone: string
  subtotal: number
  deliveryFee: number
  tax: number
  tip: number
  discount?: number
  total: number
  deliveryAddress?: string | null
  notes?: string | null
  createdAt: string
  scheduledFor?: string | null
  items: OrderItem[]
}

const statusConfig = {
  pending: { label: 'New Order', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
}

export default function KanbanOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'pickup' | 'delivery'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const [printingOrders, setPrintingOrders] = useState<Set<string>>(new Set())
  const [demoMode, setDemoMode] = useState(false)
  const [showPrinterSettings, setShowPrinterSettings] = useState(false)
  const previousOrderCountRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-order.mp3')
    audioRef.current.volume = 0.7
    
    const savedSoundPref = localStorage.getItem('orderflow-sound-enabled')
    if (savedSoundPref !== null) {
      setSoundEnabled(savedSoundPref === 'true')
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.log('Could not play sound:', e))
    }
  }, [soundEnabled])

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('orderflow-sound-enabled', String(newValue))
    toast.success(newValue ? 'Sound enabled' : 'Sound muted')
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?limit=100')
      if (!res.ok) throw new Error('Failed to fetch orders')
      
      const data = await res.json()
      const fetchedOrders: Order[] = data.orders || []
      
      if (data.demoMode) {
        setDemoMode(true)
      }
      
      // Check for new orders
      if (fetchedOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
        playNotificationSound()
        toast.success('New order received!')
      }
      previousOrderCountRef.current = fetchedOrders.length
      
      setOrders(fetchedOrders)
    } catch (error) {
      console.error('[Orders] Fetch error:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [playNotificationSound])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Supabase realtime (only if configured)
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Order' }, () => {
        playNotificationSound()
        fetchOrders()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Order' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [playNotificationSound, fetchOrders])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId)
    
    if (demoMode) {
      // In demo mode, just update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order status updated to ${newStatus}`)
      
      // Auto-print in demo mode too
      if (newStatus === 'preparing' && order) {
        const settings = browserPrint.getPrinterSettings()
        if (settings.autoPrint) {
          handlePrintOrder({ ...order, status: newStatus })
        }
      }
      return
    }

    setUpdatingOrders(prev => new Set(prev).add(orderId))
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        fetchOrders()
        toast.error('Failed to update order')
        return
      }

      toast.success(`Order ${newStatus === 'preparing' ? 'accepted' : newStatus}`)
      
      // Auto-print when order is accepted (preparing)
      if (newStatus === 'preparing' && order) {
        const settings = browserPrint.getPrinterSettings()
        if (settings.autoPrint) {
          handlePrintOrder({ ...order, status: newStatus })
        }
      }
    } catch (error) {
      fetchOrders()
      toast.error('Failed to update order')
    } finally {
      setTimeout(() => {
        setUpdatingOrders(prev => {
          const next = new Set(prev)
          next.delete(orderId)
          return next
        })
      }, 500)
    }
  }

  const handlePrintOrder = async (order: Order) => {
    setPrintingOrders(prev => new Set(prev).add(order.id))

    try {
      const htmlContent = formatHTMLTicket(order)
      const result = await browserPrint.printViaBrowser(htmlContent)

      if (result.success) {
        toast.success(`Order ${order.orderNumber} ready to print`)
      } else {
        toast.error(`Print failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Print failed')
    } finally {
      setTimeout(() => {
        setPrintingOrders(prev => {
          const next = new Set(prev)
          next.delete(order.id)
          return next
        })
      }, 1000)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const draggedOrderId = active.id as string
    const targetId = over.id as string

    const columnToStatus: Record<string, Order['status']> = {
      'new-orders': 'pending',
      'making-orders': 'preparing',
      'ready-orders': 'ready'
    }

    let newStatus = columnToStatus[targetId]

    if (!newStatus) {
      const targetOrder = orders.find(o => o.id === targetId)
      if (targetOrder) {
        const statusToColumn: Record<string, string> = {
          'pending': 'new-orders',
          'confirmed': 'new-orders',
          'preparing': 'making-orders',
          'ready': 'ready-orders',
        }
        const targetColumn = statusToColumn[targetOrder.status]
        if (targetColumn) {
          newStatus = columnToStatus[targetColumn]
        }
      }
    }

    if (newStatus) {
      const order = orders.find(o => o.id === draggedOrderId)
      if (order && order.status !== newStatus) {
        updateOrderStatus(draggedOrderId, newStatus)
      }
    }
  }

  const DroppableColumn = ({ id, title, icon: Icon, color, children }: {
    id: string
    title: string
    icon: any
    color: string
    children: React.ReactNode
  }) => {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
      <div className="flex-1 min-w-[320px]">
        <div className={`rounded-t-xl p-4 ${color}`}>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h2 className="font-bold text-lg">{title}</h2>
          </div>
        </div>
        <div
          ref={setNodeRef}
          className={`bg-slate-50 rounded-b-xl p-3 min-h-[500px] space-y-3 transition-colors ${
            isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          }`}
        >
          {children}
        </div>
      </div>
    )
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: order.id })
    const isUpdating = updatingOrders.has(order.id)
    const isPrinting = printingOrders.has(order.id)

    const style = {
      transform: CSS.Transform.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all cursor-grab active:cursor-grabbing ${
          isDragging ? 'shadow-2xl border-blue-500 z-50' : 'border-slate-200'
        } ${isUpdating ? 'opacity-60' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{order.customerName}</h3>
            <p className="text-xs text-slate-500 font-mono">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">${order.total.toFixed(2)}</p>
            <p className="text-xs text-slate-500">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Type Badge */}
        <div className="flex gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            order.type === 'pickup' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {order.type === 'pickup' ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
            {order.type}
          </span>
          {order.scheduledFor && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              <Clock className="w-3 h-3" />
              Scheduled
            </span>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-slate-100 pt-3 mb-3 space-y-1">
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="text-sm text-slate-600 flex justify-between">
              <span><span className="font-semibold">{item.quantity}x</span> {item.name}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-slate-400 italic">+{order.items.length - 3} more items</p>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-yellow-800"><strong>Note:</strong> {order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div 
          className="border-t border-slate-100 pt-3 space-y-2"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-2">
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <>
                <button
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ChefHat className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={() => {
                    if (confirm('Reject this order?')) {
                      updateOrderStatus(order.id, 'cancelled')
                    }
                  }}
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {order.status === 'preparing' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'ready')}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Ready
              </button>
            )}
            {order.status === 'ready' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'completed')}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                Complete
              </button>
            )}
          </div>
          <button
            onClick={() => handlePrintOrder(order)}
            disabled={isPrinting}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'Printing...' : 'Print Ticket'}
          </button>
        </div>
      </div>
    )
  }

  // Filter and sort orders
  const activeOrders = orders.filter(order => {
    const typeMatch = filter === 'ALL' || order.type === filter
    const isActive = order.status !== 'completed' && order.status !== 'cancelled'
    return typeMatch && isActive
  })

  const newOrders = activeOrders.filter(o => o.status === 'pending' || o.status === 'confirmed')
  const makingOrders = activeOrders.filter(o => o.status === 'preparing')
  const readyOrders = activeOrders.filter(o => o.status === 'ready')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 font-semibold">Loading Kitchen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Kitchen Orders</h1>
                <p className="text-xs text-blue-200 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {demoMode ? 'Demo Mode' : 'Real-time updates'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="ALL" className="text-slate-900">All Orders</option>
                <option value="pickup" className="text-slate-900">Pickup</option>
                <option value="delivery" className="text-slate-900">Delivery</option>
              </select>

              {/* Printer Settings */}
              <button
                onClick={() => setShowPrinterSettings(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Printer Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Refresh */}
              <button
                onClick={() => { setLoading(true); fetchOrders(); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Pending Badge */}
              <div className="relative">
                <Bell className="w-5 h-5" />
                {newOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-xs rounded-full flex items-center justify-center animate-pulse">
                    {newOrders.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">New: {newOrders.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">Making: {makingOrders.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">Ready: {readyOrders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-6">
            {/* New Orders Column */}
            <DroppableColumn
              id="new-orders"
              title="New Orders"
              icon={Bell}
              color="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900"
            >
              <SortableContext items={newOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                {newOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No new orders</p>
                  </div>
                ) : (
                  newOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </SortableContext>
            </DroppableColumn>

            {/* Making Column */}
            <DroppableColumn
              id="making-orders"
              title="Making"
              icon={ChefHat}
              color="bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900"
            >
              <SortableContext items={makingOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                {makingOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No orders in progress</p>
                  </div>
                ) : (
                  makingOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </SortableContext>
            </DroppableColumn>

            {/* Ready Column */}
            <DroppableColumn
              id="ready-orders"
              title="Ready"
              icon={Package}
              color="bg-gradient-to-r from-green-400 to-green-500 text-green-900"
            >
              <SortableContext items={readyOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                {readyOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No orders ready</p>
                  </div>
                ) : (
                  readyOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </SortableContext>
            </DroppableColumn>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-2xl opacity-90 rotate-2">
                <p className="font-bold text-slate-900">Moving order...</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Printer Settings Modal */}
      <PrinterSettingsModal
        isOpen={showPrinterSettings}
        onClose={() => setShowPrinterSettings(false)}
      />
    </div>
  )
}
