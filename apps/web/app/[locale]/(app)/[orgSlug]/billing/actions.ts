"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { guardDowngrade } from "@repo/payment/guards";
import { comparePlans } from "@repo/payment/plans";
import {
  BILLING_INTERVALS,
  PLAN_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type ActionResult, checkOrgPermission } from "@/lib/auth/auth";
import {
  getActiveSubscription,
  getOrgMemberCount,
  getOrgStorageUsage,
} from "@/lib/billing/subscription-queries";
import { type ChangePlanRequest, changePlanRequestSchema } from "./schemas";

export interface ChangePlanResult {
  action: "cancel" | "changed";
  blockReason?: string;
}

export async function changePlanAction(
  input: ChangePlanRequest,
  _prevState: ActionResult<ChangePlanResult> | null,
  _formData: FormData
): Promise<ActionResult<ChangePlanResult>> {
  const logger = createRequestLogger({ action: "changePlan" });

  try {
    const validated = changePlanRequestSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const userLogger = logger.child({ userId: caller.userId });

    const currentSubscription = await getActiveSubscription(
      validated.organizationId
    );
    if (!currentSubscription) {
      return actionError("changePlan");
    }

    const currentPlan = (currentSubscription.plan ||
      PLAN_NAMES.FREE) as PlanName;
    const direction = comparePlans(currentPlan, validated.targetPlan);

    if (direction !== "downgrade") {
      userLogger.warn(
        { currentPlan, targetPlan: validated.targetPlan, direction },
        "Change plan rejected — not a downgrade"
      );
      return actionError("changePlan");
    }

    const [memberCount, storageMB] = await Promise.all([
      getOrgMemberCount(validated.organizationId),
      getOrgStorageUsage(validated.organizationId),
    ]);

    const guard = guardDowngrade(
      currentSubscription,
      validated.targetPlan,
      memberCount,
      storageMB
    );

    if (!guard.allowed) {
      return {
        success: true,
        data: { action: "changed", blockReason: guard.reason },
      };
    }

    if (validated.targetPlan === PLAN_NAMES.FREE) {
      userLogger.info(
        { currentPlan, targetPlan: validated.targetPlan },
        "Downgrade to free — client should use cancel flow"
      );
      return { success: true, data: { action: "cancel" } };
    }

    await auth.api.upgradeSubscription({
      headers: await headers(),
      body: {
        plan: validated.targetPlan,
        annual: validated.billingInterval === BILLING_INTERVALS.YEARLY,
        referenceId: validated.organizationId,
        scheduleAtPeriodEnd: true,
      },
    });

    userLogger.info(
      {
        currentPlan,
        targetPlan: validated.targetPlan,
        billingInterval: validated.billingInterval,
      },
      "Plan downgrade scheduled at period end"
    );

    return { success: true, data: { action: "changed" } };
  } catch (error) {
    return toActionError(error, { fallback: "changePlan", logger });
  }
}
