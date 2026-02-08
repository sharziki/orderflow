import { jsPDF } from 'jspdf'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  options?: string[]
}

interface ReceiptData {
  restaurantName: string
  restaurantAddress?: string
  restaurantPhone?: string
  orderNumber: string
  orderDate: Date
  customerName: string
  orderType: 'pickup' | 'delivery'
  deliveryAddress?: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  deliveryFee?: number
  tip?: number
  total: number
}

export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // Receipt paper width, auto-height
  })

  const pageWidth = 80
  const margin = 5
  const contentWidth = pageWidth - margin * 2
  let y = 10

  // Helper functions
  const centerText = (text: string, fontSize: number = 10) => {
    doc.setFontSize(fontSize)
    const textWidth = doc.getTextWidth(text)
    doc.text(text, (pageWidth - textWidth) / 2, y)
    y += fontSize * 0.4 + 2
  }

  const leftText = (text: string, fontSize: number = 9) => {
    doc.setFontSize(fontSize)
    doc.text(text, margin, y)
    y += fontSize * 0.4 + 1.5
  }

  const rightText = (text: string, fontSize: number = 9) => {
    doc.setFontSize(fontSize)
    const textWidth = doc.getTextWidth(text)
    doc.text(text, pageWidth - margin - textWidth, y - (fontSize * 0.4 + 1.5))
  }

  const line = () => {
    doc.setLineWidth(0.1)
    doc.line(margin, y, pageWidth - margin, y)
    y += 3
  }

  const dottedLine = () => {
    doc.setLineWidth(0.1)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(margin, y, pageWidth - margin, y)
    doc.setLineDashPattern([], 0)
    y += 3
  }

  // Header
  doc.setFont('helvetica', 'bold')
  centerText(data.restaurantName, 14)
  
  doc.setFont('helvetica', 'normal')
  if (data.restaurantAddress) {
    centerText(data.restaurantAddress, 8)
  }
  if (data.restaurantPhone) {
    centerText(data.restaurantPhone, 8)
  }

  y += 2
  line()

  // Order Info
  doc.setFont('helvetica', 'bold')
  centerText(`Order #${data.orderNumber}`, 12)
  
  doc.setFont('helvetica', 'normal')
  centerText(data.orderDate.toLocaleString(), 8)
  centerText(data.orderType === 'delivery' ? '🚗 DELIVERY' : '🏪 PICKUP', 10)

  y += 1
  dottedLine()

  // Customer Info
  doc.setFont('helvetica', 'bold')
  leftText('Customer:', 9)
  doc.setFont('helvetica', 'normal')
  leftText(data.customerName, 9)

  if (data.orderType === 'delivery' && data.deliveryAddress) {
    y += 1
    doc.setFont('helvetica', 'bold')
    leftText('Deliver to:', 9)
    doc.setFont('helvetica', 'normal')
    // Wrap long addresses
    const addressLines = doc.splitTextToSize(data.deliveryAddress, contentWidth)
    addressLines.forEach((addressLine: string) => {
      leftText(addressLine, 8)
    })
  }

  y += 2
  dottedLine()

  // Items
  doc.setFont('helvetica', 'bold')
  leftText('Items:', 10)
  y += 1

  doc.setFont('helvetica', 'normal')
  data.items.forEach((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2)
    leftText(`${item.quantity}x ${item.name}`, 9)
    rightText(`$${itemTotal}`, 9)
    
    if (item.options && item.options.length > 0) {
      item.options.forEach((opt) => {
        leftText(`   • ${opt}`, 7)
      })
    }
    y += 1
  })

  y += 2
  dottedLine()

  // Totals
  doc.setFont('helvetica', 'normal')
  leftText('Subtotal', 9)
  rightText(`$${data.subtotal.toFixed(2)}`, 9)

  leftText('Tax', 9)
  rightText(`$${data.tax.toFixed(2)}`, 9)

  if (data.deliveryFee && data.deliveryFee > 0) {
    leftText('Delivery Fee', 9)
    rightText(`$${data.deliveryFee.toFixed(2)}`, 9)
  }

  if (data.tip && data.tip > 0) {
    leftText('Tip', 9)
    rightText(`$${data.tip.toFixed(2)}`, 9)
  }

  y += 2
  line()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  leftText('TOTAL', 12)
  rightText(`$${data.total.toFixed(2)}`, 12)

  y += 5
  dottedLine()

  // Footer
  doc.setFont('helvetica', 'normal')
  centerText('Thank you for your order!', 10)
  centerText('Powered by DerbyFlow', 7)

  return doc
}

export function downloadReceipt(data: ReceiptData) {
  const doc = generateReceipt(data)
  doc.save(`receipt-${data.orderNumber}.pdf`)
}

export function getReceiptBlob(data: ReceiptData): Blob {
  const doc = generateReceipt(data)
  return doc.output('blob')
}
