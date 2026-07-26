import "server-only";

import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";

export const ADMIN_AUDIT_ACTIONS = {
  SET_ROLE: "admin.user.set_role",
  BAN: "admin.user.ban",
  UNBAN: "admin.user.unban",
  IMPERSONATE: "admin.user.impersonate",
  REVOKE_SESSIONS: "admin.user.revoke_sessions",
  DELETE_USER: "admin.user.delete",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

interface RecordAdminAuditInput {
  action: AdminAuditAction;
  actorId: string;
  /** Serialized to JSON; e.g. { targetUserId, targetEmail, before, after }. */
  changes?: Record<string, unknown>;
}

async function buildAdminAuditData(input: RecordAdminAuditInput) {
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent") ?? null;

  return {
    userId: input.actorId,
    action: input.action,
    changes: input.changes ? JSON.stringify(input.changes) : null,
    ipAddress,
    userAgent,
  };
}

export async function recordAdminAudit(
  input: RecordAdminAuditInput
): Promise<void> {
  const logger = createRequestLogger({ action: "recordAdminAudit" });
  let data: Awaited<ReturnType<typeof buildAdminAuditData>> | null = null;
  try {
    data = await buildAdminAuditData(input);
    await database.auditLog.create({ data });
  } catch (error) {
    // reconstruct who acted on whom when the AuditLog insert is itself what failed.
    logger.error(
      {
        err: error instanceof Error ? error : new Error(String(error)),
        auditAction: input.action,
        actorId: input.actorId,
        changes: input.changes,
        ipAddress: data?.ipAddress ?? null,
        userAgent: data?.userAgent ?? null,
      },
      "Failed to record admin audit entry"
    );
  }
}
