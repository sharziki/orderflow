import axios from 'axios'
import { SignJWT } from 'jose'
import { prisma } from './db'

// ============================================
// TYPES
// ============================================

export interface DoorDashCredentials {
  developerId: string
  keyId: string
  signingSecret: string
}

export interface DoorDashDeliveryRequest {
  external_delivery_id: string
  pickup_address: string
  pickup_phone_number: string
  pickup_business_name: string
  pickup_instructions?: string
  dropoff_address: string
  dropoff_phone_number: string
  dropoff_instructions?: string
  dropoff_contact_given_name?: string
  dropoff_contact_family_name?: string
  dropoff_contact_send_notifications?: boolean
  order_value: number // cents
  currency: string
  tip?: number
  items: Array<{
    name: string
    description?: string
    quantity: number
    price: number // cents
  }>
}

export interface DoorDashQuoteResponse {
  external_delivery_id: string
  fee: number // cents
  currency: string
  delivery_status?: string
  estimated_pickup_time?: string
  estimated_dropoff_time?: string
}

export interface DoorDashDeliveryResponse {
  external_delivery_id: string
  delivery_id: string
  status: string
  fee: number
  currency: string
  dasher_name?: string
  dasher_phone?: string
  tracking_url?: string
}

// ============================================
// API HELPER (with credentials)
// ============================================

class DoorDashApiHelper {
  private baseUrl = 'https://openapi.doordash.com'
  private credentials: DoorDashCredentials

  constructor(credentials: DoorDashCredentials) {
    this.credentials = credentials
  }

  private base64UrlDecode(str: string): Uint8Array {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }

  private async generateJwt(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const secretKey = this.base64UrlDecode(this.credentials.signingSecret)
    
    return new SignJWT({
      aud: 'doordash',
      iss: this.credentials.developerId,
      kid: this.credentials.keyId,
    })
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT',
        'dd-ver': 'DD-JWT-V1'
      })
      .setIssuedAt(now)
      .setExpirationTime(now + 1800)
      .sign(secretKey)
  }

  async request(method: 'GET' | 'POST' | 'PUT', endpoint: string, data?: any): Promise<any> {
    const token = await this.generateJwt()
    
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data,
      })
      return response.data
    } catch (error: any) {
      if (error.response) {
        const err: any = new Error(error.response?.data?.message || 'DoorDash API error')
        err.response = error.response
        err.status = error.response.status
        throw err
      }
      throw error
    }
  }
}

// ============================================
// MULTI-TENANT DOORDASH SERVICE
// ============================================

export class DoorDashMultiTenant {
  
  /**
   * Get credentials for a tenant
   */
  static async getCredentials(tenantId: string): Promise<DoorDashCredentials | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        doordashDeveloperId: true,
        doordashKeyId: true,
        doordashSigningSecret: true,
      },
    })
    
    if (!tenant?.doordashDeveloperId || !tenant?.doordashKeyId || !tenant?.doordashSigningSecret) {
      return null
    }
    
    return {
      developerId: tenant.doordashDeveloperId,
      keyId: tenant.doordashKeyId,
      signingSecret: tenant.doordashSigningSecret,
    }
  }

  /**
   * Check if tenant has DoorDash configured
   */
  static async isConfigured(tenantId: string): Promise<boolean> {
    const creds = await this.getCredentials(tenantId)
    return creds !== null
  }

  /**
   * Create a delivery quote
   */
  static async createQuote(
    tenantId: string,
    request: DoorDashDeliveryRequest
  ): Promise<DoorDashQuoteResponse> {
    const creds = await this.getCredentials(tenantId)
    if (!creds) throw new Error('DoorDash not configured for this restaurant')
    
    const api = new DoorDashApiHelper(creds)
    return api.request('POST', '/drive/v2/quotes', request)
  }

  /**
   * Accept a quote and create delivery
   */
  static async acceptQuote(
    tenantId: string,
    externalDeliveryId: string,
    params: { tip?: number } = {}
  ): Promise<DoorDashDeliveryResponse> {
    const creds = await this.getCredentials(tenantId)
    if (!creds) throw new Error('DoorDash not configured for this restaurant')
    
    const api = new DoorDashApiHelper(creds)
    return api.request('POST', `/drive/v2/quotes/${encodeURIComponent(externalDeliveryId)}/accept`, params)
  }

  /**
   * Get delivery status
   */
  static async getDeliveryStatus(
    tenantId: string,
    deliveryId: string
  ): Promise<DoorDashDeliveryResponse> {
    const creds = await this.getCredentials(tenantId)
    if (!creds) throw new Error('DoorDash not configured for this restaurant')
    
    const api = new DoorDashApiHelper(creds)
    return api.request('GET', `/drive/v2/deliveries/${deliveryId}`)
  }

  /**
   * Cancel a delivery
   */
  static async cancelDelivery(
    tenantId: string,
    deliveryId: string
  ): Promise<void> {
    const creds = await this.getCredentials(tenantId)
    if (!creds) throw new Error('DoorDash not configured for this restaurant')
    
    const api = new DoorDashApiHelper(creds)
    await api.request('PUT', `/drive/v2/deliveries/${deliveryId}/cancel`, {})
  }

  /**
   * Create delivery for an order (full flow)
   */
  static async createDeliveryForOrder(orderId: string): Promise<{
    success: boolean
    deliveryId?: string
    fee?: number
    error?: string
  }> {
    // Get order with tenant info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            pickupInstructions: true,
            doordashDeveloperId: true,
            doordashKeyId: true,
            doordashSigningSecret: true,
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.type !== 'delivery') {
      return { success: false, error: 'Order is not a delivery order' }
    }

    if (!order.deliveryAddress) {
      return { success: false, error: 'No delivery address on order' }
    }

    const tenant = order.tenant
    if (!tenant.doordashDeveloperId || !tenant.doordashKeyId || !tenant.doordashSigningSecret) {
      return { success: false, error: 'DoorDash not configured for this restaurant' }
    }

    // Build pickup address
    const pickupAddress = [tenant.address, tenant.city, tenant.state, tenant.zip]
      .filter(Boolean)
      .join(', ')

    if (!pickupAddress) {
      return { success: false, error: 'Restaurant address not configured' }
    }

    // Parse order items
    const items = (order.items as any[]).map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: Math.round(item.price * 100), // Convert to cents
    }))

    // Build delivery request
    const deliveryRequest: DoorDashDeliveryRequest = {
      external_delivery_id: order.orderNumber,
      pickup_address: pickupAddress,
      pickup_phone_number: tenant.phone || '+15555555555',
      pickup_business_name: tenant.name,
      pickup_instructions: tenant.pickupInstructions || undefined,
      dropoff_address: order.deliveryAddress,
      dropoff_phone_number: order.customerPhone,
      dropoff_contact_given_name: order.customerName.split(' ')[0],
      dropoff_contact_family_name: order.customerName.split(' ').slice(1).join(' ') || undefined,
      dropoff_contact_send_notifications: true,
      dropoff_instructions: order.notes || undefined,
      order_value: Math.round(order.subtotal * 100), // cents
      currency: 'USD',
      tip: order.tip ? Math.round(order.tip * 100) : undefined,
      items,
    }

    try {
      // Create quote
      const quote = await this.createQuote(tenant.id, deliveryRequest)
      console.log('[DoorDash] Quote created:', quote.external_delivery_id, 'Fee:', quote.fee)

      // Accept quote
      const delivery = await this.acceptQuote(tenant.id, quote.external_delivery_id, {
        tip: deliveryRequest.tip,
      })
      console.log('[DoorDash] Delivery created:', delivery.delivery_id)

      // Update order with DoorDash delivery ID
      await prisma.order.update({
        where: { id: orderId },
        data: {
          doordashDeliveryId: delivery.delivery_id,
          deliveryFee: quote.fee / 100, // Convert from cents
        },
      })

      return {
        success: true,
        deliveryId: delivery.delivery_id,
        fee: quote.fee / 100,
      }
    } catch (error: any) {
      console.error('[DoorDash] Failed to create delivery:', error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create delivery',
      }
    }
  }
}

// ============================================
// WEBHOOK HANDLER
// ============================================

export interface DoorDashWebhookEvent {
  event_name: string
  external_delivery_id: string
  delivery_id?: string
  delivery_status?: string
  dasher_name?: string
  dasher_phone_number?: string
  tracking_url?: string
  pickup_time_estimated?: string
  dropoff_time_estimated?: string
  cancellation_reason?: string
}

// Map DoorDash status to our order status
const STATUS_MAP: Record<string, string> = {
  'created': 'confirmed',
  'confirmed': 'confirmed',
  'enroute_to_pickup': 'preparing',
  'arrived_at_pickup': 'ready',
  'picked_up': 'out_for_delivery',
  'enroute_to_dropoff': 'out_for_delivery',
  'arrived_at_dropoff': 'out_for_delivery',
  'delivered': 'completed',
  'cancelled': 'cancelled',
}

export async function handleDoorDashWebhook(event: DoorDashWebhookEvent): Promise<{
  success: boolean
  orderId?: string
  newStatus?: string
}> {
  console.log('[DoorDash Webhook]', event.event_name, event.external_delivery_id)

  // Find order by DoorDash external_delivery_id (which is our orderNumber)
  const order = await prisma.order.findFirst({
    where: { orderNumber: event.external_delivery_id },
  })

  if (!order) {
    console.warn('[DoorDash Webhook] Order not found:', event.external_delivery_id)
    return { success: false }
  }

  // Map status
  const newStatus = event.delivery_status ? STATUS_MAP[event.delivery_status] : undefined

  // Update order
  const updateData: any = {}
  
  if (newStatus && newStatus !== order.status) {
    updateData.status = newStatus
    if (newStatus === 'completed') {
      updateData.completedAt = new Date()
    }
  }

  if (event.delivery_id && !order.doordashDeliveryId) {
    updateData.doordashDeliveryId = event.delivery_id
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })
  }

  return {
    success: true,
    orderId: order.id,
    newStatus,
  }
}
