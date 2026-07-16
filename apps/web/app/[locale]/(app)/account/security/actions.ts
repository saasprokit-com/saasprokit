"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/auth/auth";
import { revalidateAccountPage } from "@/lib/infrastructure/revalidation";

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
    await auth.api.verifyTOTP({
      headers: await headers(),
      body: { code },
    });

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
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
    await auth.api.disableTwoFactor({
      headers: await headers(),
      body: { password },
    });

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "Failed to disable 2FA"
    );
    return { success: false, error: "Failed to disable 2FA" };
  }
}

/**
 * Revalidate security page after client-side mutations.
 */
export async function revalidateSecurityPageAction(): Promise<ActionResult> {
  try {
    await revalidateAccountPage("security");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to revalidate" };
  }
}
