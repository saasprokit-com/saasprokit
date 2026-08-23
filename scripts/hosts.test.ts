import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HOST_TARGETS } from "./hosts";

const ROOT = join(import.meta.dirname, "..");

describe("host manifest", () => {
  it("lists three targets", () => {
    expect(Object.keys(HOST_TARGETS).sort()).toEqual([
      "cloudflare",
      "docker",
      "vercel",
    ]);
  });

  it("only references files that exist in the repo", () => {
    for (const target of Object.values(HOST_TARGETS)) {
      for (const file of target.deleteFiles) {
        expect(existsSync(join(ROOT, file)), `${target.id}: ${file}`).toBe(true);
      }
    }
  });

  it("keeps wrangler config only for cloudflare", () => {
    for (const app of ["apps/web", "apps/docs"]) {
      expect(HOST_TARGETS.cloudflare.deleteFiles).not.toContain(
        `${app}/wrangler.jsonc`
      );
      expect(HOST_TARGETS.vercel.deleteFiles).toContain(`${app}/wrangler.jsonc`);
      expect(HOST_TARGETS.docker.deleteFiles).toContain(`${app}/wrangler.jsonc`);
    }
  });

  it("keeps the Dockerfile only for docker", () => {
    for (const app of ["apps/web", "apps/docs"]) {
      expect(HOST_TARGETS.docker.deleteFiles).not.toContain(`${app}/Dockerfile`);
      expect(HOST_TARGETS.cloudflare.deleteFiles).toContain(`${app}/Dockerfile`);
      expect(HOST_TARGETS.vercel.deleteFiles).toContain(`${app}/Dockerfile`);
    }
  });

  it("never prunes the root docs/ kit documentation", () => {
    for (const target of Object.values(HOST_TARGETS)) {
      for (const file of target.deleteFiles) {
        expect(file.startsWith("docs/"), `${target.id}: ${file}`).toBe(false);
      }
    }
  });

  it("pins the prisma runtime per host", () => {
    expect(HOST_TARGETS.cloudflare.prismaRuntime).toBe("workerd");
    expect(HOST_TARGETS.vercel.prismaRuntime).toBeNull();
    expect(HOST_TARGETS.docker.prismaRuntime).toBeNull();
  });
});
