"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { verifySession } from "@/lib/auth/action-auth";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { revalidateAccountPage } from "@/lib/infrastructure/revalidation";
import { profileSchema } from "./schemas";

/**
 * Update user profile (name and avatar)
 * Email cannot be changed for security reasons
 */
export async function updateProfileAction(formData: FormData) {
  try {
    const { session, error } = await verifySession();
    if (error) {
      return error;
    }

    const rawName = formData.get("name") as string;
    const image = formData.get("image") as string | null;

    const parsed = profileSchema.safeParse({ name: rawName });
    if (!parsed.success) {
      return actionError("nameTooShort");
    }

    const { name } = parsed.data;

    // Validate image URL if provided
    if (image) {
      try {
        const url = new URL(image);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          return actionError("invalidImageUrl");
        }
      } catch {
        return actionError("invalidImageUrl");
      }
    }

    // Update user profile
    await database.user.update({
      where: { id: session.user.id },
      data: {
        name,
        ...(image && { image }),
      },
    });

    await revalidateAccountPage("profile");

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "updateProfile" });
  }
}

/**
 * Logout a specific session, identified by its Better Auth session token.
 * No verifySession needed: revokeSession authenticates the caller itself and
 * only revokes sessions owned by that caller.
 */
export async function logoutSessionAction(token: string) {
  const logger = createRequestLogger({
    action: "logoutSession",
  });

  try {
    await auth.api.revokeSession({
      headers: await headers(),
      body: { token },
    });

    logger.info("Session logged out");

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "logoutSession",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Logout all other sessions
 * Keeps current session active
 * No verifySession needed: revokeOtherSessions authenticates the caller itself.
 */
export async function logoutAllOtherSessionsAction() {
  const logger = createRequestLogger({
    action: "logoutAllOtherSessions",
  });

  try {
    // Revoke every session except the current one via Better Auth.
    await auth.api.revokeOtherSessions({
      headers: await headers(),
    });

    logger.info("All other sessions logged out");

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "logoutAllSessions",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Permanently delete the user account immediately.
 *
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
      baFallback: "unknownError",
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
