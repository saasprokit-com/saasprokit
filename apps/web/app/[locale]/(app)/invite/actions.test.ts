import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptInvitation: vi.fn(),
  addMember: vi.fn(),
  actionError: vi.fn(),
  canOrgAddMember: vi.fn(),
  getServerSession: vi.fn(),
  headers: vi.fn(),
  inviteLinkFindUnique: vi.fn(),
  inviteLinkUpdateMany: vi.fn(),
  memberFindFirst: vi.fn(),
  organizationFindUnique: vi.fn(),
  toActionError: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: {
    api: {
      acceptInvitation: mocks.acceptInvitation,
      addMember: mocks.addMember,
    },
  },
}));

vi.mock("@repo/database", () => ({
  database: {
    inviteLink: {
      findUnique: mocks.inviteLinkFindUnique,
      updateMany: mocks.inviteLinkUpdateMany,
    },
    member: { findFirst: mocks.memberFindFirst },
    organization: { findUnique: mocks.organizationFindUnique },
  },
}));

vi.mock("@repo/logger/server", () => ({
  createRequestLogger: () => ({ error: vi.fn() }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));

vi.mock("@/lib/auth/auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/billing/subscription-queries", () => ({
  canOrgAddMember: mocks.canOrgAddMember,
}));

import {
  acceptInvitationAction,
  acceptInviteLinkAction,
} from "./actions";

const requestHeaders = new Headers({ cookie: "session=test" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.actionError.mockImplementation(async (code: string) => ({
    success: false,
    status: "error",
    error: code,
    code,
  }));
  mocks.toActionError.mockImplementation(async (_error, { fallback }) => ({
    success: false,
    status: "error",
    error: fallback,
    code: fallback,
  }));
});

describe("acceptInvitationAction", () => {
  it("delegates standard invitation validation directly to Better Auth", async () => {
    mocks.acceptInvitation.mockResolvedValue({
      member: { organizationId: "org_1" },
    });
    mocks.organizationFindUnique.mockResolvedValue({ slug: "acme" });

    const result = await acceptInvitationAction({
      invitationId: "invitation_1",
    });

    expect(mocks.acceptInvitation).toHaveBeenCalledWith({
      body: { invitationId: "invitation_1" },
      headers: requestHeaders,
    });
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.memberFindFirst).not.toHaveBeenCalled();
    expect(mocks.canOrgAddMember).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: { organizationSlug: "acme" },
    });
  });

  it("maps Better Auth acceptance errors without a manual member shortcut", async () => {
    const betterAuthError = {
      body: {
        code: "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION",
        message: "User is already a member of this organization",
      },
    };
    const mappedError = {
      success: false,
      status: "error",
      error: "User is already a member of this organization",
      code: "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION",
    };
    mocks.acceptInvitation.mockRejectedValue(betterAuthError);
    mocks.toActionError.mockResolvedValue(mappedError);

    const result = await acceptInvitationAction({
      invitationId: "invitation_1",
    });

    expect(mocks.acceptInvitation).toHaveBeenCalledOnce();
    expect(mocks.toActionError).toHaveBeenCalledWith(betterAuthError, {
      fallback: "acceptInvitation",
    });
    expect(result).toBe(mappedError);
  });
});

describe("acceptInviteLinkAction", () => {
  const baseLink = {
    id: "link_1",
    token: "shared-token",
    organizationId: "org_1",
    organization: { slug: "acme" },
    isActive: true,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    role: "member",
  };

  beforeEach(() => {
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user_1", email: "member@example.com" },
    });
    mocks.inviteLinkFindUnique.mockResolvedValue(baseLink);
    mocks.memberFindFirst.mockResolvedValue(null);
    mocks.canOrgAddMember.mockResolvedValue({ allowed: true, remaining: 3 });
    mocks.inviteLinkUpdateMany.mockResolvedValue({ count: 1 });
    mocks.addMember.mockResolvedValue({});
  });

  it("reserves pending invitation seats before Better Auth adds a member", async () => {
    mocks.canOrgAddMember.mockResolvedValue({ allowed: false, remaining: 0 });

    const result = await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.canOrgAddMember).toHaveBeenCalledWith("org_1");
    expect(mocks.inviteLinkUpdateMany).not.toHaveBeenCalled();
    expect(mocks.addMember).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      status: "error",
      error: "memberLimitReached",
      code: "memberLimitReached",
    });
  });

  it("reserves a use on an unlimited link after the capacity check and before addMember", async () => {
    const result = await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.canOrgAddMember).toHaveBeenCalledBefore(
      mocks.inviteLinkUpdateMany
    );
    expect(mocks.inviteLinkUpdateMany).toHaveBeenCalledBefore(mocks.addMember);
    expect(mocks.inviteLinkUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.inviteLinkUpdateMany).toHaveBeenCalledWith({
      where: { id: "link_1", isActive: true },
      data: { usedCount: { increment: 1 } },
    });
    expect(mocks.addMember).toHaveBeenCalledWith({
      body: { userId: "user_1", organizationId: "org_1", role: "member" },
      headers: requestHeaders,
    });
    expect(result).toEqual({
      success: true,
      data: { organizationSlug: "acme" },
    });
  });

  it("bounds the reservation by maxUses on a capped link", async () => {
    mocks.inviteLinkFindUnique.mockResolvedValue({
      ...baseLink,
      maxUses: 5,
      usedCount: 4,
    });

    await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.inviteLinkUpdateMany).toHaveBeenCalledWith({
      where: { id: "link_1", isActive: true, usedCount: { lt: 5 } },
      data: { usedCount: { increment: 1 } },
    });
  });

  it("returns the usage-limit error when the reservation matches no row", async () => {
    mocks.inviteLinkFindUnique.mockResolvedValue({
      ...baseLink,
      maxUses: 5,
      usedCount: 4,
    });
    mocks.inviteLinkUpdateMany.mockResolvedValue({ count: 0 });

    const result = await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.addMember).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "inviteLinkUsageLimitReached" });
  });

  it("releases the reserved use when addMember fails", async () => {
    const failure = {
      body: { code: "ORGANIZATION_MEMBERSHIP_LIMIT_REACHED" },
    };
    mocks.addMember.mockRejectedValue(failure);

    const result = await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.inviteLinkUpdateMany).toHaveBeenCalledTimes(2);
    expect(mocks.inviteLinkUpdateMany).toHaveBeenLastCalledWith({
      where: { id: "link_1", usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
    expect(mocks.toActionError).toHaveBeenCalledWith(failure, {
      fallback: "joinOrganization",
    });
    expect(result).toMatchObject({ code: "joinOrganization" });
  });

  it("returns success for an existing member without consuming a use", async () => {
    mocks.memberFindFirst.mockResolvedValue({ id: "member_existing" });

    const result = await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.canOrgAddMember).not.toHaveBeenCalled();
    expect(mocks.inviteLinkUpdateMany).not.toHaveBeenCalled();
    expect(mocks.addMember).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: { organizationSlug: "acme" },
    });
  });
});
