/**
 * Zod schemas for organization metadata validation
 * Ensures metadata conforms to expected structure before processing
 * Prevents type errors and security issues from malformed metadata
 */

import { BILLING_INTERVALS, PLAN_NAMES } from "@repo/utils/payment";
import { z } from "zod";

/**
 * CRITICAL: Subscriptions must have organizationId and planName for proper tracking
 */
export const stripeSubscriptionMetadataSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  organizationSlug: z
    .string()
    .min(1, "Organization slug is required")
    .optional(),
  planName: z.enum([PLAN_NAMES.PRO, PLAN_NAMES.ENTERPRISE]),
  billingInterval: z
    .enum([BILLING_INTERVALS.MONTHLY, BILLING_INTERVALS.YEARLY])
    .optional(),
});

/**
 * Validates metadata in checkout.session.completed events
 */
export const stripeCheckoutSessionMetadataSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  planName: z.enum([PLAN_NAMES.PRO, PLAN_NAMES.ENTERPRISE]),
  billingInterval: z.enum([
    BILLING_INTERVALS.MONTHLY,
    BILLING_INTERVALS.YEARLY,
  ]),
  organizationSlug: z.string().min(1, "Organization slug is required"),
  organizationName: z.string().min(1, "Organization name is required"),
});

/**
 * @throws If metadata is invalid
 */
export function validateStripeSubscriptionMetadata(
  metadata: unknown
): z.infer<typeof stripeSubscriptionMetadataSchema> {
  try {
    return stripeSubscriptionMetadataSchema.parse(metadata);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Invalid Stripe subscription metadata: ${messages}`);
    }
    throw error;
  }
}

/**
 * @throws If metadata is invalid
 */
export function validateStripeCheckoutSessionMetadata(
  metadata: unknown
): z.infer<typeof stripeCheckoutSessionMetadataSchema> {
  try {
    return stripeCheckoutSessionMetadataSchema.parse(metadata);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Invalid Stripe checkout session metadata: ${messages}`);
    }
    throw error;
  }
}
