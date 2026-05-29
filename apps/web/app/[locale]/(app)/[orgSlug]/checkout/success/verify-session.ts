import "server-only";

import { requireStripeClient } from "@repo/auth/stripe-client";
import { database } from "@repo/database";
import { PLAN_NAMES, type PlanName } from "@repo/utils/payment";
import type Stripe from "stripe";

export type VerificationFailureReason =
  | "missing_session"
  | "stripe_error"
  | "not_paid"
  | "wrong_org";

interface VerificationFailure {
  ok: false;
  reason: VerificationFailureReason;
}

interface VerificationSuccess {
  ok: true;
  planName: PlanName;
}

type VerificationResult = VerificationFailure | VerificationSuccess;

function extractId(
  value: string | { id?: string } | null | undefined
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return value?.id;
}

function findOwningSubscription(
  session: Stripe.Checkout.Session,
  organizationId: string
): Promise<{ plan: string } | null> {
  const subscriptionId = extractId(session.subscription);
  const customerId = extractId(session.customer);

  // Look up the BA-managed Subscription row to confirm Stripe's session
  // resolves back to a subscription owned by this org. Defends against
  // bookmarked or shared success URLs from another org.
  return database.subscription.findFirst({
    where: {
      referenceId: organizationId,
      OR: [
        ...(subscriptionId ? [{ stripeSubscriptionId: subscriptionId }] : []),
        ...(customerId ? [{ stripeCustomerId: customerId }] : []),
      ],
    },
    select: { plan: true },
  });
}

function asPlanName(value: string): PlanName {
  if (
    value === PLAN_NAMES.PRO ||
    value === PLAN_NAMES.ENTERPRISE ||
    value === PLAN_NAMES.FREE
  ) {
    return value;
  }
  return PLAN_NAMES.PRO;
}

export async function verifyCheckoutSession(
  sessionId: string | undefined,
  organizationId: string
): Promise<VerificationResult> {
  if (!sessionId) {
    return { ok: false, reason: "missing_session" };
  }

  let session: Stripe.Checkout.Session;
  try {
    const stripe = requireStripeClient();
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { ok: false, reason: "stripe_error" };
  }

  const isPaid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!(isPaid && session.status === "complete")) {
    return { ok: false, reason: "not_paid" };
  }

  const owningSub = await findOwningSubscription(session, organizationId);
  if (!owningSub) {
    return { ok: false, reason: "wrong_org" };
  }

  return { ok: true, planName: asPlanName(owningSub.plan) };
}
