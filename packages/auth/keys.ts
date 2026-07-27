import { MAX_ORGS_PER_USER } from "@repo/utils/organization";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const BETTER_AUTH_SECRET_LENGTH = 32;

const stripePriceId = z.string().startsWith("price_").optional();

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    server: {
      // Better Auth core
      BETTER_AUTH_SECRET: z.string().min(BETTER_AUTH_SECRET_LENGTH),
      BETTER_AUTH_URL: z.url().optional(),
      BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),

      // OAuth providers
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),

      // Stripe integration
      STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
      STRIPE_PRO_PRICE_ID_MONTHLY: stripePriceId,
      STRIPE_PRO_PRICE_ID_ANNUAL: stripePriceId,
      STRIPE_ENTERPRISE_PRICE_ID_MONTHLY: stripePriceId,
      STRIPE_ENTERPRISE_PRICE_ID_ANNUAL: stripePriceId,

      // Organization limits
      MAX_ORGS_PER_USER: z.coerce
        .number()
        .int()
        .positive()
        .default(MAX_ORGS_PER_USER),
    },
    client: {
      NEXT_PUBLIC_APP_URL: z.url().optional(),
      NEXT_PUBLIC_APP_NAME: z.string().min(1).optional(),
    },
    runtimeEnv: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRO_PRICE_ID_MONTHLY: process.env.STRIPE_PRO_PRICE_ID_MONTHLY,
      STRIPE_PRO_PRICE_ID_ANNUAL: process.env.STRIPE_PRO_PRICE_ID_ANNUAL,
      STRIPE_ENTERPRISE_PRICE_ID_MONTHLY:
        process.env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
      STRIPE_ENTERPRISE_PRICE_ID_ANNUAL:
        process.env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
      MAX_ORGS_PER_USER: process.env.MAX_ORGS_PER_USER,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    },
  });
