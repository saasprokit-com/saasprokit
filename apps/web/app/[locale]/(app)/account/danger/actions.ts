"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";

/**
 * Goes through Better Auth's deleteUser API, which:
 * - authenticates the caller itself (authoritative session re-read from the DB,
 *   bypassing the cookie cache) — no verifySession needed;
 * - requires a fresh session (freshAge, default 1 day) since no password is
 *   supplied — a stale session yields a SESSION_EXPIRED error;
 * - runs the `deleteUser.beforeDelete` hook (cancels the user's Stripe
 *   subscription, deletes solo-owned orgs, or blocks when the user still solely
 *   owns an org with other members);
 * - deletes the user + sessions and clears the auth cookie server-side.
 * The Prisma schema cascade removes the remaining related rows (members,
 * invitations, 2FA, accounts, audit logs; files keep the row with a null owner).
 *
 * SECURITY: CSRF protection is enforced by Next.js via allowedOrigins validation on the Origin header
 */
export async function deleteAccountAction() {
  const logger = createRequestLogger({
    action: "deleteAccount",
  });

  try {
    await auth.api.deleteUser({
      headers: await headers(),
      body: {},
    });

    logger.info("Account deleted permanently");

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "deleteAccount",
      logger,
    });
  }
}

/**
 * Form-adapted wrapper for useActionState compatibility.
 * Delegates to deleteAccountAction.
 */
export async function deleteAccountFormAction(
  _prevState: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  return await deleteAccountAction();
}
