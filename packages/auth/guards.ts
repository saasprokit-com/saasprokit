import type { Subscription } from "@repo/database";
import {
  type PlanName,
  SUBSCRIPTION_STATUS,
  UNLIMITED,
} from "@repo/utils/payment";
import { getCurrentPlan } from "./helpers";
import { comparePlans, getPlanLimits } from "./plans";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  requiredPlan?: PlanName;
  upgradeUrl?: string;
}

export function guardDowngrade(
  subscription: Subscription | null | undefined,
  targetPlan: PlanName,
  currentMemberCount: number,
  currentStorageMB: number
): GuardResult {
  const currentPlan = getCurrentPlan(subscription);
  const direction = comparePlans(currentPlan, targetPlan);

  if (direction !== "downgrade") {
    return {
      allowed: false,
      reason: `${targetPlan} is not a downgrade from ${currentPlan}`,
    };
  }

  if (
    subscription?.status === SUBSCRIPTION_STATUS.PAST_DUE ||
    subscription?.status === SUBSCRIPTION_STATUS.INCOMPLETE
  ) {
    return {
      allowed: false,
      reason:
        "Resolve the outstanding payment on your current plan before changing tiers.",
    };
  }

  const targetLimits = getPlanLimits(targetPlan);

  // Check member limit (skip if unlimited)
  if (
    targetLimits.maxMembers !== UNLIMITED &&
    currentMemberCount > targetLimits.maxMembers
  ) {
    const excess = currentMemberCount - targetLimits.maxMembers;
    return {
      allowed: false,
      reason: `You have ${currentMemberCount} members but the ${targetPlan} plan allows ${targetLimits.maxMembers}. Remove ${excess} member(s) before downgrading.`,
      requiredPlan: currentPlan,
    };
  }

  if (
    targetLimits.maxStorageMB !== UNLIMITED &&
    currentStorageMB > targetLimits.maxStorageMB
  ) {
    const excessMB = currentStorageMB - targetLimits.maxStorageMB;
    return {
      allowed: false,
      reason: `You are using ${currentStorageMB.toFixed(1)}MB of storage but the ${targetPlan} plan allows ${targetLimits.maxStorageMB}MB. Free up ${excessMB.toFixed(1)}MB before downgrading.`,
      requiredPlan: currentPlan,
    };
  }

  return { allowed: true };
}
