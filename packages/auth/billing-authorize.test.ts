import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@repo/database", () => ({
  database: { member: { findFirst } },
}));

import {
  authorizeBillingAction,
  canManageBilling,
  isOrgMember,
} from "./billing-authorize";
import { ORG_ROLES } from "./permissions";

const USER_ID = "user_1";
const ORG_ID = "org_1";

beforeEach(() => {
  findFirst.mockReset();
});

describe("isOrgMember", () => {
  it("returns true when an active member row exists", async () => {
    findFirst.mockResolvedValue({ id: "m_1" });
    await expect(isOrgMember(USER_ID, ORG_ID)).resolves.toBe(true);
  });

  it("returns false when no member row matches", async () => {
    findFirst.mockResolvedValue(null);
    await expect(isOrgMember(USER_ID, ORG_ID)).resolves.toBe(false);
  });

  it("scopes by userId, organizationId, and excludes suspended members", async () => {
    findFirst.mockResolvedValue(null);
    await isOrgMember(USER_ID, ORG_ID);
    expect(findFirst).toHaveBeenCalledWith({
      where: { userId: USER_ID, organizationId: ORG_ID, suspendedAt: null },
      select: { id: true },
    });
  });
});

describe("canManageBilling", () => {
  it("returns true for an owner", async () => {
    findFirst.mockResolvedValue({ role: ORG_ROLES.OWNER });
    await expect(canManageBilling(USER_ID, ORG_ID)).resolves.toBe(true);
  });

  it("returns true for an admin", async () => {
    findFirst.mockResolvedValue({ role: ORG_ROLES.ADMIN });
    await expect(canManageBilling(USER_ID, ORG_ID)).resolves.toBe(true);
  });

  it("returns false for a plain member", async () => {
    findFirst.mockResolvedValue({ role: ORG_ROLES.MEMBER });
    await expect(canManageBilling(USER_ID, ORG_ID)).resolves.toBe(false);
  });

  it("returns false when no membership exists (also covers suspended via where clause)", async () => {
    findFirst.mockResolvedValue(null);
    await expect(canManageBilling(USER_ID, ORG_ID)).resolves.toBe(false);
  });

  it("filters out suspended members in the where clause", async () => {
    findFirst.mockResolvedValue(null);
    await canManageBilling(USER_ID, ORG_ID);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, organizationId: ORG_ID, suspendedAt: null },
      })
    );
  });
});

describe("authorizeBillingAction", () => {
  it("allows any active member to list-subscription", async () => {
    findFirst.mockResolvedValue({ id: "m_1" });
    await expect(
      authorizeBillingAction({
        userId: USER_ID,
        referenceId: ORG_ID,
        action: "list-subscription",
      })
    ).resolves.toBe(true);
  });

  it("denies list-subscription for non-members", async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      authorizeBillingAction({
        userId: USER_ID,
        referenceId: ORG_ID,
        action: "list-subscription",
      })
    ).resolves.toBe(false);
  });

  it.each([
    "upgrade-subscription",
    "cancel-subscription",
    "restore-subscription",
    "billing-portal",
  ] as const)("denies plain member for %s", async (action) => {
    findFirst.mockResolvedValue({ role: ORG_ROLES.MEMBER });
    await expect(
      authorizeBillingAction({ userId: USER_ID, referenceId: ORG_ID, action })
    ).resolves.toBe(false);
  });

  it.each([
    "upgrade-subscription",
    "cancel-subscription",
    "restore-subscription",
    "billing-portal",
  ] as const)("allows admin for %s", async (action) => {
    findFirst.mockResolvedValue({ role: ORG_ROLES.ADMIN });
    await expect(
      authorizeBillingAction({ userId: USER_ID, referenceId: ORG_ID, action })
    ).resolves.toBe(true);
  });

  it.each([
    "upgrade-subscription",
    "cancel-subscription",
    "restore-subscription",
    "billing-portal",
  ] as const)("allows owner for %s", async (action) => {
    findFirst.mockResolvedValue({ role: ORG_ROLES.OWNER });
    await expect(
      authorizeBillingAction({ userId: USER_ID, referenceId: ORG_ID, action })
    ).resolves.toBe(true);
  });

  it("denies unknown actions and logs a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      await expect(
        authorizeBillingAction({
          userId: USER_ID,
          referenceId: ORG_ID,
          action: "trial-extend",
        })
      ).resolves.toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("trial-extend")
      );
    } finally {
      warn.mockRestore();
    }
  });
});
