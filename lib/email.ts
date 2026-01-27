import { Resend } from 'resend'

// Lazy-load Resend to avoid build-time errors
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'OrderFlow <noreply@orderflow.io>'
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// ============================================
// EMAIL TEMPLATES
// ============================================

export async function sendWelcomeEmail(to: string, restaurantName: string) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Skipping welcome email (no API key):', to)
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to OrderFlow, ${restaurantName}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to OrderFlow! 🎉</h1>
          <p>Hi there,</p>
          <p>Thanks for signing up <strong>${restaurantName}</strong> with OrderFlow. You're just a few steps away from accepting online orders!</p>
          
          <h2 style="color: #1e40af;">Next Steps:</h2>
          <ol>
            <li><strong>Add your menu</strong> - Import or create your menu items</li>
            <li><strong>Connect Stripe</strong> - Set up payments to get paid</li>
            <li><strong>Configure settings</strong> - Set your hours and fees</li>
            <li><strong>Go live!</strong> - Share your ordering link</li>
          </ol>
          
          <a href="${APP_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Go to Dashboard →
          </a>
          
          <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
            Need help? Reply to this email or check our <a href="${APP_URL}/docs">documentation</a>.
          </p>
        </div>
      `,
    })
    console.log('[Email] Welcome email sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error)
  }
}

export async function sendOrderConfirmation(
  to: string,
  order: {
    orderNumber: string
    customerName: string
    items: { name: string; quantity: number; price: number }[]
    subtotal: number
    tax: number
    deliveryFee?: number
    tip?: number
    total: number
    type: 'pickup' | 'delivery'
    restaurantName: string
    restaurantPhone?: string
    restaurantAddress?: string
    estimatedTime?: string
  }
) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Skipping order confirmation (no API key):', to)
    return
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${item.quantity}x ${item.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Order Confirmed! ✓</h1>
          <p>Hi ${order.customerName},</p>
          <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${order.type === 'pickup' ? '🏪 Pickup' : '🚗 Delivery'}</h3>
            <p style="margin: 0;"><strong>${order.restaurantName}</strong></p>
            ${order.restaurantAddress ? `<p style="margin: 4px 0; color: #64748b;">${order.restaurantAddress}</p>` : ''}
            ${order.restaurantPhone ? `<p style="margin: 4px 0; color: #64748b;">${order.restaurantPhone}</p>` : ''}
            ${order.estimatedTime ? `<p style="margin-top: 12px;"><strong>Estimated ${order.type === 'pickup' ? 'ready' : 'delivery'} time:</strong> ${order.estimatedTime}</p>` : ''}
          </div>
          
          <h3>Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td style="padding: 8px 0;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right;">$${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Tax</td>
              <td style="padding: 8px 0; text-align: right;">$${order.tax.toFixed(2)}</td>
            </tr>
            ${order.deliveryFee ? `
            <tr>
              <td style="padding: 8px 0;">Delivery Fee</td>
              <td style="padding: 8px 0; text-align: right;">$${order.deliveryFee.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${order.tip ? `
            <tr>
              <td style="padding: 8px 0;">Tip</td>
              <td style="padding: 8px 0; text-align: right;">$${order.tip.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="font-weight: bold; font-size: 18px;">
              <td style="padding: 12px 0; border-top: 2px solid #e2e8f0;">Total</td>
              <td style="padding: 12px 0; border-top: 2px solid #e2e8f0; text-align: right;">$${order.total.toFixed(2)}</td>
            </tr>
          </table>
          
          <a href="${APP_URL}/track/${order.orderNumber}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Track Your Order →
          </a>
          
          <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
            Questions about your order? Contact the restaurant directly.
          </p>
        </div>
      `,
    })
    console.log('[Email] Order confirmation sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send order confirmation:', error)
  }
}

export async function sendOrderStatusUpdate(
  to: string,
  order: {
    orderNumber: string
    customerName: string
    status: string
    restaurantName: string
  }
) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Skipping status update (no API key):', to)
    return
  }

  const statusMessages: Record<string, { emoji: string; message: string }> = {
    preparing: { emoji: '👨‍🍳', message: 'Your order is being prepared!' },
    ready: { emoji: '✅', message: 'Your order is ready for pickup!' },
    out_for_delivery: { emoji: '🚗', message: 'Your order is out for delivery!' },
    completed: { emoji: '🎉', message: 'Your order has been completed!' },
    cancelled: { emoji: '❌', message: 'Your order has been cancelled.' },
  }

  const statusInfo = statusMessages[order.status] || { emoji: '📦', message: 'Your order status has been updated.' }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${statusInfo.emoji} Order Update - ${order.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>${statusInfo.emoji} ${statusInfo.message}</h1>
          <p>Hi ${order.customerName},</p>
          <p>Your order <strong>#${order.orderNumber}</strong> from <strong>${order.restaurantName}</strong> has been updated.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 24px; margin: 0;">${statusInfo.emoji}</p>
            <p style="font-size: 18px; font-weight: bold; margin: 8px 0;">${statusInfo.message}</p>
          </div>
          
          <a href="${APP_URL}/track/${order.orderNumber}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Track Your Order →
          </a>
        </div>
      `,
    })
    console.log('[Email] Status update sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send status update:', error)
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Skipping password reset (no API key):', to)
    return
  }

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your Password - OrderFlow',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Reset Your Password</h1>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset Password →
          </a>
          
          <p style="color: #64748b; font-size: 14px;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            If the button doesn't work, copy this link:<br>
            ${resetUrl}
          </p>
        </div>
      `,
    })
    console.log('[Email] Password reset sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send password reset:', error)
  }
}

export async function sendNewOrderNotification(
  to: string,
  order: {
    orderNumber: string
    customerName: string
    total: number
    itemCount: number
    type: 'pickup' | 'delivery'
  }
) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Skipping new order notification (no API key):', to)
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🔔 New Order #${order.orderNumber} - $${order.total.toFixed(2)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">🔔 New Order!</h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 24px; font-weight: bold;">#${order.orderNumber}</p>
            <p style="margin: 8px 0;">Customer: ${order.customerName}</p>
            <p style="margin: 8px 0;">${order.itemCount} items • $${order.total.toFixed(2)}</p>
            <p style="margin: 8px 0; padding: 4px 12px; background: ${order.type === 'delivery' ? '#fed7aa' : '#ddd6fe'}; display: inline-block; border-radius: 4px;">
              ${order.type === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}
            </p>
          </div>
          
          <a href="${APP_URL}/dashboard/orders" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Order →
          </a>
        </div>
      `,
    })
    console.log('[Email] New order notification sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send new order notification:', error)
  }
}
