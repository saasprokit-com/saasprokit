import type { StripePlan } from "@better-auth/stripe";
import {
  LIMITS,
  PLAN_DISPLAY_NAMES,
  PLAN_NAMES,
  type PlanLimits,
  type PlanName,
  PRICING,
} from "@repo/utils/payment";

/**
 * Single source of truth for a plan in this app.
 *
 * Extends Better Auth's `StripePlan` so any field BA's Stripe plugin
 * recognises (`priceId`, `annualDiscountPriceId`, `seatPriceId`, `freeTrial`,
 * `prorationBehavior`, `lineItems`, ...) can be set here. Adds UI fields
 * (`displayName`, `description`, `monthlyPrice`, `yearlyPrice`, `features`,
 * `highlighted`, `badge`) so the same definition powers the pricing block,
 * the plan cards on /billing, the checkout success card, etc.
 *
 * `name` and `limits` are re-narrowed off StripePlan: BA types them as
 * `string` and `Record<string, unknown>`; we know they're `PlanName` and
 * `PlanLimits` in this codebase, so narrow them back.
 */
export interface PlanConfig extends Omit<StripePlan, "name" | "limits"> {
  name: PlanName;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * Static plan catalog.
 *
 * `priceId` and `annualDiscountPriceId` are intentionally omitted here —
 * those come from environment variables at runtime and are layered in by
 * `buildStripePlans()` before the array is handed to Better Auth.
 */
export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: PLAN_NAMES.FREE,
    displayName: PLAN_DISPLAY_NAMES.free,
    description: "Perfect for getting started",
    monthlyPrice: PRICING.FREE.MONTHLY,
    yearlyPrice: PRICING.FREE.YEARLY,
    limits: {
      maxMembers: LIMITS.FREE.MAX_MEMBERS,
      maxStorageMB: LIMITS.FREE.MAX_STORAGE_MB,
      prioritySupport: false,
      advancedAnalytics: false,
    },
    features: [
      "1 team member",
      "100 MB storage",
      "Basic features",
      "Community support",
    ],
  },

  pro: {
    name: PLAN_NAMES.PRO,
    displayName: PLAN_DISPLAY_NAMES.pro,
    description: "For growing teams",
    monthlyPrice: PRICING.PRO.MONTHLY,
    yearlyPrice: PRICING.PRO.YEARLY,
    limits: {
      maxMembers: LIMITS.PRO.MAX_MEMBERS,
      maxStorageMB: LIMITS.PRO.MAX_STORAGE_MB,
      prioritySupport: true,
      advancedAnalytics: true,
    },
    features: [
      "Up to 10 team members",
      "5 GB storage",
      "Priority support",
      "Advanced analytics",
    ],
    highlighted: true,
    badge: "Most Popular",
  },

  enterprise: {
    name: PLAN_NAMES.ENTERPRISE,
    displayName: PLAN_DISPLAY_NAMES.enterprise,
    description: "For large organizations",
    monthlyPrice: PRICING.ENTERPRISE.MONTHLY,
    yearlyPrice: PRICING.ENTERPRISE.YEARLY,
    limits: {
      maxMembers: LIMITS.ENTERPRISE.MAX_MEMBERS,
      maxStorageMB: LIMITS.ENTERPRISE.MAX_STORAGE_MB,
      prioritySupport: true,
      advancedAnalytics: true,
    },
    features: [
      "Up to 50 team members",
      "50 GB storage",
      "24/7 priority support",
      "Advanced analytics",
    ],
  },
};

/**
 * Environment-provided Stripe price IDs. Each one is optional because local
 * dev may not have Stripe configured at all.
 */
export interface StripePriceIds {
  proMonthly?: string;
  proAnnual?: string;
  enterpriseMonthly?: string;
  enterpriseAnnual?: string;
}

/**
 * Build the BA-consumable plan array by overlaying env-provided Stripe price
 * IDs on top of the static `PLANS` catalog. Only paid plans (Pro, Enterprise)
 * are registered with BA — the Free plan is implicit (no Stripe row).
 */
export function buildStripePlans(prices: StripePriceIds): StripePlan[] {
  return [
    {
      ...PLANS.pro,
      priceId: prices.proMonthly,
      annualDiscountPriceId: prices.proAnnual,
    },
    {
      ...PLANS.enterprise,
      priceId: prices.enterpriseMonthly,
      annualDiscountPriceId: prices.enterpriseAnnual,
    },
  ];
}

/**
 * Resolve a Stripe price ID back to a `PlanName`. Used by webhook handlers
 * to figure out which plan an inbound subscription belongs to.
 */
export function getPlanNameFromPriceId(
  priceId: string,
  prices: StripePriceIds
): PlanName | null {
  if (
    priceId === prices.enterpriseMonthly ||
    priceId === prices.enterpriseAnnual
  ) {
    return PLAN_NAMES.ENTERPRISE;
  }
  if (priceId === prices.proMonthly || priceId === prices.proAnnual) {
    return PLAN_NAMES.PRO;
  }
  return null;
}
