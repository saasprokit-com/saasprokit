"use server";

import { auth } from "@repo/auth/server";
import { forgotPasswordSchema } from "@repo/design-system/components/molecules/auth/schemas";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import type { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { PAGE_ROUTES } from "@/lib/routes";

/** Send a password-reset email. */
export async function requestPasswordResetAction(
  input: z.infer<typeof forgotPasswordSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "requestPasswordReset" });

  try {
    const { email } = forgotPasswordSchema.parse(input);
    await enforceRateLimit("forgot");

    await auth.api.requestPasswordReset({
      headers: await headers(),
      body: {
        email: email.toLowerCase().trim(),
        redirectTo: PAGE_ROUTES.RESET_PASSWORD,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "sendResetEmail",
      logger,
    });
  }
}
