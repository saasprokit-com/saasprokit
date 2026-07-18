"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { passwordSchema } from "@repo/utils/user";
import { headers } from "next/headers";
import { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";

// Server-side trust boundary: the reset action is a public POST endpoint, so it
// must re-enforce the app's password-complexity policy (the client resolver runs
// only in the browser, and Better Auth's backstop checks length only).
const resetPasswordActionSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

/** Consume a reset token and set a new password. */
export async function resetPasswordAction(
  input: z.infer<typeof resetPasswordActionSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "resetPassword" });

  try {
    const { token, newPassword } = resetPasswordActionSchema.parse(input);
    await enforceRateLimit("reset");

    await auth.api.resetPassword({
      headers: await headers(),
      body: { token, newPassword },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "resetPassword",
      baFallback: "unknownError",
      logger,
    });
  }
}
