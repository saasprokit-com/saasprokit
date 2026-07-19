"use server";

import { auth } from "@repo/auth/server";
import { signUpSchema } from "@repo/design-system/components/molecules/auth/schemas";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import type { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { PAGE_ROUTES } from "@/lib/routes";

/**
 * Create an account. Under `requireEmailVerification` this creates no session
 * and sends a verification email — the client routes to the verify-email page.
 */
export async function signUpEmailAction(
  input: z.infer<typeof signUpSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "signUpEmail" });

  try {
    const { name, email, password } = signUpSchema.parse(input);
    await enforceRateLimit("sign-up");

    await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name,
        email: email.toLowerCase().trim(),
        password,
        callbackURL: PAGE_ROUTES.ORG,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return actionError("tooManyRequests");
    }
    return toActionError(error, {
      fallback: "signUp",
      logger,
    });
  }
}
