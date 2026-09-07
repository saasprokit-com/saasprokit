"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/log";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import {
  type BackupCodeFormValues,
  backupCodeSchema,
  type TwoFactorFormValues,
  twoFactorSchema,
} from "../schemas";

export type TwoFactorFormState = FormState<TwoFactorFormValues>;

/** Verify the TOTP code during a 2FA sign-in challenge; promotes to a session. */
export async function verifyTwoFactorAction(
  _prevState: TwoFactorFormState,
  input: TwoFactorFormValues
): Promise<TwoFactorFormState> {
  const logger = createRequestLogger({ action: "verifyTwoFactor" });

  const parsed = twoFactorSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("2fa");

    await auth.api.verifyTOTP({
      headers: await headers(),
      body: { code: parsed.data.code },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "verify2fa", logger });
  }
}

export type BackupCodeFormState = FormState<BackupCodeFormValues>;

/**
 * The recovery path for a lost authenticator. Better Auth burns the code as it
 * verifies it, so a code works exactly once.
 */
export async function verifyBackupCodeAction(
  _prevState: BackupCodeFormState,
  input: BackupCodeFormValues
): Promise<BackupCodeFormState> {
  const logger = createRequestLogger({ action: "verifyBackupCode" });

  const parsed = backupCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("2fa");

    await auth.api.verifyBackupCode({
      headers: await headers(),
      body: { code: parsed.data.code },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "verify2fa", logger });
  }
}
