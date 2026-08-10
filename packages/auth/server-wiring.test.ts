import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
  database: {},
}));

// server.ts reads these at module scope through keys.ts; without them the
// import throws before any assertion can run.
beforeAll(() => {
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-32";
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
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
});
