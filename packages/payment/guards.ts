import { type PlanName, UNLIMITED } from "@repo/utils/payment";
import { getCurrentPlan } from "./helpers";
import { comparePlans, getPlanLimits } from "./plans";
import type { Subscription } from "./types";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  requiredPlan?: PlanName;
  upgradeUrl?: string;
}

/**
 * Guard: Check if downgrade is safe based on current resource usage
 */
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

  // Check storage limit (skip if unlimited)
  if (
    targetLimits.maxStorageMB !== UNLIMITED &&
    currentStorageMB > targetLimits.maxStorageMB
  ) {
    const excessMB = currentStorageMB - targetLimits.maxStorageMB;
    return {
      allowed: false,
      reason: `You are using ${currentStorageMB}MB of storage but the ${targetPlan} plan allows ${targetLimits.maxStorageMB}MB. Free up ${excessMB}MB before downgrading.`,
      requiredPlan: currentPlan,
    };
  }

  return { allowed: true };
}
