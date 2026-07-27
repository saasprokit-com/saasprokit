import type { Subscription } from "@repo/database";
import type { FEATURE_KEYS, PlanName } from "@repo/utils/payment";
import type { PlanConfig } from "./plans";

// The subscription row shape is owned by Prisma (Better Auth's stripe plugin
// writes it). Consumers import `Subscription` straight from `@repo/database`
// rather than a hand-maintained interface + zod schema that can drift.
export type SubscriptionWithPlan = Subscription & {
  planConfig: PlanConfig;
};

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export interface FeatureAccess {
  enabled: boolean;
  feature: FeatureKey;
  limit?: number;
  usage?: number;
}

export interface BillingPortalSession {
  url: string;
}

export interface UpgradeOptions {
  annual?: boolean;
  cancelUrl: string;
  plan: PlanName;
  referenceId?: string;
  seats?: number;
  successUrl: string;
}

export interface CancelOptions {
  referenceId?: string;
  returnUrl?: string;
  subscriptionId?: string;
}

export interface UsageStats {
  members: {
    current: number;
    limit: number;
    percentage: number;
  };
  storage: {
    currentMB: number;
    limitMB: number;
    percentage: number;
  };
}
