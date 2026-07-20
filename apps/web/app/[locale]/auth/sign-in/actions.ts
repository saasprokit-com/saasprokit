"use server";

import { auth } from "@repo/auth/server";
import {
  magicLinkSchema,
  sendOtpSchema,
  signInSchema,
} from "@repo/design-system/components/molecules/auth/schemas";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { resolveCallbackUrl } from "@/lib/routes";

/**
 * Password sign-in. Returns `{ twoFactorRequired: true }` when the account has
 * 2FA enabled (Better Auth responds with `twoFactorRedirect` and withholds the
 * session) so the client can route to the 2FA challenge.
 */
export async function signInEmailAction(
  input: z.infer<typeof signInSchema>
): Promise<ActionResult<{ twoFactorRequired?: boolean }>> {
  const logger = createRequestLogger({ action: "signInEmail" });

  try {
    const { email, password, rememberMe } = signInSchema.parse(input);
    await enforceRateLimit("sign-in");

    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: { email: email.toLowerCase().trim(), password, rememberMe },
    });

    const twoFactorRequired = Boolean(
      (result as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect
    );

    return twoFactorRequired
      ? { success: true, data: { twoFactorRequired: true } }
      : { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "signIn",
      logger,
    });
  }
}

/** Send a magic-link sign-in email. */
export async function signInMagicLinkAction(
  input: z.infer<typeof magicLinkSchema>,
  callbackUrl?: string
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "signInMagicLink" });

  try {
    const { email } = magicLinkSchema.parse(input);
    await enforceRateLimit("magic-link");

    await auth.api.signInMagicLink({
      headers: await headers(),
      body: {
        email: email.toLowerCase().trim(),
        callbackURL: resolveCallbackUrl(callbackUrl),
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "sendMagicLink",
      logger,
    });
  }
}

/** Send a sign-in email OTP. */
export async function sendSignInOtpAction(
  input: z.infer<typeof sendOtpSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "sendSignInOtp" });

  try {
    const { email } = sendOtpSchema.parse(input);
    await enforceRateLimit("otp-send");

    await auth.api.sendVerificationOTP({
      headers: await headers(),
      body: { email: email.toLowerCase().trim(), type: "sign-in" },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "sendOtp",
      logger,
    });
  }
}

const verifySignInOtpSchema = z.object({
  email: z.email(),
  code: z.string().min(1),
});

/** Verify a sign-in email OTP; creates the session on success. */
export async function verifySignInOtpAction(
  input: z.infer<typeof verifySignInOtpSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "verifySignInOtp" });

  try {
    const { email, code } = verifySignInOtpSchema.parse(input);
    await enforceRateLimit("sign-in");

    await auth.api.signInEmailOTP({
      headers: await headers(),
      body: { email: email.toLowerCase().trim(), otp: code },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "invalidOtp",
      logger,
    });
  }
}
