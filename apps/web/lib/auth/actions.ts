"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/log";
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
      logger,
    });
  }
}

export async function stopImpersonatingAction(): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "stopImpersonating" });

  try {
    await auth.api.stopImpersonating({ headers: await headers() });
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "unauthorized",
      logger,
    });
  }
}
