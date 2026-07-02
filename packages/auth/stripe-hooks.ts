import { database } from "@repo/database";
import {
  sendSubscriptionCancelledEmail,
  sendSubscriptionDowngradedEmail,
  sendSubscriptionStartedEmail,
  sendSubscriptionUpgradedEmail,
} from "@repo/email";
import { MILLISECONDS_PER_SECOND } from "@repo/utils/date";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_ORDER,
  type PlanName,
} from "@repo/utils/payment";
import type Stripe from "stripe";
import { keys } from "./keys";
import { ORG_ROLES } from "./permissions";
import { getPlanNameFromPriceId } from "./plans";
import { claimWebhookEvent } from "./webhook-idempotency";

const env = keys();

interface OrgEmailContext {
  dashboardUrl: string;
  ownerEmail: string;
  ownerName: string | undefined;
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

export async function handleSubscriptionComplete(args: {
  event: Stripe.Event;
  subscription: { referenceId: string };
  stripeSubscription: Stripe.Subscription;
  plan: { name: string };
}): Promise<void> {
  if (!(await claimWebhookEvent(args.event))) {
    return;
  }

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
  if (!(await claimWebhookEvent(args.event))) {
    return;
  }

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
  event: Stripe.Event;
  subscription: { referenceId: string; plan: string };
  stripeSubscription: Stripe.Subscription;
}): Promise<void> {
  if (!(await claimWebhookEvent(args.event))) {
    return;
  }

  const ctx = await getOrgEmailContext(args.subscription.referenceId);
  if (!ctx) {
    return;
  }

  // Stripe v22.2+ moved `current_period_end` from the Subscription root onto
  // each SubscriptionItem. Use the first item's period as the access cutoff.
  const periodEnd = args.stripeSubscription.items.data[0]?.current_period_end;
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
