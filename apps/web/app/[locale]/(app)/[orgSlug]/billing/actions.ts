"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { guardDowngrade } from "@repo/payment/guards";
import { isAlreadyCancelingError } from "@repo/payment/helpers";
import { comparePlans } from "@repo/payment/plans";
import {
  BILLING_INTERVALS,
  PLAN_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { headers } from "next/headers";
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

/** Absolute origin/{locale}/{orgSlug} base for Stripe return URLs (no `window` on the server). */
function buildOrgBase(locale: string, organizationSlug: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/${locale}/${organizationSlug}`;
}

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

/**
 * Start an upgrade (free→paid or paid→paid) via Better Auth's Stripe plugin.
 *
 * No `hasOrgPermission` pre-check: `upgradeSubscription` runs its own
 * `authorizeReference` (owner/admin, not suspended) — a pre-check would be
 * redundant and weaker. Returns the Stripe Checkout / confirm URL for the client
 * to redirect to; for a new subscription that's the hosted Checkout page.
 */
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
        // free→paid goes through Stripe Checkout (uses success/cancel URLs).
        successUrl: `${orgBase}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${orgBase}/checkout/canceled`,
        // paid→paid updates the existing subscription via a Stripe-hosted confirm
        // flow and returns here afterward — without this it falls back to "/".
        returnUrl: `${orgBase}/billing`,
      },
    });

    return { success: true, data: { url: result?.url ?? undefined } };
  } catch (error) {
    return toActionError(error, {
      fallback: "startCheckout",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Open the Stripe customer portal. Returns the portal URL for the client to
 * redirect to. `createBillingPortal` authorizes the caller itself.
 */
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
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Cancel the org's subscription. `cancelSubscription` returns a Stripe portal
 * URL for the confirmation flow (client redirects to it). The benign
 * "already scheduled to cancel" error is treated as success so the UI settles.
 */
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
    // Stripe already has the cancellation scheduled — local state had drifted.
    // Surface as success so the UI reloads and settles (mirrors prior behavior).
    if (error instanceof Error && isAlreadyCancelingError(error.message)) {
      return { success: true };
    }
    return toActionError(error, {
      fallback: "cancelSubscription",
      baFallback: "unknownError",
      logger,
    });
  }
}
