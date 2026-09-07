import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(import.meta.dirname, "./seo-config.ts"),
  "utf8"
);

describe("seo-config carries no kit branding", () => {
  it("contains no SaaSProKit identifiers", () => {
    expect(source.toLowerCase()).not.toContain("saasprokit");
  });

  it("derives the site name from NEXT_PUBLIC_APP_NAME", () => {
    expect(source).toContain("env.NEXT_PUBLIC_APP_NAME");
  });
});
