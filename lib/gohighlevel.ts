/**
 * Go High Level (GHL) Integration
 * 
 * Syncs customer contacts and order notes to GHL CRM after orders.
 * API Docs: https://highlevel.stoplight.io/docs/integrations
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com'

interface GHLCustomerData {
  firstName: string
  lastName?: string
  email?: string
  phone: string
  address1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface GHLContactResponse {
  contact: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    locationId: string
    [key: string]: any
  }
}

interface GHLNoteResponse {
  note: {
    id: string
    body: string
    contactId: string
    [key: string]: any
  }
}

/**
 * Parse a full name into first and last name
 */
function parseFullName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] || 'Customer'
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined
  return { firstName, lastName }
}

/**
 * Create or update a contact in Go High Level
 * Uses the upsert endpoint to avoid duplicates (matches on email or phone)
 */
export async function createOrUpdateContact(
  apiKey: string,
  locationId: string,
  customerData: GHLCustomerData
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        locationId,
        firstName: customerData.firstName,
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phone: customerData.phone,
        address1: customerData.address1 || '',
        city: customerData.city || '',
        state: customerData.state || '',
        postalCode: customerData.postalCode || '',
        country: customerData.country || 'US',
        source: 'OrderFlow',
        tags: ['OrderFlow Customer'],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GHL] Contact upsert failed:', response.status, errorText)
      return { success: false, error: `API error: ${response.status}` }
    }

    const data: GHLContactResponse = await response.json()
    return { success: true, contactId: data.contact.id }
  } catch (error) {
    console.error('[GHL] Contact upsert error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Add a note to a contact in Go High Level
 */
export async function addContactNote(
  apiKey: string,
  contactId: string,
  noteText: string
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        body: noteText,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GHL] Add note failed:', response.status, errorText)
      return { success: false, error: `API error: ${response.status}` }
    }

    const data: GHLNoteResponse = await response.json()
    return { success: true, noteId: data.note.id }
  } catch (error) {
    console.error('[GHL] Add note error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderData {
  orderNumber: string
  items: OrderItem[]
  total: number
  orderCount: number // This customer's order number (e.g., 3rd order)
  totalOrders: number // Total orders by this customer
  type: 'pickup' | 'delivery'
  notes?: string
}

/**
 * Format order details as a note for GHL
 */
export function formatOrderNote(orderData: OrderData): string {
  const itemsList = orderData.items
    .map(item => `• ${item.name} x${item.quantity} - $${item.price.toFixed(2)}`)
    .join('\n')

  const lines = [
    `📦 ORDER #${orderData.orderNumber}`,
    `Order ${orderData.orderCount} of ${orderData.totalOrders} total orders`,
    '',
    `Type: ${orderData.type.toUpperCase()}`,
    '',
    'Items:',
    itemsList,
    '',
    `💰 Total: $${orderData.total.toFixed(2)}`,
  ]

  if (orderData.notes) {
    lines.push('', `📝 Notes: ${orderData.notes}`)
  }

  return lines.join('\n')
}

/**
 * Sync a customer and their order to Go High Level
 * This is the main function to call after an order is placed
 */
export async function syncOrderToGHL(
  apiKey: string,
  locationId: string,
  customerInfo: {
    name: string
    email?: string
    phone: string
    address?: string
    city?: string
    state?: string
    zip?: string
  },
  orderData: OrderData
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  // Parse the customer name
  const { firstName, lastName } = parseFullName(customerInfo.name)

  // Create or update the contact
  const contactResult = await createOrUpdateContact(apiKey, locationId, {
    firstName,
    lastName,
    email: customerInfo.email,
    phone: customerInfo.phone,
    address1: customerInfo.address,
    city: customerInfo.city,
    state: customerInfo.state,
    postalCode: customerInfo.zip,
  })

  if (!contactResult.success || !contactResult.contactId) {
    return contactResult
  }

  // Add the order note
  const noteText = formatOrderNote(orderData)
  const noteResult = await addContactNote(apiKey, contactResult.contactId, noteText)

  if (!noteResult.success) {
    console.warn('[GHL] Contact created but note failed:', noteResult.error)
    // Still return success for the contact creation
  }

  return { success: true, contactId: contactResult.contactId }
}

/**
 * Test GHL connection with provided credentials
 */
export async function testGHLConnection(
  apiKey: string,
  locationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to fetch contacts (just to verify credentials work)
    const response = await fetch(`${GHL_API_BASE}/contacts/?locationId=${locationId}&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' }
      }
      if (response.status === 400) {
        return { success: false, error: 'Invalid location ID' }
      }
      return { success: false, error: `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[GHL] Connection test error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Connection failed' }
  }
}
