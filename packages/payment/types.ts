import {
  type FEATURE_KEYS,
  PLAN_NAMES,
  type PlanConfig,
  type PlanName,
  type SubscriptionStatus,
} from "@repo/utils/payment";
import { z } from "zod";

export type Subscription = {
  id: string;
  plan: string;
  referenceId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  seats: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// Runtime validation schema for Subscription data from database
export const SubscriptionSchema = z.object({
  id: z.string(),
  plan: z.enum([PLAN_NAMES.FREE, PLAN_NAMES.PRO, PLAN_NAMES.ENTERPRISE]),
  referenceId: z.string(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  status: z.string().nullable(),
  periodStart: z.date().nullable(),
  periodEnd: z.date().nullable(),
  trialStart: z.date().nullable(),
  trialEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean().nullable(),
  seats: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubscriptionWithPlan = Subscription & {
  planConfig: PlanConfig;
};

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export type FeatureAccess = {
  feature: FeatureKey;
  enabled: boolean;
  limit?: number;
  usage?: number;
};

export type BillingPortalSession = {
  url: string;
};

export type UpgradeOptions = {
  plan: PlanName;
  annual?: boolean;
  referenceId?: string;
  successUrl: string;
  cancelUrl: string;
  seats?: number;
};

export type CancelOptions = {
  subscriptionId?: string;
  referenceId?: string;
  returnUrl?: string;
};

export type UsageStats = {
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
};
