"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/log";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { revalidateAccountPage } from "@/lib/infrastructure/revalidation";
import {
  type ChangePasswordFormValues,
  changePasswordSchema,
  type TwoFactorCodeValues,
  type TwoFactorPasswordValues,
  twoFactorCodeSchema,
  twoFactorPasswordSchema,
} from "./schemas";

export type Enable2FAFormState = FormState<
  TwoFactorPasswordValues,
  { totpURI: string; backupCodes: string[] }
>;

export async function enable2FAAction(
  _prevState: Enable2FAFormState,
  input: TwoFactorPasswordValues
): Promise<Enable2FAFormState> {
  const logger = createRequestLogger({ action: "enable2FA" });

  const parsed = twoFactorPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("change-password");

    const data = await auth.api.enableTwoFactor({
      headers: await headers(),
      body: { password: parsed.data.password },
    });

    if (!data?.totpURI) {
      return actionError("enable2fa");
    }

    return {
      status: "success",
      data: { totpURI: data.totpURI, backupCodes: data.backupCodes ?? [] },
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "enable2fa", logger });
  }
}

export type Verify2FAFormState = FormState<TwoFactorCodeValues>;

export async function verify2FAAction(
  _prevState: Verify2FAFormState,
  input: TwoFactorCodeValues
): Promise<Verify2FAFormState> {
  const logger = createRequestLogger({ action: "verify2FA" });

  const parsed = twoFactorCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("2fa");

    await auth.api.verifyTOTP({
      headers: await headers(),
      body: { code: parsed.data.code },
    });

    await revalidateAccountPage("security");

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "verify2fa", logger });
  }
}

export type Disable2FAFormState = FormState<TwoFactorPasswordValues>;

export async function disable2FAAction(
  _prevState: Disable2FAFormState,
  input: TwoFactorPasswordValues
): Promise<Disable2FAFormState> {
  const logger = createRequestLogger({ action: "disable2FA" });

  const parsed = twoFactorPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("change-password");

    await auth.api.disableTwoFactor({
      headers: await headers(),
      body: { password: parsed.data.password },
    });

    await revalidateAccountPage("security");

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "disable2fa", logger });
  }
}

/**
 * No verifySession needed: revokeSession authenticates the caller itself and
 * only revokes sessions owned by that caller.
 */
export async function logoutSessionAction(
  token: string
): Promise<ActionResult> {
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
      logger,
    });
  }
}

export async function logoutAllOtherSessionsAction(): Promise<ActionResult> {
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
      logger,
    });
  }
}

export type ChangePasswordFormState = FormState<ChangePasswordFormValues>;

export async function changePasswordAction(
  _prevState: ChangePasswordFormState,
  input: ChangePasswordFormValues
): Promise<ChangePasswordFormState> {
  const logger = createRequestLogger({ action: "changePassword" });

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const { currentPassword, newPassword } = parsed.data;
    await enforceRateLimit("change-password");

    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "changePassword",
      logger,
    });
  }
}
