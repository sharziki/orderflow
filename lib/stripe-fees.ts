/**
 * Stripe Connect Fee Calculation Utilities
 *
 * Handles all fee calculations for the marketplace payment model:
 * - Platform fee (3% of subtotal)
 * - Restaurant payout (total - platform fee)
 * - Stripe processing fees (2.9% + $0.30)
 */

export interface FeeBreakdown {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  platformFee: number;
  stripeFee: number;
  restaurantPayout: number;
  total: number;
}

export interface OrderFeeCalculation {
  platformFeePercent: number; // e.g., 0.03 for 3%
  subtotal: number; // Items total before tax, delivery, fees
  tax: number;
  deliveryFee: number;
}

/**
 * Calculate platform fee based on subtotal
 * Platform fee is calculated on subtotal ONLY (not tax, not delivery, not Stripe fees)
 *
 * @param subtotal - Order subtotal (items total)
 * @param platformFeePercent - Platform fee percentage (default 0.03 = 3%)
 * @returns Platform fee in dollars (rounded to 2 decimals)
 */
export function calculatePlatformFee(
  subtotal: number,
  platformFeePercent: number = 0.03
): number {
  const fee = subtotal * platformFeePercent;
  return Math.round(fee * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate Stripe processing fee
 * Stripe charges 2.9% + $0.30 on the total transaction amount
 *
 * @param total - Total transaction amount (subtotal + tax + delivery + platform fee)
 * @returns Stripe processing fee in dollars (rounded to 2 decimals)
 */
export function calculateStripeFee(total: number): number {
  const stripeFeePercent = 0.029; // 2.9%
  const stripeFixedFee = 0.30; // $0.30
  const fee = (total * stripeFeePercent) + stripeFixedFee;
  return Math.round(fee * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate restaurant payout
 * Restaurant receives: Total - Platform Fee - Stripe Fee
 *
 * Note: In Stripe Connect with separate charges and transfers,
 * we charge the customer the full amount, then transfer (total - platform fee) to restaurant.
 * Stripe deducts their processing fee from the restaurant's transfer.
 *
 * @param total - Total transaction amount
 * @param platformFee - Platform fee to keep
 * @returns Restaurant payout in dollars (rounded to 2 decimals)
 */
export function calculateRestaurantPayout(
  total: number,
  platformFee: number
): number {
  const payout = total - platformFee;
  return Math.round(payout * 100) / 100; // Round to 2 decimals
}

/**
 * Split payment across platform and restaurant
 * Returns complete breakdown of all fees and payouts
 *
 * @param params - Order fee calculation parameters
 * @returns Complete fee breakdown
 *
 * @example
 * const breakdown = splitPayment({
 *   platformFeePercent: 0.03,
 *   subtotal: 100.00,
 *   tax: 10.25,
 *   deliveryFee: 5.00
 * });
 * // Returns:
 * // {
 * //   subtotal: 100.00,
 * //   tax: 10.25,
 * //   deliveryFee: 5.00,
 * //   platformFee: 3.00,        // 3% of subtotal
 * //   stripeFee: 3.72,          // 2.9% + $0.30 of total
 * //   restaurantPayout: 115.25, // total - platformFee
 * //   total: 118.25             // subtotal + tax + delivery + platformFee
 * // }
 */
export function splitPayment(params: OrderFeeCalculation): FeeBreakdown {
  const { platformFeePercent, subtotal, tax, deliveryFee } = params;

  // Step 1: Calculate platform fee (3% of subtotal only)
  const platformFee = calculatePlatformFee(subtotal, platformFeePercent);

  // Step 2: Calculate total customer pays (subtotal + tax + delivery + platform fee)
  const total = subtotal + tax + deliveryFee + platformFee;

  // Step 3: Calculate Stripe processing fee (2.9% + $0.30 of total)
  const stripeFee = calculateStripeFee(total);

  // Step 4: Calculate restaurant payout (total - platform fee)
  // Note: Stripe deducts their processing fee from the transfer to restaurant
  const restaurantPayout = calculateRestaurantPayout(total, platformFee);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    platformFee,
    stripeFee,
    restaurantPayout,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Calculate platform fee in cents for Stripe API
 * Stripe API requires amounts in cents (smallest currency unit)
 *
 * @param subtotal - Order subtotal in dollars
 * @param platformFeePercent - Platform fee percentage (default 0.03 = 3%)
 * @returns Platform fee in cents (integer)
 */
export function calculatePlatformFeeInCents(
  subtotal: number,
  platformFeePercent: number = 0.03
): number {
  const feeInDollars = subtotal * platformFeePercent;
  return Math.round(feeInDollars * 100); // Convert to cents and round
}

/**
 * Validate fee calculation parameters
 * Ensures all amounts are valid before processing
 *
 * @param params - Order fee calculation parameters
 * @throws Error if any parameter is invalid
 */
export function validateFeeCalculation(params: OrderFeeCalculation): void {
  const { subtotal, tax, deliveryFee, platformFeePercent } = params;

  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }

  if (tax < 0) {
    throw new Error('Tax cannot be negative');
  }

  if (deliveryFee < 0) {
    throw new Error('Delivery fee cannot be negative');
  }

  if (platformFeePercent < 0 || platformFeePercent > 1) {
    throw new Error('Platform fee percent must be between 0 and 1');
  }

  // Prevent unreasonably high platform fees (safety check)
  if (platformFeePercent > 0.5) {
    throw new Error('Platform fee percent cannot exceed 50%');
  }
}

/**
 * Format fee for display to customers
 * Returns fee as currency string with percentage label
 *
 * @param fee - Fee amount in dollars
 * @param percent - Fee percentage (e.g., 0.03 for 3%)
 * @returns Formatted string (e.g., "$3.00 (3%)")
 */
export function formatFeeDisplay(fee: number, percent: number): string {
  const percentDisplay = Math.round(percent * 100);
  return `$${fee.toFixed(2)} (${percentDisplay}%)`;
}

/**
 * Calculate total amount customer pays
 * Helper function for quick total calculation
 *
 * @param subtotal - Items total
 * @param tax - Tax amount
 * @param deliveryFee - Delivery fee
 * @param platformFee - Platform service fee
 * @returns Total amount customer pays
 */
export function calculateCustomerTotal(
  subtotal: number,
  tax: number,
  deliveryFee: number,
  platformFee: number
): number {
  const total = subtotal + tax + deliveryFee + platformFee;
  return Math.round(total * 100) / 100;
}
