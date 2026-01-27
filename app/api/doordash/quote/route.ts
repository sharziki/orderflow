import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, AppError, validateRequired, normalizePhone, normalizeAddress, logRequest } from '@/lib/api-utils'
import { doorDashQuotes } from '@/lib/doordash'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    logRequest('POST', '/api/doordash/quote', { externalId: body.external_delivery_id })

    const {
      external_delivery_id,
      pickup_address: incoming_pickup_address,
      pickup_business_name: incoming_pickup_business_name,
      pickup_phone_number: incoming_pickup_phone_number,
      pickup_instructions,
      dropoff_address,
      dropoff_phone_number: incoming_dropoff_phone_number,
      dropoff_instructions,
      dropoff_contact_given_name,
      dropoff_contact_family_name,
      dropoff_contact_send_notifications,
      dropoff_business_name,
      dropoff_location,
      order_value,
      currency,
      items,
      tip,
    } = body

    // Validate required fields
    validateRequired(body, ['external_delivery_id', 'dropoff_address', 'order_value', 'currency', 'items'])

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Items array is required and must not be empty', 400, 'INVALID_ITEMS')
    }

    // Enforce restaurant pickup details from environment
    const pickup_address = normalizeAddress(process.env.DOORDASH_PICKUP_ADDRESS || incoming_pickup_address || '607 SE 5th St, Bentonville, AR 72712')
    const pickup_business_name = process.env.DOORDASH_PICKUP_BUSINESS_NAME || incoming_pickup_business_name || 'Blu Fish House Bentonville'
    const pickup_phone_number = normalizePhone(process.env.DOORDASH_PICKUP_PHONE) || normalizePhone(incoming_pickup_phone_number) || '+14795555555'
    
    // Normalize dropoff phone
    let dropoff_phone_number: string = '+14792735400' // Default fallback
    
    // Helper to validate NANP phone number
    const isValidNANPNumber = (phone: string): boolean => {
      const digits = phone.replace(/\D/g, '')
      if (digits.length === 11 && digits.startsWith('1')) {
        const exchange = digits.charAt(4)
        return exchange !== '0' && exchange !== '1'
      } else if (digits.length === 10) {
        const exchange = digits.charAt(3)
        return exchange !== '0' && exchange !== '1'
      }
      return true
    }
    
    if (incoming_dropoff_phone_number) {
      const trimmed = String(incoming_dropoff_phone_number).trim()
      if (trimmed.startsWith('+') && /^\+\d{10,15}$/.test(trimmed)) {
        if (trimmed.startsWith('+1') && !isValidNANPNumber(trimmed)) {
          console.warn('[DoorDash Quote] Invalid NANP exchange code, using fallback:', trimmed)
        } else {
          dropoff_phone_number = trimmed
        }
      } else if (trimmed.length > 0) {
        const normalized = normalizePhone(trimmed)
        if (normalized && isValidNANPNumber(normalized)) {
          dropoff_phone_number = normalized
        }
      }
    }
    
    // Normalize dropoff address
    const isTestAddress = dropoff_address && /^\d+\s+SE\s+5th\s+St,?\s+Bentonville,?\s+AR\s+72712/i.test(dropoff_address.trim())
    const normalized_dropoff_address = isTestAddress 
      ? dropoff_address.trim()
      : normalizeAddress(dropoff_address)

    console.log('[DoorDash Quote] Creating quote:', {
      externalId: external_delivery_id,
      dropoffAddress: normalized_dropoff_address,
      pickupAddress: pickup_address,
      orderValue: order_value,
      itemCount: items.length,
    })

    // Build quote request
    const quoteRequest: any = {
      external_delivery_id,
      pickup_address,
      pickup_business_name,
      pickup_phone_number,
      dropoff_address: normalized_dropoff_address,
      dropoff_phone_number,
      order_value,
      currency,
      items,
    }

    // Add optional fields
    if (pickup_instructions) quoteRequest.pickup_instructions = pickup_instructions
    if (dropoff_instructions) quoteRequest.dropoff_instructions = dropoff_instructions
    if (dropoff_contact_given_name) quoteRequest.dropoff_contact_given_name = dropoff_contact_given_name
    if (dropoff_contact_family_name) quoteRequest.dropoff_contact_family_name = dropoff_contact_family_name
    if (typeof dropoff_contact_send_notifications === 'boolean') quoteRequest.dropoff_contact_send_notifications = dropoff_contact_send_notifications
    if (dropoff_business_name) quoteRequest.dropoff_business_name = dropoff_business_name
    if (!isTestAddress && dropoff_location?.lat && dropoff_location?.lng) quoteRequest.dropoff_location = dropoff_location
    if (typeof tip === 'number' && tip > 0) quoteRequest.tip = tip

    // Create quote using TypeScript DoorDash library
    const quote = await doorDashQuotes.createQuote(quoteRequest)

    console.log('[DoorDash Quote] Quote created:', {
      fee: quote.fee,
      currency: quote.currency
    })

    return NextResponse.json({ success: true, quote })
  } catch (err: any) {
    if (err?.response?.data) {
      const errorData = err.response.data
      console.error('[DoorDash Quote] API error:', errorData)
      return NextResponse.json({
        success: false,
        error: errorData
      }, { status: 200 })
    }
    return handleApiError(err, 'POST /api/doordash/quote')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    logRequest('PUT', '/api/doordash/quote', { externalId: body.external_delivery_id })

    const { external_delivery_id, tip, dropoff_phone_number } = body

    if (!external_delivery_id) {
      throw new AppError('external_delivery_id is required', 400, 'MISSING_DELIVERY_ID')
    }

    console.log('[DoorDash Quote] Accepting quote:', {
      externalId: external_delivery_id,
      tip: tip || 0
    })

    // Accept quote using TypeScript DoorDash library
    const params: any = {}
    if (typeof tip === 'number' && tip > 0) params.tip = tip
    if (dropoff_phone_number) {
      const normalized = normalizePhone(dropoff_phone_number)
      if (normalized) params.dropoff_phone_number = normalized
    }

    const delivery = await doorDashQuotes.acceptQuote(external_delivery_id, params)

    console.log('[DoorDash Quote] Quote accepted:', {
      deliveryId: delivery.delivery_id || delivery.external_delivery_id
    })

    return NextResponse.json({ success: true, delivery })
  } catch (err: any) {
    if (err?.response?.data) {
      const errorData = err.response.data
      console.error('[DoorDash Quote Accept] API error:', errorData)
      return NextResponse.json({
        success: false,
        error: errorData
      }, { status: 200 })
    }
    return handleApiError(err, 'PUT /api/doordash/quote')
  }
}
