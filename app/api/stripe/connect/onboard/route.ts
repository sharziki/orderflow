import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/stripe/connect/onboard
 *
 * Creates a Stripe Connect Express account for a restaurant and generates onboarding link
 *
 * Request body:
 * {
 *   restaurantId: string (optional - for future multi-tenant)
 *   email: string (restaurant owner email)
 *   businessName: string (restaurant business name)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   accountId: string (Stripe Connect account ID)
 *   onboardingUrl: string (URL to redirect restaurant owner to complete onboarding)
 * }
 *
 * Flow:
 * 1. Create Stripe Connect Express account
 * 2. Generate account onboarding link
 * 3. Save account ID to database
 * 4. Return onboarding URL to frontend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, email, businessName } = body;

    // Validation
    if (!email || !businessName) {
      return NextResponse.json(
        { error: 'Email and business name are required' },
        { status: 400 }
      );
    }

    // For now, we're single-tenant (Blu Fish House)
    // In multi-tenant mode, you'd use restaurantId from auth/context
    // For this MVP, we'll create/get the default restaurant
    const { data: existingRestaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'blu-fish-house')
      .single();

    let restaurant = existingRestaurant as any;

    // If restaurant doesn't exist yet, create it
    if (!restaurant) {
      const { data: newRestaurant, error: createError } = await (supabase
        .from('restaurants') as any)
        .insert({
          name: businessName,
          slug: 'blu-fish-house',
          platform_fee_percent: 0.03, // 3% platform fee
          active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating restaurant:', createError);
        return NextResponse.json(
          { error: 'Failed to create restaurant record' },
          { status: 500 }
        );
      }

      restaurant = newRestaurant;
    }

    // Check if restaurant already has a Stripe Connect account
    if (restaurant.stripe_account_id && restaurant.stripe_onboarding_complete) {
      return NextResponse.json(
        {
          error: 'Restaurant already has an active Stripe Connect account',
          accountId: restaurant.stripe_account_id,
        },
        { status: 400 }
      );
    }

    let accountId = restaurant.stripe_account_id;

    // Step 1: Create Stripe Connect Express account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        business_type: 'company',
        company: {
          name: businessName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: businessName,
          product_description: 'Restaurant food ordering and delivery services',
          mcc: '5812', // Merchant Category Code for Eating Places, Restaurants
        },
        metadata: {
          restaurantId: restaurant.id,
          restaurantName: businessName,
        },
      });

      accountId = account.id;

      // Save Stripe account ID to database
      const { error: updateError } = await (supabase
        .from('restaurants') as any)
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_complete: false,
        })
        .eq('id', restaurant.id);

      if (updateError) {
        console.error('Error updating restaurant with Stripe account ID:', updateError);
      }
    }

    // Step 2: Generate account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      accountId: accountId,
      onboardingUrl: accountLink.url,
      message: 'Stripe Connect account created successfully. Redirect to onboarding URL.',
    });
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid request to Stripe. Please check your information.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create Stripe Connect account',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/connect/onboard?restaurantId=xxx
 *
 * Generate a new onboarding link for an existing Stripe Connect account
 * Useful when the original onboarding link expires (they expire after a few days)
 *
 * Query params:
 * - restaurantId (optional): Restaurant ID (for future multi-tenant)
 *
 * Response:
 * {
 *   success: boolean
 *   onboardingUrl: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // For single-tenant MVP, get the default restaurant
    const { data: restaurantGetData, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'blu-fish-house')
      .single();

    const restaurantGet = restaurantGetData as any

    if (!restaurantGet || !restaurantGet.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found. Please create one first.' },
        { status: 404 }
      );
    }

    // Check if onboarding is already complete
    if (restaurantGet.stripe_onboarding_complete) {
      return NextResponse.json(
        {
          error: 'Onboarding already complete',
          message: 'This restaurant has already completed Stripe onboarding.',
        },
        { status: 400 }
      );
    }

    // Generate new account link
    const accountLink = await stripe.accountLinks.create({
      account: restaurantGet.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      message: 'New onboarding link generated successfully.',
    });
  } catch (error: any) {
    console.error('Error generating onboarding link:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate onboarding link',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
