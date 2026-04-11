import "server-only";

import { createRequestLogger } from "@repo/logger/server";

const logger = createRequestLogger({
  action: "passwordReset",
});

/**
 * Log password reset requests for security monitoring.
 * Audit log temporarily removed — logs to Pino only.
 */
export function logPasswordResetRequest(email: string): void {
  try {
    logger.info({ email }, "Password reset email sent");
  } catch (error) {
    logger.error(
      {
        err: error instanceof Error ? error : new Error(String(error)),
        email,
      },
      "Failed to log password reset request"
    );
  }
}