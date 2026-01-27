/**
 * Restaurant hours and status utilities
 */

export interface RestaurantHours {
  day: number // 0 = Sunday, 1 = Monday, etc.
  open: string // "HH:MM" format
  close: string // "HH:MM" format
}

// Define restaurant hours (adjust these as needed)
export const RESTAURANT_HOURS: RestaurantHours[] = [
  { day: 0, open: "11:00", close: "21:00" }, // Sunday
  { day: 1, open: "11:00", close: "21:00" }, // Monday
  { day: 2, open: "11:00", close: "21:00" }, // Tuesday
  { day: 3, open: "11:00", close: "21:00" }, // Wednesday
  { day: 4, open: "11:00", close: "22:00" }, // Thursday
  { day: 5, open: "11:00", close: "23:00" }, // Friday
  { day: 6, open: "11:00", close: "23:00" }, // Saturday
]

interface RestaurantStatus {
  isOpen: boolean
  opensAt: string | null
  closesAt: string | null
  nextOpenTime: Date | null
}

/**
 * Get current restaurant status
 */
export function getRestaurantStatus(): RestaurantStatus {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

  // Get today's hours
  const todayHours = RESTAURANT_HOURS.find(h => h.day === currentDay)

  if (!todayHours) {
    // Closed if no hours defined for today
    return {
      isOpen: false,
      opensAt: null,
      closesAt: null,
      nextOpenTime: getNextOpenTime(now)
    }
  }

  // Parse open and close times
  const [openHour, openMin] = todayHours.open.split(':').map(Number)
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number)
  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin

  // Check if currently open
  const isOpen = currentTime >= openTime && currentTime < closeTime

  return {
    isOpen,
    opensAt: todayHours.open,
    closesAt: todayHours.close,
    nextOpenTime: isOpen ? null : getNextOpenTime(now)
  }
}

/**
 * Get the next time the restaurant will open
 */
function getNextOpenTime(from: Date): Date | null {
  const currentDay = from.getDay()
  const currentTime = from.getHours() * 60 + from.getMinutes()

  // Check if opens later today
  const todayHours = RESTAURANT_HOURS.find(h => h.day === currentDay)
  if (todayHours) {
    const [openHour, openMin] = todayHours.open.split(':').map(Number)
    const openTime = openHour * 60 + openMin

    if (currentTime < openTime) {
      const nextOpen = new Date(from)
      nextOpen.setHours(openHour, openMin, 0, 0)
      return nextOpen
    }
  }

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7
    const dayHours = RESTAURANT_HOURS.find(h => h.day === checkDay)

    if (dayHours) {
      const [openHour, openMin] = dayHours.open.split(':').map(Number)
      const nextOpen = new Date(from)
      nextOpen.setDate(nextOpen.getDate() + i)
      nextOpen.setHours(openHour, openMin, 0, 0)
      return nextOpen
    }
  }

  return null
}

/**
 * Format time for display (e.g., "11:00 AM")
 */
export function formatTime(time: string): string {
  const [hour, min] = time.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`
}

/**
 * Format next open time for display
 */
export function formatNextOpenTime(nextOpen: Date): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const nextOpenDate = new Date(nextOpen)
  nextOpenDate.setHours(0, 0, 0, 0)

  if (nextOpenDate.getTime() === new Date(now.setHours(0, 0, 0, 0)).getTime()) {
    // Today
    return `Today at ${formatTime(`${nextOpen.getHours()}:${nextOpen.getMinutes()}`)}`
  } else if (nextOpenDate.getTime() === tomorrow.getTime()) {
    // Tomorrow
    return `Tomorrow at ${formatTime(`${nextOpen.getHours()}:${nextOpen.getMinutes()}`)}`
  } else {
    // Other day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return `${days[nextOpen.getDay()]} at ${formatTime(`${nextOpen.getHours()}:${nextOpen.getMinutes()}`)}`
  }
}
