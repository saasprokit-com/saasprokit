export const STRIPE_API_VERSION = "2026-06-24.dahlia";

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

export interface PlanLimits {
  advancedAnalytics: boolean;
  maxMembers: number;
  maxStorageMB: number;
  prioritySupport: boolean;
  [key: string]: number | boolean;
}

export const SUBSCRIPTION_STATUS = {
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  PAUSED: "paused",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const ACTIVE_STATUSES = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
] as const;

export const UNLIMITED = -1;

export const LIMITS = {
  FREE: {
    MAX_MEMBERS: 3,
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

const STORAGE_GB_THRESHOLD = 1000;
const FRACTION_DIGITS = 1;

export function formatStorage(mb: number): string {
  if (mb === UNLIMITED) {
    return "Unlimited";
  }
  if (mb >= STORAGE_GB_THRESHOLD) {
    return `${(mb / STORAGE_GB_THRESHOLD).toFixed(FRACTION_DIGITS)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

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

export const CENTS_PER_DOLLAR = 100;

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

export type OrgCreationDenialCode = "max_reached" | "upgrade_required";

export interface OrgCreationCheck {
  allowed: boolean;
  code?: OrgCreationDenialCode;
  reason?: string;
}

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
