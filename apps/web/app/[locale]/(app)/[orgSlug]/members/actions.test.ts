import { ORG_ROLES } from "@repo/auth/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  createInvitation: vi.fn(),
  getServerSession: vi.fn(),
  hasOrgPermission: vi.fn(),
  headers: vi.fn(),
  invitationFindMany: vi.fn(),
  memberDeleteMany: vi.fn(),
  memberFindFirst: vi.fn(),
  memberFindMany: vi.fn(),
  memberUpdateMany: vi.fn(),
  removeMember: vi.fn(),
  revalidateOrgPage: vi.fn(),
  toActionError: vi.fn(),
  transaction: vi.fn(),
  txMemberFindFirst: vi.fn(),
  txMemberUpdate: vi.fn(),
  updateMemberRole: vi.fn(),
  userFindMany: vi.fn(),
  verifySession: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: {
    api: {
      createInvitation: mocks.createInvitation,
      removeMember: mocks.removeMember,
      updateMemberRole: mocks.updateMemberRole,
    },
  },
}));

vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.transaction,
    invitation: { findMany: mocks.invitationFindMany },
    member: {
      deleteMany: mocks.memberDeleteMany,
      findFirst: mocks.memberFindFirst,
      findMany: mocks.memberFindMany,
      updateMany: mocks.memberUpdateMany,
    },
    user: { findMany: mocks.userFindMany },
  },
}));

vi.mock("@repo/logger/log", () => ({
  createRequestLogger: () => ({ error: vi.fn() }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

vi.mock("@/lib/auth/action-auth", () => ({
  verifySession: mocks.verifySession,
}));

vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));

vi.mock("@/lib/auth/auth", () => ({
  getServerSession: mocks.getServerSession,
  hasOrgPermission: mocks.hasOrgPermission,
}));


vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));

import { ORG_PAGES } from "@/lib/routes";
import {
  bulkInviteAction,
  inviteMemberAction,
  removeMembersAction,
  transferOwnershipAction,
  updateMemberRoleAction,
} from "./actions";

const input = {
  email: "new-member@example.com",
  organizationId: "org_1",
  orgSlug: "acme",
  role: ORG_ROLES.MEMBER,
};

const requestHeaders = new Headers({ cookie: "session=test" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actionError.mockImplementation((code: string) => ({
    code,
    error: code,
    status: "error",
    success: false,
  }));
  mocks.toActionError.mockImplementation(
    async (_error: unknown, { fallback }: { fallback: string }) => ({
      code: fallback,
      error: fallback,
      status: "error",
      success: false,
    })
  );
  mocks.hasOrgPermission.mockResolvedValue(true);
  mocks.createInvitation.mockResolvedValue({});
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.revalidateOrgPage.mockResolvedValue(undefined);
});

describe("inviteMemberAction", () => {
  it("validates input before calling Better Auth", async () => {
    const result = await inviteMemberAction(
      { status: "idle" },
      { ...input, email: "invalid-email" }
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBeDefined();
    expect(mocks.createInvitation).not.toHaveBeenCalled();
  });

  it("delegates authorization and the seat limit to Better Auth", async () => {
    const result = await inviteMemberAction({ status: "idle" }, input);

    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
    expect(mocks.createInvitation).toHaveBeenCalledWith({
      body: {
        email: "new-member@example.com",
        role: ORG_ROLES.MEMBER,
        organizationId: "org_1",
      },
      headers: requestHeaders,
    });
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.MEMBERS
    );
    expect(result).toEqual({ status: "success" });
  });

  it("maps a Better Auth rejection without revalidating", async () => {
    const failure = {
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION" },
    };
    mocks.createInvitation.mockRejectedValue(failure);

    const result = await inviteMemberAction({ status: "idle" }, input);

    expect(mocks.toActionError).toHaveBeenCalledWith(failure, {
      fallback: "invalidInput",
    });
    expect(mocks.revalidateOrgPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "error", code: "invalidInput" });
  });

});

describe("bulkInviteAction", () => {
  const bulkInput = {
    emails: "one@example.com, two@example.com",
    organizationId: "org_1",
    orgSlug: "acme",
    role: ORG_ROLES.MEMBER,
  };

  beforeEach(() => {
    mocks.userFindMany.mockResolvedValue([]);
    mocks.memberFindMany.mockResolvedValue([]);
    mocks.invitationFindMany.mockResolvedValue([]);
  });

  it("denies unauthorized callers before any skip read", async () => {
    mocks.hasOrgPermission.mockResolvedValue(false);

    const result = await bulkInviteAction({ status: "idle" }, bulkInput);

    expect(mocks.hasOrgPermission).toHaveBeenCalledWith("org_1", {
      invitation: ["create"],
    });
    expect(mocks.userFindMany).not.toHaveBeenCalled();
    expect(mocks.invitationFindMany).not.toHaveBeenCalled();
    expect(mocks.createInvitation).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "error", code: "unauthorized" });
  });

  it("authorizes, then reads skip state, then invites", async () => {
    const result = await bulkInviteAction({ status: "idle" }, bulkInput);

    expect(mocks.hasOrgPermission).toHaveBeenCalledBefore(mocks.userFindMany);
    expect(mocks.userFindMany).toHaveBeenCalledBefore(mocks.createInvitation);
    expect(mocks.createInvitation).toHaveBeenCalledTimes(2);
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.MEMBERS
    );
    expect(result).toEqual({
      status: "success",
      data: { invited: 2, skipped: [] },
    });
  });

});

describe("removeMembersAction", () => {
  const removeInput = {
    memberIds: ["member_owner", "member_self", "member_a", "member_b"],
    organizationId: "org_1",
    orgSlug: "acme",
  };

  beforeEach(() => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_self" } });
    mocks.memberFindMany.mockResolvedValue([
      { id: "member_owner", role: ORG_ROLES.OWNER, userId: "user_owner" },
      { id: "member_self", role: ORG_ROLES.ADMIN, userId: "user_self" },
      { id: "member_a", role: ORG_ROLES.MEMBER, userId: "user_a" },
      { id: "member_b", role: ORG_ROLES.MEMBER, userId: "user_b" },
    ]);
    mocks.removeMember.mockResolvedValue({ member: {} });
  });

  it("sends each removable member to Better Auth with one shared headers result", async () => {
    const result = await removeMembersAction(removeInput);

    expect(mocks.removeMember).toHaveBeenCalledTimes(2);
    expect(mocks.removeMember).toHaveBeenCalledWith({
      body: { memberIdOrEmail: "member_a", organizationId: "org_1" },
      headers: requestHeaders,
    });
    expect(mocks.removeMember).toHaveBeenCalledWith({
      body: { memberIdOrEmail: "member_b", organizationId: "org_1" },
      headers: requestHeaders,
    });
    expect(mocks.headers).toHaveBeenCalledTimes(1);
    expect(mocks.memberDeleteMany).not.toHaveBeenCalled();
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.MEMBERS
    );
    expect(result).toEqual({ success: true, data: { removedCount: 2 } });
  });

  it("reports the fulfilled count when some removals are rejected", async () => {
    mocks.removeMember
      .mockResolvedValueOnce({ member: {} })
      .mockRejectedValueOnce(new Error("rejected by Better Auth"));

    const result = await removeMembersAction(removeInput);

    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.MEMBERS
    );
    expect(result).toEqual({ success: true, data: { removedCount: 1 } });
  });

  it("maps the first Better Auth rejection when every removal fails", async () => {
    const failure = {
      body: { code: "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER" },
    };
    mocks.removeMember.mockRejectedValue(failure);

    const result = await removeMembersAction(removeInput);

    expect(mocks.toActionError).toHaveBeenCalledWith(failure, {
      fallback: "removeMember",
      logger: expect.anything(),
    });
    expect(mocks.revalidateOrgPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "removeMember" });
  });

  it("returns noValidMembers when only the owner and the caller were selected", async () => {
    mocks.memberFindMany.mockResolvedValue([
      { id: "member_owner", role: ORG_ROLES.OWNER, userId: "user_owner" },
      { id: "member_self", role: ORG_ROLES.ADMIN, userId: "user_self" },
    ]);

    const result = await removeMembersAction({
      ...removeInput,
      memberIds: ["member_owner", "member_self"],
    });

    expect(mocks.removeMember).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "noValidMembers" });
  });
});

describe("updateMemberRoleAction", () => {
  const roleInput = {
    memberId: "member_a",
    newRole: ORG_ROLES.ADMIN,
    organizationId: "org_1",
    orgSlug: "acme",
  };

  beforeEach(() => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_self" } });
    mocks.memberFindFirst.mockResolvedValue({
      role: ORG_ROLES.MEMBER,
      userId: "user_a",
    });
    mocks.updateMemberRole.mockResolvedValue({});
  });

  it("refuses to change the owner without calling Better Auth", async () => {
    mocks.memberFindFirst.mockResolvedValue({
      role: ORG_ROLES.OWNER,
      userId: "user_owner",
    });

    const result = await updateMemberRoleAction(roleInput);

    expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    expect(mocks.revalidateOrgPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "updateRole" });
  });

  it("refuses to change the caller's own role without calling Better Auth", async () => {
    mocks.memberFindFirst.mockResolvedValue({
      role: ORG_ROLES.ADMIN,
      userId: "user_self",
    });

    const result = await updateMemberRoleAction(roleInput);

    expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "updateRole" });
  });

  it("returns memberNotFound for an id outside the organization", async () => {
    mocks.memberFindFirst.mockResolvedValue(null);

    const result = await updateMemberRoleAction(roleInput);

    expect(mocks.memberFindFirst).toHaveBeenCalledWith({
      where: { id: "member_a", organizationId: "org_1" },
      select: { role: true, userId: true },
    });
    expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "memberNotFound" });
  });

  it("delegates the role change to Better Auth and revalidates", async () => {
    const result = await updateMemberRoleAction(roleInput);

    expect(mocks.updateMemberRole).toHaveBeenCalledWith({
      body: {
        memberId: "member_a",
        organizationId: "org_1",
        role: ORG_ROLES.ADMIN,
      },
      headers: requestHeaders,
    });
    expect(mocks.memberUpdateMany).not.toHaveBeenCalled();
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.MEMBERS
    );
    expect(result).toEqual({ success: true });
  });

});
