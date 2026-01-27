import { Resend } from 'resend'

// Initialize Resend with API key
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Email sender configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Blu Fish House <noreply@blufishhouse.com>'
const RESTAURANT_NAME = 'Blu Fish House'
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://blufishhouse.com'

interface GiftCardEmailData {
  code: string
  amount: number
  purchaserName: string
  purchaserEmail: string
  recipientName?: string
  recipientEmail?: string
  message?: string
}

// Generate beautiful HTML email for gift card
function generateGiftCardEmailHTML(data: GiftCardEmailData, isRecipient: boolean): string {
  const greeting = isRecipient 
    ? `${data.recipientName ? `Hi ${data.recipientName}` : 'Hello'}!`
    : `Hi ${data.purchaserName}!`
  
  const introText = isRecipient
    ? `${data.purchaserName} has sent you a gift card to ${RESTAURANT_NAME}!`
    : `Thank you for purchasing a ${RESTAURANT_NAME} gift card!`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${RESTAURANT_NAME} Gift Card</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B3755 0%, #1e3a5f 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                🎁 ${RESTAURANT_NAME}
              </h1>
              <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8);">
                Gift Card
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              <!-- Greeting -->
              <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1e293b;">
                ${greeting}
              </h2>
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #64748b; line-height: 1.6;">
                ${introText}
              </p>
              
              ${data.message ? `
              <!-- Gift Message -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
                  Personal Message
                </p>
                <p style="margin: 0; font-size: 16px; color: #78350f; font-style: italic; line-height: 1.6;">
                  "${data.message}"
                </p>
                <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e;">
                  — ${data.purchaserName}
                </p>
              </div>
              ` : ''}
              
              <!-- Gift Card Display -->
              <div style="background: linear-gradient(135deg, #0B3755 0%, #1e3a5f 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">
                  Gift Card Value
                </p>
                <p style="margin: 0 0 24px 0; font-size: 48px; font-weight: 700; color: #ffffff;">
                  $${data.amount.toFixed(2)}
                </p>
                
                <div style="background-color: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                    Your Gift Card Code
                  </p>
                  <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                    ${data.code}
                  </p>
                </div>
                
                <div style="display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                  ✓ Active
                </div>
              </div>
              
              <!-- How to Use -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e293b;">
                  How to Use Your Gift Card
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #0B3755; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</span>
                    </td>
                    <td style="padding: 8px 0; padding-left: 12px; color: #475569; font-size: 15px;">
                      Visit us in-store or order online at our website
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #0B3755; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</span>
                    </td>
                    <td style="padding: 8px 0; padding-left: 12px; color: #475569; font-size: 15px;">
                      Enter your gift card code at checkout or show it to the cashier
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #0B3755; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">3</span>
                    </td>
                    <td style="padding: 8px 0; padding-left: 12px; color: #475569; font-size: 15px;">
                      Enjoy delicious fresh seafood! 🐟
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Check Balance Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${WEBSITE_URL}/gift-cards/balance" style="display: inline-block; background-color: #0B3755; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
                  Check Your Balance
                </a>
              </div>
              
              <!-- Important Notes -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                  Important Information
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
                  <li>This gift card never expires</li>
                  <li>Redeemable in-store and online</li>
                  <li>Cannot be exchanged for cash</li>
                  <li>Treat this code like cash — keep it safe!</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; border-radius: 0 0 16px 16px; padding: 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
                ${RESTAURANT_NAME}
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                Fresh Seafood & More
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.4);">
                Questions? Contact us at support@blufishhouse.com
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Generate plain text version
function generateGiftCardEmailText(data: GiftCardEmailData, isRecipient: boolean): string {
  const greeting = isRecipient 
    ? `${data.recipientName ? `Hi ${data.recipientName}` : 'Hello'}!`
    : `Hi ${data.purchaserName}!`
  
  const introText = isRecipient
    ? `${data.purchaserName} has sent you a gift card to ${RESTAURANT_NAME}!`
    : `Thank you for purchasing a ${RESTAURANT_NAME} gift card!`

  let text = `
${greeting}

${introText}
`

  if (data.message) {
    text += `
Personal Message from ${data.purchaserName}:
"${data.message}"
`
  }

  text += `
===============================
🎁 YOUR GIFT CARD
===============================

Value: $${data.amount.toFixed(2)}
Code: ${data.code}
Status: Active

===============================

HOW TO USE YOUR GIFT CARD:
1. Visit us in-store or order online
2. Enter your gift card code at checkout
3. Enjoy delicious fresh seafood! 🐟

Check your balance anytime: ${WEBSITE_URL}/gift-cards/balance

IMPORTANT:
• This gift card never expires
• Redeemable in-store and online
• Cannot be exchanged for cash
• Treat this code like cash — keep it safe!

---
${RESTAURANT_NAME}
Fresh Seafood & More
Questions? Contact us at support@blufishhouse.com
`

  return text.trim()
}

// Send gift card email to purchaser
export async function sendGiftCardPurchaseEmail(data: GiftCardEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured. RESEND_API_KEY is missing.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.purchaserEmail,
      subject: `🎁 Your ${RESTAURANT_NAME} Gift Card - $${data.amount.toFixed(2)}`,
      html: generateGiftCardEmailHTML(data, false),
      text: generateGiftCardEmailText(data, false),
    })

    if (error) {
      console.error('[Email] Failed to send purchaser email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Gift card email sent to purchaser:', data.purchaserEmail)
    return { success: true }
  } catch (err) {
    console.error('[Email] Error sending purchaser email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' }
  }
}

// Send gift card email to recipient
export async function sendGiftCardRecipientEmail(data: GiftCardEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured. RESEND_API_KEY is missing.')
    return { success: false, error: 'Email service not configured' }
  }

  if (!data.recipientEmail) {
    return { success: false, error: 'No recipient email provided' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `🎁 ${data.purchaserName} sent you a ${RESTAURANT_NAME} Gift Card!`,
      html: generateGiftCardEmailHTML(data, true),
      text: generateGiftCardEmailText(data, true),
    })

    if (error) {
      console.error('[Email] Failed to send recipient email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Gift card email sent to recipient:', data.recipientEmail)
    return { success: true }
  } catch (err) {
    console.error('[Email] Error sending recipient email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' }
  }
}

// Send both emails (purchaser confirmation + recipient gift)
export async function sendGiftCardEmails(data: GiftCardEmailData): Promise<{ 
  purchaserSent: boolean
  recipientSent: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // Send to purchaser
  const purchaserResult = await sendGiftCardPurchaseEmail(data)
  if (!purchaserResult.success && purchaserResult.error) {
    errors.push(`Purchaser email: ${purchaserResult.error}`)
  }

  // Send to recipient if different from purchaser
  let recipientSent = false
  if (data.recipientEmail && data.recipientEmail !== data.purchaserEmail) {
    const recipientResult = await sendGiftCardRecipientEmail(data)
    recipientSent = recipientResult.success
    if (!recipientResult.success && recipientResult.error) {
      errors.push(`Recipient email: ${recipientResult.error}`)
    }
  }

  return {
    purchaserSent: purchaserResult.success,
    recipientSent,
    errors
  }
}

