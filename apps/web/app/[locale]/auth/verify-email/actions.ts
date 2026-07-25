"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { PAGE_ROUTES } from "@/lib/routes";

const resendSchema = z.object({ email: z.email() });

export async function resendVerificationEmailAction(
  input: z.infer<typeof resendSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "resendVerificationEmail" });

  try {
    const { email } = resendSchema.parse(input);
    await enforceRateLimit("verify-email-resend");

    await auth.api.sendVerificationEmail({
      headers: await headers(),
      body: { email: email.toLowerCase().trim(), callbackURL: PAGE_ROUTES.ORG },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "resendVerificationEmail",
      logger,
    });
  }
}

export async function resendVerificationEmailFormAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return await resendVerificationEmailAction({
    email: String(formData.get("email") ?? ""),
  });
}
