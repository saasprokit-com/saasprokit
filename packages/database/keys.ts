import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      DATABASE_URL: z.url(),
      DB_SLOW_QUERY_MS: z.coerce.number().int().positive().default(500),
    },
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
      DB_SLOW_QUERY_MS: process.env.DB_SLOW_QUERY_MS,
    },
  });
