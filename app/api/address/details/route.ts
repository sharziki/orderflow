import { NextRequest, NextResponse } from 'next/server'

// Get full address details including parsed components and coordinates

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('place_id')
  
  if (!placeId) {
    return NextResponse.json({ error: 'place_id required' }, { status: 400 })
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

  try {
    // If it's a Nominatim place ID, we need to re-fetch the data
    if (placeId.startsWith('nominatim_')) {
      return await getNominatimDetails(placeId.replace('nominatim_', ''))
    }
    
    // Otherwise use Google Places
    if (googleApiKey) {
      return await getGoogleDetails(placeId, googleApiKey)
    }

    return NextResponse.json({ error: 'No address provider configured' }, { status: 500 })
  } catch (error) {
    console.error('Address details error:', error)
    return NextResponse.json({ error: 'Failed to get address details' }, { status: 500 })
  }
}

async function getGoogleDetails(placeId: string, apiKey: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'address_components,geometry,formatted_address')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`)
  }

  const result = data.result
  const components = result.address_components || []

  // Extract address components
  const getComponent = (type: string) => {
    const comp = components.find((c: any) => c.types.includes(type))
    return comp?.long_name || ''
  }
  
  const getComponentShort = (type: string) => {
    const comp = components.find((c: any) => c.types.includes(type))
    return comp?.short_name || ''
  }

  const streetNumber = getComponent('street_number')
  const streetName = getComponent('route')

  return NextResponse.json({
    address: streetNumber && streetName ? `${streetNumber} ${streetName}` : result.formatted_address.split(',')[0],
    city: getComponent('locality') || getComponent('sublocality'),
    state: getComponentShort('administrative_area_level_1'),
    zip: getComponent('postal_code'),
    country: getComponentShort('country'),
    lat: result.geometry?.location?.lat,
    lng: result.geometry?.location?.lng,
    formatted_address: result.formatted_address
  })
}

async function getNominatimDetails(placeId: string) {
  // Fetch the place details from Nominatim
  const url = new URL('https://nominatim.openstreetmap.org/lookup')
  url.searchParams.set('osm_ids', `N${placeId},W${placeId},R${placeId}`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'DerbyFlow/1.0 (Restaurant Ordering Platform)'
    }
  })
  
  const data = await res.json()
  
  if (!data || data.length === 0) {
    // If lookup fails, try a reverse geocode with the original search
    return NextResponse.json({
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      error: 'Could not find place details'
    })
  }

  const item = data[0]
  const addr = item.address || {}

  // Build the street address
  const streetAddress = addr.house_number && addr.road 
    ? `${addr.house_number} ${addr.road}`
    : addr.road || item.display_name.split(',')[0]

  // Get city (Nominatim uses different fields)
  const city = addr.city || addr.town || addr.village || addr.municipality || ''
  
  // Get state
  const state = addr.state || ''
  
  // Map full state names to abbreviations for US
  const stateAbbreviations: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
  }

  const stateAbbr = stateAbbreviations[state] || state

  return NextResponse.json({
    address: streetAddress,
    city: city,
    state: stateAbbr,
    zip: addr.postcode || '',
    country: addr.country_code?.toUpperCase() || 'US',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    formatted_address: item.display_name
  })
}
