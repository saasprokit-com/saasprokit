import "server-only";

import { IP_ADDRESS_HEADERS } from "@repo/auth/ip-headers";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import type { AuditAction } from "@repo/utils/audit";
import { getIp } from "better-auth/api";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/auth";

export interface RecordAuditInput {
  action: AuditAction;
  actorId?: string;
  changes?: Record<string, unknown>;
  organizationId?: string;
}

async function resolveActorId(actorId?: string): Promise<string | null> {
  if (actorId) {
    return actorId;
  }
  const session = await getServerSession();
  return session?.user?.id ?? null;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  const logger = createRequestLogger({ action: "recordAudit" });

  try {
    const actorId = await resolveActorId(input.actorId);
    if (!actorId) {
      logger.warn(
        {
          auditAction: input.action,
          organizationId: input.organizationId ?? null,
        },
        "Skipped audit entry without an actor"
      );
      return;
    }

    const requestHeaders = await headers();

    await database.auditLog.create({
      data: {
        action: input.action,
        changes: input.changes ? JSON.stringify(input.changes) : null,
        ipAddress: getIp(requestHeaders, {
          advanced: { ipAddress: { ipAddressHeaders: IP_ADDRESS_HEADERS } },
        }),
        organizationId: input.organizationId ?? null,
        userAgent: requestHeaders.get("user-agent") ?? null,
        userId: actorId,
      },
    });
  } catch (error) {
    logger.error(
      {
        actorId: input.actorId ?? null,
        auditAction: input.action,
        changes: input.changes,
        err: error instanceof Error ? error : new Error(String(error)),
        organizationId: input.organizationId ?? null,
      },
      "Failed to record audit entry"
    );
  }
}
