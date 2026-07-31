import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stripCliCi } from "./ci-workflow";

const REAL_CI = readFileSync(
  join(import.meta.dirname, "../../.github/workflows/ci.yml"),
  "utf8"
);

describe("stripCliCi", () => {
  it("removes every reference to the CLI's own scripts", () => {
    const out = stripCliCi(REAL_CI);
    expect(out).not.toContain("test:cli");
    expect(out).not.toContain("typecheck:cli");
    expect(out).not.toContain("pnpm run setup");
    expect(out).not.toContain("setup-cli");
    expect(out).not.toContain("matrix.host");
  });

  it("keeps the jobs the customer still needs", () => {
    const out = stripCliCi(REAL_CI);
    expect(out).toContain("  lint:");
    expect(out).toContain("  typecheck:");
    expect(out).toContain("  test:");
    expect(out).toContain("run: pnpm test\n");
    expect(out).toContain("run: pnpm --filter app typecheck");
    expect(out).toContain("run: pnpm check");
  });

  it("leaves exactly one trailing newline", () => {
    const out = stripCliCi(REAL_CI);
    expect(out.endsWith("\n")).toBe(true);
    expect(out.endsWith("\n\n")).toBe(false);
  });

  it("does not strip a job that merely starts with the same prefix", () => {
    const yaml = "jobs:\n  setup-cli-extras:\n    runs-on: ubuntu-latest\n";
    expect(stripCliCi(yaml)).toContain("setup-cli-extras");
  });

  it("is idempotent", () => {
    const once = stripCliCi(REAL_CI);
    expect(stripCliCi(once)).toBe(once);
  });
});
