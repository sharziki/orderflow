import { prisma } from './db'

// Twilio client - lazy loaded
let twilioClient: any = null

function getTwilioClient(accountSid: string, authToken: string) {
  if (!twilioClient) {
    const twilio = require('twilio')
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

interface SMSConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

/**
 * Send SMS notification
 */
export async function sendSMS(
  to: string,
  message: string,
  config: SMSConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = getTwilioClient(config.accountSid, config.authToken)
    
    const result = await client.messages.create({
      body: message,
      from: config.fromNumber,
      to: to,
    })

    console.log(`[SMS] Sent to ${to}: ${result.sid}`)
    return { success: true, messageId: result.sid }
  } catch (error: any) {
    console.error('[SMS] Failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send order status SMS
 */
export async function sendOrderStatusSMS(
  order: {
    id: string
    orderNumber: string
    customerPhone: string
    customerName: string
    type: 'pickup' | 'delivery'
    status: string
  },
  tenantId: string
): Promise<void> {
  // Get tenant SMS config
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      smsNotificationsEnabled: true,
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioPhoneNumber: true,
    }
  })

  if (!tenant?.smsNotificationsEnabled || !tenant.twilioAccountSid || !tenant.twilioAuthToken || !tenant.twilioPhoneNumber) {
    console.log('[SMS] SMS not configured for tenant')
    return
  }

  const statusMessages: Record<string, string> = {
    confirmed: `Hi ${order.customerName}! Your order #${order.orderNumber} from ${tenant.name} has been confirmed. We'll notify you when it's ready!`,
    preparing: `${order.customerName}, good news! Your order #${order.orderNumber} is now being prepared.`,
    ready: order.type === 'pickup'
      ? `🔔 ${order.customerName}, your order #${order.orderNumber} is READY for pickup at ${tenant.name}!`
      : `🚗 ${order.customerName}, your order #${order.orderNumber} is out for delivery!`,
    completed: `Thank you for ordering from ${tenant.name}! Enjoy your meal. 🍽️`,
  }

  const message = statusMessages[order.status]
  if (!message) return

  await sendSMS(order.customerPhone, message, {
    accountSid: tenant.twilioAccountSid,
    authToken: tenant.twilioAuthToken,
    fromNumber: tenant.twilioPhoneNumber,
  })
}

/**
 * Send verification code SMS
 */
export async function sendVerificationSMS(
  phone: string,
  code: string,
  config: SMSConfig
): Promise<{ success: boolean; error?: string }> {
  const message = `Your OrderFlow verification code is: ${code}. Valid for 10 minutes.`
  return sendSMS(phone, message, config)
}
