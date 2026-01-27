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
  menuItem: {
    name: string
  }
  price: number
}

interface Order {
  id: string
  orderType: 'PICKUP' | 'DELIVERY'
  status: string
  createdAt: string
  customer: {
    name: string
    phone?: string
  }
  items: OrderItem[]
  notes?: string
  deliveryAddress?: string
  finalAmount: number
  scheduledPickupTime?: string | null
}

/**
 * Format an order for thermal printer (80mm width)
 * 80mm thermal printers typically support 42-48 characters per line at normal width
 */
export function formatOrderTicket(order: Order, restaurantName: string = 'BLU FISH HOUSE'): string {
  const LINE_WIDTH = 42
  const SEPARATOR = '='.repeat(LINE_WIDTH)
  const DASH_LINE = '-'.repeat(LINE_WIDTH)

  let ticket = COMMANDS.INIT

  // Header - Restaurant Name (Centered, Bold, Double Size)
  ticket += COMMANDS.CENTER
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_SIZE
  ticket += restaurantName + COMMANDS.LINE_FEED
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF
  ticket += SEPARATOR + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  // Order Number (Bold, Large)
  ticket += COMMANDS.LEFT
  ticket += COMMANDS.BOLD_ON
  ticket += COMMANDS.DOUBLE_HEIGHT
  ticket += `Order #: ${order.id.slice(-6).toUpperCase()}` + COMMANDS.LINE_FEED
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

  // Order Type (Bold)
  ticket += COMMANDS.BOLD_ON
  ticket += `Type: [${order.orderType}]` + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF

  // Scheduled Pickup Time (if applicable)
  if (order.scheduledPickupTime) {
    const scheduledTime = new Date(order.scheduledPickupTime)
    const scheduledStr = scheduledTime.toLocaleString('en-US', {
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
  ticket += `Customer: ${truncateText(order.customer.name, LINE_WIDTH - 10)}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF

  if (order.customer.phone) {
    ticket += `Phone: ${order.customer.phone}` + COMMANDS.LINE_FEED
  }

  // Delivery Address (if delivery order)
  if (order.orderType === 'DELIVERY' && order.deliveryAddress) {
    ticket += `Address: ${wrapText(order.deliveryAddress, LINE_WIDTH - 9)}` + COMMANDS.LINE_FEED
  }

  ticket += DASH_LINE + COMMANDS.LINE_FEED

  // Items Header
  ticket += COMMANDS.BOLD_ON
  ticket += 'ITEMS:' + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF

  // Order Items
  order.items.forEach((item) => {
    // Item quantity and name (Bold)
    ticket += COMMANDS.BOLD_ON
    ticket += COMMANDS.DOUBLE_WIDTH
    ticket += `${item.quantity}x ${truncateText(item.menuItem.name, (LINE_WIDTH / 2) - 4)}` + COMMANDS.LINE_FEED
    ticket += COMMANDS.NORMAL_SIZE
    ticket += COMMANDS.BOLD_OFF

    // Add a blank line between items for readability
    ticket += COMMANDS.LINE_FEED
  })

  ticket += DASH_LINE + COMMANDS.LINE_FEED

  // Special Instructions (if any)
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
  ticket += `Total: $${order.finalAmount.toFixed(2)}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.NORMAL_SIZE
  ticket += COMMANDS.BOLD_OFF

  // Footer
  ticket += SEPARATOR + COMMANDS.LINE_FEED
  ticket += COMMANDS.CENTER
  ticket += `Status: ${order.status}` + COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  
  // Derby Digital branding
  ticket += COMMANDS.BOLD_ON
  ticket += 'Powered By Derby Digital' + COMMANDS.LINE_FEED
  ticket += COMMANDS.BOLD_OFF
  ticket += COMMANDS.LEFT

  // Add extra line feeds before cut
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  // Cut paper
  ticket += COMMANDS.CUT

  return ticket
}

/**
 * Truncate text to fit within a maximum width
 */
function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) {
    return text
  }
  return text.substring(0, maxWidth - 3) + '...'
}

/**
 * Wrap text to multiple lines based on maximum width
 */
function wrapText(text: string, maxWidth: number, indent: string = '  '): string {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.map((line, index) => (index === 0 ? line : `${indent}${line}`)).join('\n')
}

/**
 * Generate a test ticket for printer verification
 */
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
  ticket += 'BLU FISH HOUSE' + COMMANDS.LINE_FEED
  ticket += 'Kitchen Printer System' + COMMANDS.LINE_FEED
  ticket += COMMANDS.LEFT

  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED
  ticket += COMMANDS.LINE_FEED

  ticket += COMMANDS.CUT

  return ticket
}

/**
 * Format order as HTML for browser print dialog fallback
 * Used when Web Serial API or Star WebPRNT is not available
 */
export function formatHTMLTicket(order: Order, restaurantName: string = 'BLU FISH HOUSE'): string {
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
  if (order.scheduledPickupTime) {
    const scheduledTime = new Date(order.scheduledPickupTime)
    const scheduledStr = scheduledTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    scheduledHTML = `<div class="scheduled"><strong>SCHEDULED: ${scheduledStr}</strong></div>`
  }

  const itemsHTML = order.items.map(item => `
    <div class="item">
      <div class="item-name"><strong>${item.quantity}x ${item.menuItem.name}</strong></div>
    </div>
  `).join('')

  const notesHTML = order.notes && order.notes.trim() ? `
    <div class="separator"></div>
    <div class="section-title"><strong>SPECIAL REQUESTS:</strong></div>
    <div>${order.notes}</div>
  ` : ''

  const deliveryHTML = order.orderType === 'DELIVERY' && order.deliveryAddress ? `
    <div>Address: ${order.deliveryAddress}</div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order #${order.id.slice(-6).toUpperCase()}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          line-height: 1.3;
        }
        .header {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3mm;
        }
        .separator {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }
        .double-separator {
          border-top: 2px solid #000;
          margin: 3mm 0;
        }
        .order-number {
          font-size: 18px;
          font-weight: bold;
          margin: 2mm 0;
        }
        .section-title {
          font-weight: bold;
          margin-top: 2mm;
          margin-bottom: 1mm;
        }
        .item {
          margin: 2mm 0;
        }
        .item-name {
          font-size: 13px;
        }
        .scheduled {
          font-weight: bold;
          margin: 2mm 0;
          font-size: 12px;
        }
        .total {
          font-size: 16px;
          font-weight: bold;
          margin: 3mm 0;
        }
        .footer {
          text-align: center;
          margin-top: 3mm;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">${restaurantName}</div>
      <div class="double-separator"></div>

      <div class="order-number">Order #: ${order.id.slice(-6).toUpperCase()}</div>
      <div>Time: ${timeStr} - ${dateStr}</div>
      <div><strong>Type: [${order.orderType}]</strong></div>
      ${scheduledHTML}

      <div class="separator"></div>

      <div><strong>Customer: ${order.customer.name}</strong></div>
      ${order.customer.phone ? `<div>Phone: ${order.customer.phone}</div>` : ''}
      ${deliveryHTML}

      <div class="separator"></div>

      <div class="section-title">ITEMS:</div>
      ${itemsHTML}

      ${notesHTML}

      <div class="separator"></div>

      <div class="total">Total: $${order.finalAmount.toFixed(2)}</div>

      <div class="double-separator"></div>

      <div class="footer">
        <div>Status: ${order.status}</div>
        <div style="margin-top: 4mm; text-align: center;">
          <div style="font-weight: bold; margin-bottom: 2mm;">Powered By Derby Digital</div>
        </div>
      </div>
    </body>
    </html>
  `
}
