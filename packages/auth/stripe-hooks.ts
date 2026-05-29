import { database } from "@repo/database";
import {
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionDowngradedEmail,
  sendSubscriptionRenewedEmail,
  sendSubscriptionStartedEmail,
  sendSubscriptionUpgradedEmail,
} from "@repo/email";
import { MILLISECONDS_PER_SECOND } from "@repo/utils/date";
import {
  getPlanNameFromPriceId,
  PLAN_DISPLAY_NAMES,
  PLAN_ORDER,
  type PlanName,
} from "@repo/utils/payment";
import type Stripe from "stripe";
import { keys } from "./keys";
import { ORG_ROLES } from "./permissions";

const env = keys();

const CENTS_PER_DOLLAR = 100;

interface OrgEmailContext {
  ownerEmail: string;
  ownerName: string | undefined;
  dashboardUrl: string;
}

async function getOrgEmailContext(
  referenceId: string
): Promise<OrgEmailContext | null> {
  const [org, owner] = await Promise.all([
    database.organization.findUnique({
      where: { id: referenceId },
      select: { id: true, slug: true },
    }),
    database.member.findFirst({
      where: { organizationId: referenceId, role: ORG_ROLES.OWNER },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  if (!(org && owner?.user.email)) {
    return null;
  }

  return {
    ownerEmail: owner.user.email,
    ownerName: owner.user.name || undefined,
    dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/${org.slug}/billing`,
  };
}

function getBillingInterval(
  stripeSubscription: Stripe.Subscription
): "Monthly" | "Annually" {
  const priceId = stripeSubscription.items?.data?.[0]?.price?.id;
  const isAnnual =
    priceId === env.STRIPE_PRO_PRICE_ID_ANNUAL ||
    priceId === env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL;
  return isAnnual ? "Annually" : "Monthly";
}

function displayPlanName(plan: string): string {
  return PLAN_DISPLAY_NAMES[plan as PlanName] ?? plan;
}

function getStripePriceEnvMap() {
  return {
    proMonthly: env.STRIPE_PRO_PRICE_ID_MONTHLY,
    proAnnual: env.STRIPE_PRO_PRICE_ID_ANNUAL,
    enterpriseMonthly: env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
    enterpriseAnnual: env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
  };
}

function extractSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  // Stripe v22.2+ removed `subscription` from the top-level Invoice; it now
  // lives on each InvoiceLineItem. Read from the first line item.
  const raw = invoice.lines.data[0]?.subscription;
  return typeof raw === "string" ? raw : raw?.id;
}

export async function handleSubscriptionComplete(args: {
  subscription: { referenceId: string };
  stripeSubscription: Stripe.Subscription;
  plan: { name: string };
}): Promise<void> {
  const ctx = await getOrgEmailContext(args.subscription.referenceId);
  if (!ctx) {
    return;
  }

  await sendSubscriptionStartedEmail({
    email: ctx.ownerEmail,
    userName: ctx.ownerName,
    planName: displayPlanName(args.plan.name),
    billingInterval: getBillingInterval(args.stripeSubscription),
    dashboardUrl: ctx.dashboardUrl,
  });
}

export async function handleSubscriptionUpdate(args: {
  event: Stripe.Event;
  subscription: { referenceId: string; plan: string };
}): Promise<void> {
  const previousAttributes = (
    args.event.data as { previous_attributes?: Record<string, unknown> }
  ).previous_attributes;
  const previousItems = (
    previousAttributes?.items as
      | { data?: Array<{ price?: { id?: string } }> }
      | undefined
  )?.data;

  // No plan change — skip (status-only updates, period rollovers, etc.)
  if (!previousItems?.length) {
    return;
  }

  const ctx = await getOrgEmailContext(args.subscription.referenceId);
  if (!ctx) {
    return;
  }

  const previousPriceId = previousItems[0]?.price?.id;
  const previousPlanName = previousPriceId
    ? getPlanNameFromPriceId(previousPriceId, getStripePriceEnvMap())
    : null;

  const newIndex = PLAN_ORDER.indexOf(args.subscription.plan as PlanName);
  const previousIndex = previousPlanName
    ? PLAN_ORDER.indexOf(previousPlanName)
    : -1;
  const isDowngrade = previousIndex > newIndex && newIndex >= 0;

  const stripeSubscription = args.event.data.object as Stripe.Subscription;
  const payload = {
    email: ctx.ownerEmail,
    userName: ctx.ownerName,
    previousPlan: previousPlanName
      ? displayPlanName(previousPlanName)
      : "Unknown",
    newPlan: displayPlanName(args.subscription.plan),
    billingInterval: getBillingInterval(stripeSubscription),
    dashboardUrl: ctx.dashboardUrl,
  };

  await (isDowngrade
    ? sendSubscriptionDowngradedEmail(payload)
    : sendSubscriptionUpgradedEmail(payload));
}

export async function handleSubscriptionDeleted(args: {
  subscription: { referenceId: string; plan: string };
  stripeSubscription: Stripe.Subscription;
}): Promise<void> {
  const ctx = await getOrgEmailContext(args.subscription.referenceId);
  if (!ctx) {
    return;
  }

  // Stripe v22.2+ moved `current_period_end` from the Subscription root onto
  // each SubscriptionItem. Use the first item's period as the access cutoff.
  const periodEnd =
    args.stripeSubscription.items.data[0]?.current_period_end;
  const accessUntil = periodEnd
    ? new Date(periodEnd * MILLISECONDS_PER_SECOND).toLocaleDateString()
    : "unknown";

  await sendSubscriptionCancelledEmail({
    email: ctx.ownerEmail,
    userName: ctx.ownerName,
    planName: displayPlanName(args.subscription.plan),
    accessUntil,
    reactivateUrl: ctx.dashboardUrl,
  });
}

export async function handleStripeInvoiceEvent(
  event: Stripe.Event
): Promise<void> {
  if (event.type === "invoice.payment_failed") {
    await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
    return;
  }
  if (event.type === "invoice.paid") {
    await handleInvoiceRenewal(event.data.object as Stripe.Invoice);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = extractSubscriptionId(invoice);
  if (!subscriptionId) {
    return;
  }

  const subscription = await database.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { referenceId: true, plan: true },
  });
  if (!subscription) {
    return;
  }

  const ctx = await getOrgEmailContext(subscription.referenceId);
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
    (invoice.last_finalization_error as { message?: string } | null)?.message ||
    "Payment method declined";

  await sendPaymentFailedEmail({
    email: ctx.ownerEmail,
    userName: ctx.ownerName,
    planName: displayPlanName(subscription.plan),
    amount: amountDue,
    failureReason,
    retryDate,
    updatePaymentUrl: ctx.dashboardUrl,
  });
}

async function handleInvoiceRenewal(invoice: Stripe.Invoice): Promise<void> {
  // Skip first payment — welcome email is sent via onSubscriptionComplete
  if (invoice.billing_reason !== "subscription_cycle") {
    return;
  }

  const subscriptionId = extractSubscriptionId(invoice);
  if (!subscriptionId) {
    return;
  }

  const dbSubscription = await database.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { referenceId: true, plan: true },
  });
  if (!dbSubscription) {
    return;
  }

  const ctx = await getOrgEmailContext(dbSubscription.referenceId);
  if (!ctx) {
    return;
  }

  const amountPaid = invoice.amount_paid
    ? `$${(invoice.amount_paid / CENTS_PER_DOLLAR).toFixed(2)}`
    : undefined;
  const renewalDate = invoice.period_end
    ? new Date(invoice.period_end * MILLISECONDS_PER_SECOND).toLocaleDateString()
    : undefined;

  // Derive billing interval from the invoice's price ID. Stripe v22.2+ moved
  // the price reference from `lines.data[N].price` to
  // `lines.data[N].pricing.price_details.price` (which is `string | Price`).
  const priceRef = invoice.lines.data[0]?.pricing?.price_details?.price;
  const invoicePriceId =
    typeof priceRef === "string" ? priceRef : priceRef?.id;
  const isAnnual =
    invoicePriceId === env.STRIPE_PRO_PRICE_ID_ANNUAL ||
    invoicePriceId === env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL;

  await sendSubscriptionRenewedEmail({
    email: ctx.ownerEmail,
    userName: ctx.ownerName,
    planName: displayPlanName(dbSubscription.plan),
    amount: amountPaid,
    billingInterval: isAnnual ? "Annually" : "Monthly",
    renewalDate,
    nextBillingDate: renewalDate,
    dashboardUrl: ctx.dashboardUrl,
  });
}
