import { getCurrentPlan } from "@repo/auth/helpers";
import { getAllPlans, getAnnualSavingsPercent } from "@repo/auth/plans";
import type { ActionErrorMessages } from "@repo/internationalization";
import { PLAN_NAMES } from "@repo/utils/payment";
import { getActiveSubscription } from "@/lib/billing/subscription-queries";
import { ChangePlanView } from "./change-plan-view";

interface ChangePlanProps {
  errors: ActionErrorMessages;
  organizationId: string;
}

export async function ChangePlan({ errors, organizationId }: ChangePlanProps) {
  const subscription = await getActiveSubscription(organizationId);

  return (
    <ChangePlanView
      currentPlan={getCurrentPlan(subscription)}
      errors={errors}
      organizationId={organizationId}
      plans={getAllPlans()}
      savingsPercent={getAnnualSavingsPercent(PLAN_NAMES.PRO)}
      subscription={subscription}
    />
  );
}
