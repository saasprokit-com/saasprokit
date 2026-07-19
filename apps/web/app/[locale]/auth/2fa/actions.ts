"use server";

import { auth } from "@repo/auth/server";
import { twoFactorSchema } from "@repo/design-system/components/molecules/auth/schemas";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import type { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";

/** Verify the TOTP code during a 2FA sign-in challenge; promotes to a session. */
export async function verifyTwoFactorAction(
  input: z.infer<typeof twoFactorSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "verifyTwoFactor" });

  try {
    const { code } = twoFactorSchema.parse(input);
    await enforceRateLimit("2fa");

    await auth.api.verifyTOTP({
      headers: await headers(),
      body: { code },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "verify2fa",
      baFallback: "unknownError",
      logger,
    });
  }
}
