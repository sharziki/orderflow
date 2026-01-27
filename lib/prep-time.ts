/**
 * Prep Time Calculation Utilities
 * 
 * Calculates estimated preparation time for orders based on menu items.
 * Items prep in parallel, so we take the max prep time, not sum.
 */

export interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
  options?: any[]
  specialRequests?: string
  prepTimeMinutes?: number
}

export interface MenuItemWithPrepTime {
  id: string
  prepTimeMinutes: number | null
}

/**
 * Calculate total prep time for an order
 * 
 * Items cook in parallel, so we take the maximum prep time, not the sum.
 * If an item doesn't have a prep time, we use a default of 10 minutes.
 * 
 * For quantity > 1, we add a small buffer (2 min per extra item up to 5 min max)
 * to account for batch cooking time.
 * 
 * @param items - Array of order items with optional prepTimeMinutes
 * @param defaultPrepTime - Default prep time for items without specified time (default: 10)
 * @returns Estimated total prep time in minutes
 */
export function calculatePrepTime(
  items: OrderItem[],
  defaultPrepTime: number = 10
): number {
  if (!items || items.length === 0) {
    return 0
  }

  let maxPrepTime = 0

  for (const item of items) {
    const basePrepTime = item.prepTimeMinutes ?? defaultPrepTime
    
    // Add buffer for quantity > 1 (max 5 extra minutes)
    const quantityBuffer = Math.min((item.quantity - 1) * 2, 5)
    const itemPrepTime = basePrepTime + quantityBuffer

    if (itemPrepTime > maxPrepTime) {
      maxPrepTime = itemPrepTime
    }
  }

  return maxPrepTime
}

/**
 * Look up prep times from menu items and calculate total
 * 
 * @param orderItems - Array of order items (without prep times)
 * @param menuItems - Array of menu items with prep times from database
 * @param defaultPrepTime - Default prep time for items without specified time
 * @returns Estimated total prep time in minutes
 */
export function calculatePrepTimeFromMenuItems(
  orderItems: Array<{ menuItemId: string; quantity: number }>,
  menuItems: MenuItemWithPrepTime[],
  defaultPrepTime: number = 10
): number {
  if (!orderItems || orderItems.length === 0) {
    return 0
  }

  const menuItemMap = new Map<string, number | null>()
  for (const mi of menuItems) {
    menuItemMap.set(mi.id, mi.prepTimeMinutes)
  }

  let maxPrepTime = 0

  for (const item of orderItems) {
    const basePrepTime = menuItemMap.get(item.menuItemId) ?? defaultPrepTime
    
    // Add buffer for quantity > 1 (max 5 extra minutes)
    const quantityBuffer = Math.min((item.quantity - 1) * 2, 5)
    const itemPrepTime = basePrepTime + quantityBuffer

    if (itemPrepTime > maxPrepTime) {
      maxPrepTime = itemPrepTime
    }
  }

  return maxPrepTime
}

/**
 * Calculate estimated ready time
 * 
 * @param prepMinutes - Prep time in minutes
 * @param startTime - Order start time (default: now)
 * @returns Estimated ready Date
 */
export function calculateEstimatedReady(
  prepMinutes: number,
  startTime: Date = new Date()
): Date {
  return new Date(startTime.getTime() + prepMinutes * 60 * 1000)
}
