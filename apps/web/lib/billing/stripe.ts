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
