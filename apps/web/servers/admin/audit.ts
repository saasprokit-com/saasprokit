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
 * Log-and-continue: this swallows its own errors and never rejects, so a caller can
 * await it (awaiting keeps the write alive on serverless) without an audit failure
 * ever aborting the mutation it records. `actorId` is the acting staff member
 * (AuditLog.userId), which is why deleting that admin later cascades their entries.
 */
/**
 * Build the AuditLog row for an admin mutation, reading IP / User-Agent from the
 * request headers. Exposed so a caller can enlist `database.auditLog.create({ data })`
 * in its own `$transaction` — making the audit atomic with the mutation it records
 * (see deleteOrganizationAction) — instead of the fire-and-log path in recordAdminAudit.
 */
export async function buildAdminAuditData(input: RecordAdminAuditInput) {
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
  // Captured before the insert so the catch can log the same forensic context the
  // row would have carried, if the AuditLog insert itself is what fails.
  let data: Awaited<ReturnType<typeof buildAdminAuditData>> | null = null;
  try {
    data = await buildAdminAuditData(input);
    await database.auditLog.create({ data });
  } catch (error) {
    // Never rejects, but preserve the full record so the app log can stand in as a
    // fallback audit trail: without actor/target/context there is no way to
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
