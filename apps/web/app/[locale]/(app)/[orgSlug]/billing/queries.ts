import "server-only";

import { getPlanLimits } from "@repo/auth/plans";
import type { UsageStats } from "@repo/auth/types";
import { PLAN_NAMES, type PlanName } from "@repo/utils/payment";
import {
  getOrgSubscription,
  getOrgUsageStats,
} from "@/lib/billing/subscription-queries";

export interface BillingUsageData {
  hasUnlimitedMembers: boolean;
  hasUnlimitedStorage: boolean;
  planName: PlanName;
  usageStats: UsageStats;
}

export async function getBillingUsageData(
  organizationId: string
): Promise<BillingUsageData> {
  const [usageStats, subscription] = await Promise.all([
    getOrgUsageStats(organizationId),
    getOrgSubscription(organizationId),
  ]);

  const planName: PlanName =
    (subscription?.plan as PlanName) || PLAN_NAMES.FREE;
  const limits = getPlanLimits(planName);

  return {
    usageStats,
    planName,
    hasUnlimitedMembers: limits.maxMembers === -1,
    hasUnlimitedStorage: limits.maxStorageMB === -1,
  };
}
