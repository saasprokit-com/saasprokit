import { STRIPE_API_VERSION } from "@repo/utils/payment";
import Stripe from "stripe";
import { keys } from "./keys";

type StripeInstance = InstanceType<typeof Stripe>;

const env = keys();

/**
 * Single Stripe SDK instance shared across the app.
 * Used by Better Auth's Stripe plugin (see server.ts) and by apps that
 * need direct Stripe SDK access (e.g. server actions for checkout/portal).
 *
 * Null when STRIPE_SECRET_KEY is not configured (e.g. local dev without Stripe).
 */
export const stripeClient: StripeInstance | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;

/**
 * Strict variant — throws if Stripe is not configured.
 * Use at call sites where Stripe is required (e.g. server actions that mutate billing).
 */
export function requireStripeClient(): StripeInstance {
  if (!stripeClient) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Stripe operations require a valid secret key."
    );
  }
  return stripeClient;
}
