import { describe, expect, it } from "vitest";
import { HOST_TARGETS } from "../hosts";
import {
  pruneAppPackage,
  renameRootPackage,
  stripCliFromRootPackage,
} from "./package-json";

const appPkg = () => ({
  name: "app",
  scripts: {
    dev: "next dev -p 3000",
    build: "next build",
    preview: "pnpm cf:build && opennextjs-cloudflare preview",
    deploy: "pnpm cf:build && opennextjs-cloudflare deploy",
    "deploy:demo": "pnpm cf:build && opennextjs-cloudflare deploy --env=demo",
    upload: "pnpm cf:build && opennextjs-cloudflare upload",
    "cf:build": "turbo build --filter=@repo/database && CF_BUILD=1 opennextjs-cloudflare build",
  },
  devDependencies: {
    "@opennextjs/cloudflare": "^1.20.2",
    "@playwright/test": "^1.62.0",
    wrangler: "^4.114.0",
  },
});

describe("pruneAppPackage", () => {
  it("removes all cloudflare scripts and devDeps for vercel", () => {
    const out = pruneAppPackage(appPkg(), HOST_TARGETS.vercel);
    expect(Object.keys(out.scripts ?? {})).toEqual(["dev", "build"]);
    expect(out.devDependencies).toEqual({ "@playwright/test": "^1.62.0" });
  });

  it("removes only deploy:demo for cloudflare", () => {
    const out = pruneAppPackage(appPkg(), HOST_TARGETS.cloudflare);
    expect(out.scripts?.["deploy:demo"]).toBeUndefined();
    expect(out.scripts?.deploy).toBeDefined();
    expect(out.devDependencies?.wrangler).toBeDefined();
  });

  it("does not mutate its input", () => {
    const pkg = appPkg();
    pruneAppPackage(pkg, HOST_TARGETS.vercel);
    expect(pkg.scripts?.deploy).toBeDefined();
  });
});

describe("renameRootPackage", () => {
  it("sets the name", () => {
    expect(renameRootPackage({ name: "saasprokit" }, "acme").name).toBe("acme");
  });
});

describe("stripCliFromRootPackage", () => {
  it("removes bin, files, CLI deps and CLI scripts", () => {
    const out = stripCliFromRootPackage({
      name: "acme",
      bin: { saasprokit: "dist/index.js" },
      files: ["dist/index.js"],
      scripts: { build: "turbo build", setup: "tsup --silent && node dist/index.js init", "test:cli": "vitest run" },
      dependencies: { "@clack/prompts": "^1.7.0", commander: "^15.0.0", "comment-json": "^4.4.1" },
      devDependencies: { tsup: "^8.5.1", turbo: "^2.10.6" },
    });
    expect(out.bin).toBeUndefined();
    expect(out.files).toBeUndefined();
    expect(out.dependencies).toBeUndefined();
    expect(out.scripts).toEqual({ build: "turbo build" });
    expect(out.devDependencies).toEqual({ turbo: "^2.10.6" });
  });
});
