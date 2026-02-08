/**
 * Ticket Formatter for 80mm Thermal Printers
 * Generates ESC/POS formatted tickets for kitchen order printing
 */

// ESC/POS Control Commands
const ESC = '\x1B'
const GS = '\x1D'

// Common ESC/POS Commands
const COMMANDS = {
  INIT: `${ESC}@`,           // Initialize printer
  BOLD_ON: `${ESC}E\x01`,    // Bold text on
  BOLD_OFF: `${ESC}E\x00`,   // Bold text off
  CENTER: `${ESC}a\x01`,     // Center alignment
  LEFT: `${ESC}a\x00`,       // Left alignment
  RIGHT: `${ESC}a\x02`,      // Right alignment
  CUT: `${GS}V\x00`,         // Full cut
  DOUBLE_HEIGHT: `${ESC}!\x10`, // Double height
  DOUBLE_WIDTH: `${ESC}!\x20`,  // Double width
  DOUBLE_SIZE: `${ESC}!\x30`,   // Double height + width
  NORMAL_SIZE: `${ESC}!\x00`,   // Normal size
  LINE_FEED: '\n',
}

interface OrderItem {
  quantity: number
  name?: string
  menuItem?: { name: string }
  price: number
}

// Flexible Order type that works with both DerbyFlow and legacy admin formats
interface Order {
  id: string
  orderNumber?: string
  type?: 'pickup' | 'delivery'
  orderType?: 'PICKUP' | 'DELIVERY'
  status: string
  createdAt: string
  customerName?: string
  customer?: { name: string; phone?: string }
  customerPhone?: string
  items: OrderItem[]
  notes?: string | null
  deliveryAddress?: string | null
  total?: number
  finalAmount?: number
  scheduledFor?: string | null
  scheduledPickupTime?: string | null
}

// Helper to normalize order data from different formats
function normalizeOrder(order: Order) {
  const orderNumber = order.orderNumber || order.id.slice(-6).toUpperCase()
  const orderType = (order.type || order.orderType || 'pickup').toLowerCase() as 'pickup' | 'delivery'
  const customerName = order.customerName || order.customer?.name || 'Customer'
  const customerPhone = order.customerPhone || order.customer?.phone
  const total = order.total ?? order.finalAmount ?? 0
  const scheduledTime = order.scheduledFor || order.scheduledPickupTime
  
  return { orderNumber, orderType, customerName, customerPhone, total, scheduledTime }
}

// Helper to get item name from different formats
function getItemName(item: OrderItem): string {
  return item.name || item.menuItem?.name || 'Item'
}

/**
 * Format an order for thermal printer (80mm width)
 */
export function formatOrderTicket(order: Order, restaurantName: string = 'ORDER FLOW'): string {
  const LINE_WIDTH = 42
  const SEPARATOR = '='.repeat(LINE_WIDTH)
  const DASH_LINE = '-'.repeat(LINE_WIDTH)
  
  const { orderNumber, orderType, customerName, customerPhone, total, scheduledTime } = normalizeOrder(order)

  let ticket = COMMANDS.INIT

  // Header
  ticket += COMMANDS.CENTER
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_SIZE
  ticket += restaurantName + COMMANDS.LINE_FEED
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  ticket += SEPARATOR + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  // Order Number
  ticket += COMMANDS.LEFT
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += `Order #: ${orderNumber}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF

  // Time and Date
  const orderTime = new Date(order.createdAt)
  const timeStr = orderTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  const dateStr = orderTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  ticket += `Time: ${timeStr} - ${dateStr}` + COMMANDS.LINE_FEED

  // Order Type
  ticket += COMMANDS.BOLD_ON
  ticket += `Type: [${orderType.toUpperCase()}]` + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF

  // Scheduled Time
  if (scheduledTime) {
    const scheduledDate = new Date(scheduledTime)
    const scheduledStr = scheduledDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    ticket += COMMANDS.BOLD_ON
    ticket += `SCHEDULED: ${scheduledStr}` + COMMANDS.LINE_FEED
    ticket += COMMANDS.BOLD_OFF
  }

  ticket += DASH_LINE + COMMANDS.LINE_FEED

  // Customer Information
  ticket += COMMANDS.BOLD_ON
  ticket += `Customer: ${truncateText(customerName, LINE_WIDTH - 10)}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF

  if (customerPhone) {
    ticket += `Phone: ${customerPhone}` + COMMANDS.LINE_FEED
  }

  // Delivery Address
  if (orderType === 'delivery' && order.deliveryAddress) {
    ticket += `Address: ${wrapText(order.deliveryAddress, LINE_WIDTH - 9)}` + COMMANDS.LINE_FEED
  }

  ticket += DASH_LINE + COMMANDS.LINE_FEED

  // Items Header
  ticket += COMMANDS.BOLD_ON
  ticket += 'ITEMS:' + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF

  // Order Items
  order.items.forEach((item) => {
    const itemName = getItemName(item)
    ticket += COMMANDS.BOLD_ON
    ticket += COMMANDS.DOUBLE_WIDTH
    ticket += `${item.quantity}x ${truncateText(itemName, (LINE_WIDTH / 2) - 4)}` + COMMANDS.LINE_FEED
    ticket += COMMANDS.NORMAL_SIZE
    ticket += COMMANDS.BOLD_OFF
    ticket += COMMANDS.LINE_FEED
  })

  ticket += DASH_LINE + COMMANDS.LINE_FEED

  // Special Instructions
  if (order.notes && order.notes.trim()) {
    ticket += COMMANDS.BOLD_ON
    ticket += 'SPECIAL REQUESTS:' + COMMANDS.LINE_FEED
    ticket += COMMANDS.BOLD_OFF
    ticket += wrapText(order.notes, LINE_WIDTH) + COMMANDS.LINE_FEED
    ticket += DASH_LINE + COMMANDS.LINE_FEED
  }

  // Total Amount
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += `Total: $${total.toFixed(2)}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF

  // Footer
  ticket += SEPARATOR + COMMANDS.LINE_FEED
  ticket += COMMANDS.CENTER
  ticket += `Status: ${order.status}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_ON
  ticket += 'Powered By DerbyFlow' + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF
  ticket += COMMANDS.LEFT

  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.CUT

  return ticket
}

function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text
  return text.substring(0, maxWidth - 3) + '...'
}

function wrapText(text: string, maxWidth: number, indent: string = '  '): string {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  })

  if (currentLine) lines.push(currentLine)

  return lines.map((line, index) => (index === 0 ? line : `${indent}${line}`)).join('\n')
}

export function formatTestTicket(printerName: string): string {
  const LINE_WIDTH = 42
  const SEPARATOR = '='.repeat(LINE_WIDTH)

  let ticket = COMMANDS.INIT

  ticket += COMMANDS.CENTER
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_SIZE
  ticket += 'TEST PRINT' + COMMANDS.LINE_FEED
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  ticket += SEPARATOR + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  ticket += COMMANDS.LEFT
  ticket += `Printer: ${printerName}` + COMMANDS.LINE_FEED
  ticket += `Time: ${new Date().toLocaleString()}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  ticket += 'If you can read this message,' + COMMANDS.LINE_FEED
  ticket += 'your printer is configured' + COMMANDS.LINE_FEED
  ticket += 'correctly!' + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  ticket += SEPARATOR + COMMANDS.LINE_FEED
  ticket += COMMANDS.CENTER
  ticket += 'ORDER FLOW' + COMMANDS.LINE_FEED
  ticket += 'Kitchen Printer System' + COMMANDS.LINE_FEED
  ticket += COMMANDS.LEFT

  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.CUT

  return ticket
}

/**
 * Format order as HTML for browser print dialog
 */
export function formatHTMLTicket(order: Order, restaurantName: string = 'ORDER FLOW'): string {
  const { orderNumber, orderType, customerName, customerPhone, total, scheduledTime } = normalizeOrder(order)
  
  const orderTime = new Date(order.createdAt)
  const timeStr = orderTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  const dateStr = orderTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  let scheduledHTML = ''
  if (scheduledTime) {
    const scheduledDate = new Date(scheduledTime)
    const scheduledStr = scheduledDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    scheduledHTML = `<div class="scheduled"><strong>SCHEDULED: ${scheduledStr}</strong></div>`
  }

  const itemsHTML = order.items.map(item => {
    const itemName = getItemName(item)
    return `
      <div class="item">
        <div class="item-name"><strong>${item.quantity}x ${itemName}</strong></div>
      </div>
    `
  }).join('')

  const notesHTML = order.notes && order.notes.trim() ? `
    <div class="separator"></div>
    <div class="section-title"><strong>SPECIAL REQUESTS:</strong></div>
    <div>${order.notes}</div>
  ` : ''

  const deliveryHTML = orderType === 'delivery' && order.deliveryAddress ? `
    <div>Address: ${order.deliveryAddress}</div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order ${orderNumber}</title>
      <style>
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; padding: 0; }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          line-height: 1.3;
        }
        .header { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 3mm; }
        .separator { border-top: 1px dashed #000; margin: 3mm 0; }
        .double-separator { border-top: 2px solid #000; margin: 3mm 0; }
        .order-number { font-size: 18px; font-weight: bold; margin: 2mm 0; }
        .section-title { font-weight: bold; margin-top: 2mm; margin-bottom: 1mm; }
        .item { margin: 2mm 0; }
        .item-name { font-size: 13px; }
        .scheduled { font-weight: bold; margin: 2mm 0; font-size: 12px; }
        .total { font-size: 16px; font-weight: bold; margin: 3mm 0; }
        .footer { text-align: center; margin-top: 3mm; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">${restaurantName}</div>
      <div class="double-separator"></div>
      <div class="order-number">Order #: ${orderNumber}</div>
      <div>Time: ${timeStr} - ${dateStr}</div>
      <div><strong>Type: [${orderType.toUpperCase()}]</strong></div>
      ${scheduledHTML}
      <div class="separator"></div>
      <div><strong>Customer: ${customerName}</strong></div>
      ${customerPhone ? `<div>Phone: ${customerPhone}</div>` : ''}
      ${deliveryHTML}
      <div class="separator"></div>
      <div class="section-title">ITEMS:</div>
      ${itemsHTML}
      ${notesHTML}
      <div class="separator"></div>
      <div class="total">Total: $${total.toFixed(2)}</div>
      <div class="double-separator"></div>
      <div class="footer">
        <div>Status: ${order.status}</div>
        <div style="margin-top: 4mm;"><strong>Powered By DerbyFlow</strong></div>
      </div>
    </body>
    </html>
  `
}
