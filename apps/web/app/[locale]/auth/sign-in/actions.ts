"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { resolveCallbackUrl } from "@/lib/routes";
import {
  type MagicLinkFormValues,
  magicLinkSchema,
  type SendOtpFormValues,
  type SignInFormValues,
  sendOtpSchema,
  signInSchema,
  type VerifyOtpFormValues,
  verifyOtpSchema,
} from "../schemas";

export type SignInFormState = FormState<
  SignInFormValues,
  { twoFactorRequired?: boolean }
>;

/**
 * Returns `data.twoFactorRequired` when the account has 2FA enabled (Better Auth
 * responds with `twoFactorRedirect` and withholds the session) so the client can
 * route to the 2FA challenge.
 */
export async function signInEmailAction(
  _prevState: SignInFormState,
  input: SignInFormValues
): Promise<SignInFormState> {
  const logger = createRequestLogger({ action: "signInEmail" });

  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const { email, password, rememberMe } = parsed.data;
    await enforceRateLimit("sign-in");

    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: { email: email.toLowerCase().trim(), password, rememberMe },
    });

    const twoFactorRequired = Boolean(
      (result as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect
    );

    return { status: "success", data: { twoFactorRequired } };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "signIn", logger });
  }
}

export type MagicLinkFormState = FormState<MagicLinkFormValues>;

export async function signInMagicLinkAction(
  _prevState: MagicLinkFormState,
  input: MagicLinkFormValues & { callbackUrl?: string }
): Promise<MagicLinkFormState> {
  const logger = createRequestLogger({ action: "signInMagicLink" });

  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("magic-link");

    await auth.api.signInMagicLink({
      headers: await headers(),
      body: {
        email: parsed.data.email.toLowerCase().trim(),
        callbackURL: resolveCallbackUrl(input.callbackUrl),
      },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "sendMagicLink", logger });
  }
}

export type SendOtpFormState = FormState<SendOtpFormValues>;

export async function sendSignInOtpAction(
  _prevState: SendOtpFormState,
  input: SendOtpFormValues
): Promise<SendOtpFormState> {
  const logger = createRequestLogger({ action: "sendSignInOtp" });

  const parsed = sendOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("otp-send");

    await auth.api.sendVerificationOTP({
      headers: await headers(),
      body: { email: parsed.data.email.toLowerCase().trim(), type: "sign-in" },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "sendOtp", logger });
  }
}

export type VerifyOtpFormState = FormState<VerifyOtpFormValues>;

/** Creates the session on success. */
export async function verifySignInOtpAction(
  _prevState: VerifyOtpFormState,
  input: VerifyOtpFormValues & { email: string }
): Promise<VerifyOtpFormState> {
  const logger = createRequestLogger({ action: "verifySignInOtp" });

  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("sign-in");

    await auth.api.signInEmailOTP({
      headers: await headers(),
      body: { email: input.email.toLowerCase().trim(), otp: parsed.data.code },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "invalidOtp", logger });
  }
}
