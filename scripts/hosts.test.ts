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

  // The local drift guard: a manifest path that no longer exists means a
  // host file moved without the manifest being updated.
  it("only references files that exist in the repo", () => {
    for (const target of Object.values(HOST_TARGETS)) {
      for (const file of target.deleteFiles) {
        expect(existsSync(join(ROOT, file)), `${target.id}: ${file}`).toBe(true);
      }
    }
  });

  it("keeps wrangler config only for cloudflare", () => {
    expect(HOST_TARGETS.cloudflare.deleteFiles).not.toContain(
      "apps/web/wrangler.jsonc"
    );
    expect(HOST_TARGETS.vercel.deleteFiles).toContain("apps/web/wrangler.jsonc");
    expect(HOST_TARGETS.docker.deleteFiles).toContain("apps/web/wrangler.jsonc");
  });

  it("keeps the Dockerfile only for docker", () => {
    expect(HOST_TARGETS.docker.deleteFiles).not.toContain("apps/web/Dockerfile");
    expect(HOST_TARGETS.cloudflare.deleteFiles).toContain("apps/web/Dockerfile");
    expect(HOST_TARGETS.vercel.deleteFiles).toContain("apps/web/Dockerfile");
  });

  it("pins the prisma runtime per host", () => {
    expect(HOST_TARGETS.cloudflare.prismaRuntime).toBe("workerd");
    expect(HOST_TARGETS.vercel.prismaRuntime).toBeNull();
    expect(HOST_TARGETS.docker.prismaRuntime).toBeNull();
  });
});
