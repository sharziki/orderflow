/**
 * Reset Sold Out Items Cron Job
 * 
 * This function resets all menu items with `isSoldOut: true` and `soldOutAutoReset: true`
 * back to available status. Designed to run at midnight for each tenant's timezone.
 * 
 * VERCEL CRON SETUP:
 * 
 * 1. Create a cron API route at: /api/cron/reset-sold-out/route.ts
 * 2. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/reset-sold-out",
 *        "schedule": "0 0 * * *"
 *      }]
 *    }
 * 
 * 3. The API route should:
 *    - Verify the request is from Vercel Cron (check CRON_SECRET header)
 *    - Call resetSoldOutItems() for each tenant or by timezone
 * 
 * For timezone-aware resets (midnight in each restaurant's timezone):
 * Run hourly and check which timezones are at midnight.
 */

import { prisma } from '@/lib/db'

export interface ResetResult {
  tenantId: string
  tenantName: string
  resetCount: number
}

/**
 * Reset sold out items for a specific tenant
 */
export async function resetSoldOutForTenant(tenantId: string): Promise<number> {
  const result = await prisma.menuItem.updateMany({
    where: {
      tenantId,
      isSoldOut: true,
      soldOutAutoReset: true,
    },
    data: {
      isSoldOut: false,
    },
  })

  return result.count
}

/**
 * Reset sold out items for all tenants
 * Use when running a simple daily cron at a fixed time
 */
export async function resetSoldOutForAllTenants(): Promise<ResetResult[]> {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  const results: ResetResult[] = []

  for (const tenant of tenants) {
    const resetCount = await resetSoldOutForTenant(tenant.id)
    results.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      resetCount,
    })
  }

  return results
}

/**
 * Reset sold out items for tenants in a specific timezone
 * Use when running hourly to handle per-timezone midnight resets
 * 
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 */
export async function resetSoldOutByTimezone(timezone: string): Promise<ResetResult[]> {
  const tenants = await prisma.tenant.findMany({
    where: { 
      isActive: true,
      timezone,
    },
    select: { id: true, name: true },
  })

  const results: ResetResult[] = []

  for (const tenant of tenants) {
    const resetCount = await resetSoldOutForTenant(tenant.id)
    if (resetCount > 0) {
      results.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        resetCount,
      })
    }
  }

  return results
}

/**
 * Get all unique timezones from active tenants
 */
export async function getActiveTimezones(): Promise<string[]> {
  const result = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { timezone: true },
    distinct: ['timezone'],
  })

  return result.map(t => t.timezone)
}

/**
 * Check if it's midnight (00:00-00:59) in a given timezone
 */
export function isMidnightInTimezone(timezone: string): boolean {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  })
  const hour = parseInt(formatter.format(now), 10)
  return hour === 0
}

/**
 * Smart reset: checks all timezones and resets items where it's midnight
 * Run this hourly for timezone-aware resets
 */
export async function smartResetSoldOut(): Promise<ResetResult[]> {
  const timezones = await getActiveTimezones()
  const allResults: ResetResult[] = []

  for (const timezone of timezones) {
    if (isMidnightInTimezone(timezone)) {
      const results = await resetSoldOutByTimezone(timezone)
      allResults.push(...results)
    }
  }

  return allResults
}
