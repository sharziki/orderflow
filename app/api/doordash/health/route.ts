import { NextResponse } from 'next/server'
import { doorDashService } from '@/lib/doordash'

export async function GET() {
  try {
    // Use an obviously invalid ID to avoid creating anything
    const fakeId = 'healthcheck_invalid_id'
    await doorDashService.getDeliveryStatus(fakeId)

    // If DoorDash ever returns 200 for a bogus id (unlikely), treat as reachable
    return NextResponse.json({ ok: true, reachable: true, note: 'Unexpected 200 for invalid id' })
  } catch (err: any) {
    // Axios-style error handling to extract HTTP details
    const status = err?.response?.status
    const data = err?.response?.data

    if (status === 404) {
      // 404 Not Found means: we authenticated and reached the API
      return NextResponse.json({ ok: true, reachable: true, status, hint: 'Auth likely valid; invalid id as expected', data }, { status: 200 })
    }

    if (status === 401 || status === 403) {
      return NextResponse.json({ ok: false, reachable: true, status, hint: 'Auth/signature invalid or credentials rejected', data }, { status: 200 })
    }

    // Network or unexpected errors
    return NextResponse.json({ ok: false, reachable: false, status: status ?? null, error: err?.message ?? 'Unknown error', data }, { status: 200 })
  }
}


