import { keys } from "../keys";
import { NodemailerProvider } from "./nodemailer";
import { ResendProvider } from "./resend";
import type { EmailProvider } from "./types";

// Validated environment variables
const env = keys();

export { NodemailerProvider } from "./nodemailer";

// Re-export providers for direct use if needed
export { ResendProvider } from "./resend";
// Re-export types
export type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  SMTPConfig,
} from "./types";

/**
 * Cached provider instance (singleton pattern)
 */
let cachedProvider: EmailProvider | null = null;

function detectProvider(): "resend" | "nodemailer" {
  // Production with Resend API key → use Resend
  if (process.env.NODE_ENV === "production" && env.RESEND_API_KEY) {
    return "resend";
  }

  // Development or no Resend key → use Nodemailer
  return "nodemailer";
}

/**
 * Provider selection priority:
 * 1. Explicit EMAIL_PROVIDER env var
 * 2. Auto-detection based on environment
 *
 * Auto-detection logic:
 * - Production + RESEND_API_KEY → Resend
 * - Development or no API key → Nodemailer (localhost:1025)
 */
export function getEmailProvider(): EmailProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  // Determine provider type
  const providerType =
    (env.EMAIL_PROVIDER as "resend" | "nodemailer") || detectProvider();

  if (providerType === "resend") {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is required for Resend provider"
      );
    }
    cachedProvider = new ResendProvider(apiKey);
  } else {
    cachedProvider = new NodemailerProvider({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      pool: env.SMTP_POOL,
    });
  }

  return cachedProvider;
}

/**
 * Reset the cached provider (useful for testing)
 */
export function resetEmailProvider(): void {
  cachedProvider = null;
}

/**
 * Get the current provider name without initializing
 */
export function getProviderName(): string {
  if (cachedProvider) {
    return cachedProvider.name;
  }
  return env.EMAIL_PROVIDER || detectProvider();
}
