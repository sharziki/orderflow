import { NextRequest, NextResponse } from 'next/server'
import { smartResetSoldOut, resetSoldOutForAllTenants } from '@/lib/cron/reset-sold-out'

/**
 * Cron endpoint to reset sold out items
 * 
 * VERCEL CRON CONFIGURATION:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reset-sold-out",
 *     "schedule": "0 * * * *"  // Run every hour for timezone-aware resets
 *   }]
 * }
 * 
 * For simpler setup (single timezone), use:
 * "schedule": "0 0 * * *"  // Run at midnight UTC
 * 
 * Query parameters:
 * - mode: "smart" (default) | "all"
 *   - smart: Only resets items for tenants where it's currently midnight in their timezone
 *   - all: Resets all items regardless of timezone
 */
export async function GET(req: NextRequest) {
  try {
    // Verify request is from Vercel Cron or has valid secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      // In development, allow without secret but log warning
      console.warn('CRON_SECRET not set - allowing unauthenticated cron request')
    }

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || 'smart'

    let results
    if (mode === 'all') {
      results = await resetSoldOutForAllTenants()
    } else {
      results = await smartResetSoldOut()
    }

    const totalReset = results.reduce((sum, r) => sum + r.resetCount, 0)

    console.log(`[Cron] Reset sold out items: ${totalReset} items across ${results.length} tenants`)

    return NextResponse.json({
      success: true,
      mode,
      timestamp: new Date().toISOString(),
      totalItemsReset: totalReset,
      tenantsAffected: results.length,
      details: results,
    })
  } catch (error) {
    console.error('Cron reset-sold-out error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

// Also allow POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req)
}
