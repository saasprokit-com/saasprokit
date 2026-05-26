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
