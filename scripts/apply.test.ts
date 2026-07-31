import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyInit } from "./apply";

const FIXTURE_FILES: Record<string, string> = {
  "package.json": JSON.stringify({
    name: "saasprokit",
    bin: { saasprokit: "dist/index.js" },
    scripts: { build: "turbo build", setup: "tsup --silent && node dist/index.js init" },
    dependencies: { commander: "^15.0.0" },
  }),
  "apps/web/package.json": JSON.stringify({
    name: "app",
    scripts: {
      build: "next build",
      deploy: "pnpm cf:build && opennextjs-cloudflare deploy",
      "deploy:demo": "pnpm cf:build && opennextjs-cloudflare deploy --env=demo",
      preview: "x", upload: "x", "cf:build": "x",
    },
    devDependencies: { "@opennextjs/cloudflare": "^1", wrangler: "^4", vitest: "^4" },
  }),
  "apps/web/wrangler.jsonc": `{
  "name": "saasprokit-web",
  "env": { "demo": { "name": "saasprokit-web" } }
}`,
  "apps/web/open-next.config.ts": "export default {};",
  "apps/web/public/_headers": "/x\n",
  "apps/web/lib/stubs/prisma-adapter-pg.ts": "export {};",
  "apps/web/Dockerfile": "FROM node:22\n",
  "apps/web/vercel.json": "{}",
  "apps/web/scripts/skip-ci.js": "// x\n",
  "apps/web/.env.example": 'NEXT_PUBLIC_APP_NAME="MyApp"\nDATABASE_URL="postgresql://dev"\nBETTER_AUTH_SECRET=\n',
  "packages/database/prisma/schema.prisma": `generator client {\n  provider = "prisma-client"\n  runtime       = "workerd"\n}\n`,
  "docker-compose.yml": `services:\n  postgres:\n    environment:\n      POSTGRES_DB: saasprokit_dev\n  web:\n    environment:\n      - DATABASE_URL=postgresql://dev:dev@postgres:5432/saasprokit_dev\n`,
};

function makeFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "saasprokit-cli-"));
  for (const [file, content] of Object.entries(FIXTURE_FILES)) {
    mkdirSync(join(root, file, ".."), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
}

const CONFIG = (host: "cloudflare" | "vercel" | "docker") => ({
  slug: "acme",
  host,
  keepAllHosts: false,
  answers: { appName: "Acme", databaseUrl: "postgresql://dev", authSecret: "s" },
});

let root: string;
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("applyInit", () => {
  it("vercel: prunes cloudflare + docker, drops the workerd runtime", () => {
    root = makeFixture();
    applyInit(root, CONFIG("vercel"));
    expect(existsSync(join(root, "apps/web/wrangler.jsonc"))).toBe(false);
    expect(existsSync(join(root, "apps/web/Dockerfile"))).toBe(false);
    expect(existsSync(join(root, "apps/web/vercel.json"))).toBe(true);
    const appPkg = JSON.parse(readFileSync(join(root, "apps/web/package.json"), "utf8"));
    expect(appPkg.scripts.deploy).toBeUndefined();
    expect(appPkg.devDependencies.wrangler).toBeUndefined();
    expect(appPkg.devDependencies.vitest).toBeDefined();
    expect(readFileSync(join(root, "packages/database/prisma/schema.prisma"), "utf8")).not.toContain("workerd");
  });

  it("cloudflare: keeps wrangler (rebranded, demo-stripped), drops vercel + docker files", () => {
    root = makeFixture();
    applyInit(root, CONFIG("cloudflare"));
    const wrangler = readFileSync(join(root, "apps/web/wrangler.jsonc"), "utf8");
    expect(wrangler).toContain("acme-web");
    expect(wrangler).not.toContain('"env"');
    expect(existsSync(join(root, "apps/web/vercel.json"))).toBe(false);
    expect(existsSync(join(root, "apps/web/Dockerfile"))).toBe(false);
    expect(readFileSync(join(root, "packages/database/prisma/schema.prisma"), "utf8")).toContain("workerd");
  });

  it("docker: keeps the Dockerfile, drops cloudflare + vercel files", () => {
    root = makeFixture();
    applyInit(root, CONFIG("docker"));
    expect(existsSync(join(root, "apps/web/Dockerfile"))).toBe(true);
    expect(existsSync(join(root, "apps/web/wrangler.jsonc"))).toBe(false);
    expect(existsSync(join(root, "apps/web/vercel.json"))).toBe(false);
  });

  it("writes env files and renames the root package", () => {
    root = makeFixture();
    applyInit(root, CONFIG("vercel"));
    expect(readFileSync(join(root, "apps/web/.env.local"), "utf8")).toContain('NEXT_PUBLIC_APP_NAME="Acme"');
    expect(readFileSync(join(root, "packages/database/.env"), "utf8")).toContain("DATABASE_URL");
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name).toBe("acme");
  });

  it("keepAllHosts skips deletion but still writes env", () => {
    root = makeFixture();
    applyInit(root, { ...CONFIG("vercel"), keepAllHosts: true });
    expect(existsSync(join(root, "apps/web/wrangler.jsonc"))).toBe(true);
    expect(existsSync(join(root, "apps/web/.env.local"))).toBe(true);
  });

  it("rebrands docker-compose.yml so the DB name matches the generated DATABASE_URL", () => {
    root = makeFixture();
    applyInit(root, CONFIG("docker"));
    const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");
    expect(compose).toContain("acme_dev");
    expect(compose).not.toContain("saasprokit");
  });

  it("hyphenated slugs get an underscore DB name in docker-compose.yml, matching the generated DATABASE_URL", () => {
    root = makeFixture();
    applyInit(root, { ...CONFIG("docker"), slug: "acme-co" });
    const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");
    expect(compose).toContain("acme_co_dev");
    expect(compose).not.toContain("acme-co_dev");
    expect(compose).not.toContain("saasprokit");
  });
});
