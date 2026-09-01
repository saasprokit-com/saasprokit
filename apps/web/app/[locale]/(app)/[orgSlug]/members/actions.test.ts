import { ORG_ROLES } from "@repo/auth/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  canOrgAddMember: vi.fn(),
  createInvitation: vi.fn(),
  getServerSession: vi.fn(),
  hasOrgPermission: vi.fn(),
  headers: vi.fn(),
  revalidateOrgPage: vi.fn(),
  toActionError: vi.fn(),
  verifySession: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: { api: { createInvitation: mocks.createInvitation } },
}));

vi.mock("@repo/database", () => ({ database: {} }));

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

vi.mock("@/lib/billing/subscription-queries", () => ({
  canOrgAddMember: mocks.canOrgAddMember,
}));

vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));

import { inviteMemberAction } from "./actions";

const input = {
  email: "new-member@example.com",
  organizationId: "org_1",
  orgSlug: "acme",
  role: ORG_ROLES.MEMBER,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actionError.mockImplementation((code: string) => ({
    code,
    error: code,
    status: "error",
    success: false,
  }));
  mocks.hasOrgPermission.mockResolvedValue(true);
  mocks.canOrgAddMember.mockResolvedValue({ allowed: true, remaining: 2 });
  mocks.createInvitation.mockResolvedValue({});
  mocks.headers.mockResolvedValue(new Headers({ cookie: "session=test" }));
  mocks.revalidateOrgPage.mockResolvedValue(undefined);
});

describe("inviteMemberAction", () => {
  it("validates input before authorization", async () => {
    const result = await inviteMemberAction(
      { status: "idle" },
      { ...input, email: "invalid-email" }
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBeDefined();
    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
    expect(mocks.canOrgAddMember).not.toHaveBeenCalled();
    expect(mocks.createInvitation).not.toHaveBeenCalled();
  });

  it("denies unauthorized callers before reading organization capacity", async () => {
    mocks.hasOrgPermission.mockResolvedValue(false);

    const result = await inviteMemberAction({ status: "idle" }, input);

    expect(mocks.hasOrgPermission).toHaveBeenCalledWith("org_1", {
      invitation: ["create"],
    });
    expect(mocks.canOrgAddMember).not.toHaveBeenCalled();
    expect(mocks.createInvitation).not.toHaveBeenCalled();
    expect(result).toEqual({
      code: "unauthorized",
      error: "unauthorized",
      status: "error",
      success: false,
    });
  });

  it("authorizes before checking capacity and creating the invitation", async () => {
    await inviteMemberAction({ status: "idle" }, input);

    expect(mocks.hasOrgPermission).toHaveBeenCalledBefore(
      mocks.canOrgAddMember
    );
    expect(mocks.canOrgAddMember).toHaveBeenCalledBefore(
      mocks.createInvitation
    );
  });
});
