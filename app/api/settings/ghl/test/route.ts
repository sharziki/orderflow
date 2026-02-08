import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { testGHLConnection } from '@/lib/gohighlevel'

// POST /api/settings/ghl/test - Test GHL connection
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey, locationId } = await req.json()

    if (!apiKey || !locationId) {
      return NextResponse.json(
        { error: 'API key and location ID are required' },
        { status: 400 }
      )
    }

    const result = await testGHLConnection(apiKey, locationId)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Connection successful!' })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Connection failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('GHL test error:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}
