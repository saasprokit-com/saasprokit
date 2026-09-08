import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  getCurrentPlanForOrg: vi.fn(),
  getPlanLimits: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    aiConversation: { findFirst: mocks.findFirst, findMany: mocks.findMany },
    aiUsage: { aggregate: mocks.aggregate },
  },
}));
vi.mock("@repo/auth/plans", () => ({ getPlanLimits: mocks.getPlanLimits }));
vi.mock("@/lib/billing/subscription-queries", () => ({ getCurrentPlanForOrg: mocks.getCurrentPlanForOrg }));

import { UNLIMITED } from "@repo/utils/payment";
import {
  getAiQuotaStatus,
  getMonthlyAiUsage,
  getOwnedConversation,
  isWithinAiQuota,
  listConversations,
  titleOf,
  toUIMessage,
} from "./queries";

const textParts = (text: string) => JSON.stringify([{ type: "text", text }]);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentPlanForOrg.mockResolvedValue("free");
  mocks.getPlanLimits.mockReturnValue({ maxAiTokensPerMonth: 100, maxAiImagesPerMonth: 2 });
});

describe("toUIMessage", () => {
  it("parses stored parts JSON", () => {
    expect(toUIMessage({ id: "m1", role: "assistant", parts: textParts("hi") })).toEqual({
      id: "m1",
      role: "assistant",
      parts: [{ type: "text", text: "hi" }],
    });
  });
});

describe("titleOf", () => {
  it("uses the first message's first text part, or null", () => {
    expect(titleOf([{ parts: [{ type: "text", text: "First prompt" }] }])).toBe("First prompt");
    expect(titleOf([{ parts: [{ type: "file", mediaType: "image/png", url: "/x.png" }] }])).toBeNull();
    expect(titleOf([])).toBeNull();
  });
});

describe("listConversations", () => {
  it("returns newest first with a derived title", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "c1", updatedAt: new Date("2026-09-06"), messages: [{ id: "m1", role: "user", parts: textParts("Hello") }] },
      { id: "c2", updatedAt: new Date("2026-09-05"), messages: [] },
    ]);
    expect(await listConversations("org_1", "user_1")).toEqual([
      { id: "c1", updatedAt: new Date("2026-09-06"), title: "Hello" },
      { id: "c2", updatedAt: new Date("2026-09-05"), title: null },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org_1", userId: "user_1" }, orderBy: { updatedAt: "desc" } })
    );
  });
});

describe("getOwnedConversation", () => {
  it("scopes by id and user and maps messages", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "c1",
      organizationId: "org_1",
      messages: [{ id: "m1", role: "user", parts: textParts("yo") }],
    });
    const result = await getOwnedConversation("c1", "user_1");
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1", userId: "user_1" } })
    );
    expect(result).toEqual({
      id: "c1",
      organizationId: "org_1",
      messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "yo" }] }],
    });
  });

  it("returns null when not owned", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await getOwnedConversation("c1", "user_2")).toBeNull();
  });
});

describe("getMonthlyAiUsage", () => {
  it("sums from the first of the current UTC month and coerces null to 0", async () => {
    mocks.aggregate.mockResolvedValue({ _sum: { totalTokens: null, imageCount: 3 } });
    const result = await getMonthlyAiUsage("org_1", new Date("2026-09-06T10:00:00Z"));
    expect(result).toEqual({ totalTokens: 0, imageCount: 3 });
    expect(mocks.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org_1", createdAt: { gte: new Date("2026-09-01T00:00:00Z") } },
      })
    );
  });
});

describe("getAiQuotaStatus", () => {
  it("combines monthly usage with the plan's limits", async () => {
    mocks.aggregate.mockResolvedValue({ _sum: { totalTokens: 40, imageCount: 1 } });
    expect(await getAiQuotaStatus("org_1")).toEqual({
      usage: { totalTokens: 40, imageCount: 1 },
      limits: { maxAiTokensPerMonth: 100, maxAiImagesPerMonth: 2 },
    });
  });
});

describe("isWithinAiQuota", () => {
  const status = (totalTokens: number, imageCount: number, tokens = 100, images = 2) => ({
    usage: { totalTokens, imageCount },
    limits: { maxAiTokensPerMonth: tokens, maxAiImagesPerMonth: images },
  });

  it("allows chat below the token cap and blocks at it", () => {
    expect(isWithinAiQuota(status(99, 0), "chat")).toBe(true);
    expect(isWithinAiQuota(status(100, 0), "chat")).toBe(false);
  });

  it("allows images below the image cap and blocks at it", () => {
    expect(isWithinAiQuota(status(0, 1), "image")).toBe(true);
    expect(isWithinAiQuota(status(0, 2), "image")).toBe(false);
  });

  it("treats UNLIMITED as no cap", () => {
    expect(isWithinAiQuota(status(1_000_000, 500, UNLIMITED, UNLIMITED), "chat")).toBe(true);
    expect(isWithinAiQuota(status(1_000_000, 500, UNLIMITED, UNLIMITED), "image")).toBe(true);
  });
});
