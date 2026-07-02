import type { StripePlan } from "@better-auth/stripe";
import {
  LIMITS,
  PLAN_DISPLAY_NAMES,
  PLAN_NAMES,
  type PlanLimits,
  type PlanName,
  PRICING,
} from "@repo/utils/payment";

export interface PlanConfig extends Omit<StripePlan, "name" | "limits"> {
  badge?: string;
  description: string;
  displayName: string;
  features: string[];
  highlighted?: boolean;
  limits: PlanLimits;
  monthlyPrice: number;
  name: PlanName;
  yearlyPrice: number;
}

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

export interface StripePriceIds {
  enterpriseAnnual?: string;
  enterpriseMonthly?: string;
  proAnnual?: string;
  proMonthly?: string;
}

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
