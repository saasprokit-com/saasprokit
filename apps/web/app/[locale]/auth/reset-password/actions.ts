"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { type ResetPasswordFormValues, resetPasswordSchema } from "../schemas";

export type ResetPasswordFormState = FormState<ResetPasswordFormValues>;

export async function resetPasswordAction(
  _prevState: ResetPasswordFormState,
  input: ResetPasswordFormValues & { token: string }
): Promise<ResetPasswordFormState> {
  const logger = createRequestLogger({ action: "resetPassword" });

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await enforceRateLimit("reset");

    await auth.api.resetPassword({
      headers: await headers(),
      body: { token: input.token, newPassword: parsed.data.password },
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, { fallback: "resetPassword", logger });
  }
}
