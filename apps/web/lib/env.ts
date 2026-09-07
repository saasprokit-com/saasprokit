import { keys as authKeys } from "@repo/auth/keys";
import { keys as dbKeys } from "@repo/database/keys";
import { keys as emailKeys } from "@repo/email/keys";
import { keys as storageKeys } from "@repo/storage/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Environment validation constants
const MIN_SECRET_LENGTH = 32;
const MIN_HEALTH_CHECK_TIMEOUT_MS = 1000;
const MAX_HEALTH_CHECK_TIMEOUT_MS = 30_000;
const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 5000;
const DEFAULT_ORG_QUERY_TIMEOUT_MS = 5000;

export const env = createEnv({
  extends: [authKeys(), dbKeys(), emailKeys(), storageKeys()],
  emptyStringAsUndefined: true,
  server: {
    // Node environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // Cron job security
    CRON_SECRET: z.string().min(MIN_SECRET_LENGTH).optional(),

    // Health check configuration
    HEALTH_CHECK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(MIN_HEALTH_CHECK_TIMEOUT_MS)
      .max(MAX_HEALTH_CHECK_TIMEOUT_MS)
      .default(DEFAULT_HEALTH_CHECK_TIMEOUT_MS),

    // Database query timeout
    ORG_QUERY_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_ORG_QUERY_TIMEOUT_MS),

    // Better Auth (required at app level, optional in package)
    BETTER_AUTH_URL: z.url(),

    // Host validation
    ALLOWED_ORIGINS: z.string().optional(),

    ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),
    OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
    AI_MOCK: z.stringbool().optional(),
  },
  client: {
    // Required at app level (optional in package schemas)
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_DOCS_URL: z.url().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    CRON_SECRET: process.env.CRON_SECRET,
    HEALTH_CHECK_TIMEOUT_MS: process.env.HEALTH_CHECK_TIMEOUT_MS,
    ORG_QUERY_TIMEOUT_MS: process.env.ORG_QUERY_TIMEOUT_MS,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_MOCK: process.env.AI_MOCK,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
  },
});
