import { BILLING_INTERVALS, PLAN_NAMES } from "@repo/utils/payment";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  comparePlans: vi.fn(),
  getActiveSubscription: vi.fn(),
  getOrgMemberCount: vi.fn(),
  getOrgStorageUsage: vi.fn(),
  getServerSession: vi.fn(),
  guardDowngrade: vi.fn(),
  hasOrgPermission: vi.fn(),
  headers: vi.fn(),
  toActionError: vi.fn(),
  upgradeSubscription: vi.fn(),
}));

vi.mock("@repo/auth/guards", () => ({ guardDowngrade: mocks.guardDowngrade }));
vi.mock("@repo/auth/helpers", () => ({ isAlreadyCancelingError: () => false }));
vi.mock("@repo/auth/plans", () => ({ comparePlans: mocks.comparePlans }));
vi.mock("@repo/auth/server", () => ({
  auth: {
    api: {
      cancelSubscription: vi.fn(),
      createBillingPortal: vi.fn(),
      upgradeSubscription: mocks.upgradeSubscription,
    },
  },
}));
vi.mock("@repo/logger/log", () => ({
  createRequestLogger: () => ({
    child: () => ({ info: vi.fn(), warn: vi.fn() }),
    error: vi.fn(),
  }),
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));
vi.mock("@/lib/auth/auth", () => ({
  getServerSession: mocks.getServerSession,
  hasOrgPermission: mocks.hasOrgPermission,
}));
vi.mock("@/lib/billing/subscription-queries", () => ({
  getActiveSubscription: mocks.getActiveSubscription,
  getOrgMemberCount: mocks.getOrgMemberCount,
  getOrgStorageUsage: mocks.getOrgStorageUsage,
}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}));

import { changePlanAction } from "./actions";

const input = {
  billingInterval: BILLING_INTERVALS.MONTHLY,
  organizationId: "org_1",
  targetPlan: PLAN_NAMES.PRO,
};

const activeSubscription = { plan: PLAN_NAMES.ENTERPRISE };

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
  mocks.getServerSession.mockResolvedValue({ user: { id: "user_actor" } });
  mocks.hasOrgPermission.mockResolvedValue(true);
  mocks.headers.mockResolvedValue(new Headers());
  mocks.getActiveSubscription.mockResolvedValue(activeSubscription);
  mocks.getOrgMemberCount.mockResolvedValue(3);
  mocks.getOrgStorageUsage.mockResolvedValue(10);
  mocks.comparePlans.mockReturnValue("downgrade");
  mocks.guardDowngrade.mockReturnValue({ allowed: true });
  mocks.upgradeSubscription.mockResolvedValue({});
});

describe("changePlanAction", () => {
  it("schedules the downgrade at period end", async () => {
    const result = await changePlanAction(input);

    expect(mocks.upgradeSubscription).toHaveBeenCalledWith({
      headers: expect.anything(),
      body: {
        plan: PLAN_NAMES.PRO,
        annual: false,
        referenceId: "org_1",
        scheduleAtPeriodEnd: true,
      },
    });
    expect(result).toEqual({ success: true, data: { action: "changed" } });
  });

  it("fails when there is no active subscription", async () => {
    mocks.getActiveSubscription.mockResolvedValue(null);

    const result = await changePlanAction(input);

    expect(mocks.comparePlans).not.toHaveBeenCalled();
    expect(mocks.guardDowngrade).not.toHaveBeenCalled();
    expect(mocks.upgradeSubscription).not.toHaveBeenCalled();
    expect(mocks.actionError).toHaveBeenCalledWith("changePlan");
    expect(result).toMatchObject({ code: "changePlan" });
  });

  it("fails when the target is not a downgrade", async () => {
    mocks.comparePlans.mockReturnValue("upgrade");

    const result = await changePlanAction(input);

    expect(mocks.guardDowngrade).not.toHaveBeenCalled();
    expect(mocks.upgradeSubscription).not.toHaveBeenCalled();
    expect(mocks.actionError).toHaveBeenCalledWith("changePlan");
    expect(result).toMatchObject({ code: "changePlan" });
  });

  it("returns the block reason when the downgrade is blocked", async () => {
    mocks.guardDowngrade.mockReturnValue({ allowed: false, reason: "members" });

    const result = await changePlanAction(input);

    expect(mocks.guardDowngrade).toHaveBeenCalledWith(
      activeSubscription,
      PLAN_NAMES.PRO,
      3,
      10
    );
    expect(mocks.upgradeSubscription).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: { action: "changed", blockReason: "members" },
    });
  });

  it("routes a downgrade to free into the cancel flow", async () => {
    const result = await changePlanAction({
      ...input,
      targetPlan: PLAN_NAMES.FREE,
    });

    expect(mocks.upgradeSubscription).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: { action: "cancel" } });
  });
});
