import { STRIPE_API_VERSION } from "@repo/utils/payment";
import Stripe from "stripe";
import { keys } from "./keys";

type StripeInstance = InstanceType<typeof Stripe>;

const env = keys();

export const stripeClient: StripeInstance | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;

export function requireStripeClient(): StripeInstance {
  if (!stripeClient) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Stripe operations require a valid secret key."
    );
  }
  return stripeClient;
}

const STRIPE_DASHBOARD_URL = "https://dashboard.stripe.com";

/**
 * Whether the configured secret key is a Stripe test-mode key (`sk_test_…`).
 * Test-mode dashboard deep links require a `/test` path segment; live keys and
 * a missing key both resolve to live URLs.
 */
export const isStripeTestMode =
  env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;

/**
 * Deep link to a customer in the Stripe Dashboard for the configured mode
 * (e.g. `.../test/customers/cus_…` in test mode, `.../customers/cus_…` in live).
 */
export function stripeCustomerDashboardUrl(customerId: string): string {
  return `${STRIPE_DASHBOARD_URL}/${isStripeTestMode ? "test/" : ""}customers/${customerId}`;
}
