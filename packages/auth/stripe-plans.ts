import type { StripePlan } from "@better-auth/stripe";
import {
  getStripePriceMap,
  PLAN_NAMES,
  PLANS,
  type StripePriceIds,
} from "@repo/utils/payment";

/**
 * Build the Better Auth Stripe `plans` array from environment-supplied price
 * IDs and the canonical plan catalog (`PLANS`).
 *
 * Kept here rather than in `@repo/utils/payment` so the utils package doesn't
 * have to depend on `@better-auth/stripe` types. The catalog (`PLANS`) is the
 * UI source of truth — display names, monthly/yearly prices, feature lists.
 * This function derives the Stripe-side registry from that catalog, plus the
 * env-supplied price IDs that can't be statically known at compile time.
 */
export function buildStripePlans(prices: StripePriceIds): StripePlan[] {
  const priceMap = getStripePriceMap(prices);

  return [
    {
      name: PLAN_NAMES.PRO,
      priceId: priceMap.pro_monthly,
      annualDiscountPriceId: priceMap.pro_yearly,
      limits: {
        maxMembers: PLANS.pro.limits.maxMembers,
        maxStorageMB: PLANS.pro.limits.maxStorageMB,
      },
    },
    {
      name: PLAN_NAMES.ENTERPRISE,
      priceId: priceMap.enterprise_monthly,
      annualDiscountPriceId: priceMap.enterprise_yearly,
      limits: {
        maxMembers: PLANS.enterprise.limits.maxMembers,
        maxStorageMB: PLANS.enterprise.limits.maxStorageMB,
      },
    },
  ];
}
