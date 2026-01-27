'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, CheckCircle, XCircle, Truck, Store, RefreshCw, ChefHat, Package, Bell, BellOff, Printer, Gift } from 'lucide-react'
import Image from 'next/image'
import PrinterSettingsModal from '@/components/PrinterSettingsModal'
import { browserPrint } from '@/lib/browser-print'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Order {
  id: string
  orderType: 'PICKUP' | 'DELIVERY'
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  totalAmount: number
  deliveryFee: number
  merchantDeliveryFee?: number
  tax: number
  stripeFee?: number
  finalAmount: number
  deliveryAddress?: string
  doordashOrderId?: string
  notes?: string
  createdAt: string
  customer: {
    name: string
    email: string
    phone?: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    menu_item: {
      name: string
      description: string
    }
  }>
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'PICKUP' | 'DELIVERY'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showPrinterSettings, setShowPrinterSettings] = useState(false)
  const [printingOrders, setPrintingOrders] = useState<Set<string>>(new Set())
  const previousOrderCountRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require 3px movement to activate drag (prevents accidental drags)
      },
    })
  )

  // Initialize audio - Longer bell-like sound
  useEffect(() => {
    try {
      // Create bell sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const sampleRate = audioContext.sampleRate
      const duration = 0.8 // 800ms for a longer bell sound
      const buffer = audioContext.createBuffer(1, Math.floor(sampleRate * duration), sampleRate)
      const data = buffer.getChannelData(0)
      
      // Generate a bell-like sound with multiple harmonics and exponential decay
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate
        // Bell sound: fundamental + harmonics with exponential decay
        const fundamental = Math.sin(2 * Math.PI * 800 * t) // 800Hz base tone
        const harmonic2 = Math.sin(2 * Math.PI * 1600 * t) * 0.5 // 1600Hz harmonic
        const harmonic3 = Math.sin(2 * Math.PI * 2400 * t) * 0.25 // 2400Hz harmonic
        const decay = Math.exp(-t * 3) // Exponential decay for bell-like fade
        data[i] = (fundamental + harmonic2 + harmonic3) * decay * 0.3
      }
      
      // Convert to WAV and create audio element
      const wav = audioBufferToWav(buffer)
      const blob = new Blob([wav], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      audioRef.current = new Audio(url)
      audioRef.current.volume = 0.7
      
      // Clean up URL when audio is loaded
      audioRef.current.addEventListener('loadeddata', () => {
        URL.revokeObjectURL(url)
      })
    } catch (error) {
      console.error('Failed to create bell sound, using fallback:', error)
      // Fallback to a simple beep if Web Audio API fails
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGF0fPTgjMGHm7A7+OZRA0PVa3n77BdGAg+ltrzxnYpBSh+zPLaizsIGGS57OihUhELTKXh8bllHAU2jdXzzn0vBSt9yvHakD0KE1yw6OyrWBYJPJTX88p5KwUmd8rx3I4+CRZhs+nur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk8kdfzy3krBSh3yfLcjj0JFmGz7u6vWxkJPJHX88t5KwUod8ny3I49CRZhs+nur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk8kdfzy3krBSh3yfLcjj0JFmGz7u6vWxkJPJHX88t5KwUod8ny3I49CRZhs+zur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk8kdfzy3krBSh3yfLcjj0JFmGz7u6vWxkJPJHX88t5KwUod8ny3I49CRZhs+zur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk8kdfzy3krBSh3yfLcjj0JFmGz7u6vWxkJPJHX88t5KwUod8ny3I49CRZhs+zur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk8kdfzy3krBSh3yfLcjj0JFmGz7u6vWxkJPJHX88t5KwUod8ny3I49CRZhs+zur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk8kdfzy3krBSh3yfLcjj0JFmGz7u6vWxkJPJHX88t5KwUod8ny3I49CRZhs+zur1sZCTyR1/PLeSsFKHfJ8tyOPQkWYbPu7q9bGQk=')
    }
  }, [])
  
  // Helper function to convert AudioBuffer to WAV
  function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    let pos = 0
    
    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true)
      pos += 2
    }
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true)
      pos += 4
    }
    
    // RIFF identifier
    setUint32(0x46464952) // "RIFF"
    setUint32(36 + length * numberOfChannels * 2) // File length - 8
    setUint32(0x45564157) // "WAVE"
    
    // Format chunk
    setUint32(0x20746d66) // "fmt "
    setUint32(16) // Chunk length
    setUint16(1) // Audio format (1 = PCM)
    setUint16(numberOfChannels) // Number of channels
    setUint32(sampleRate) // Sample rate
    setUint32(sampleRate * numberOfChannels * 2) // Byte rate
    setUint16(numberOfChannels * 2) // Block align
    setUint16(16) // Bits per sample
    
    // Data chunk
    setUint32(0x61746164) // "data"
    setUint32(length * numberOfChannels * 2) // Chunk length
    
    // Write interleaved data
    const channels: Float32Array[] = []
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }
    
    let offset = 0
    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }
    
    return arrayBuffer
  }

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Could not play sound:', e))
    }
  }, [soundEnabled])

  useEffect(() => {
    fetchOrders()

    // Track initial count
    previousOrderCountRef.current = orders.length

    // Set up real-time subscription for all order changes
    console.log('[Admin] Setting up real-time subscriptions')

    let insertChannel: any = null
    let updateChannel: any = null

    try {
      // Check if Supabase is available before setting up subscriptions
      if (typeof window !== 'undefined') {
        const hasSupabaseEnv = !!(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        if (!hasSupabaseEnv) {
          console.warn('[Admin] Supabase environment variables not available. Real-time updates disabled.')
          console.warn('[Admin] URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
          console.warn('[Admin] Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
          return
        }
      }

      // Subscribe to INSERT events (new orders)
      insertChannel = supabase
        .channel('order-inserts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          (payload: any) => {
            console.log('[Admin] New order received:', payload)
            // Validate payload before processing
            if (payload && payload.new) {
              fetchOrders()
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Admin] Successfully subscribed to INSERT events')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Admin] Error subscribing to INSERT events')
          }
        })

      // Subscribe to UPDATE events (status changes)
      updateChannel = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders'
          },
          async (payload: any) => {
            console.log('[Admin] Order updated:', payload)
            // Validate payload before processing
            if (payload && payload.new) {
              fetchOrders()

              // Auto-print when order is CONFIRMED
              if (payload.new.status === 'CONFIRMED') {
                const settings = browserPrint.getPrinterSettings()
                if (settings.autoPrint) {
                  try {
                    // Fetch full order details for printing
                    const response = await fetch(`/api/orders/${payload.new.id}`)
                    if (response.ok) {
                      const order = await response.json()
                      const result = await browserPrint.printTicket(order)

                      if (result.success) {
                        toast.success(`Order #${order.id.slice(-6).toUpperCase()} printed to kitchen`)
                        console.log('[Admin] Auto-print successful for order:', payload.new.id)
                      } else {
                        toast.error(`Print failed: ${result.error}`)
                        console.error('[Admin] Auto-print failed:', result.error)
                      }
                    }
                  } catch (error) {
                    console.error('[Admin] Auto-print error:', error)
                    toast.error('Auto-print failed. Please print manually.')
                  }
                }
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Admin] Successfully subscribed to UPDATE events')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Admin] Error subscribing to UPDATE events')
          }
        })
    } catch (error) {
      console.error('[Admin] Error setting up subscriptions:', error)
      // Don't block the UI if subscriptions fail - polling will still work
    }

    return () => {
      console.log('[Admin] Cleaning up subscriptions')
      try {
        if (insertChannel) {
          supabase.removeChannel(insertChannel)
        }
        if (updateChannel) {
          supabase.removeChannel(updateChannel)
        }
      } catch (error) {
        console.error('[Admin] Error cleaning up subscriptions:', error)
      }
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Admin] Error fetching orders:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        setError(errorData.error || `Failed to fetch orders (${response.status})`)
        setOrders([]) // Set empty array on error
        return
      }

      const data = await response.json()

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('[Admin] Invalid response format: expected array, got:', typeof data)
        setError('Invalid response format from server')
        setOrders([]) // Set empty array on invalid data
        return
      }

      console.log('[Admin] Orders fetched successfully:', data.length)

      // Check if new orders arrived
      if (data.length > previousOrderCountRef.current) {
        playNotificationSound()
      }
      previousOrderCountRef.current = data.length

      setOrders(data)
      setError(null) // Clear any previous errors
    } catch (error) {
      console.error('[Admin] Error fetching orders:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch orders')
      setOrders([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // Optimistic update
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ))

    // Add to updating set for visual feedback
    setUpdatingOrders(prev => new Set(prev).add(orderId))

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
        fetchOrders()
        return
      }

      // Auto-print when order is accepted (changed to PREPARING) if auto-print is enabled
      if (newStatus === 'PREPARING') {
        // Get fresh settings from storage (don't rely on cached values)
        const settings = browserPrint.getPrinterSettings()
        // Only auto-print if explicitly enabled (check for true, not just truthy)
        if (settings && settings.autoPrint === true) {
          try {
            // Get the order that was just updated
            const order = orders.find(o => o.id === orderId)
            if (order) {
              // Use the same browser print dialog as the print button
              const { formatHTMLTicket } = await import('@/lib/ticket-formatter')
              
              // Convert order to format expected by formatHTMLTicket
              const orderForPrint = {
                id: order.id,
                orderType: order.orderType,
                status: order.status,
                createdAt: order.createdAt,
                customer: {
                  name: order.customer.name,
                  phone: order.customer.phone
                },
                items: order.items.map(item => ({
                  quantity: item.quantity,
                  menuItem: {
                    name: item.menu_item.name
                  },
                  price: item.price
                })),
                notes: order.notes,
                deliveryAddress: order.deliveryAddress,
                finalAmount: order.finalAmount,
                scheduledPickupTime: null
              }
              
              const htmlContent = formatHTMLTicket(orderForPrint)
              
              // Create a hidden iframe for printing
              const iframe = document.createElement('iframe')
              iframe.style.position = 'fixed'
              iframe.style.left = '-9999px'
              iframe.style.top = '-9999px'
              iframe.style.width = '0'
              iframe.style.height = '0'
              iframe.style.border = 'none'
              document.body.appendChild(iframe)

              // Wait for iframe to be ready
              await new Promise<void>((resolve) => {
                iframe.onload = () => resolve()
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                if (iframeDoc && iframeDoc.readyState === 'complete') {
                  resolve()
                } else {
                  setTimeout(() => resolve(), 100)
                }
              })

              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
              if (iframeDoc) {
                // Write content to iframe
                iframeDoc.open()
                iframeDoc.write(htmlContent)
                iframeDoc.close()

                // Wait for content to load
                await new Promise(resolve => setTimeout(resolve, 500))

                // Trigger print
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()

                console.log('[Admin] Auto-print triggered for order:', orderId)
                
                // Clean up after print
                setTimeout(() => {
                  try {
                    if (document.body.contains(iframe)) {
                      document.body.removeChild(iframe)
                    }
                  } catch (e) {
                    // Ignore cleanup errors
                  }
                }, 2000)
              }
            }
          } catch (error) {
            console.error('[Admin] Auto-print error on accept:', error)
            // Don't show error toast, just log it
          }
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      // Revert on error
      fetchOrders()
    } finally {
      // Remove from updating set
      setTimeout(() => {
        setUpdatingOrders(prev => {
          const next = new Set(prev)
          next.delete(orderId)
          return next
        })
      }, 500)
    }
  }

  const handleLogout = async () => {
    // Demo mode: Logout disabled
    console.log('Logout disabled in demo mode')
  }

  const handlePrintOrder = async (order: Order) => {
    setPrintingOrders(prev => new Set(prev).add(order.id))

    try {
      // Always use browser native print dialog (like test print)
      const { formatHTMLTicket } = await import('@/lib/ticket-formatter')
      
      // Convert order to format expected by formatHTMLTicket
      const orderForPrint = {
        id: order.id,
        orderType: order.orderType,
        status: order.status,
        createdAt: order.createdAt,
        customer: {
          name: order.customer.name,
          phone: order.customer.phone
        },
        items: order.items.map(item => ({
          quantity: item.quantity,
          menuItem: {
            name: item.menu_item.name
          },
          price: item.price
        })),
        notes: order.notes,
        deliveryAddress: order.deliveryAddress,
        finalAmount: order.finalAmount,
        scheduledPickupTime: null
      }
      
      const htmlContent = formatHTMLTicket(orderForPrint)
      
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.top = '-9999px'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      // Wait for iframe to be ready
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve()
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc && iframeDoc.readyState === 'complete') {
          resolve()
        } else {
          setTimeout(() => resolve(), 100)
        }
      })

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not access iframe document')
      }

      // Write content to iframe
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500))

      // Trigger print
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()

      toast.success(`Order #${order.id.slice(-6).toUpperCase()} ready to print`)
      
      // Clean up after print (wait a bit for dialog to open)
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 2000)
    } catch (error) {
      console.error('[Admin] Print error:', error)
      toast.error(`Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch(e.key.toLowerCase()) {
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            fetchOrders()
          }
          break
        case 'escape':
          setSelectedOrder(null)
          setShowShortcuts(false)
          clearSelection()
          break
        case 'a':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            // Select all visible orders
            const allVisibleOrderIds = activeOrders.map(o => o.id)
            setSelectedOrderIds(new Set(allVisibleOrderIds))
          }
          break
        case '1':
        case '2':
        case '3':
          if (!e.metaKey && !e.ctrlKey) {
            const filters: ('ALL' | 'PICKUP' | 'DELIVERY')[] = ['ALL', 'PICKUP', 'DELIVERY']
            setFilter(filters[parseInt(e.key) - 1])
          }
          break
        case 'm':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            setSoundEnabled(prev => !prev)
          }
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedOrder])

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedOrderIds(new Set())
  }

  const handleDragStart = (event: DragStartEvent) => {
    const draggedOrderId = event.active.id as string
    
    // If the dragged order is not selected, select it and clear other selections
    if (!selectedOrderIds.has(draggedOrderId)) {
      setSelectedOrderIds(new Set([draggedOrderId]))
    }
    
    setActiveId(draggedOrderId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      // If dropped outside, keep selection
      return
    }

    const draggedOrderId = active.id as string
    const targetId = over.id as string

    // Map column IDs to order statuses
    const columnToStatus: Record<string, Order['status']> = {
      'new-orders': 'PENDING',
      'making-orders': 'PREPARING',
      'ready-orders': 'READY'
    }

    // Check if we dropped directly on a column
    let targetColumn = targetId
    let newStatus = columnToStatus[targetColumn]

    // If we dropped on another order card, find which column that order belongs to
    if (!newStatus) {
      const targetOrder = orders.find(o => o.id === targetId)
      if (targetOrder) {
        // Map order status to column ID
        const statusToColumn: Record<Order['status'], string> = {
          'PENDING': 'new-orders',
          'CONFIRMED': 'new-orders',
          'PREPARING': 'making-orders',
          'READY': 'ready-orders',
          'COMPLETED': 'new-orders', // Fallback
          'CANCELLED': 'new-orders' // Fallback
        }
        targetColumn = statusToColumn[targetOrder.status] || 'new-orders'
        newStatus = columnToStatus[targetColumn]
      } else {
        // If we can't find the target, don't update
        console.warn('[Admin] Could not determine target column for drop:', targetId)
        return
      }
    }

    if (newStatus) {
      // Get all orders to move (selected orders + the dragged one)
      const ordersToMove = Array.from(selectedOrderIds.size > 0 ? selectedOrderIds : [draggedOrderId])
      
      // Update all selected orders
      ordersToMove.forEach(orderId => {
        const order = orders.find(o => o.id === orderId)
        if (order && order.status !== newStatus) {
          updateOrderStatus(orderId, newStatus)
        }
      })
      
      // Clear selection after moving
      setSelectedOrderIds(new Set())
    }
  }

  // Droppable column component
  const DroppableColumn = ({ 
    id, 
    children, 
    className = '' 
  }: { 
    id: string
    children: React.ReactNode
    className?: string
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
    })

    return (
      <div
        ref={setNodeRef}
        className={`${className} transition-colors duration-150 min-h-[400px] ${isOver ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}
      >
        {children}
      </div>
    )
  }

  // Filter orders by type, exclude COMPLETED and CANCELLED from board
  const activeOrders = orders.filter(order => {
    const typeMatch = filter === 'ALL' || order.orderType === filter
    const isActive = order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
    return typeMatch && isActive
  })

  // Split orders into columns
  const newOrders = activeOrders
    .filter(order => order.status === 'PENDING' || order.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // oldest first

  const makingOrders = activeOrders
    .filter(order => order.status === 'PREPARING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const readyOrders = activeOrders
    .filter(order => order.status === 'READY')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Sortable order card component with drag and drop
  const SortableOrderCard = ({ order }: { order: Order }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging
    } = useSortable({ id: order.id })

    const isUpdating = updatingOrders.has(order.id)
    const isSelected = selectedOrderIds.has(order.id)

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : undefined,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 9999 : 'auto',
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white border-2 rounded-lg p-4 space-y-3 ${
          isSelected ? 'border-blue-500 bg-blue-50/30 shadow-lg' : 'border-gray-200'
        } ${
          isDragging ? 'shadow-2xl border-blue-500 cursor-grabbing' : 'hover:shadow-md transition-shadow duration-200 cursor-grab'
        } ${isUpdating ? 'opacity-50' : ''}`}
      >
        {/* Selection Checkbox */}
        <div 
          className="flex items-center justify-between mb-2"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                toggleOrderSelection(order.id)
              }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 font-medium">
              {isSelected ? 'Selected' : 'Select'}
            </span>
          </label>
          {selectedOrderIds.size > 0 && (
            <span className="text-xs text-blue-600 font-semibold">
              {selectedOrderIds.size} selected
            </span>
          )}
        </div>

        {/* Order Content - Clickable to open modal */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            setSelectedOrder(order)
          }}
          className="cursor-pointer"
        >
          {/* Customer Name - Large */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{order.customer.name}</h3>
              <p className="text-xs text-gray-500">#{order.id.slice(-6).toUpperCase()}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  order.orderType === 'PICKUP'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {order.orderType === 'PICKUP' ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                  {order.orderType}
                </span>
                {/* Category Tag - Fresh Fish Market vs Restaurant */}
                {order.items.some(item => item.menu_item?.name && (
                  item.menu_item.name.toLowerCase().includes('fish') ||
                  item.menu_item.name.toLowerCase().includes('salmon') ||
                  item.menu_item.name.toLowerCase().includes('tuna') ||
                  item.menu_item.name.toLowerCase().includes('crab') ||
                  item.menu_item.name.toLowerCase().includes('snapper') ||
                  item.menu_item.name.toLowerCase().includes('bass')
                )) ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6c0 2.5 1.5 4.5 3 6l3 3 3-3c1.5-1.5 3-3.5 3-6a6 6 0 00-6-6z"/>
                    </svg>
                    Fish Market
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                    <ChefHat className="w-3 h-3" />
                    Restaurant
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-gray-900">
                ${order.finalAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="border-t border-gray-200 pt-2 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 truncate">
              <span className="font-semibold text-gray-900">{item.quantity}x</span> {item.menu_item.name}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="text-xs text-gray-500 italic">
            +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
          </div>
        )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border-t border-gray-200 pt-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5">
              <p className="text-xs text-yellow-800 line-clamp-2">
                <span className="font-semibold">Note:</span> {order.notes}
              </p>
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div 
          className="border-t border-gray-200 pt-3 space-y-2" 
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex gap-2">
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  updateOrderStatus(order.id, 'PREPARING')
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                Accept
              </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Are you sure you want to reject this order? The customer will be notified.')) {
                  updateOrderStatus(order.id, 'CANCELLED')
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </>
        )}
        {order.status === 'PREPARING' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              updateOrderStatus(order.id, 'READY')
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Ready
          </button>
        )}
        {order.status === 'READY' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              updateOrderStatus(order.id, 'COMPLETED')
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            Complete
          </button>
        )}
        </div>
        {/* Print Button - Always visible */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePrintOrder(order)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={printingOrders.has(order.id)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" />
          {printingOrders.has(order.id) ? 'Printing...' : 'Print Ticket'}
        </button>
        </div>
      </div>
    )
  }

  // Order detail modal component
  const OrderModal = ({ order }: { order: Order }) => (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={() => setSelectedOrder(null)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 border-b border-gray-200 p-6 flex items-start justify-between text-white">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-semibold ${
                  order.orderType === 'PICKUP'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/20 text-white'
                }`}>
                  {order.orderType === 'PICKUP' ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                  {order.orderType}
                </span>
                {/* Category Tag - Fresh Fish Market vs Restaurant */}
                {order.items.some(item => item.menu_item?.name && (
                  item.menu_item.name.toLowerCase().includes('fish') ||
                  item.menu_item.name.toLowerCase().includes('salmon') ||
                  item.menu_item.name.toLowerCase().includes('tuna') ||
                  item.menu_item.name.toLowerCase().includes('crab') ||
                  item.menu_item.name.toLowerCase().includes('snapper') ||
                  item.menu_item.name.toLowerCase().includes('bass')
                )) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold bg-cyan-50 text-cyan-700 border border-cyan-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6c0 2.5 1.5 4.5 3 6l3 3 3-3c1.5-1.5 3-3.5 3-6a6 6 0 00-6-6z"/>
                    </svg>
                    Fish Market
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-300">
                    <ChefHat className="w-4 h-4" />
                    Restaurant
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-100">
                Placed {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-3">Customer Information</h3>
              <div className="card p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Name:</span>
                  <span className="font-medium">{order.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Email:</span>
                  <span className="font-medium">{order.customer.email}</span>
                </div>
                {order.customer.phone && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Phone:</span>
                    <span className="font-medium">{order.customer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {order.notes && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 mb-3">Special Instructions</h3>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-200">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-3">Order Items</h3>
              <div className="card p-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.menu_item.name}</p>
                      <p className="text-sm text-neutral-400">{item.menu_item.description}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-[rgb(var(--color-primary))]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-3">Pricing</h3>
              <div className="card p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Tax:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                {order.orderType === 'DELIVERY' && (
                  <>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">DoorDash Delivery Fee:</span>
                        <span>${order.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    {(order.merchantDeliveryFee ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Merchant Delivery Fee:</span>
                        <span>${(order.merchantDeliveryFee ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Processing Fee:</span>
                  <span>${order.stripeFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-neutral-800 pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[rgb(var(--color-primary))]">${order.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'PREPARING')
                      setSelectedOrder(null)
                    }}
                    className="btn-primary w-full"
                  >
                    <ChefHat className="w-5 h-5" />
                    Accept & Start Making Order
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Are you sure you want to reject this order? The customer will be notified and this action cannot be undone.')) {
                        updateOrderStatus(order.id, 'CANCELLED')
                        setSelectedOrder(null)
                      }
                    }}
                    className="w-full rounded px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Order
                  </button>
                </>
              )}
              {order.status === 'PREPARING' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateOrderStatus(order.id, 'READY')
                    setSelectedOrder(null)
                  }}
                  className="btn-primary w-full"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Ready
                </button>
              )}
              {order.status === 'READY' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateOrderStatus(order.id, 'COMPLETED')
                    setSelectedOrder(null)
                  }}
                  className="w-full rounded px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Complete Order
                </button>
              )}
              {/* Print Button - Always visible */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrintOrder(order)
                }}
                disabled={printingOrders.has(order.id)}
                className="w-full rounded px-4 py-3 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-5 h-5" />
                {printingOrders.has(order.id) ? 'Printing...' : 'Print Kitchen Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 p-4">
        <div className="text-center max-w-2xl">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Error</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-2">To fix this on Vercel:</p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Go to your Vercel project settings</li>
                <li>Navigate to Environment Variables</li>
                <li>Add the following variables:
                  <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                    <li><code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                  </ul>
                </li>
                <li>Redeploy your application</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[rgb(var(--color-primary))] to-blue-700">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6 bg-white rounded-2xl p-4 shadow-2xl">
            <Image
              src="/bluefishlogo.png"
              alt="Blu Fish House"
              fill
              className="object-contain animate-pulse"
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading Blu Fish House Kitchen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 shadow-lg sticky top-0 z-40">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative w-14 h-14 bg-white rounded-lg p-2 shadow-md">
                <Image
                  src="/bluefishlogo.png"
                  alt="Blu Fish House"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Blu Fish House Kitchen</h1>
                <p className="text-sm text-blue-100 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Real-time updates enabled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Order Type Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-2 rounded-md bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors text-sm font-medium backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                title="Filter orders (Keyboard: 1, 2, 3)"
              >
                <option value="ALL" className="text-gray-900">All Orders</option>
                <option value="PICKUP" className="text-gray-900">Pickup Only</option>
                <option value="DELIVERY" className="text-gray-900">Delivery Only</option>
              </select>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-2 rounded-md text-white flex items-center gap-2 transition-all border border-white/20 backdrop-blur-sm font-medium text-sm ${
                  soundEnabled
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30'
                }`}
                title={`Sound notifications ${soundEnabled ? 'ON' : 'OFF'} (Keyboard: M)`}
              >
                {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors border border-white/20 backdrop-blur-sm font-medium text-sm"
                title="Refresh orders (Keyboard: R)"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => window.location.href = '/admin/gift-cards'}
                className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors border border-white/20 backdrop-blur-sm font-medium text-sm"
                title="Gift Card Management"
              >
                <Gift className="w-4 h-4" />
                Gift Cards
              </button>
              <button
                onClick={() => setShowPrinterSettings(true)}
                className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors border border-white/20 backdrop-blur-sm font-medium text-sm"
                title="Printer Settings"
              >
                <Printer className="w-4 h-4" />
              </button>
              {selectedOrderIds.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors border border-white/20 backdrop-blur-sm font-medium text-sm"
                  title={`Clear selection (${selectedOrderIds.size} selected)`}
                >
                  <XCircle className="w-4 h-4" />
                  Clear ({selectedOrderIds.size})
                </button>
              )}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 backdrop-blur-sm font-bold text-sm w-9 h-9"
                title="Keyboard shortcuts (Press ?)"
              >
                ?
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: NEW ORDERS */}
            <DroppableColumn id="new-orders" className="flex flex-col">
              <SortableContext 
                items={newOrders.map(o => o.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col relative z-0">
                  <div className="card p-5 mb-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30 shadow-sm relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">New Orders</h2>
                      </div>
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                        {newOrders.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto min-h-[200px] pr-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                    {newOrders.length === 0 ? (
                      <div className="card p-8 text-center bg-gray-50/50">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 font-medium">No new orders</p>
                      </div>
                    ) : (
                      newOrders.map((order) => <SortableOrderCard key={order.id} order={order} />)
                    )}
                  </div>
                </div>
              </SortableContext>
            </DroppableColumn>

            {/* Column 2: MAKING */}
            <DroppableColumn id="making-orders" className="flex flex-col">
              <SortableContext 
                items={makingOrders.map(o => o.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col relative z-0">
                  <div className="card p-5 mb-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30 shadow-sm relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                          <ChefHat className="w-5 h-5 text-orange-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">In Progress</h2>
                      </div>
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                        {makingOrders.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto min-h-[200px] pr-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                    {makingOrders.length === 0 ? (
                      <div className="card p-8 text-center bg-gray-50/50">
                        <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 font-medium">No orders in progress</p>
                      </div>
                    ) : (
                      makingOrders.map((order) => <SortableOrderCard key={order.id} order={order} />)
                    )}
                  </div>
                </div>
              </SortableContext>
            </DroppableColumn>

            {/* Column 3: READY */}
            <DroppableColumn id="ready-orders" className="flex flex-col">
              <SortableContext 
                items={readyOrders.map(o => o.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col relative z-0">
                  <div className="card p-5 mb-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 shadow-sm relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Ready</h2>
                      </div>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                        {readyOrders.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto min-h-[200px] pr-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                    {readyOrders.length === 0 ? (
                      <div className="card p-8 text-center bg-gray-50/50">
                        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 font-medium">No orders ready</p>
                      </div>
                    ) : (
                      readyOrders.map((order) => <SortableOrderCard key={order.id} order={order} />)
                    )}
                  </div>
                </div>
              </SortableContext>
            </DroppableColumn>
          </div>

          {/* Drag Overlay - Shows dragged item(s) on top */}
          <DragOverlay>
            {activeId ? (
              (() => {
                const draggedOrder = orders.find(o => o.id === activeId)
                const selectedCount = selectedOrderIds.size > 0 ? selectedOrderIds.size : 1
                return draggedOrder ? (
                  <div className="bg-white border-2 border-blue-500 rounded-lg p-4 space-y-3 shadow-2xl opacity-95 rotate-2 scale-105">
                    {selectedCount > 1 && (
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-2 text-center">
                        Moving {selectedCount} orders
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{draggedOrder.customer.name}</h3>
                        <p className="text-xs text-gray-500">#{draggedOrder.id.slice(-6).toUpperCase()}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            draggedOrder.orderType === 'PICKUP'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {draggedOrder.orderType === 'PICKUP' ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            {draggedOrder.orderType}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">
                          ${draggedOrder.finalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null
              })()
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 font-medium mb-2">Total Active</p>
            <p className="text-3xl font-bold text-[rgb(var(--color-primary))]">{activeOrders.length}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-yellow-50 to-white hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 font-medium mb-2">New Orders</p>
            <p className="text-3xl font-bold text-yellow-600">{newOrders.length}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 font-medium mb-2">In Progress</p>
            <p className="text-3xl font-bold text-orange-600">{makingOrders.length}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 font-medium mb-2">Ready</p>
            <p className="text-3xl font-bold text-green-600">{readyOrders.length}</p>
          </div>
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && <OrderModal order={selectedOrder} />}

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40 animate-in fade-in duration-200"
            onClick={() => setShowShortcuts(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 p-6 rounded-t-lg">
                <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Refresh orders</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">R</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Toggle sound notifications</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">M</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show all orders</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">1</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show pickup only</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">2</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show delivery only</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">3</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Close modal / shortcuts</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">ESC</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Toggle this help</span>
                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-gray-100 border border-gray-300 rounded">?</kbd>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="w-full btn-primary"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Printer Settings Modal */}
      <PrinterSettingsModal
        isOpen={showPrinterSettings}
        onClose={() => setShowPrinterSettings(false)}
      />
    </div>
  )
}
