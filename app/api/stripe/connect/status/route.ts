import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

/**
 * GET /api/stripe/connect/status?restaurantId=xxx
 *
 * Check the status of a restaurant's Stripe Connect account
 * Returns onboarding completion status, capabilities, and payout information
 *
 * Query params:
 * - restaurantId (optional): Restaurant ID (for future multi-tenant)
 *
 * Response:
 * {
 *   success: boolean
 *   accountId: string
 *   onboardingComplete: boolean
 *   chargesEnabled: boolean
 *   payoutsEnabled: boolean
 *   detailsSubmitted: boolean
 *   requirements: {
 *     currentlyDue: string[]
 *     eventuallyDue: string[]
 *     pastDue: string[]
 *     disabled_reason: string | null
 *   }
 *   capabilities: {
 *     cardPayments: string (active, inactive, pending)
 *     transfers: string (active, inactive, pending)
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // For single-tenant MVP, get the default restaurant
    const { data: restaurantData, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'blu-fish-house')
      .single();

    const restaurant = restaurantData as any

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.stripe_account_id) {
      return NextResponse.json({
        success: true,
        onboardingComplete: false,
        accountId: null,
        message: 'No Stripe Connect account created yet',
      });
    }

    // Retrieve Stripe account details
    const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);

    // Check onboarding completion
    const onboardingComplete =
      account.details_submitted === true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true;

    // Update database if onboarding status changed
    if (onboardingComplete !== restaurant.stripe_onboarding_complete) {
      await (supabase
        .from('restaurants') as any)
        .update({
          stripe_onboarding_complete: onboardingComplete,
        })
        .eq('id', restaurant.id);
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      onboardingComplete,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        disabledReason: account.requirements?.disabled_reason || null,
      },
      capabilities: {
        cardPayments: account.capabilities?.card_payments || 'inactive',
        transfers: account.capabilities?.transfers || 'inactive',
      },
      country: account.country,
      email: account.email,
      businessProfile: {
        name: account.business_profile?.name,
        mcc: account.business_profile?.mcc,
      },
    });
  } catch (error: any) {
    console.error('Error fetching Stripe Connect status:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      // Account might have been deleted
      if (error.code === 'resource_missing') {
        // Clear invalid account ID from database
        const { data: restaurantToFix } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', 'blu-fish-house')
          .single();

        const restaurantRecord = restaurantToFix as any

        if (restaurantRecord) {
          await (supabase
            .from('restaurants') as any)
            .update({
              stripe_account_id: null,
              stripe_onboarding_complete: false,
            })
            .eq('id', restaurantRecord.id);
        }

        return NextResponse.json(
          {
            error: 'Stripe Connect account not found',
            message: 'The connected account may have been deleted. Please create a new one.',
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch Stripe Connect status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/connect/status
 *
 * Manually sync Stripe Connect account status to database
 * Useful for forcing a refresh after webhook delays
 *
 * Request body:
 * {
 *   restaurantId?: string (optional for future multi-tenant)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   onboardingComplete: boolean
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // For single-tenant MVP, get the default restaurant
    const { data: restaurantPostData, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'blu-fish-house')
      .single();

    const restaurantPost = restaurantPostData as any

    if (!restaurantPost || !restaurantPost.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      );
    }

    // Retrieve latest account details from Stripe
    const account = await stripe.accounts.retrieve(restaurantPost.stripe_account_id);

    // Check onboarding completion
    const onboardingComplete =
      account.details_submitted === true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true;

    // Update database
    await (supabase
      .from('restaurants') as any)
      .update({
        stripe_onboarding_complete: onboardingComplete,
      })
      .eq('id', restaurantPost.id);

    return NextResponse.json({
      success: true,
      onboardingComplete,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      message: onboardingComplete
        ? 'Stripe Connect account is fully onboarded and active'
        : 'Stripe Connect onboarding is incomplete. Please complete the onboarding process.',
    });
  } catch (error: any) {
    console.error('Error syncing Stripe Connect status:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Stripe Connect status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
