"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/log";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { PAGE_ROUTES } from "@/lib/routes";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "../schemas";

export type ForgotPasswordFormState = FormState<ForgotPasswordFormValues>;

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordFormState,
  input: ForgotPasswordFormValues
): Promise<ForgotPasswordFormState> {
  const logger = createRequestLogger({ action: "requestPasswordReset" });

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("forgot");

    await auth.api.requestPasswordReset({
      headers: await headers(),
      body: {
        email: parsed.data.email.toLowerCase().trim(),
        redirectTo: PAGE_ROUTES.RESET_PASSWORD,
      },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "sendResetEmail", logger });
  }
}
