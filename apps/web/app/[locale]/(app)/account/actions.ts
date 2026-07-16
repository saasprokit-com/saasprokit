"use server";

import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
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
 * Logout a specific session
 */
export async function logoutSessionAction(sessionId: string) {
  const logger = createRequestLogger({
    action: "logoutSession",
    sessionId,
  });

  try {
    const { session, error } = await verifySession();
    if (error) {
      return error;
    }

    const userLogger = logger.child({ userId: session.user.id });

    // Verify the session belongs to the current user
    const targetSession = await database.session.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession || targetSession.userId !== session.user.id) {
      userLogger.warn({ sessionId }, "Session not found or unauthorized");
      return actionError("sessionNotFound");
    }

    // Delete the session
    await database.session.delete({
      where: { id: sessionId },
    });

    userLogger.info({ sessionId }, "Session logged out");

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "logoutSession", logger });
  }
}

/**
 * Logout all other sessions
 * Keeps current session active
 */
export async function logoutAllOtherSessionsAction() {
  const logger = createRequestLogger({
    action: "logoutAllOtherSessions",
  });

  try {
    const { session, error } = await verifySession();
    if (error) {
      return error;
    }

    const userLogger = logger.child({ userId: session.user.id });

    // PERFORMANCE: Use deleteMany without loading data to avoid memory overhead
    // If user has many sessions (e.g., due to compromised token generation),
    // loading all sessions into memory could cause memory exhaustion
    const deleteResult = await database.session.deleteMany({
      where: {
        userId: session.user.id,
        NOT: { id: session.session.id },
      },
    });

    userLogger.info(
      {
        sessionCount: deleteResult.count,
      },
      "All other sessions logged out"
    );

    await revalidateAccountPage("security");

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "logoutAllSessions", logger });
  }
}

/**
 * Permanently delete the user account immediately
 * This action:
 * 1. Verifies the user session
 * 2. Deletes the user (cascades delete all related data)
 * 3. Returns success for redirect to logout
 *
 * SECURITY: CSRF protection is enforced by Next.js via allowedOrigins validation on the Origin header
 */
export async function deleteAccountAction() {
  const logger = createRequestLogger({
    action: "deleteAccount",
  });

  try {
    const { session, error } = await verifySession();
    if (error) {
      logger.warn("Unauthorized account deletion attempt");
      return error;
    }

    const userLogger = logger.child({ userId: session.user.id });

    // Delete user (cascades to all related records via Prisma schema)
    // CASCADE deletes: sessions, members, invitations, files, twofactor, accounts, auditlogs
    await database.user.delete({
      where: { id: session.user.id },
    });

    userLogger.info({}, "Account deleted permanently");

    // Session is already deleted via cascade, so next request will be unauthenticated
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "deleteAccount", logger });
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
