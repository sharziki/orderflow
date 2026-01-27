import { prisma } from './db'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.FROM_EMAIL || 'OrderFlow <noreply@orderflow.io>'
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://orderflow.io'

interface CartItem {
  name: string
  quantity: number
  price: number
}

/**
 * Process abandoned carts older than 1 hour and send recovery emails
 * Run this via cron job every hour
 */
export async function processAbandonedCarts() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  // Find carts that are:
  // - Older than 1 hour
  // - Not recovered
  // - Have email and haven't been emailed yet
  const carts = await prisma.abandonedCart.findMany({
    where: {
      createdAt: { lt: oneHourAgo },
      recovered: false,
      recoveryEmailSent: false,
      email: { not: null },
    },
    include: {
      tenant: {
        select: { name: true, slug: true, primaryColor: true }
      }
    },
    take: 50, // Process in batches
  })

  console.log(`[AbandonedCarts] Processing ${carts.length} carts`)

  for (const cart of carts) {
    try {
      await sendRecoveryEmail(cart)
      
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { recoveryEmailSent: true }
      })
      
      console.log(`[AbandonedCarts] Sent recovery email for cart ${cart.id}`)
    } catch (error) {
      console.error(`[AbandonedCarts] Failed to send email for cart ${cart.id}:`, error)
    }
  }

  return { processed: carts.length }
}

async function sendRecoveryEmail(cart: {
  id: string
  email: string | null
  items: any
  subtotal: number
  tenant: { name: string; slug: string; primaryColor: string }
}) {
  if (!resend || !cart.email) return

  const items = cart.items as CartItem[]
  const storeUrl = `${APP_URL}/store/${cart.tenant.slug}`
  const primaryColor = cart.tenant.primaryColor

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        ${item.quantity}x ${item.name}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  await resend.emails.send({
    from: FROM_EMAIL,
    to: cart.email,
    subject: `🛒 You left something behind at ${cart.tenant.name}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${primaryColor};">Forget something?</h1>
        <p>Hey there! We noticed you left some items in your cart at <strong>${cart.tenant.name}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Cart</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr style="font-weight: bold;">
              <td style="padding: 12px 0; border-top: 2px solid #e2e8f0;">Subtotal</td>
              <td style="padding: 12px 0; border-top: 2px solid #e2e8f0; text-align: right;">
                $${cart.subtotal.toFixed(2)}
              </td>
            </tr>
          </table>
        </div>
        
        <p>Your delicious meal is just a click away! 🍕</p>
        
        <a href="${storeUrl}" style="display: inline-block; background: ${primaryColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
          Complete Your Order →
        </a>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
          This email was sent because you added items to your cart but didn't complete checkout.
          <br>If you've already ordered, please disregard this email.
        </p>
      </div>
    `,
  })
}

/**
 * Mark cart as recovered when order is placed
 */
export async function markCartRecovered(tenantId: string, email?: string, phone?: string, orderId?: string) {
  if (!email && !phone) return

  const where: any = {
    tenantId,
    recovered: false,
  }

  if (email) where.email = email
  if (phone) where.phone = phone

  await prisma.abandonedCart.updateMany({
    where,
    data: {
      recovered: true,
      recoveredOrderId: orderId,
    }
  })
}
