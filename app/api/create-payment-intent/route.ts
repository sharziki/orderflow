import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { calculatePlatformFeeInCents, splitPayment } from '@/lib/stripe-fees'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
})

/**
 * POST /api/create-payment-intent
 *
 * Creates a Stripe Payment Intent with Stripe Connect marketplace model
 *
 * Request body:
 * {
 *   amount: number (total amount customer pays in dollars)
 *   subtotal: number (items total before tax/fees)
 *   tax: number
 *   deliveryFee: number
 *   orderId?: string (optional - to store payment intent ID with order)
 *   restaurantId?: string (optional - for future multi-tenant)
 * }
 *
 * Response:
 * {
 *   clientSecret: string (Stripe payment intent client secret)
 *   platformFee: number (platform fee in dollars)
 *   restaurantPayout: number (restaurant payout in dollars)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, subtotal, tax, deliveryFee, orderId, restaurantId } = await request.json()

    // Validation
    if (!amount || !subtotal) {
      return NextResponse.json(
        { error: 'Amount and subtotal are required' },
        { status: 400 }
      )
    }

    // Get restaurant (for single-tenant MVP, always Blu Fish House)
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'blu-fish-house')
      .single()

    if (restaurantError || !restaurantData) {
      return NextResponse.json(
        { error: 'Restaurant not found. Please set up your restaurant first.' },
        { status: 404 }
      )
    }

    const restaurant = restaurantData as any

    // Check if restaurant has Stripe Connect set up
    const useStripeConnect = restaurant.stripe_account_id && restaurant.stripe_onboarding_complete

    let feeBreakdown
    let platformFeeInCents = 0
    let paymentIntent

    if (useStripeConnect) {
      // Calculate fees using the fee calculation library
      feeBreakdown = splitPayment({
        platformFeePercent: restaurant.platform_fee_percent,
        subtotal: subtotal || 0,
        tax: tax || 0,
        deliveryFee: deliveryFee || 0,
      })

      // Calculate platform fee in cents for Stripe API
      platformFeeInCents = calculatePlatformFeeInCents(
        subtotal,
        restaurant.platform_fee_percent
      )

      // Create Payment Intent with Stripe Connect parameters
      // Using "Destination Charges" model (formerly "Direct Charges")
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Total customer pays (in cents)
        currency: 'usd',
        application_fee_amount: platformFeeInCents, // Platform fee kept by platform
        transfer_data: {
          destination: restaurant.stripe_account_id, // Restaurant's Stripe Connect account
        },
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: orderId || 'pending',
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          platformFee: feeBreakdown.platformFee.toString(),
          restaurantPayout: feeBreakdown.restaurantPayout.toString(),
          subtotal: subtotal.toString(),
          tax: (tax || 0).toString(),
          deliveryFee: (deliveryFee || 0).toString(),
        },
        description: `Order for ${restaurant.name}`,
      })
    } else {
      // Fallback to regular Stripe payment (for testing/development)
      // No fee split, all funds go to the platform account
      console.log('[Payment Intent] Using regular Stripe payment (Connect not configured)')

      feeBreakdown = {
        platformFee: 0,
        restaurantPayout: amount,
      }

      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Total customer pays (in cents)
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: orderId || 'pending',
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          subtotal: subtotal.toString(),
          tax: (tax || 0).toString(),
          deliveryFee: (deliveryFee || 0).toString(),
          mode: 'direct_payment', // Indicates this is not using Connect
        },
        description: `Order for ${restaurant.name}`,
      })
    }

    // If orderId provided, save payment intent ID to order
    if (orderId) {
      try {
        await (supabase
          .from('orders') as any)
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            platform_fee: feeBreakdown.platformFee,
            restaurant_payout: feeBreakdown.restaurantPayout,
          })
          .eq('id', orderId)
      } catch (error) {
        console.error('Error updating order with payment intent ID:', error)
        // Don't fail the payment intent creation if order update fails
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      platformFee: feeBreakdown.platformFee,
      restaurantPayout: feeBreakdown.restaurantPayout,
      breakdown: feeBreakdown, // Return full breakdown for debugging
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      // Handle invalid connected account
      if (error.code === 'account_invalid') {
        return NextResponse.json(
          {
            error: 'Restaurant payment account is invalid',
            message: 'Please contact support to resolve payment setup issues.',
          },
          { status: 400 }
        )
      }

      // Handle charges not enabled
      if (error.code === 'charges_not_enabled') {
        return NextResponse.json(
          {
            error: 'Restaurant payments not enabled',
            message: 'This restaurant needs to complete payment setup.',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
