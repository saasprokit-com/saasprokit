import {
  type FEATURE_KEYS,
  PLAN_NAMES,
  type PlanName,
  type SubscriptionStatus,
} from "@repo/utils/payment";
import { z } from "zod";
import type { PlanConfig } from "./plans";

export interface Subscription {
  cancelAt: Date | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: Date;
  id: string;
  periodEnd: Date | null;
  periodStart: Date | null;
  plan: string;
  referenceId: string;
  seats: number | null;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEnd: Date | null;
  trialStart: Date | null;
  updatedAt: Date;
}

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
  cancelAt: z.date().nullable(),
  seats: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

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
