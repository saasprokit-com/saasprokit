"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";

/**
 * Sign the current user out. `auth.api.signOut` authenticates the caller from
 * the forwarded headers and clears the auth cookie server-side (via the
 * `nextCookies` after-hook) — no verifySession needed. Client navigates after.
 */
export async function signOutAction(): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "signOut" });

  try {
    await auth.api.signOut({ headers: await headers() });
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "signOut",
      baFallback: "unknownError",
      logger,
    });
  }
}
