"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";

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

/**
 * End an active impersonation and restore the admin's own session. Better Auth's
 * stopImpersonating deletes the impersonated session and swaps the parked admin
 * cookie back in; nextCookies() propagates that Set-Cookie from this server action.
 */
export async function stopImpersonatingAction(): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "stopImpersonating" });

  try {
    await auth.api.stopImpersonating({ headers: await headers() });
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "unauthorized",
      baFallback: "unknownError",
      logger,
    });
  }
}
