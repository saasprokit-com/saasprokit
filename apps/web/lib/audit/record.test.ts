import { ORG_AUDIT_ACTIONS } from "@repo/utils/audit";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  getIp: vi.fn(),
  getServerSession: vi.fn(),
  headers: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: { auditLog: { create: mocks.auditLogCreate } },
}));

vi.mock("@repo/auth/ip-headers", () => ({
  IP_ADDRESS_HEADERS: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
}));

vi.mock("better-auth/api", () => ({ getIp: mocks.getIp }));

vi.mock("@repo/logger/server", () => ({
  createRequestLogger: () => ({
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
  }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

vi.mock("@/lib/auth/auth", () => ({
  getServerSession: mocks.getServerSession,
}));

import { recordAudit } from "./record";

const requestHeaders = new Headers({ "user-agent": "vitest" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.getIp.mockReturnValue("203.0.113.9");
  mocks.auditLogCreate.mockResolvedValue({});
});

describe("recordAudit", () => {
  it("writes an org-scoped row using the explicit actor", async () => {
    await recordAudit({
      action: ORG_AUDIT_ACTIONS.MEMBER_INVITE,
      actorId: "user_admin",
      changes: { email: "new@example.com", role: "member" },
      organizationId: "org_1",
    });

    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        action: "org.member.invite",
        changes: JSON.stringify({ email: "new@example.com", role: "member" }),
        ipAddress: "203.0.113.9",
        organizationId: "org_1",
        userAgent: "vitest",
        userId: "user_admin",
      },
    });
  });

  it("resolves the actor from the session when none is given", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_session" } });

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.DELETE,
      organizationId: "org_1",
    });

    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "org.delete",
        changes: null,
        organizationId: "org_1",
        userId: "user_session",
      }),
    });
  });

  it("skips the write and warns when no actor can be resolved", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.SETTINGS_UPDATE,
      organizationId: "org_1",
    });

    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.loggerWarn).toHaveBeenCalledTimes(1);
  });

  it("swallows a database failure and logs it with the payload", async () => {
    const failure = new Error("connection reset");
    mocks.auditLogCreate.mockRejectedValue(failure);

    await expect(
      recordAudit({
        action: ORG_AUDIT_ACTIONS.MEMBER_REMOVE,
        actorId: "user_admin",
        changes: { removedCount: 2 },
        organizationId: "org_1",
      })
    ).resolves.toBeUndefined();

    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user_admin",
        auditAction: "org.member.remove",
        changes: { removedCount: 2 },
        err: failure,
        organizationId: "org_1",
      }),
      "Failed to record audit entry"
    );
  });
});
