import { NextRequest, NextResponse } from 'next/server'

// Address autocomplete using Nominatim (OpenStreetMap) - free, no API key required
// Falls back to Google Places if GOOGLE_PLACES_API_KEY is set

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  
  if (!query || query.length < 3) {
    return NextResponse.json({ predictions: [] })
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

  try {
    // If Google Places API key is available, use it for better results
    if (googleApiKey) {
      return await getGooglePredictions(query, googleApiKey)
    }
    
    // Otherwise use Nominatim (free, no API key)
    return await getNominatimPredictions(query)
  } catch (error) {
    console.error('Address autocomplete error:', error)
    return NextResponse.json({ predictions: [] })
  }
}

async function getGooglePredictions(query: string, apiKey: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
  url.searchParams.set('input', query)
  url.searchParams.set('types', 'address')
  url.searchParams.set('components', 'country:us')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
    return NextResponse.json({
      predictions: data.predictions || [],
      provider: 'google'
    })
  }

  throw new Error(`Google Places API error: ${data.status}`)
}

async function getNominatimPredictions(query: string) {
  // Nominatim (OpenStreetMap) - completely free
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '5')
  url.searchParams.set('countrycodes', 'us')

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'DerbyFlow/1.0 (Restaurant Ordering Platform)'
    }
  })
  
  const data = await res.json()

  // Transform Nominatim response to match Google Places format
  const predictions = data.map((item: any) => {
    const mainText = item.address?.road 
      ? `${item.address.house_number || ''} ${item.address.road}`.trim()
      : item.display_name.split(',')[0]
    
    const secondaryParts = []
    if (item.address?.city || item.address?.town || item.address?.village) {
      secondaryParts.push(item.address.city || item.address.town || item.address.village)
    }
    if (item.address?.state) secondaryParts.push(item.address.state)
    if (item.address?.postcode) secondaryParts.push(item.address.postcode)

    return {
      place_id: `nominatim_${item.place_id}`,
      description: item.display_name,
      structured_formatting: {
        main_text: mainText,
        secondary_text: secondaryParts.join(', ')
      },
      // Store the full data for the details endpoint
      _nominatim_data: item
    }
  })

  return NextResponse.json({ 
    predictions,
    provider: 'nominatim'
  })
}
