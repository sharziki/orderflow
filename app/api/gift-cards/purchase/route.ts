import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'
import {
  handleApiError,
  AppError,
  validateRequired,
  logRequest
} from '@/lib/api-utils'
import { sendGiftCardEmails } from '@/lib/email'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
})

// Generate a unique gift card code
function generateGiftCardCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = 3
  const segmentLength = 4

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('')
  }).join('-')

  return `GIFT-${code}`
}

// POST /api/gift-cards/purchase - Create payment intent for gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    logRequest('POST', '/api/gift-cards/purchase', { amount: body.amount })

    const { amount, customer, recipient, notes, action } = body

    // If action is 'create-payment-intent', create the payment intent
    if (action === 'create-payment-intent') {
      validateRequired(body, ['amount'])

      if (typeof amount !== 'number' || amount <= 0) {
        throw new AppError('Amount must be a positive number', 400, 'INVALID_AMOUNT')
      }

      if (amount < 10) {
        throw new AppError('Minimum gift card amount is $10', 400, 'AMOUNT_TOO_LOW')
      }

      if (amount > 500) {
        throw new AppError('Maximum gift card amount is $500', 400, 'AMOUNT_TOO_HIGH')
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'gift_card',
          amount: amount.toString(),
          customerName: customer?.name || '',
          customerEmail: customer?.email || '',
          customerPhone: customer?.phone || '',
          recipientName: recipient?.name || '',
          recipientEmail: recipient?.email || '',
          notes: notes || '',
        },
        description: recipient?.name 
          ? `Gift Card for ${recipient.name} - $${amount}`
          : `Gift Card Purchase - $${amount}`,
      })

      console.log('[Gift Card Purchase] Created payment intent:', paymentIntent.id)

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    }

    // If action is 'confirm-purchase', create the gift card after successful payment
    if (action === 'confirm-purchase') {
      validateRequired(body, ['paymentIntentId'])

      const { paymentIntentId } = body

      // Verify payment intent was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status !== 'succeeded') {
        throw new AppError(
          'Payment has not been completed',
          400,
          'PAYMENT_NOT_COMPLETED'
        )
      }

      // Extract metadata
      const metadata = paymentIntent.metadata
      const giftCardAmount = parseFloat(metadata.amount || '0')

      if (!giftCardAmount || giftCardAmount <= 0) {
        throw new AppError('Invalid gift card amount', 400, 'INVALID_AMOUNT')
      }

      // Check if gift card already created for this payment
      const { data: existingCard } = await supabase
        .from('gift_cards')
        .select('*')
        .like('notes', `%Payment Intent: ${paymentIntentId}%`)
        .single()

      if (existingCard) {
        const card = existingCard as any
        // Already created, return existing card
        return NextResponse.json({
          success: true,
          giftCard: {
            id: card.id,
            code: card.code,
            initialAmount: card.initial_amount,
            currentBalance: card.current_balance,
            purchasedAt: card.purchased_at,
            status: card.status,
          },
          message: 'Gift card already created for this payment',
        })
      }

      // Generate unique code
      let code = generateGiftCardCode()
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 10) {
        const { data: existing } = await supabase
          .from('gift_cards')
          .select('id')
          .eq('code', code)
          .single()

        if (!existing) {
          isUnique = true
        } else {
          code = generateGiftCardCode()
          attempts++
        }
      }

      if (!isUnique) {
        throw new AppError(
          'Failed to generate unique gift card code',
          500,
          'CODE_GENERATION_FAILED'
        )
      }

      // Handle customer if provided
      let customerId = null
      if (metadata.customerEmail) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('email', metadata.customerEmail)
          .single()

        if (existingCustomer) {
          customerId = (existingCustomer as any).id
        } else if (metadata.customerName) {
          const now = new Date().toISOString()
          const { data: newCustomer, error: customerError } = await (supabase
            .from('customers') as any)
            .insert({
              id: createId(),
              name: metadata.customerName.trim(),
              email: metadata.customerEmail,
              phone: metadata.customerPhone || null,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single()

          if (customerError) {
            console.error('Error creating customer:', customerError)
          } else {
            customerId = newCustomer.id
          }
        }
      }

      // Create gift card
      const giftCardId = createId()
      const now = new Date().toISOString()

      const giftCardNotes = metadata.notes || `Gift card purchased for $${giftCardAmount}`
      const noteWithPayment = `${giftCardNotes}\nPayment Intent: ${paymentIntentId}`

      const { data: giftCard, error: giftCardError } = await (supabase
        .from('gift_cards') as any)
        .insert({
          id: giftCardId,
          code: code,
          initial_amount: giftCardAmount,
          current_balance: giftCardAmount,
          purchased_by: customerId,
          purchased_at: now,
          status: 'ACTIVE',
          notes: noteWithPayment,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (giftCardError) {
        console.error('Error creating gift card:', giftCardError)
        throw new AppError('Failed to create gift card', 500, 'GIFT_CARD_CREATE_ERROR')
      }

      // Create initial transaction record
      const transactionId = createId()
      await (supabase
        .from('gift_card_transactions') as any)
        .insert({
          id: transactionId,
          gift_card_id: giftCardId,
          amount: giftCardAmount,
          balance_before: 0,
          balance_after: giftCardAmount,
          transaction_type: 'PURCHASE',
          notes: `Initial purchase via Stripe (${paymentIntentId})`,
          created_by: customerId ? 'customer' : 'anonymous',
          created_at: now,
        })

      console.log('[Gift Card Purchase] Created gift card:', {
        id: giftCardId,
        code: code,
        amount: giftCardAmount,
        paymentIntent: paymentIntentId,
      })

      // Send email(s) to purchaser and recipient
      try {
        const emailResult = await sendGiftCardEmails({
          code: code,
          amount: giftCardAmount,
          purchaserName: metadata.customerName || 'Customer',
          purchaserEmail: metadata.customerEmail,
          recipientName: metadata.recipientName || undefined,
          recipientEmail: metadata.recipientEmail || undefined,
          message: metadata.notes || undefined,
        })

        console.log('[Gift Card Purchase] Email results:', {
          purchaserSent: emailResult.purchaserSent,
          recipientSent: emailResult.recipientSent,
          errors: emailResult.errors,
        })
      } catch (emailError) {
        // Don't fail the gift card creation if email fails
        console.error('[Gift Card Purchase] Email sending failed:', emailError)
      }

      return NextResponse.json({
        success: true,
        giftCard: {
          id: giftCard.id,
          code: giftCard.code,
          initialAmount: giftCard.initial_amount,
          currentBalance: giftCard.current_balance,
          purchasedAt: giftCard.purchased_at,
          status: giftCard.status,
        },
        message: metadata.recipientEmail 
          ? `Gift card created and sent to ${metadata.recipientEmail}!`
          : 'Gift card created successfully',
      }, { status: 201 })
    }

    throw new AppError('Invalid action', 400, 'INVALID_ACTION')

  } catch (error) {
    return handleApiError(error, 'POST /api/gift-cards/purchase')
  }
}
