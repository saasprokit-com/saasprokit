import "server-only";

import { STRIPE_API_VERSION } from "@repo/utils/payment";
import Stripe from "stripe";

import { env } from "@/lib/env";

let _stripeClient: Stripe | null = null;

/**
 * Shared Stripe client singleton for the web app.
 *
 * Uses lazy initialization so `next build` doesn't crash when
 * STRIPE_SECRET_KEY is unavailable at static-generation time.
 * Every call-site in the web app should import this instead of
 * creating its own `new Stripe(...)`.
 */
export function getStripeClient(): Stripe {
  if (!_stripeClient) {
    const apiKey = env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error(
        "STRIPE_SECRET_KEY environment variable is not set. " +
          "Stripe operations require a valid secret key."
      );
    }
    _stripeClient = new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION });
  }
  return _stripeClient;
}

/**
 * Allowed Stripe event types for webhook processing
 *
 * SECURITY: Only events in this whitelist are processed by our custom handlers.
 * New event types must be explicitly approved and their handlers tested before adding.
 * Note: Better Auth's Stripe plugin receives all signed events regardless of this list.
 *
 * Event type purposes:
 * - checkout.session.completed: Sends subscription started email on checkout completion
 * - customer.subscription.updated: Sends upgrade/downgrade email on plan change
 * - customer.subscription.deleted: Sends cancellation email with access-until date
 * - invoice.payment_failed: Sends payment failure email with retry date
 * - invoice.paid: Sends subscription renewed email on billing cycle payment
 *
 * To add new event types:
 * 1. Add event type to ALLOWED_STRIPE_EVENT_TYPES
 * 2. Implement handler in /api/stripe/webhook/route.ts processStripeEvent()
 * 3. Test thoroughly in staging with actual Stripe webhooks
 * 4. Add security validation for all metadata fields
 * 5. Document the event purpose above
 */
const ALLOWED_EVENT_TYPES_ARRAY = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.paid",
] as const;

export const ALLOWED_STRIPE_EVENT_TYPES = new Set<string>(
  ALLOWED_EVENT_TYPES_ARRAY
);

export type AllowedStripeEventType = (typeof ALLOWED_EVENT_TYPES_ARRAY)[number];
