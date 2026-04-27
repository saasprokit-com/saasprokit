export const STRIPE_API_VERSION = "2025-11-17.clover";

export const PLAN_NAMES = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type PlanName = (typeof PLAN_NAMES)[keyof typeof PLAN_NAMES];

export const BILLING_INTERVALS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export type BillingInterval =
  (typeof BILLING_INTERVALS)[keyof typeof BILLING_INTERVALS];

export type PlanLimits = {
  maxMembers: number;
  maxStorageMB: number;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
};

export type PlanConfig = {
  name: PlanName;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
  badge?: string;
};

export const SUBSCRIPTION_STATUS = {
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  PAUSED: "paused",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const ACTIVE_STATUSES = [SUBSCRIPTION_STATUS.ACTIVE] as const;

export const UNLIMITED = -1;

export const LIMITS = {
  FREE: {
    MAX_MEMBERS: 1,
    MAX_STORAGE_MB: 100, // 100 MB
  },
  PRO: {
    MAX_MEMBERS: 10,
    MAX_STORAGE_MB: 5000, // 5 GB
  },
  ENTERPRISE: {
    MAX_MEMBERS: 50,
    MAX_STORAGE_MB: 50_000, // 50 GB
  },
} as const;

export const PLAN_ORDER: PlanName[] = [
  PLAN_NAMES.FREE,
  PLAN_NAMES.PRO,
  PLAN_NAMES.ENTERPRISE,
];

export const PLAN_DISPLAY_NAMES: Record<PlanName, string> = {
  [PLAN_NAMES.FREE]: "Free",
  [PLAN_NAMES.PRO]: "Pro",
  [PLAN_NAMES.ENTERPRISE]: "Enterprise",
};

export const FEATURE_KEYS = {
  PRIORITY_SUPPORT: "priority_support",
  ADVANCED_ANALYTICS: "advanced_analytics",
} as const;

export const PRICING = {
  FREE: {
    MONTHLY: 0,
    YEARLY: 0,
  },
  PRO: {
    MONTHLY: 19, // $19/month
    YEARLY: 190, // $190/year (save ~17%)
  },
  ENTERPRISE: {
    MONTHLY: 49, // $49/month
    YEARLY: 490, // $490/year (save ~17%)
  },
} as const;

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

export type StripePriceIds = {
  proMonthly?: string;
  proAnnual?: string;
  enterpriseMonthly?: string;
  enterpriseAnnual?: string;
};

export const getStripePriceMap = (prices: StripePriceIds) => ({
  pro_monthly: prices.proMonthly ?? "",
  pro_yearly: prices.proAnnual ?? "",
  enterprise_monthly: prices.enterpriseMonthly ?? "",
  enterprise_yearly: prices.enterpriseAnnual ?? "",
});

export type StripePriceKey = keyof ReturnType<typeof getStripePriceMap>;

/**
 * Resolve a Stripe price ID to a plan name.
 * Used by webhook handlers and BA plan resolution.
 */
export function getPlanNameFromPriceId(
  priceId: string,
  prices: StripePriceIds
): PlanName | null {
  const map = getStripePriceMap(prices);
  if (priceId === map.enterprise_monthly || priceId === map.enterprise_yearly) {
    return "enterprise";
  }
  if (priceId === map.pro_monthly || priceId === map.pro_yearly) {
    return "pro";
  }
  return null;
}

export type OrgCreationDenialCode = "max_reached" | "upgrade_required";

export type OrgCreationCheck = {
  allowed: boolean;
  reason?: string;
  code?: OrgCreationDenialCode;
};

/**
 * Pure business-logic check for org creation eligibility.
 * Both auth plugin callback and billing UI call this to stay in sync.
 */
export function checkOrgCreationEligibility(
  ownedOrgCount: number,
  freePlanCount: number,
  maxOrgsPerUser: number
): OrgCreationCheck {
  if (ownedOrgCount === 0) {
    return { allowed: true };
  }

  if (ownedOrgCount >= maxOrgsPerUser) {
    return {
      allowed: false,
      code: "max_reached",
      reason: `You have reached the maximum of ${maxOrgsPerUser} organizations.`,
    };
  }

  if (freePlanCount >= 1) {
    return {
      allowed: false,
      code: "upgrade_required",
      reason:
        "You already have a free organization. Upgrade it to a paid plan to create another organization.",
    };
  }

  return { allowed: true };
}
