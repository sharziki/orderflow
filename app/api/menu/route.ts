import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleApiError, logRequest } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/menu')

    const { searchParams } = new URL(request.url)
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true'
    const category = searchParams.get('category')

    let query = supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (!includeUnavailable) {
      query = query.eq('available', true)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data: menuItems, error } = await query

    if (error) {
      console.error('Error fetching menu items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: 500 }
      )
    }

    // Return with cache headers for better performance
    const response = NextResponse.json(menuItems || [])
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')

    return response
  } catch (error) {
    return handleApiError(error, 'GET /api/menu')
  }
}
