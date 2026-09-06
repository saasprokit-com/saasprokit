import { ORG_AUDIT_ACTIONS } from "@repo/utils/audit";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  cancelInvitation: vi.fn(),
  createInvitation: vi.fn(),
  hasOrgPermission: vi.fn(),
  headers: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationFindMany: vi.fn(),
  recordAudit: vi.fn(),
  revalidateOrgPage: vi.fn(),
  toActionError: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: {
    api: {
      cancelInvitation: mocks.cancelInvitation,
      createInvitation: mocks.createInvitation,
    },
  },
}));

vi.mock("@repo/database", () => ({
  database: {
    invitation: {
      findFirst: mocks.invitationFindFirst,
      findMany: mocks.invitationFindMany,
    },
  },
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

vi.mock("@/lib/audit/record", () => ({ recordAudit: mocks.recordAudit }));

vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));

vi.mock("@/lib/auth/auth", () => ({
  hasOrgPermission: mocks.hasOrgPermission,
}));

vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));

import {
  cancelInvitationAction,
  cancelInvitationsAction,
  resendInvitationAction,
} from "./actions";

const requestHeaders = new Headers({ cookie: "session=test" });

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
  mocks.hasOrgPermission.mockResolvedValue(true);
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.recordAudit.mockResolvedValue(undefined);
  mocks.revalidateOrgPage.mockResolvedValue(undefined);
  mocks.cancelInvitation.mockResolvedValue({});
  mocks.createInvitation.mockResolvedValue({});
});

describe("resendInvitationAction", () => {
  it("records the resend with the invitation email", async () => {
    mocks.invitationFindFirst.mockResolvedValue({
      email: "pending@example.com",
      role: "member",
    });

    await resendInvitationAction({
      invitationId: "inv_1",
      organizationId: "org_1",
      orgSlug: "acme",
    });

    expect(mocks.recordAudit).toHaveBeenCalledWith({
      action: ORG_AUDIT_ACTIONS.INVITATION_RESEND,
      changes: { email: "pending@example.com", invitationId: "inv_1" },
      organizationId: "org_1",
    });
  });

  it("does not record when the invitation is not pending", async () => {
    mocks.invitationFindFirst.mockResolvedValue(null);

    await resendInvitationAction({
      invitationId: "inv_1",
      organizationId: "org_1",
      orgSlug: "acme",
    });

    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });
});

describe("cancelInvitationAction", () => {
  it("records the cancellation", async () => {
    mocks.invitationFindFirst.mockResolvedValue({ id: "inv_1" });

    await cancelInvitationAction({
      invitationId: "inv_1",
      organizationId: "org_1",
      orgSlug: "acme",
    });

    expect(mocks.recordAudit).toHaveBeenCalledWith({
      action: ORG_AUDIT_ACTIONS.INVITATION_CANCEL,
      changes: { invitationId: "inv_1" },
      organizationId: "org_1",
    });
  });

  it("does not record when the invitation is not pending", async () => {
    mocks.invitationFindFirst.mockResolvedValue(null);

    await cancelInvitationAction({
      invitationId: "inv_1",
      organizationId: "org_1",
      orgSlug: "acme",
    });

    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });
});

describe("cancelInvitationsAction", () => {
  it("records one summary row with the ids that were cancelled", async () => {
    mocks.invitationFindMany.mockResolvedValue([
      { id: "inv_1" },
      { id: "inv_2" },
    ]);
    mocks.cancelInvitation
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("gone"));

    await cancelInvitationsAction(
      { invitationIds: ["inv_1", "inv_2"], organizationId: "org_1", orgSlug: "acme" },
      null,
      new FormData()
    );

    expect(mocks.recordAudit).toHaveBeenCalledWith({
      action: ORG_AUDIT_ACTIONS.INVITATION_CANCEL,
      changes: { cancelledCount: 1, invitationIds: ["inv_1"] },
      organizationId: "org_1",
    });
  });

  it("index-matches settled results to pendingInvitations so a rejected middle cancel is excluded from the audit ids", async () => {
    mocks.invitationFindMany.mockResolvedValue([
      { id: "inv_1" },
      { id: "inv_2" },
      { id: "inv_3" },
    ]);
    mocks.cancelInvitation
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("gone"))
      .mockResolvedValueOnce({});

    await cancelInvitationsAction(
      {
        invitationIds: ["inv_1", "inv_2", "inv_3"],
        organizationId: "org_1",
        orgSlug: "acme",
      },
      null,
      new FormData()
    );

    expect(mocks.recordAudit).toHaveBeenCalledWith({
      action: ORG_AUDIT_ACTIONS.INVITATION_CANCEL,
      changes: { cancelledCount: 2, invitationIds: ["inv_1", "inv_3"] },
      organizationId: "org_1",
    });
  });

  it("does not record when there are no pending invitations to cancel", async () => {
    mocks.invitationFindMany.mockResolvedValue([]);

    await cancelInvitationsAction(
      { invitationIds: ["inv_1"], organizationId: "org_1", orgSlug: "acme" },
      null,
      new FormData()
    );

    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });

  it("does not record when every cancellation fails", async () => {
    mocks.invitationFindMany.mockResolvedValue([{ id: "inv_1" }]);
    mocks.cancelInvitation.mockRejectedValue(new Error("gone"));

    await cancelInvitationsAction(
      { invitationIds: ["inv_1"], organizationId: "org_1", orgSlug: "acme" },
      null,
      new FormData()
    );

    expect(mocks.recordAudit).not.toHaveBeenCalled();
  });
});
