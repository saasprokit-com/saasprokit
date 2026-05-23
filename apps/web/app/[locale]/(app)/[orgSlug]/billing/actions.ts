"use server";

import { requireStripeClient } from "@repo/auth/stripe-client";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { guardDowngrade } from "@repo/payment/guards";
import { comparePlans } from "@repo/payment/plans";
import {
  getStripePriceMap,
  PLAN_NAMES,
  type PlanName,
  type StripePriceIds,
  type StripePriceKey,
} from "@repo/utils/payment";
import { redirect } from "next/navigation";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type ActionResult, checkOrgPermission } from "@/lib/auth/auth";
import {
  getActiveSubscription,
  getOrgMemberCount,
  getOrgStorageUsage,
} from "@/lib/billing/subscription-queries";
import { env } from "@/lib/env";
import {
  type BillingPortalRequest,
  billingPortalRequestSchema,
  type ChangePlanRequest,
  type CheckoutRequest,
  changePlanRequestSchema,
  checkoutRequestSchema,
} from "./schemas";

async function resolveStripeCustomerId(
  userId: string,
  organization: { id: string; name: string }
): Promise<{ customerId: string; created: boolean } | null> {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!user) {
    return null;
  }

  if (user.stripeCustomerId) {
    return { customerId: user.stripeCustomerId, created: false };
  }

  const stripeCustomer = await requireStripeClient().customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId,
      organizationId: organization.id,
      organizationName: organization.name,
    },
  });

  await database.user.update({
    where: { id: userId },
    data: { stripeCustomerId: stripeCustomer.id },
  });

  return { customerId: stripeCustomer.id, created: true };
}

export async function startCheckoutAction(
  input: CheckoutRequest,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "startCheckout" });

  let sessionUrl: string;

  try {
    const validated = checkoutRequestSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const userId = caller.userId;
    const userLogger = logger.child({ userId });

    const organization = await database.organization.findUnique({
      where: { id: validated.organizationId },
      select: { slug: true, name: true },
    });

    if (!organization) {
      return actionError("orgNotFound");
    }

    const customerResult = await resolveStripeCustomerId(userId, {
      id: validated.organizationId,
      name: organization.name,
    });

    if (!customerResult) {
      return actionError("notFound");
    }

    if (customerResult.created) {
      userLogger.info(
        { customerId: customerResult.customerId },
        "Stripe customer created at checkout"
      );
    }

    const stripePrices: StripePriceIds = {
      proMonthly: env.STRIPE_PRO_PRICE_ID_MONTHLY,
      proAnnual: env.STRIPE_PRO_PRICE_ID_ANNUAL,
      enterpriseMonthly: env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
      enterpriseAnnual: env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
    };
    const priceMap = getStripePriceMap(stripePrices);
    const priceKey =
      `${validated.planName}_${validated.billingInterval}` as StripePriceKey;
    const priceId = priceMap[priceKey];

    if (!priceId) {
      userLogger.error(
        {
          planName: validated.planName,
          billingInterval: validated.billingInterval,
        },
        "Price ID not configured for plan/interval combination"
      );
      return actionError("startCheckout");
    }

    const checkoutSession =
      await requireStripeClient().checkout.sessions.create({
        customer: customerResult.customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/${validated.locale}/${organization.slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${validated.locale}/${organization.slug}/checkout/canceled`,
        metadata: {
          organizationId: validated.organizationId,
          organizationSlug: organization.slug,
          organizationName: organization.name,
          userId,
          planName: validated.planName,
          billingInterval: validated.billingInterval,
        },
        subscription_data: {
          metadata: {
            organizationId: validated.organizationId,
            organizationSlug: organization.slug,
            planName: validated.planName,
            billingInterval: validated.billingInterval,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
      });

    userLogger.info(
      {
        sessionId: checkoutSession.id,
        planName: validated.planName,
        billingInterval: validated.billingInterval,
      },
      "Checkout session created successfully"
    );

    if (!checkoutSession.url) {
      userLogger.error(
        { sessionId: checkoutSession.id },
        "Stripe returned checkout session without URL"
      );
      return actionError("startCheckout");
    }

    sessionUrl = checkoutSession.url;
  } catch (error) {
    return toActionError(error, { fallback: "startCheckout", logger });
  }

  redirect(sessionUrl);
}

export async function openBillingPortalAction(
  input: BillingPortalRequest,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "openBillingPortal" });

  let portalUrl: string;

  try {
    const validated = billingPortalRequestSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const userId = caller.userId;
    const userLogger = logger.child({ userId });

    const sub = await database.subscription.findFirst({
      where: { referenceId: validated.organizationId },
      select: { stripeCustomerId: true },
    });

    if (!sub?.stripeCustomerId) {
      userLogger.error(
        { organizationId: validated.organizationId },
        "No Stripe customer found for organization"
      );
      return actionError("openBillingPortal");
    }

    const portalSession =
      await requireStripeClient().billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${env.NEXT_PUBLIC_APP_URL}/${validated.locale}/${validated.organizationSlug}/billing`,
      });

    userLogger.info(
      { portalSessionId: portalSession.id },
      "Billing portal session created"
    );

    portalUrl = portalSession.url;
  } catch (error) {
    return toActionError(error, { fallback: "openBillingPortal", logger });
  }

  redirect(portalUrl);
}

// =============================================================================
// Change Plan (Downgrade)
// =============================================================================

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

    const userId = caller.userId;
    const userLogger = logger.child({ userId });

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

    if (!currentSubscription.stripeSubscriptionId) {
      userLogger.error(
        { organizationId: validated.organizationId },
        "No Stripe subscription found"
      );
      return actionError("changePlan");
    }

    const stripePrices: StripePriceIds = {
      proMonthly: env.STRIPE_PRO_PRICE_ID_MONTHLY,
      proAnnual: env.STRIPE_PRO_PRICE_ID_ANNUAL,
      enterpriseMonthly: env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
      enterpriseAnnual: env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
    };
    const priceMap = getStripePriceMap(stripePrices);
    const priceKey =
      `${validated.targetPlan}_${validated.billingInterval}` as StripePriceKey;
    const priceId = priceMap[priceKey];

    if (!priceId) {
      userLogger.error(
        {
          targetPlan: validated.targetPlan,
          billingInterval: validated.billingInterval,
        },
        "Price ID not configured for plan/interval"
      );
      return actionError("changePlan");
    }

    const stripeSub = await requireStripeClient().subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    );

    const currentItem = stripeSub.items.data[0];
    if (!currentItem) {
      userLogger.error(
        { stripeSubscriptionId: currentSubscription.stripeSubscriptionId },
        "No subscription items found"
      );
      return actionError("changePlan");
    }

    const previousPriceId = currentItem.price.id;

    await requireStripeClient().subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: "create_prorations",
        metadata: {
          ...stripeSub.metadata,
          planName: validated.targetPlan,
          billingInterval: validated.billingInterval,
        },
      }
    );

    try {
      await database.subscription.update({
        where: { id: currentSubscription.id },
        data: { plan: validated.targetPlan },
      });
    } catch (dbError) {
      userLogger.error(
        {
          err: dbError instanceof Error ? dbError : new Error(String(dbError)),
        },
        "DB update failed after Stripe update — rolling back Stripe"
      );
      await requireStripeClient().subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{ id: currentItem.id, price: previousPriceId }],
          proration_behavior: "none",
          metadata: stripeSub.metadata,
        }
      );
      throw dbError;
    }

    userLogger.info(
      {
        currentPlan,
        targetPlan: validated.targetPlan,
        billingInterval: validated.billingInterval,
      },
      "Plan downgraded successfully"
    );

    return { success: true, data: { action: "changed" } };
  } catch (error) {
    return toActionError(error, { fallback: "changePlan", logger });
  }
}
