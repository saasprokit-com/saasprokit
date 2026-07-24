"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { resolveCallbackUrl } from "@/lib/routes";
import { type SignUpFormValues, signUpSchema } from "../schemas";

export type SignUpFormState = FormState<SignUpFormValues>;

/**
 * Under `requireEmailVerification` this creates no session
 * and sends a verification email — the client routes to the verify-email page.
 */
export async function signUpEmailAction(
  _prevState: SignUpFormState,
  input: SignUpFormValues & { callbackUrl?: string }
): Promise<SignUpFormState> {
  const logger = createRequestLogger({ action: "signUpEmail" });

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const { name, email, password } = parsed.data;
    await enforceRateLimit("sign-up");

    await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name,
        email: email.toLowerCase().trim(),
        password,
        callbackURL: resolveCallbackUrl(input.callbackUrl),
      },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "signUp", logger });
  }
}
