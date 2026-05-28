import "server-only";

import { requireStripeClient } from "@repo/auth/stripe-client";
import { database } from "@repo/database";
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
  session: Stripe.Checkout.Session;
}

export type VerificationResult = VerificationFailure | VerificationSuccess;

function extractId(
  value: string | { id?: string } | null | undefined
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return value?.id;
}

async function sessionBelongsToOrg(
  session: Stripe.Checkout.Session,
  organizationId: string
): Promise<boolean> {
  const subscriptionId = extractId(session.subscription);
  const customerId = extractId(session.customer);

  // Look up the BA-managed Subscription row to confirm Stripe's session
  // resolves back to a subscription owned by this org. Defends against
  // bookmarked or shared success URLs from another org.
  const match = await database.subscription.findFirst({
    where: {
      referenceId: organizationId,
      OR: [
        ...(subscriptionId ? [{ stripeSubscriptionId: subscriptionId }] : []),
        ...(customerId ? [{ stripeCustomerId: customerId }] : []),
      ],
    },
    select: { id: true },
  });

  return match !== null;
}

export async function verifyCheckoutSession(
  sessionId: string | undefined,
  organizationId: string
): Promise<VerificationResult> {
  if (!sessionId) {
    return { ok: false, reason: "missing_session" };
  }

  const stripe = requireStripeClient();

  let session: Stripe.Checkout.Session;
  try {
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

  if (!(await sessionBelongsToOrg(session, organizationId))) {
    return { ok: false, reason: "wrong_org" };
  }

  return { ok: true, session };
}
