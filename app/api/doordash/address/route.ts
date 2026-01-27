import { NextRequest, NextResponse } from 'next/server'
import { doorDashAddressService } from '@/lib/doordash'
import { normalizeAddress } from '@/lib/api-utils'

/**
 * Address autocomplete helper using free geocoding APIs
 * Provides real-time address suggestions as user types
 * Matches Python implementation pattern with query variants and proper formatting
 */

function generateQueryVariants(query: string): string[] {
  const variants = [query.trim()]
  
  // If query contains street suffixes, try without them for broader results
  const streetSuffixPattern = /\b(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Pl|Place|Way|Cir|Circle)\b/gi
  if (streetSuffixPattern.test(query)) {
    const withoutSuffix = query.replace(streetSuffixPattern, '').trim()
    if (withoutSuffix.length >= 3) {
      variants.push(withoutSuffix)
    }
  }
  
  // Remove common words that might limit results
  const apartmentPattern = /\b(apartment|apt|unit|#)\b/gi
  if (apartmentPattern.test(query)) {
    const withoutApt = query.replace(apartmentPattern, '').trim()
    if (withoutApt.length >= 3) {
      variants.push(withoutApt)
    }
  }
  
  return variants.filter(v => v.length >= 3)
}

function formatAddressFromNominatim(result: any): string {
  const addr = result.address || {}
  const parts: string[] = []
  
  // Build street address
  const houseNumber = addr.house_number || ''
  const road = addr.road || ''
  const street = [houseNumber, road].filter(Boolean).join(' ').trim()
  
  if (street) {
    parts.push(street)
  }
  
  // City
  const city = addr.city || addr.town || addr.village || addr.municipality || ''
  if (city) {
    parts.push(city)
  }
  
  // State
  const state = addr.state || ''
  if (state) {
    parts.push(state)
  }
  
  // ZIP code
  const postcode = addr.postcode || ''
  if (postcode) {
    parts.push(postcode)
  }
  
  return parts.join(', ')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input_address, location, search_radius_meter, max_results, country } = body
    
    if (!input_address || String(input_address).trim().length < 3) {
      return NextResponse.json({ success: true, results: [] })
    }

    const query = String(input_address).trim()
    const limit = Math.min(Math.max(max_results || 5, 1), 10)
    const countryCode = country?.toLowerCase() || 'us'

    // Try DoorDash autocomplete first (production only)
    try {
      const results = await doorDashAddressService.autocomplete({
        input_address: query,
        location,
        search_radius_meter: search_radius_meter ?? 5000,
        max_results: limit,
        country: countryCode.toUpperCase(),
      })
      return NextResponse.json({ success: true, ...results })
    } catch (ddError: any) {
      // If DoorDash autocomplete fails (e.g., sandbox limitation), fall back to Nominatim
      console.log('[Address Autocomplete] DoorDash autocomplete unavailable, using Nominatim fallback')
    }

    // Use Nominatim with query variants (like Python implementation)
    const queryVariants = generateQueryVariants(query)
    const allSuggestions: any[] = []
    const seenAddresses = new Set<string>()

    for (const variant of queryVariants) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(variant)}&` +
          `countrycodes=${countryCode}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=${limit * 2}` // Get more to filter duplicates

        const nominatimResponse = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'DoorDashAPI-Python-Sample/1.0' // Required by Nominatim
          },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })

        if (!nominatimResponse.ok) {
          continue // Try next variant
        }

        const nominatimResults = await nominatimResponse.json()

        for (const result of nominatimResults) {
          // Format address properly
          const formattedAddress = formatAddressFromNominatim(result)
          
          // Normalize to ensure consistent format
          const normalizedAddress = normalizeAddress(formattedAddress, result.address)
          
          // Skip duplicates
          if (normalizedAddress && !seenAddresses.has(normalizedAddress)) {
            seenAddresses.add(normalizedAddress)
            allSuggestions.push({
              address: normalizedAddress,
              location: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
              },
              components: result.address || {}
            })

            if (allSuggestions.length >= limit) {
              break
            }
          }
        }

        // If we found enough suggestions, stop trying variants
        if (allSuggestions.length >= limit) {
          break
        }
      } catch (err) {
        // Continue to next variant
        continue
      }
    }

    console.log('[Address Autocomplete] Nominatim results:', allSuggestions.length, 'addresses found')

    return NextResponse.json({ success: true, results: allSuggestions })
  } catch (err: any) {
    console.error('[Address Autocomplete] Error:', err)
    return NextResponse.json({
      success: false,
      error: err?.message ?? 'Autocomplete failed'
    }, { status: 200 })
  }
}


