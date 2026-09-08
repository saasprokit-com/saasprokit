import type { createRequestLogger } from "@repo/logger/log";
import { UNLIMITED } from "@repo/utils/payment";
import { BYTES_PER_MB } from "@repo/utils/storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentPlanForOrg: vi.fn(),
  getOrgStorageUsage: vi.fn(),
  getPlanLimits: vi.fn(),
}));

vi.mock("@repo/auth/plans", () => ({ getPlanLimits: mocks.getPlanLimits }));

vi.mock("@/lib/billing/subscription-queries", () => ({
  getCurrentPlanForOrg: mocks.getCurrentPlanForOrg,
  getOrgStorageUsage: mocks.getOrgStorageUsage,
}));

import { validateStorageQuota } from "./storage-quota";

const warn = vi.fn();
const logger = { warn } as unknown as ReturnType<typeof createRequestLogger>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentPlanForOrg.mockResolvedValue("free");
  mocks.getPlanLimits.mockReturnValue({ maxStorageMB: 100 });
});

describe("validateStorageQuota", () => {
  it("allows a file that lands exactly on the plan limit", async () => {
    mocks.getOrgStorageUsage.mockResolvedValue(99.5);

    await expect(
      validateStorageQuota("org_1", 0.5 * BYTES_PER_MB, logger)
    ).resolves.toEqual({ valid: true });
    expect(warn).not.toHaveBeenCalled();
  });

  it("rejects the first byte past the plan limit and reports the usage", async () => {
    mocks.getOrgStorageUsage.mockResolvedValue(99.5);

    const result = await validateStorageQuota(
      "org_1",
      0.5 * BYTES_PER_MB + 1,
      logger
    );

    expect(result).toMatchObject({ valid: false });
    expect(result).toHaveProperty(
      "error",
      expect.stringContaining("99.5 MB of 100 MB")
    );
    expect(warn).toHaveBeenCalledWith(
      "Storage quota exceeded",
      expect.objectContaining({ organizationId: "org_1", maxStorageMB: 100 })
    );
  });

  it("never rejects on an unlimited plan", async () => {
    mocks.getPlanLimits.mockReturnValue({ maxStorageMB: UNLIMITED });
    mocks.getOrgStorageUsage.mockResolvedValue(1_000_000);

    await expect(
      validateStorageQuota("org_1", 10 * BYTES_PER_MB, logger)
    ).resolves.toEqual({ valid: true });
  });

  it("propagates a usage lookup failure instead of answering", async () => {
    mocks.getOrgStorageUsage.mockRejectedValue(new Error("db down"));

    await expect(
      validateStorageQuota("org_1", BYTES_PER_MB, logger)
    ).rejects.toThrow("db down");
  });
});
