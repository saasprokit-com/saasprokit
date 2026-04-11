import languine from "@repo/internationalization/languine.json" with {
  type: "json",
};
import { BILLING_INTERVALS, PLAN_NAMES } from "@repo/utils/payment";
import { z } from "zod";

const locales = [languine.locale.source, ...languine.locale.targets] as const;

export const checkoutRequestSchema = z
  .object({
    organizationId: z.string().min(1),
    planName: z.enum([PLAN_NAMES.PRO, PLAN_NAMES.ENTERPRISE]),
    billingInterval: z.enum([
      BILLING_INTERVALS.MONTHLY,
      BILLING_INTERVALS.YEARLY,
    ]),
    locale: z.enum(locales).optional().default("en"),
  })
  .strict();

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const billingPortalRequestSchema = z
  .object({
    organizationId: z.string().min(1),
    organizationSlug: z.string().min(1),
    locale: z.enum(locales).optional().default("en"),
  })
  .strict();

export type BillingPortalRequest = z.infer<typeof billingPortalRequestSchema>;

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
