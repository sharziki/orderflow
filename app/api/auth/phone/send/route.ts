import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizePhone } from '@/lib/sanitize'

// POST /api/auth/phone/send - Send verification code
export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per 15 minutes per IP
  const rateCheck = checkRateLimit(req, 'auth')
  if (!rateCheck.success && rateCheck.response) {
    return rateCheck.response
  }

  try {
    const body = await req.json()
    const { phone, tenantSlug } = body

    if (!phone || !tenantSlug) {
      return NextResponse.json({ error: 'Phone and tenant required' }, { status: 400 })
    }

    const normalizedPhone = sanitizePhone(phone)

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { 
        id: true, 
        twilioAccountSid: true, 
        twilioAuthToken: true, 
        twilioPhoneNumber: true 
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create or update customer
    await prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: normalizedPhone } },
      create: {
        tenantId: tenant.id,
        phone: normalizedPhone,
        verifyCode: code,
        verifyCodeExpiry: expiresAt,
      },
      update: {
        verifyCode: code,
        verifyCodeExpiry: expiresAt,
      },
    })

    // Send SMS if Twilio configured
    if (tenant.twilioAccountSid && tenant.twilioAuthToken && tenant.twilioPhoneNumber) {
      try {
        const twilio = require('twilio')(tenant.twilioAccountSid, tenant.twilioAuthToken)
        await twilio.messages.create({
          body: `Your verification code is: ${code}`,
          from: tenant.twilioPhoneNumber,
          to: normalizedPhone,
        })
      } catch (smsError) {
        console.error('[PhoneAuth] SMS failed:', smsError)
        // Continue - code is saved, can be retrieved for testing
      }
    } else {
      // Development mode - log code
      console.log(`[PhoneAuth] Dev mode - code for ${normalizedPhone}: ${code}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent',
      // In dev, return code for testing
      ...(process.env.NODE_ENV === 'development' && { code })
    })
  } catch (error) {
    console.error('[PhoneAuth] Send error:', error)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
