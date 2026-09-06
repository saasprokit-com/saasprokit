import { ORG_AUDIT_ACTIONS } from "@repo/utils/audit";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  getServerSession: vi.fn(),
  hasOrgPermission: vi.fn(),
  inviteLinkCreate: vi.fn(),
  inviteLinkFindFirst: vi.fn(),
  inviteLinkUpdate: vi.fn(),
  inviteLinkUpdateMany: vi.fn(),
  recordAudit: vi.fn(),
  revalidateOrgPage: vi.fn(),
  toActionError: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    inviteLink: {
      create: mocks.inviteLinkCreate,
      findFirst: mocks.inviteLinkFindFirst,
      update: mocks.inviteLinkUpdate,
      updateMany: mocks.inviteLinkUpdateMany,
    },
  },
}));

vi.mock("@/lib/audit/record", () => ({ recordAudit: mocks.recordAudit }));

vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));

vi.mock("@/lib/auth/auth", () => ({
  getServerSession: mocks.getServerSession,
  hasOrgPermission: mocks.hasOrgPermission,
}));

vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_URL: "http://localhost:3000" },
}));

vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));

import {
  createInviteLinkAction,
  revokeInviteLinkAction,
  revokeInviteLinksAction,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actionError.mockImplementation((code: string) => ({
    code,
    error: code,
    success: false,
  }));
  mocks.toActionError.mockImplementation(
    async (_error: unknown, { fallback }: { fallback: string }) => ({
      code: fallback,
      error: fallback,
      success: false,
    })
  );
  mocks.getServerSession.mockResolvedValue({ user: { id: "user_actor" } });
  mocks.hasOrgPermission.mockResolvedValue(true);
  mocks.recordAudit.mockResolvedValue(undefined);
  mocks.revalidateOrgPage.mockResolvedValue(undefined);
  mocks.inviteLinkCreate.mockResolvedValue({});
  mocks.inviteLinkUpdate.mockResolvedValue({});
});

describe("createInviteLinkAction", () => {
  it("records the link settings but never the token", async () => {
    await createInviteLinkAction(
      { status: "idle" },
      {
        expiresInDays: 7,
        maxUses: 5,
        organizationId: "org_1",
        orgSlug: "acme",
        role: "member",
      }
    );

    const call = mocks.recordAudit.mock.calls[0][0];
    expect(call).toMatchObject({
      action: ORG_AUDIT_ACTIONS.INVITE_LINK_CREATE,
      actorId: "user_actor",
      changes: { maxUses: 5, role: "member" },
      organizationId: "org_1",
    });
    expect(typeof call.changes.expiresAt).toBe("string");
    expect(JSON.stringify(call.changes)).not.toContain("token");
  });
});

describe("revokeInviteLinkAction", () => {
  it("records the revoked link id", async () => {
    mocks.inviteLinkFindFirst.mockResolvedValue({ id: "link_1" });

    await revokeInviteLinkAction({
      inviteLinkId: "link_1",
      organizationId: "org_1",
      orgSlug: "acme",
    });

    expect(mocks.recordAudit).toHaveBeenCalledWith({
      action: ORG_AUDIT_ACTIONS.INVITE_LINK_REVOKE,
      changes: { inviteLinkId: "link_1" },
      organizationId: "org_1",
    });
  });

  it("does not record when nothing active matched", async () => {
    mocks.inviteLinkFindFirst.mockResolvedValue(null);

    await revokeInviteLinkAction({
      inviteLinkId: "link_1",
      organizationId: "org_1",
      orgSlug: "acme",
    });

    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });
});

describe("revokeInviteLinksAction", () => {
  it("records the requested ids and the actual count", async () => {
    mocks.inviteLinkUpdateMany.mockResolvedValue({ count: 2 });

    await revokeInviteLinksAction(
      {
        inviteLinkIds: ["link_1", "link_2", "link_3"],
        organizationId: "org_1",
        orgSlug: "acme",
      },
      null,
      new FormData()
    );

    expect(mocks.recordAudit).toHaveBeenCalledWith({
      action: ORG_AUDIT_ACTIONS.INVITE_LINK_REVOKE,
      changes: {
        inviteLinkIds: ["link_1", "link_2", "link_3"],
        revokedCount: 2,
      },
      organizationId: "org_1",
    });
  });

  it("does not record when no active invite links matched", async () => {
    mocks.inviteLinkUpdateMany.mockResolvedValue({ count: 0 });

    await revokeInviteLinksAction(
      { inviteLinkIds: ["link_1"], organizationId: "org_1", orgSlug: "acme" },
      null,
      new FormData()
    );

    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });
});
