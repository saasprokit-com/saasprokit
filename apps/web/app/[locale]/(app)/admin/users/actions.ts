"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { hasAdminPermission } from "@/lib/auth/admin";
import { type ActionResult, getServerSession } from "@/lib/auth/auth";
import { revalidateAdminPage } from "@/lib/infrastructure/revalidation";
import { ADMIN_PAGES } from "@/lib/routes";
import { ADMIN_AUDIT_ACTIONS, recordAdminAudit } from "@/servers/admin/audit";
import { guardUserMutation } from "./guards";
import {
  type BanUserInput,
  banUserSchema,
  type SetUserRoleInput,
  setUserRoleSchema,
  type TargetUserInput,
  targetUserSchema,
} from "./schemas";

const SECONDS_PER_DAY = 86_400;

/**
 * Set a user's platform role. Self-demotion is blocked at the auth layer by a
 * `before` hook on `/admin/set-role` (packages/auth/server.ts); the pure guard
 * here is the friendly first-line message before the round-trip.
 */
export async function setUserRoleAction(
  input: SetUserRoleInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "setUserRoleAction" });
  try {
    const data = setUserRoleSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ user: ["set-role"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    const guard = guardUserMutation({
      actorId,
      targetId: data.userId,
      mutation: "set-role",
    });
    if (!guard.ok) {
      return actionError(guard.code);
    }

    await auth.api.setRole({
      body: { userId: data.userId, role: data.role },
      headers: await headers(),
    });

    await recordAdminAudit({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.SET_ROLE,
      changes: { targetUserId: data.userId, role: data.role },
    });

    await Promise.all([
      revalidateAdminPage(ADMIN_PAGES.USERS),
      revalidateAdminPage(`users/${data.userId}`),
    ]);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "updateRole",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Ban a user. Better Auth blocks self-ban and revokes the target's sessions;
 * the pure guard adds a friendly self-target message before the API call.
 */
export async function banUserAction(
  input: BanUserInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "banUserAction" });
  try {
    const data = banUserSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ user: ["ban"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    const guard = guardUserMutation({
      actorId,
      targetId: data.userId,
      mutation: "ban",
    });
    if (!guard.ok) {
      return actionError(guard.code);
    }

    await auth.api.banUser({
      body: {
        userId: data.userId,
        banReason: data.banReason,
        banExpiresIn: data.banExpiresInDays
          ? data.banExpiresInDays * SECONDS_PER_DAY
          : undefined,
      },
      headers: await headers(),
    });

    await recordAdminAudit({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.BAN,
      changes: {
        targetUserId: data.userId,
        banReason: data.banReason,
        banExpiresInDays: data.banExpiresInDays,
      },
    });

    await Promise.all([
      revalidateAdminPage(ADMIN_PAGES.USERS),
      revalidateAdminPage(`users/${data.userId}`),
    ]);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "banUser",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Lift a ban. Better Auth checks `user:["ban"]` for this endpoint too, and there
 * is no self-target risk, so no pure guard is needed.
 */
export async function unbanUserAction(
  input: TargetUserInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "unbanUserAction" });
  try {
    const data = targetUserSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ user: ["ban"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    await auth.api.unbanUser({
      body: { userId: data.userId },
      headers: await headers(),
    });

    await recordAdminAudit({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.UNBAN,
      changes: { targetUserId: data.userId },
    });

    await Promise.all([
      revalidateAdminPage(ADMIN_PAGES.USERS),
      revalidateAdminPage(`users/${data.userId}`),
    ]);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "unbanUser",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Impersonate a user. Better Auth blocks impersonating admins and parks the
 * caller's token in a signed cookie; nextCookies() propagates the swap. No
 * revalidation — the client hard-navigates into the impersonated session.
 */
export async function impersonateUserAction(
  input: TargetUserInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "impersonateUserAction" });
  try {
    const data = targetUserSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ user: ["impersonate"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    const guard = guardUserMutation({
      actorId,
      targetId: data.userId,
      mutation: "impersonate",
    });
    if (!guard.ok) {
      return actionError(guard.code);
    }

    await auth.api.impersonateUser({
      body: { userId: data.userId },
      headers: await headers(),
    });

    await recordAdminAudit({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.IMPERSONATE,
      changes: { targetUserId: data.userId },
    });

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "impersonateUser",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Revoke every session for a user. Self-revoke is just a full logout, so no
 * pure guard is needed.
 */
export async function revokeUserSessionsAction(
  input: TargetUserInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "revokeUserSessionsAction" });
  try {
    const data = targetUserSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ session: ["revoke"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    await auth.api.revokeUserSessions({
      body: { userId: data.userId },
      headers: await headers(),
    });

    await recordAdminAudit({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.REVOKE_SESSIONS,
      changes: { targetUserId: data.userId },
    });

    await Promise.all([
      revalidateAdminPage(ADMIN_PAGES.USERS),
      revalidateAdminPage(`users/${data.userId}`),
    ]);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "revokeUserSessions",
      baFallback: "unknownError",
      logger,
    });
  }
}

/**
 * Permanently delete a user. Better Auth blocks self-delete; the pure guard
 * surfaces a friendly message before the API call.
 */
export async function removeUserAction(
  input: TargetUserInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "removeUserAction" });
  try {
    const data = targetUserSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ user: ["delete"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    const guard = guardUserMutation({
      actorId,
      targetId: data.userId,
      mutation: "delete",
    });
    if (!guard.ok) {
      return actionError(guard.code);
    }

    await auth.api.removeUser({
      body: { userId: data.userId },
      headers: await headers(),
    });

    await recordAdminAudit({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.DELETE_USER,
      changes: { targetUserId: data.userId },
    });

    await Promise.all([
      revalidateAdminPage(ADMIN_PAGES.USERS),
      revalidateAdminPage(`users/${data.userId}`),
    ]);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "deleteUser",
      baFallback: "unknownError",
      logger,
    });
  }
}
