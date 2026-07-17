import { BILLING_INTERVALS, PLAN_NAMES } from "@repo/utils/payment";
import { z } from "zod";

export const changePlanRequestSchema = z
  .object({
    organizationId: z.string().min(1),
    targetPlan: z.enum([
      PLAN_NAMES.FREE,
      PLAN_NAMES.PRO,
      PLAN_NAMES.ENTERPRISE,
    ]),
    billingInterval: z
      .enum([BILLING_INTERVALS.MONTHLY, BILLING_INTERVALS.YEARLY])
      .optional()
      .default(BILLING_INTERVALS.MONTHLY),
  })
  .strict();

export type ChangePlanRequest = z.infer<typeof changePlanRequestSchema>;

/** Fields shared by every billing action that builds a Stripe return URL. */
const billingLocationSchema = z.object({
  organizationId: z.string().min(1),
  organizationSlug: z.string().min(1),
  locale: z.string().min(1),
});

export const upgradeSubscriptionSchema = billingLocationSchema
  .extend({
    planName: z.enum([PLAN_NAMES.PRO, PLAN_NAMES.ENTERPRISE]),
    billingInterval: z.enum([
      BILLING_INTERVALS.MONTHLY,
      BILLING_INTERVALS.YEARLY,
    ]),
  })
  .strict();

export type UpgradeSubscriptionInput = z.infer<
  typeof upgradeSubscriptionSchema
>;

export const openBillingPortalSchema = billingLocationSchema.strict();

export type OpenBillingPortalInput = z.infer<typeof openBillingPortalSchema>;

export const cancelSubscriptionSchema = billingLocationSchema
  .extend({
    subscriptionId: z.string().min(1).optional(),
  })
  .strict();

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
