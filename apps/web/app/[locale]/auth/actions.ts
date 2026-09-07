"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/log";
import { headers } from "next/headers";
import { z } from "zod";
import { toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { resolveCallbackUrl } from "@/lib/routes";

const socialProviderSchema = z.enum(["google", "github"]);

/**
 * `disableRedirect: true` makes Better Auth return the provider authorization
 * URL instead of redirecting server-side; the client navigates there. The OAuth
 * state cookie is set via `nextCookies`.
 */
export async function signInSocialAction(
  provider: string,
  callbackUrl?: string
): Promise<ActionResult<{ url?: string }>> {
  const logger = createRequestLogger({ action: "signInSocial" });

  try {
    const validated = socialProviderSchema.parse(provider);

    const result = await auth.api.signInSocial({
      headers: await headers(),
      body: {
        provider: validated,
        callbackURL: resolveCallbackUrl(callbackUrl),
        disableRedirect: true,
      },
    });

    return { success: true, data: { url: result?.url ?? undefined } };
  } catch (error) {
    return toActionError(error, {
      fallback: "signIn",
      logger,
    });
  }
}
