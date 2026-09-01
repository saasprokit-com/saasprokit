import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptInvitation: vi.fn(),
  addMember: vi.fn(),
  actionError: vi.fn(),
  canOrgAddMember: vi.fn(),
  getServerSession: vi.fn(),
  headers: vi.fn(),
  inviteLinkFindUnique: vi.fn(),
  inviteLinkUpdate: vi.fn(),
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
      update: mocks.inviteLinkUpdate,
    },
    member: { findFirst: mocks.memberFindFirst },
    organization: { findUnique: mocks.organizationFindUnique },
  },
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
  it("reserves pending invitation seats before Better Auth adds a member", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user_1", email: "member@example.com" },
    });
    mocks.inviteLinkFindUnique.mockResolvedValue({
      id: "link_1",
      token: "shared-token",
      organizationId: "org_1",
      organization: { slug: "acme" },
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
      role: "member",
    });
    mocks.memberFindFirst.mockResolvedValue(null);
    mocks.canOrgAddMember.mockResolvedValue({
      allowed: false,
      remaining: 0,
    });

    const result = await acceptInviteLinkAction({ token: "shared-token" });

    expect(mocks.canOrgAddMember).toHaveBeenCalledWith("org_1");
    expect(mocks.addMember).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      status: "error",
      error: "memberLimitReached",
      code: "memberLimitReached",
    });
  });
});
