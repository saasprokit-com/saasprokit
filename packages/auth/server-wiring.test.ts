import { APIError } from "better-auth/api";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getOrganizationMembershipLimit, memberFindFirst } = vi.hoisted(() => ({
  getOrganizationMembershipLimit: vi.fn(),
  memberFindFirst: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    member: {
      findFirst: memberFindFirst,
    },
  },
}));

vi.mock("./membership-limit", () => ({
  getOrganizationMembershipLimit,
}));

// server.ts reads these at module scope through keys.ts; without them the
// import throws before any assertion can run.
beforeAll(() => {
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-32";
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
});

beforeEach(() => {
  getOrganizationMembershipLimit.mockReset();
  memberFindFirst.mockReset();
});

describe("auth server wiring", () => {
  it("registers the two-factor after-hook on the shipped instance", async () => {
    const { auth } = await import("./server");
    const { twoFactorAfterHook } = await import("./two-factor-hooks");

    // The rotation fix this hook carries is dropped by deleting one line in
    // server.ts, and every other test in this package builds its own
    // betterAuth() instance — so nothing else would notice.
    expect(auth.options.hooks?.after).toBe(twoFactorAfterHook);
  });

  it("registers a dynamic organization membership limit", async () => {
    const expectedLimit = 42;
    getOrganizationMembershipLimit.mockResolvedValue(expectedLimit);
    const { auth } = await import("./server");
    const organizationPlugin = auth.options.plugins?.find(
      (plugin) => plugin.id === "organization"
    );
    const membershipLimit = organizationPlugin?.options.membershipLimit;

    if (typeof membershipLimit !== "function") {
      throw new Error("Organization membershipLimit callback is not configured");
    }

    const organization = { id: "org_1" } as Parameters<
      typeof membershipLimit
    >[1];
    const user = {} as Parameters<typeof membershipLimit>[0];

    await expect(membershipLimit(user, organization)).resolves.toBe(
      expectedLimit
    );
    expect(getOrganizationMembershipLimit).toHaveBeenCalledWith(organization.id);
  });

  it("blocks invitation acceptance when the recipient is already a member", async () => {
    memberFindFirst.mockResolvedValue({ id: "member_1" });
    const { auth } = await import("./server");
    const organizationPlugin = auth.options.plugins?.find(
      (plugin) => plugin.id === "organization"
    );
    const beforeAcceptInvitation =
      organizationPlugin?.options.organizationHooks?.beforeAcceptInvitation;

    if (typeof beforeAcceptInvitation !== "function") {
      throw new Error("beforeAcceptInvitation hook is not configured");
    }

    const data = {
      invitation: { organizationId: "org_1" },
      user: { id: "user_1" },
      organization: { id: "org_1" },
    } as Parameters<typeof beforeAcceptInvitation>[0];

    const error = await beforeAcceptInvitation(data).then(
      () => undefined,
      (reason: unknown) => reason
    );
    expect(error).toBeInstanceOf(APIError);
    expect(error).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({
          code: "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION",
        }),
      })
    );

    expect(memberFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: data.invitation.organizationId,
        userId: data.user.id,
      },
      select: { id: true },
    });
  });

  it("allows a non-member to accept an invitation", async () => {
    memberFindFirst.mockResolvedValue(null);
    const { auth } = await import("./server");
    const organizationPlugin = auth.options.plugins?.find(
      (plugin) => plugin.id === "organization"
    );
    const beforeAcceptInvitation =
      organizationPlugin?.options.organizationHooks?.beforeAcceptInvitation;

    if (typeof beforeAcceptInvitation !== "function") {
      throw new Error("beforeAcceptInvitation hook is not configured");
    }

    const data = {
      invitation: { organizationId: "org_1" },
      user: { id: "user_1" },
      organization: { id: "org_1" },
    } as Parameters<typeof beforeAcceptInvitation>[0];

    await expect(beforeAcceptInvitation(data)).resolves.toBeUndefined();
    expect(memberFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: data.invitation.organizationId,
        userId: data.user.id,
      },
      select: { id: true },
    });
  });
});
