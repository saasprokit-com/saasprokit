"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import type { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { revalidateAccountPage } from "@/lib/infrastructure/revalidation";
import { changePasswordSchema } from "./schemas";

type Enable2FAResult =
  | { success: true; totpURI: string; backupCodes: string[] }
  | { success: false; error: string };

/**
 * Enable two-factor authentication for the current user.
 */
export async function enable2FAAction(
  password: string
): Promise<Enable2FAResult> {
  const logger = createRequestLogger({ action: "enable2FA" });

  try {
    await enforceRateLimit("change-password");

    const data = await auth.api.enableTwoFactor({
      headers: await headers(),
      body: { password },
    });

    if (!data?.totpURI) {
      return { success: false, error: "No TOTP URI returned" };
    }

    return {
      success: true,
      totpURI: data.totpURI,
      backupCodes: data.backupCodes ?? [],
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      const limited = await actionError("tooManyRequests");
      return {
        success: false,
        error: limited.error ?? "Too many attempts. Please try again shortly.",
      };
    }
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "Failed to enable 2FA"
    );
    return { success: false, error: "Failed to enable 2FA" };
  }
}

/**
 * Verify TOTP code to complete 2FA setup.
 */
export async function verify2FAAction(code: string): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "verify2FA" });

  try {
    await enforceRateLimit("2fa");

    await auth.api.verifyTOTP({
      headers: await headers(),
      body: { code },
    });

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "Failed to verify 2FA"
    );
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Disable two-factor authentication for the current user.
 */
export async function disable2FAAction(
  password: string
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "disable2FA" });

  try {
    await enforceRateLimit("change-password");

    await auth.api.disableTwoFactor({
      headers: await headers(),
      body: { password },
    });

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "Failed to disable 2FA"
    );
    return { success: false, error: "Failed to disable 2FA" };
  }
}

/**
 * Logout a specific session, identified by its Better Auth session token.
 * No verifySession needed: revokeSession authenticates the caller itself and
 * only revokes sessions owned by that caller.
 */
export async function logoutSessionAction(token: string) {
  const logger = createRequestLogger({
    action: "logoutSession",
  });

  try {
    await auth.api.revokeSession({
      headers: await headers(),
      body: { token },
    });

    logger.info("Session logged out");

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "logoutSession",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Logout all other sessions
 * Keeps current session active
 */
export async function logoutAllOtherSessionsAction() {
  const logger = createRequestLogger({
    action: "logoutAllOtherSessions",
  });

  try {
    // Revoke every session except the current one via Better Auth.
    await auth.api.revokeOtherSessions({
      headers: await headers(),
    });

    logger.info("All other sessions logged out");

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "logoutAllSessions",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Change the current user's password and revoke other sessions.
 * auth.api.changePassword authenticates the caller from the forwarded headers.
 */
export async function changePasswordAction(
  input: z.infer<typeof changePasswordSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "changePassword" });

  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(input);
    await enforceRateLimit("change-password");

    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "changePassword",
      baFallback: "unknownError",
      logger,
    });
  }
}
