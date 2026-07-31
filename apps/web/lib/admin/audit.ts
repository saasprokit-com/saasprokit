import "server-only";

import { IP_ADDRESS_HEADERS } from "@repo/auth/ip-headers";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { getIp } from "better-auth/api";
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
  // Same resolution the rate limiter uses. Reading x-forwarded-for[0] directly
  // would record a client-supplied value: behind a CDN the real address is
  // appended to that chain, so the first entry is attacker-controlled — and an
  // audit trail of forged IPs is worse than none.
  const ipAddress = getIp(requestHeaders, {
    advanced: { ipAddress: { ipAddressHeaders: IP_ADDRESS_HEADERS } },
  });
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
