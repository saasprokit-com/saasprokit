import { MONTHS_PER_YEAR } from "@repo/utils/date";
import { PLAN_ORDER, type PlanConfig, type PlanLimits, type PlanName } from "@repo/utils/payment";

// Re-export PLANS from utils (single source of truth)
export { PLANS } from "@repo/utils/payment";

// Import PLANS for local use in utility functions
import { PLANS } from "@repo/utils/payment";

const PERCENTAGE_MULTIPLIER = 100;

/**
 * Get plan limits by name
 */
export function getPlanLimits(planName: PlanName): PlanLimits {
  return PLANS[planName].limits;
}

/**
 * Get all plans as an ordered array
 */
export function getAllPlans(): PlanConfig[] {
  return PLAN_ORDER.map((name) => PLANS[name]);
}

/**
 * Check if a plan is higher tier than another
 */
export function isPlanHigherTier(planA: PlanName, planB: PlanName): boolean {
  const indexA = PLAN_ORDER.indexOf(planA);
  const indexB = PLAN_ORDER.indexOf(planB);
  return indexA > indexB;
}

/**
 * Calculate monthly price from annual
 */
export function getMonthlyFromAnnual(annualPrice: number): number {
  return (
    Math.round((annualPrice / MONTHS_PER_YEAR) * PERCENTAGE_MULTIPLIER) /
    PERCENTAGE_MULTIPLIER
  );
}

/**
 * Calculate savings percentage when paying annually
 */
export function getAnnualSavingsPercent(planName: PlanName): number {
  const plan = PLANS[planName];
  if (plan.monthlyPrice === 0) {
    return 0;
  }

  const monthlyTotal = plan.monthlyPrice * MONTHS_PER_YEAR;
  const savings = monthlyTotal - plan.yearlyPrice;
  return Math.round((savings / monthlyTotal) * PERCENTAGE_MULTIPLIER);
}

/**
 * Compare two plans and return upgrade/downgrade direction
 */
export function comparePlans(
  currentPlan: PlanName,
  targetPlan: PlanName
): "upgrade" | "downgrade" | "same" {
  if (currentPlan === targetPlan) {
    return "same";
  }
  return isPlanHigherTier(targetPlan, currentPlan) ? "upgrade" : "downgrade";
}

