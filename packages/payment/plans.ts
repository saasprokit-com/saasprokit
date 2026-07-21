import { PLANS, type PlanConfig } from "@repo/auth/plans";
import { MONTHS_PER_YEAR } from "@repo/utils/date";
import {
  PLAN_ORDER,
  type PlanLimits,
  type PlanName,
} from "@repo/utils/payment";

// Re-export PLANS + PlanConfig from @repo/auth/plans (single source of truth)
export { PLANS, type PlanConfig } from "@repo/auth/plans";

const PERCENTAGE_MULTIPLIER = 100;

export function getPlanLimits(planName: PlanName): PlanLimits {
  return PLANS[planName].limits;
}

/**
 * Get all plans as an ordered array
 */
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
