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
