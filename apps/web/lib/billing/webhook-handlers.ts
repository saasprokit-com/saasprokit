import "server-only";

import { ORG_ROLES } from "@repo/auth/permissions";
import { database } from "@repo/database";
import {
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionDowngradedEmail,
  sendSubscriptionRenewedEmail,
  sendSubscriptionStartedEmail,
  sendSubscriptionUpgradedEmail,
} from "@repo/email";
import { createRequestLogger } from "@repo/logger/server";
import { MILLISECONDS_PER_SECOND } from "@repo/utils/date";
import {
  BILLING_INTERVALS,
  getPlanNameFromPriceId,
  PLAN_DISPLAY_NAMES,
  PLAN_ORDER,
  type StripePriceIds,
} from "@repo/utils/payment";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { STRIPE_PRICES_CACHE_TAG } from "@/lib/billing/prices";
import {
  ALLOWED_STRIPE_EVENT_TYPES,
  getStripeClient,
} from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import {
  validateStripeCheckoutSessionMetadata,
  validateStripeSubscriptionMetadata,
} from "@/lib/validation/organization-metadata-schema";

const CENTS_PER_DOLLAR = 100;

const logger = createRequestLogger({
  endpoint: "/api/stripe/webhook",
  method: "POST",
});

// Stripe client is provided by getStripeClient() from @/lib/billing/stripe

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const metadata = session.metadata;

  if (!(metadata?.userId && metadata?.organizationId)) {
    logger.warn(
      { sessionId: session.id },
      "Missing required metadata (userId or organizationId)"
    );
    return;
  }

  // CRITICAL: Validate metadata schema to ensure type safety
  try {
    validateStripeCheckoutSessionMetadata(metadata);
  } catch (error) {
    logger.warn(
      {
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Invalid checkout session metadata schema"
    );
    return;
  }

  // CRITICAL: Validate referenced IDs exist before processing
  const [user, organization] = await Promise.all([
    database.user.findUnique({
      where: { id: metadata.userId },
      select: { email: true, name: true },
    }),
    database.organization.findUnique({
      where: { id: metadata.organizationId },
      select: { id: true },
    }),
  ]);

  if (!user?.email) {
    logger.warn(
      { userId: metadata.userId, sessionId: session.id },
      "User not found for subscription email"
    );
    return;
  }

  if (!organization) {
    logger.warn(
      { organizationId: metadata.organizationId, sessionId: session.id },
      "Organization not found for subscription email"
    );
    return;
  }

  const orgSlug = metadata.organizationSlug as string | undefined;
  const dashboardPath = orgSlug ? `/${orgSlug}/billing` : "/";

  const emailResult = await Promise.allSettled([
    sendSubscriptionStartedEmail({
      email: user.email,
      userName: user.name || undefined,
      planName: metadata.planName || "Pro",
      billingInterval:
        metadata.billingInterval === BILLING_INTERVALS.YEARLY
          ? "Annually"
          : "Monthly",
      dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}${dashboardPath}`,
    }),
  ]);

  const failed = emailResult.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    logger.error(
      {
        userId: metadata.userId,
        organizationId: metadata.organizationId,
        errors: failed.map((r) => (r.status === "rejected" ? r.reason : null)),
      },
      "Failed to send subscription started email"
    );
  } else {
    logger.info(
      {
        userId: metadata.userId,
        organizationId: metadata.organizationId,
      },
      "Sent subscription started email"
    );
  }
}

/**
 * Extract previous plan name from subscription's previous items
 * Maps price IDs to plan names (enterprise > pro > free)
 */
function extractPreviousPlanName(
  previousAttributes: Record<string, unknown>
): string {
  const previousItems = previousAttributes.items as unknown[];
  if (!Array.isArray(previousItems) || previousItems.length === 0) {
    return "Unknown";
  }

  const previousItem = previousItems[0] as Record<string, unknown> | undefined;
  const previousPriceId = (
    previousItem?.price as Record<string, unknown> | undefined
  )?.id as string | undefined;

  if (!previousPriceId) {
    return "Unknown";
  }

  const stripePrices: StripePriceIds = {
    proMonthly: env.STRIPE_PRO_PRICE_ID_MONTHLY,
    proAnnual: env.STRIPE_PRO_PRICE_ID_ANNUAL,
    enterpriseMonthly: env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
    enterpriseAnnual: env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
  };
  const planName = getPlanNameFromPriceId(previousPriceId, stripePrices);
  return planName ? PLAN_DISPLAY_NAMES[planName] : "Unknown";
}

/**
 * Validate subscription update preconditions
 * Returns null if valid, or early return reason if invalid
 */
async function validateSubscriptionUpdatePreconditions(
  subscription: Stripe.Subscription,
  previousAttributes: Record<string, unknown>
): Promise<{
  valid: boolean;
  organization?: { id: string };
  member?: { user: { email: string; name: string | null } };
  metadata?: Record<string, unknown>;
}> {
  const metadata = subscription.metadata;

  if (
    !(
      previousAttributes?.items &&
      metadata?.organizationId &&
      metadata?.planName
    )
  ) {
    logger.warn(
      { subscriptionId: subscription.id },
      "Missing required metadata or previous attributes"
    );
    return { valid: false };
  }

  // CRITICAL: Validate metadata schema to ensure type safety
  try {
    validateStripeSubscriptionMetadata(metadata);
  } catch (error) {
    logger.warn(
      {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Invalid subscription metadata schema"
    );
    return { valid: false };
  }

  // CRITICAL: Validate organization exists before querying members
  const organization = await database.organization.findUnique({
    where: { id: metadata.organizationId as string },
    select: { id: true },
  });

  if (!organization) {
    logger.warn(
      {
        organizationId: metadata.organizationId,
        subscriptionId: subscription.id,
      },
      "Organization not found for subscription upgrade"
    );
    return { valid: false };
  }

  const member = await database.member.findFirst({
    where: {
      organizationId: metadata.organizationId as string,
      role: ORG_ROLES.OWNER,
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  if (!member?.user.email) {
    logger.warn(
      { organizationId: metadata.organizationId },
      "Organization owner email not found for upgrade email"
    );
    return { valid: false };
  }

  return { valid: true, organization, member, metadata };
}

async function handleCustomerSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes: Record<string, unknown>
): Promise<void> {
  const preconditions = await validateSubscriptionUpdatePreconditions(
    subscription,
    previousAttributes
  );

  if (
    !(preconditions.valid && preconditions.member && preconditions.metadata)
  ) {
    return;
  }

  const previousPlanName = extractPreviousPlanName(previousAttributes);
  const newPlanName = preconditions.metadata.planName as string;
  const orgSlug = (preconditions.metadata as Record<string, unknown>)
    .organizationSlug as string | undefined;
  const dashboardPath = orgSlug ? `/${orgSlug}/billing` : "/";
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}${dashboardPath}`;
  const billingInterval =
    preconditions.metadata.billingInterval === BILLING_INTERVALS.YEARLY
      ? "Annually"
      : "Monthly";

  // Detect upgrade vs downgrade by comparing plan tiers
  const previousIndex = PLAN_ORDER.indexOf(
    previousPlanName.toLowerCase() as (typeof PLAN_ORDER)[number]
  );
  const newIndex = PLAN_ORDER.indexOf(
    newPlanName.toLowerCase() as (typeof PLAN_ORDER)[number]
  );
  const isDowngrade = previousIndex > newIndex && newIndex >= 0;

  const emailPromise = isDowngrade
    ? sendSubscriptionDowngradedEmail({
        email: preconditions.member.user.email,
        userName: preconditions.member.user.name || undefined,
        newPlan: newPlanName,
        previousPlan: previousPlanName,
        billingInterval,
        dashboardUrl,
      })
    : sendSubscriptionUpgradedEmail({
        email: preconditions.member.user.email,
        userName: preconditions.member.user.name || undefined,
        newPlan: newPlanName,
        previousPlan: previousPlanName,
        billingInterval,
        dashboardUrl,
      });

  const emailResult = await Promise.allSettled([emailPromise]);

  const emailType = isDowngrade ? "downgraded" : "upgraded";
  const failed = emailResult.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    logger.error(
      {
        organizationId: preconditions.metadata.organizationId,
        errors: failed.map((r) => (r.status === "rejected" ? r.reason : null)),
      },
      `Failed to send subscription ${emailType} email`
    );
  } else {
    logger.info(
      { organizationId: preconditions.metadata.organizationId },
      `Sent subscription ${emailType} email`
    );
  }
}

async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const metadata = subscription.metadata;

  if (!(metadata?.organizationId && metadata?.planName)) {
    logger.warn(
      { subscriptionId: subscription.id },
      "Missing required metadata (organizationId or planName)"
    );
    return;
  }

  // CRITICAL: Validate metadata schema to ensure type safety
  try {
    validateStripeSubscriptionMetadata(metadata);
  } catch (error) {
    logger.warn(
      {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Invalid subscription metadata schema"
    );
    return;
  }

  // CRITICAL: Validate organization exists before querying members
  const organization = await database.organization.findUnique({
    where: { id: metadata.organizationId },
    select: { id: true },
  });

  if (!organization) {
    logger.warn(
      {
        organizationId: metadata.organizationId,
        subscriptionId: subscription.id,
      },
      "Organization not found for subscription cancellation"
    );
    return;
  }

  const member = await database.member.findFirst({
    where: {
      organizationId: metadata.organizationId,
      role: ORG_ROLES.OWNER,
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  if (!member?.user.email) {
    logger.warn(
      { organizationId: metadata.organizationId },
      "Organization owner email not found for cancellation email"
    );
    return;
  }

  // Convert Unix timestamp to Date - current_period_end is in seconds
  const periodEnd = (subscription as unknown as Record<string, unknown>)
    .current_period_end as number | undefined;
  const accessUntil = periodEnd
    ? new Date(periodEnd * MILLISECONDS_PER_SECOND).toLocaleDateString()
    : "unknown";

  const cancelOrgSlug = (metadata as Record<string, unknown>)
    .organizationSlug as string | undefined;
  const reactivatePath = cancelOrgSlug ? `/${cancelOrgSlug}/billing` : "/org";

  const emailResult = await Promise.allSettled([
    sendSubscriptionCancelledEmail({
      email: member.user.email,
      userName: member.user.name || undefined,
      planName: metadata.planName,
      accessUntil,
      reactivateUrl: `${env.NEXT_PUBLIC_APP_URL}${reactivatePath}`,
    }),
  ]);

  const failed = emailResult.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    logger.error(
      {
        organizationId: metadata.organizationId,
        errors: failed.map((r) => (r.status === "rejected" ? r.reason : null)),
      },
      "Failed to send subscription cancelled email"
    );
  } else {
    logger.info(
      { organizationId: metadata.organizationId },
      "Sent subscription cancelled email"
    );
  }
}

interface InvoiceEmailContext {
  metadata: Stripe.Metadata;
  subscription: Stripe.Subscription;
  ownerEmail: string;
  ownerName: string | undefined;
}

function extractInvoiceSubscriptionId(
  invoice: Stripe.Invoice
): string | undefined {
  const rawSubscription = (invoice as unknown as Record<string, unknown>)
    .subscription;
  return typeof rawSubscription === "string"
    ? rawSubscription
    : (rawSubscription as { id?: string } | null)?.id;
}

async function resolveInvoiceEmailContext(
  invoice: Stripe.Invoice,
  contextName: string
): Promise<InvoiceEmailContext | null> {
  const subscriptionId = extractInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    logger.warn(
      { invoiceId: invoice.id },
      `No subscription on ${contextName} invoice`
    );
    return null;
  }

  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = sub.metadata;

  if (!(metadata?.organizationId && metadata?.planName)) {
    logger.warn(
      { subscriptionId },
      `Missing required metadata on subscription for ${contextName}`
    );
    return null;
  }

  try {
    validateStripeSubscriptionMetadata(metadata);
  } catch (error) {
    logger.warn(
      {
        subscriptionId,
        error: error instanceof Error ? error.message : String(error),
      },
      `Invalid subscription metadata schema for ${contextName}`
    );
    return null;
  }

  const organization = await database.organization.findUnique({
    where: { id: metadata.organizationId },
    select: { id: true },
  });

  if (!organization) {
    logger.warn(
      { organizationId: metadata.organizationId },
      `Organization not found for ${contextName} email`
    );
    return null;
  }

  const member = await database.member.findFirst({
    where: {
      organizationId: metadata.organizationId,
      role: ORG_ROLES.OWNER,
    },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!member?.user.email) {
    logger.warn(
      { organizationId: metadata.organizationId },
      `Organization owner email not found for ${contextName} email`
    );
    return null;
  }

  return {
    metadata,
    subscription: sub,
    ownerEmail: member.user.email,
    ownerName: member.user.name || undefined,
  };
}

function logEmailResult(
  results: PromiseSettledResult<unknown>[],
  organizationId: string,
  emailType: string
) {
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    logger.error(
      {
        organizationId,
        errors: failed.map((r) => (r.status === "rejected" ? r.reason : null)),
      },
      `Failed to send ${emailType} email`
    );
  } else {
    logger.info({ organizationId }, `Sent ${emailType} email`);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const ctx = await resolveInvoiceEmailContext(invoice, "payment failed");
  if (!ctx) {
    return;
  }

  const amountDue = invoice.amount_due
    ? `$${(invoice.amount_due / CENTS_PER_DOLLAR).toFixed(2)}`
    : undefined;
  const retryDate = invoice.next_payment_attempt
    ? new Date(
        invoice.next_payment_attempt * MILLISECONDS_PER_SECOND
      ).toLocaleDateString()
    : undefined;
  const failureReason =
    (
      invoice.last_finalization_error as Record<string, unknown> | null
    )?.message?.toString() || "Payment method declined";

  const orgSlug = ctx.metadata.organizationSlug as string | undefined;
  const updatePaymentUrl = orgSlug
    ? `${env.NEXT_PUBLIC_APP_URL}/${orgSlug}/billing`
    : `${env.NEXT_PUBLIC_APP_URL}/`;

  const emailResult = await Promise.allSettled([
    sendPaymentFailedEmail({
      email: ctx.ownerEmail,
      userName: ctx.ownerName,
      planName: ctx.metadata.planName,
      amount: amountDue,
      failureReason,
      retryDate,
      updatePaymentUrl,
    }),
  ]);

  logEmailResult(emailResult, ctx.metadata.organizationId, "payment failed");
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  if (invoice.billing_reason !== "subscription_cycle") {
    return;
  }

  const ctx = await resolveInvoiceEmailContext(invoice, "invoice paid");
  if (!ctx) {
    return;
  }

  const amountPaid = invoice.amount_paid
    ? `$${(invoice.amount_paid / CENTS_PER_DOLLAR).toFixed(2)}`
    : undefined;

  const periodEnd = (invoice as unknown as Record<string, unknown>)
    .period_end as number | undefined;
  const renewalDate = periodEnd
    ? new Date(periodEnd * MILLISECONDS_PER_SECOND).toLocaleDateString()
    : undefined;

  const currentPeriodEnd = (
    ctx.subscription as unknown as Record<string, unknown>
  ).current_period_end as number | undefined;
  const nextBillingDate = currentPeriodEnd
    ? new Date(currentPeriodEnd * MILLISECONDS_PER_SECOND).toLocaleDateString()
    : undefined;

  const billingInterval =
    ctx.metadata.billingInterval === BILLING_INTERVALS.YEARLY
      ? "Annually"
      : "Monthly";

  const orgSlug = ctx.metadata.organizationSlug as string | undefined;
  const dashboardPath = orgSlug ? `/${orgSlug}/billing` : "/";
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}${dashboardPath}`;

  const emailResult = await Promise.allSettled([
    sendSubscriptionRenewedEmail({
      email: ctx.ownerEmail,
      userName: ctx.ownerName,
      planName: ctx.metadata.planName,
      amount: amountPaid,
      billingInterval,
      renewalDate,
      nextBillingDate,
      dashboardUrl,
    }),
  ]);

  logEmailResult(
    emailResult,
    ctx.metadata.organizationId,
    "subscription renewed"
  );
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  if (!ALLOWED_STRIPE_EVENT_TYPES.has(event.type)) {
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = event.data.previous_attributes as Record<
        string,
        unknown
      >;
      await handleCustomerSubscriptionUpdated(subscription, previousAttributes);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleCustomerSubscriptionDeleted(subscription);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }

    case "price.created":
    case "price.updated":
    case "product.updated":
      revalidateTag(STRIPE_PRICES_CACHE_TAG, "max");
      logger.info(
        { eventType: event.type, eventId: event.id },
        "Invalidated pricing cache"
      );
      break;

    default:
      // Other Stripe events are handled by Better Auth's Stripe plugin
      break;
  }
}

export function validateAndConstructEvent(
  body: string,
  signature: string | null
):
  | { success: false; response: Response }
  | { success: true; event: Stripe.Event } {
  if (!signature) {
    logger.warn("Missing Stripe signature");
    return {
      success: false,
      // Return 200 to stop Stripe retries — missing signature is permanent
      response: NextResponse.json({ error: "Missing signature" }),
    };
  }

  const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!stripeWebhookSecret) {
    logger.error(
      "Missing Stripe configuration (STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)"
    );
    return {
      success: false,
      // Return 200 to stop Stripe retries — server misconfiguration is
      // permanent until the next deploy, retrying won't fix it
      response: NextResponse.json({ error: "Webhook not configured" }),
    };
  }

  try {
    const event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
    return { success: true, event };
  } catch (error) {
    logger.error({ err: error }, "Webhook signature verification failed");
    return {
      success: false,
      // Return 200 to stop Stripe retries — signature mismatch is permanent
      // for this event payload
      response: NextResponse.json({ error: "Invalid signature" }),
    };
  }
}
