import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: { api: { hasPermission: mocks.hasPermission } },
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

import { hasOrgPermission } from "./auth";

const permissions = { organization: ["update"] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers());
});

describe("hasOrgPermission", () => {
  it("returns Better Auth's answer for members", async () => {
    mocks.hasPermission.mockResolvedValue({ success: false });

    await expect(hasOrgPermission("org_1", permissions)).resolves.toBe(false);
    expect(mocks.hasPermission).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { organizationId: "org_1", permissions },
    });
  });

  it("returns false when Better Auth rejects a non-member", async () => {
    mocks.hasPermission.mockRejectedValue(
      new APIError("UNAUTHORIZED", {
        message: "User is not a member of the organization",
      })
    );

    await expect(hasOrgPermission("org_1", permissions)).resolves.toBe(false);
  });

  it("rethrows failures that are not authorization answers", async () => {
    mocks.hasPermission.mockRejectedValue(new Error("connection refused"));

    await expect(hasOrgPermission("org_1", permissions)).rejects.toThrow(
      "connection refused"
    );
  });
});
