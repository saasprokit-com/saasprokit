import "server-only";

import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";

/**
 * Audit action names for platform-admin mutations. Stored in AuditLog.action.
 */
export const ADMIN_AUDIT_ACTIONS = {
  SET_ROLE: "admin.user.set_role",
  BAN: "admin.user.ban",
  UNBAN: "admin.user.unban",
  IMPERSONATE: "admin.user.impersonate",
  REVOKE_SESSIONS: "admin.user.revoke_sessions",
  DELETE_USER: "admin.user.delete",
  DELETE_ORG: "admin.org.delete",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

interface RecordAdminAuditInput {
  action: AdminAuditAction;
  actorId: string;
  /** Serialized to JSON; e.g. { targetUserId, targetEmail, before, after }. */
  changes?: Record<string, unknown>;
}

/**
 * Write an audit entry for a platform-admin mutation.
 *
 * Log-and-continue: an audit failure must never abort the mutation it records, so
 * callers do not await a result that can throw. `actorId` is the acting staff member
 * (AuditLog.userId), which is why deleting that admin later cascades their entries.
 */
export async function recordAdminAudit(
  input: RecordAdminAuditInput
): Promise<void> {
  const logger = createRequestLogger({ action: "recordAdminAudit" });
  try {
    const requestHeaders = await headers();
    const ipAddress =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = requestHeaders.get("user-agent") ?? null;

    await database.auditLog.create({
      data: {
        userId: input.actorId,
        action: input.action,
        changes: input.changes ? JSON.stringify(input.changes) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      `Failed to record admin audit entry for ${input.action}`
    );
  }
}
