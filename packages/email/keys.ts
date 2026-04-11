import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Default SMTP port for Maildev development
const DEFAULT_SMTP_PORT = 1025;

export const keys = () =>
  createEnv({
    server: {
      // Provider selection (auto-detected if not set)
      EMAIL_PROVIDER: z.enum(["resend", "nodemailer"]).optional(),

      // Common email settings
      EMAIL_FROM: z
        .string()
        .default("App <noreply@localhost>")
        .describe("Default sender email address"),

      // Resend configuration
      RESEND_API_KEY: z
        .string()
        .optional()
        .describe("Resend API key for production email"),

      // SMTP/Nodemailer configuration
      SMTP_HOST: z
        .string()
        .default("localhost")
        .describe("SMTP server hostname"),
      SMTP_PORT: z.coerce
        .number()
        .default(DEFAULT_SMTP_PORT)
        .describe("SMTP server port (1025 for Maildev)"),
      SMTP_SECURE: z.coerce
        .boolean()
        .default(false)
        .describe("Use TLS (true for port 465)"),
      SMTP_USER: z.string().optional().describe("SMTP authentication username"),
      SMTP_PASS: z.string().optional().describe("SMTP authentication password"),
      SMTP_POOL: z.coerce
        .boolean()
        .default(false)
        .describe("Enable connection pooling"),
    },
    client: {},
    runtimeEnv: {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      EMAIL_FROM: process.env.EMAIL_FROM,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_POOL: process.env.SMTP_POOL,
    },
  });
