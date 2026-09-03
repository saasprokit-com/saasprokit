import type { StripePlan } from "@better-auth/stripe";
import { MONTHS_PER_YEAR } from "@repo/utils/date";
import { PERCENTAGE_MULTIPLIER } from "@repo/utils/number";
import {
  formatStorage,
  LIMITS,
  PLAN_DISPLAY_NAMES,
  PLAN_NAMES,
  PLAN_ORDER,
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
      `Up to ${LIMITS.FREE.MAX_MEMBERS} team members`,
      `Up to ${formatStorage(LIMITS.FREE.MAX_STORAGE_MB)} storage`,
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
      `Up to ${LIMITS.PRO.MAX_MEMBERS} team members`,
      `Up to ${formatStorage(LIMITS.PRO.MAX_STORAGE_MB)} storage`,
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
      `Up to ${LIMITS.ENTERPRISE.MAX_MEMBERS} team members`,
      `Up to ${formatStorage(LIMITS.ENTERPRISE.MAX_STORAGE_MB)} storage`,
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

export function getPlanLimits(planName: PlanName): PlanLimits {
  return PLANS[planName].limits;
}

export function getAllPlans(): PlanConfig[] {
  return PLAN_ORDER.map((name) => PLANS[name]);
}

export function isPlanHigherTier(planA: PlanName, planB: PlanName): boolean {
  const indexA = PLAN_ORDER.indexOf(planA);
  const indexB = PLAN_ORDER.indexOf(planB);
  return indexA > indexB;
}

export function getMonthlyFromAnnual(annualPrice: number): number {
  return (
    Math.round((annualPrice / MONTHS_PER_YEAR) * PERCENTAGE_MULTIPLIER) /
    PERCENTAGE_MULTIPLIER
  );
}

export function getAnnualSavingsPercent(planName: PlanName): number {
  const plan = PLANS[planName];
  if (plan.monthlyPrice === 0) {
    return 0;
  }

  const monthlyTotal = plan.monthlyPrice * MONTHS_PER_YEAR;
  const savings = monthlyTotal - plan.yearlyPrice;
  return Math.round((savings / monthlyTotal) * PERCENTAGE_MULTIPLIER);
}

export function comparePlans(
  currentPlan: PlanName,
  targetPlan: PlanName
): "upgrade" | "downgrade" | "same" {
  if (currentPlan === targetPlan) {
    return "same";
  }
  return isPlanHigherTier(targetPlan, currentPlan) ? "upgrade" : "downgrade";
}
