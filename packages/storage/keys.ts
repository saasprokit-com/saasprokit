import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const DEFAULT_SIGNED_URL_EXPIRES = 3600;

export const keys = () =>
  createEnv({
    server: {
      // Provider selection
      STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),

      // Local storage configuration
      STORAGE_LOCAL_PATH: z.string().default("./public/uploads"),
      STORAGE_BASE_URL: z.string().url().optional(),

      // AWS S3 configuration
      AWS_ACCESS_KEY_ID: z.string().optional(),
      AWS_SECRET_ACCESS_KEY: z.string().optional(),
      AWS_S3_BUCKET: z.string().optional(),
      AWS_REGION: z.string().default("us-east-1"),
      AWS_S3_PUBLIC_URL: z.string().url().optional(),
      AWS_S3_SIGNED_URL_EXPIRES: z.coerce
        .number()
        .int()
        .positive()
        .default(DEFAULT_SIGNED_URL_EXPIRES),
    },
    runtimeEnv: {
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
      STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,
      STORAGE_BASE_URL: process.env.STORAGE_BASE_URL,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
      AWS_S3_PUBLIC_URL: process.env.AWS_S3_PUBLIC_URL,
      AWS_S3_SIGNED_URL_EXPIRES: process.env.AWS_S3_SIGNED_URL_EXPIRES,
    },
  });
