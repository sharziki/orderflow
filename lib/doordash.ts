import axios from 'axios'
import { SignJWT } from 'jose'
import { withDoorDashRetry } from './retry'

interface DoorDashDeliveryRequest {
  external_delivery_id: string
  pickup_address: string
  pickup_phone_number: string
  pickup_business_name: string
  pickup_external_business_id?: string
  pickup_external_store_id?: string
  pickup_instructions?: string
  pickup_reference_tag?: string
  dropoff_address: string
  dropoff_phone_number: string
  dropoff_instructions?: string
  dropoff_contact_given_name?: string
  dropoff_contact_family_name?: string
  dropoff_contact_send_notifications?: boolean
  dropoff_business_name?: string
  dropoff_location?: {
    lat: number
    lng: number
  }
  order_value: number
  currency: string
  tip?: number
  items: Array<{
    name: string
    description?: string
    quantity: number
    price: number
  }>
}

interface DoorDashDeliveryResponse {
  external_delivery_id: string
  delivery_id: string
  status: string
  fee: number
  currency: string
}

/**
 * DoorDash API Helper - Direct implementation
 * Makes direct API calls to DoorDash without requiring Python service
 */
class DoorDashApiHelper {
  private baseUrl: string
  private developerId: string
  private keyId: string
  private signingSecret: string

  constructor() {
    this.baseUrl = process.env.DOORDASH_BASE_URL || 'https://openapi.doordash.com'
    // Use same defaults as Python implementation
    this.developerId = process.env.DOORDASH_DEVELOPER_ID || '1eb5fc8d-c7f0-42ce-aa0d-b1802c5aa44c'
    this.keyId = process.env.DOORDASH_API_KEY || 'ae5671ba-d7c2-4f24-ab1d-8cb871d4e4e1'
    this.signingSecret = process.env.DOORDASH_SECRET || 'bIeQ1VL78AkATIB7zcZYAxBEBGPY9Aw9A6AA-soVh7w'
  }

  /**
   * Decode base64url string to Uint8Array
   * Matches Python's jwt.utils.base64url_decode behavior
   */
  private base64UrlDecode(str: string): Uint8Array {
    // Base64url uses - and _ instead of + and /
    // Also removes padding
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    
    // Convert base64 to Buffer, then to Uint8Array
    const buffer = Buffer.from(base64, 'base64')
    return new Uint8Array(buffer)
  }

  /**
   * Generate JWT token for DoorDash API authentication
   * Matches Python implementation using DD-JWT-V1 format
   * DoorDash requires: alg, typ: "JWT", and dd-ver: "DD-JWT-V1" in header
   */
  private async generateJwtToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    
    // DoorDash uses base64url encoding for the secret
    // Decode it the same way Python's jwt.utils.base64url_decode does
    const secretKey = this.base64UrlDecode(this.signingSecret)
    
    // Match Python implementation:
    // - kid is in payload (not header) per Python code
    // - exp and iat are numbers (JWT spec, PyJWT converts strings to numbers)
    // - Header must have: alg, typ: "JWT", and dd-ver: "DD-JWT-V1"
    const token = await new SignJWT({
      aud: 'doordash',
      iss: this.developerId,
      kid: this.keyId, // kid is in payload per Python implementation
    })
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT', // DoorDash requires this
        'dd-ver': 'DD-JWT-V1'
      })
      .setIssuedAt(now)
      .setExpirationTime(now + 1800)
      .sign(secretKey)
    
    return token
  }

  /**
   * Get headers for DoorDash API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.generateJwtToken()
    return {
      'Accept-Encoding': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Make a request to DoorDash API with retry logic
   */
  async makeRequest(method: 'GET' | 'POST' | 'PUT', endpoint: string, data?: any): Promise<any> {
    return withDoorDashRetry(async () => {
      const url = `${this.baseUrl}${endpoint}`
      const headers = await this.getHeaders()
      
      try {
        const response = await axios({
          method,
          url,
          headers,
          data,
        })
        
        return response.data
      } catch (error: any) {
        // Preserve axios error structure so API routes can access response.data
        if (error.response) {
          // Re-throw with response structure intact
          const axiosError: any = new Error(error.response?.data?.message || error.message || 'DoorDash API request failed')
          axiosError.response = error.response
          axiosError.isAxiosError = true
          throw axiosError
        }
        throw error
      }
    }, `doordash_${method}_${endpoint}`)
  }
}

/**
 * DoorDash Service - Direct API implementation
 * All DoorDash API calls are made directly without Python service
 */
class DoorDashService {
  private apiHelper: DoorDashApiHelper

  constructor() {
    this.apiHelper = new DoorDashApiHelper()
  }

  async createDelivery(deliveryData: DoorDashDeliveryRequest): Promise<DoorDashDeliveryResponse> {
    try {
      const requestBody: any = {
        external_delivery_id: deliveryData.external_delivery_id,
        pickup_address: deliveryData.pickup_address,
        pickup_business_name: deliveryData.pickup_business_name,
        pickup_phone_number: deliveryData.pickup_phone_number,
        dropoff_address: deliveryData.dropoff_address,
        dropoff_phone_number: deliveryData.dropoff_phone_number,
        order_value: deliveryData.order_value,
      }

      // Add optional fields
      if (deliveryData.pickup_external_business_id) {
        requestBody.pickup_external_business_id = deliveryData.pickup_external_business_id
      }
      if (deliveryData.pickup_external_store_id) {
        requestBody.pickup_external_store_id = deliveryData.pickup_external_store_id
      }
      if (deliveryData.pickup_instructions) {
        requestBody.pickup_instructions = deliveryData.pickup_instructions
      }
      if (deliveryData.dropoff_instructions) {
        requestBody.dropoff_instructions = deliveryData.dropoff_instructions
      }
      if (deliveryData.dropoff_contact_given_name) {
        requestBody.dropoff_contact_given_name = deliveryData.dropoff_contact_given_name
      }
      if (deliveryData.dropoff_contact_family_name) {
        requestBody.dropoff_contact_family_name = deliveryData.dropoff_contact_family_name
      }
      if (deliveryData.dropoff_contact_send_notifications !== undefined) {
        requestBody.dropoff_contact_send_notifications = deliveryData.dropoff_contact_send_notifications
      }
      if (deliveryData.dropoff_business_name) {
        requestBody.dropoff_business_name = deliveryData.dropoff_business_name
      }
      if (deliveryData.dropoff_location) {
        requestBody.dropoff_location = deliveryData.dropoff_location
      }
      if (deliveryData.currency) {
        requestBody.currency = deliveryData.currency
      }
      if (deliveryData.tip) {
        requestBody.tip = deliveryData.tip
      }
      if (deliveryData.items) {
        requestBody.items = deliveryData.items
      }

      const delivery = await this.apiHelper.makeRequest('POST', '/drive/v2/deliveries', requestBody)
      return delivery
    } catch (error: any) {
      // Preserve axios error structure
      if (error.response) {
        throw error
      }
      throw new Error(error.message || 'Failed to create delivery')
    }
  }

  async getDeliveryStatus(deliveryId: string): Promise<any> {
    try {
      const delivery = await this.apiHelper.makeRequest('GET', `/drive/v2/deliveries/${deliveryId}`)
      return delivery
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get delivery status')
    }
  }

  // Mock method for testing when API keys are not available
  async createMockDelivery(deliveryData: DoorDashDeliveryRequest): Promise<DoorDashDeliveryResponse> {
    return {
      external_delivery_id: deliveryData.external_delivery_id,
      delivery_id: `mock_${Date.now()}`,
      status: 'accepted',
      fee: 3.99,
      currency: 'USD'
    }
  }
}

export const doorDashService = new DoorDashService()
export type { DoorDashDeliveryRequest, DoorDashDeliveryResponse }

// Quote types
export interface DoorDashQuoteRequest {
  external_delivery_id: string
  pickup_address?: string
  pickup_business_name?: string
  pickup_phone_number: string
  pickup_external_business_id?: string
  pickup_external_store_id?: string
  pickup_instructions?: string
  dropoff_address: string
  dropoff_phone_number: string
  dropoff_instructions?: string
  dropoff_contact_given_name?: string
  dropoff_contact_family_name?: string
  dropoff_contact_send_notifications?: boolean
  dropoff_business_name?: string
  dropoff_location?: {
    lat: number
    lng: number
  }
  order_value: number // cents
  currency: string
  tip?: number
  items: Array<{
    name: string
    description?: string
    quantity: number
    price: number // cents per item
  }>
}

export interface DoorDashQuoteResponse {
  external_delivery_id: string
  fee: number // cents
  currency: string
  delivery_status?: string
}

export class DoorDashQuotes {
  private apiHelper: DoorDashApiHelper

  constructor() {
    this.apiHelper = new DoorDashApiHelper()
  }

  async createQuote(data: DoorDashQuoteRequest): Promise<DoorDashQuoteResponse> {
    try {
      const requestBody: any = {
        external_delivery_id: data.external_delivery_id,
        pickup_address: data.pickup_address,
        pickup_business_name: data.pickup_business_name,
        pickup_phone_number: data.pickup_phone_number,
        dropoff_address: data.dropoff_address,
        dropoff_phone_number: data.dropoff_phone_number,
        order_value: data.order_value,
      }

      // Add optional fields
      if (data.pickup_external_business_id) {
        requestBody.pickup_external_business_id = data.pickup_external_business_id
      }
      if (data.pickup_external_store_id) {
        requestBody.pickup_external_store_id = data.pickup_external_store_id
      }
      if (data.pickup_instructions) {
        requestBody.pickup_instructions = data.pickup_instructions
      }
      if (data.dropoff_instructions) {
        requestBody.dropoff_instructions = data.dropoff_instructions
      }
      if (data.dropoff_contact_given_name) {
        requestBody.dropoff_contact_given_name = data.dropoff_contact_given_name
      }
      if (data.dropoff_contact_family_name) {
        requestBody.dropoff_contact_family_name = data.dropoff_contact_family_name
      }
      if (data.dropoff_contact_send_notifications !== undefined) {
        requestBody.dropoff_contact_send_notifications = data.dropoff_contact_send_notifications
      }
      if (data.dropoff_business_name) {
        requestBody.dropoff_business_name = data.dropoff_business_name
      }
      if (data.dropoff_location) {
        requestBody.dropoff_location = data.dropoff_location
      }
      if (data.currency) {
        requestBody.currency = data.currency
      }
      if (data.tip) {
        requestBody.tip = data.tip
      }
      if (data.items) {
        requestBody.items = data.items
      }

      const quote = await this.apiHelper.makeRequest('POST', '/drive/v2/quotes', requestBody)
      return quote
    } catch (error: any) {
      // Preserve axios error structure
      if (error.response) {
        throw error
      }
      throw new Error(error.message || 'Failed to create quote')
    }
  }

  async acceptQuote(externalDeliveryId: string, params: { tip?: number; dropoff_phone_number?: string } = {}): Promise<any> {
    try {
      const requestBody: any = {}
      if (params.tip) {
        requestBody.tip = params.tip
      }
      if (params.dropoff_phone_number) {
        requestBody.dropoff_phone_number = params.dropoff_phone_number
      }

      const delivery = await this.apiHelper.makeRequest('POST', `/drive/v2/quotes/${encodeURIComponent(externalDeliveryId)}/accept`, requestBody)
      return delivery
    } catch (error: any) {
      // Preserve axios error structure
      if (error.response) {
        throw error
      }
      throw new Error(error.message || 'Failed to accept quote')
    }
  }
}

export const doorDashQuotes = new DoorDashQuotes()

// Address autocomplete types
export interface DoorDashAddressAutocompleteRequest {
  input_address: string
  location?: { lat: number; lng: number }
  search_radius_meter?: number
  max_results?: number
  country?: string // e.g., 'US'
}

export interface DoorDashAddressAutocompleteResponse {
  results: Array<{
    address: string
    location?: { lat: number; lng: number }
    components?: Record<string, any>
  }>
}

export class DoorDashAddressService {
  /**
   * DoorDash doesn't have an address autocomplete endpoint
   * This service always throws an error to trigger fallback to Nominatim
   */
  async autocomplete(body: DoorDashAddressAutocompleteRequest): Promise<DoorDashAddressAutocompleteResponse> {
    // DoorDash doesn't provide address autocomplete, so we always throw
    // This allows the Next.js route to fall back to Nominatim
    throw new Error('DoorDash address autocomplete endpoint not available')
  }
}

export const doorDashAddressService = new DoorDashAddressService()
