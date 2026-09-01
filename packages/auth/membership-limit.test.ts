import {
  ACTIVE_STATUSES,
  LIMITS,
  PLAN_NAMES,
  SUBSCRIPTION_STATUS,
  UNLIMITED,
} from "@repo/utils/payment";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLANS } from "./plans";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@repo/database", () => ({
  database: { subscription: { findFirst } },
}));

import { getOrganizationMembershipLimit } from "./membership-limit";

const ORG_ID = "org_1";
const originalEnterpriseLimit = PLANS.enterprise.limits.maxMembers;

beforeEach(() => {
  findFirst.mockReset();
});

afterEach(() => {
  PLANS.enterprise.limits.maxMembers = originalEnterpriseLimit;
});

describe("getOrganizationMembershipLimit", () => {
  it("returns the free limit when no active subscription exists", async () => {
    findFirst.mockResolvedValue(null);

    await expect(getOrganizationMembershipLimit(ORG_ID)).resolves.toBe(
      LIMITS.FREE.MAX_MEMBERS
    );
  });

  it("returns the configured limit for an active plan", async () => {
    findFirst.mockResolvedValue({
      plan: PLAN_NAMES.PRO,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });

    await expect(getOrganizationMembershipLimit(ORG_ID)).resolves.toBe(
      LIMITS.PRO.MAX_MEMBERS
    );
  });

  it("maps an unlimited plan limit to Better Auth's numeric maximum", async () => {
    PLANS.enterprise.limits.maxMembers = UNLIMITED;
    findFirst.mockResolvedValue({
      plan: PLAN_NAMES.ENTERPRISE,
      status: SUBSCRIPTION_STATUS.TRIALING,
    });

    await expect(getOrganizationMembershipLimit(ORG_ID)).resolves.toBe(
      Number.MAX_SAFE_INTEGER
    );
  });

  it("queries the latest active subscription for the organization", async () => {
    findFirst.mockResolvedValue(null);

    await getOrganizationMembershipLimit(ORG_ID);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        referenceId: ORG_ID,
        status: { in: [...ACTIVE_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("rejects when the subscription query fails", async () => {
    const error = new Error("database unavailable");
    findFirst.mockRejectedValue(error);

    await expect(getOrganizationMembershipLimit(ORG_ID)).rejects.toBe(error);
  });
});
