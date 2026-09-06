"use server";

import { guardDowngrade } from "@repo/auth/guards";
import { isAlreadyCancelingError } from "@repo/auth/helpers";
import { comparePlans } from "@repo/auth/plans";
import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { ORG_AUDIT_ACTIONS } from "@repo/utils/audit";
import {
  BILLING_INTERVALS,
  PLAN_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { headers } from "next/headers";
import { recordAudit } from "@/lib/audit/record";
import { actionError, toActionError } from "@/lib/auth/action-error";
import {
  type ActionResult,
  getServerSession,
  hasOrgPermission,
} from "@/lib/auth/auth";
import {
  getActiveSubscription,
  getOrgMemberCount,
  getOrgStorageUsage,
} from "@/lib/billing/subscription-queries";
import { env } from "@/lib/env";
import {
  type CancelSubscriptionInput,
  type ChangePlanRequest,
  cancelSubscriptionSchema,
  changePlanRequestSchema,
  type OpenBillingPortalInput,
  openBillingPortalSchema,
  type UpgradeSubscriptionInput,
  upgradeSubscriptionSchema,
} from "./schemas";

function buildOrgBase(locale: string, organizationSlug: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/${locale}/${organizationSlug}`;
}

export interface ChangePlanResult {
  action: "cancel" | "changed";
  blockReason?: string;
}

export async function changePlanAction(
  input: ChangePlanRequest
): Promise<ActionResult<ChangePlanResult>> {
  const logger = createRequestLogger({ action: "changePlan" });

  try {
    const validated = changePlanRequestSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const session = await getServerSession();
    if (!session) {
      return actionError("unauthorized");
    }

    const userLogger = logger.child({ userId: session.user.id });

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

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.PLAN_CHANGE,
      actorId: session.user.id,
      changes: {
        billingInterval: validated.billingInterval,
        from: currentPlan,
        scheduledAtPeriodEnd: true,
        to: validated.targetPlan,
      },
      organizationId: validated.organizationId,
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

export async function upgradeSubscriptionAction(
  input: UpgradeSubscriptionInput
): Promise<ActionResult<{ url?: string }>> {
  const logger = createRequestLogger({ action: "upgradeSubscription" });

  try {
    const validated = upgradeSubscriptionSchema.parse(input);
    const orgBase = buildOrgBase(validated.locale, validated.organizationSlug);

    const result = await auth.api.upgradeSubscription({
      headers: await headers(),
      body: {
        plan: validated.planName,
        annual: validated.billingInterval === BILLING_INTERVALS.YEARLY,
        referenceId: validated.organizationId,
        successUrl: `${orgBase}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${orgBase}/checkout/canceled`,
        returnUrl: `${orgBase}/billing`,
      },
    });

    return { success: true, data: { url: result?.url ?? undefined } };
  } catch (error) {
    return toActionError(error, {
      fallback: "startCheckout",
      logger,
    });
  }
}

export async function openBillingPortalAction(
  input: OpenBillingPortalInput
): Promise<ActionResult<{ url?: string }>> {
  const logger = createRequestLogger({ action: "openBillingPortal" });

  try {
    const validated = openBillingPortalSchema.parse(input);
    const orgBase = buildOrgBase(validated.locale, validated.organizationSlug);

    const result = await auth.api.createBillingPortal({
      headers: await headers(),
      body: {
        referenceId: validated.organizationId,
        returnUrl: `${orgBase}/billing`,
      },
    });

    return { success: true, data: { url: result?.url ?? undefined } };
  } catch (error) {
    return toActionError(error, {
      fallback: "openBillingPortal",
      logger,
    });
  }
}

export async function cancelSubscriptionAction(
  input: CancelSubscriptionInput
): Promise<ActionResult<{ url?: string }>> {
  const logger = createRequestLogger({ action: "cancelSubscription" });

  try {
    const validated = cancelSubscriptionSchema.parse(input);
    const orgBase = buildOrgBase(validated.locale, validated.organizationSlug);

    const result = await auth.api.cancelSubscription({
      headers: await headers(),
      body: {
        referenceId: validated.organizationId,
        ...(validated.subscriptionId && {
          subscriptionId: validated.subscriptionId,
        }),
        returnUrl: `${orgBase}/billing`,
      },
    });

    return { success: true, data: { url: result?.url ?? undefined } };
  } catch (error) {
    if (error instanceof Error && isAlreadyCancelingError(error.message)) {
      return { success: true };
    }
    return toActionError(error, {
      fallback: "cancelSubscription",
      logger,
    });
  }
}
