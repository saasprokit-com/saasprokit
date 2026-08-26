import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyInit, devDbName, removeKitDocs, stripCliTooling } from "./apply";

const FIXTURE_FILES: Record<string, string> = {
  "package.json": JSON.stringify({
    name: "saasprokit",
    bin: { saasprokit: "dist/index.js" },
    scripts: {
      build: "turbo build --filter=!kit-docs",
      dev: "turbo dev --filter=!kit-docs",
      "kit-docs:dev": "pnpm --filter kit-docs dev",
      "kit-docs:build": "pnpm --filter kit-docs build",
      "kit-docs:deploy": "pnpm --filter kit-docs run deploy:site",
      setup: "tsup --silent && node dist/index.js init",
    },
    dependencies: { commander: "^15.0.0" },
  }),
  "pnpm-workspace.yaml": 'packages:\n  - "apps/*"\n  - "packages/*"\n  - "docs"\n',
  "docker/dev.Dockerfile": "COPY apps/docs/package.json apps/docs/source.config.ts ./apps/docs/\nCOPY docs/package.json docs/source.config.ts ./docs/\nCOPY apps/email/package.json ./apps/email/package.json\n",
  "biome.jsonc": '{\n  "files": {\n    "includes": [\n      "**/*",\n      "!apps/docs/**/*.json",\n      "!docs/**/*.json"\n    ]\n  }\n}\n',
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
  "apps/docs/package.json": JSON.stringify({
    name: "docs",
    scripts: {
      build: "next build",
      deploy: "pnpm cf:build && opennextjs-cloudflare deploy",
      preview: "x", upload: "x", "cf:build": "x",
    },
    devDependencies: { "@opennextjs/cloudflare": "^1", wrangler: "^4", typescript: "^5" },
  }),
  "apps/docs/wrangler.jsonc": `{
  "name": "saasprokit-docs",
  "r2_buckets": [{ "bucket_name": "saasprokit-docs-cache" }]
}`,
  "apps/docs/open-next.config.ts": "export default {};",
  "apps/docs/public/_headers": "/x\n",
  "apps/docs/Dockerfile": "FROM node:22\n",
  "docs/package.json": JSON.stringify({ name: "kit-docs" }),
  "docs/wrangler.jsonc": `{
  "name": "saasprokit-docs",
  "env": { "site": { "routes": [{ "pattern": "docs.saasprokit.com" }] } }
}`,
  "packages/database/prisma/schema.prisma": `generator client {\n  provider = "prisma-client"\n  runtime       = "workerd"\n}\n`,
  "docker-compose.yml": `services:\n  postgres:\n    environment:\n      POSTGRES_DB: saasprokit_dev\n  web:\n    environment:\n      - DATABASE_URL=postgresql://dev:dev@postgres:5432/saasprokit_dev\n`,
  "tsup.config.ts": "export default {};",
  "vitest.config.mts": "export default {};",
  "scripts/index.ts": "// cli\n",
  "dist/index.js": "// bundle\n",
  ".github/workflows/ci.yml": `jobs:
  test:
    steps:
      - name: Run tests
        run: pnpm test

      - name: Run setup CLI tests
        run: pnpm test:cli

  setup-cli:
    strategy:
      matrix:
        host: [cloudflare, vercel, docker]
    steps:
      - name: Run setup CLI
        run: pnpm run setup --yes
`,
};

const CLI_OWNED_FILES = [
  "scripts",
  "tsup.config.ts",
  "vitest.config.mts",
  "dist",
];

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
  overwriteEnv: true,
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

  it("initializes apps/docs the same way as apps/web", () => {
    root = makeFixture();
    applyInit(root, CONFIG("cloudflare"));
    const wrangler = readFileSync(join(root, "apps/docs/wrangler.jsonc"), "utf8");
    expect(wrangler).toContain("acme-docs");
    expect(wrangler).toContain("acme-docs-cache");
    expect(wrangler).not.toContain("saasprokit");
    expect(existsSync(join(root, "apps/docs/Dockerfile"))).toBe(false);
  });

  it("vercel: prunes the cloudflare surface from apps/docs too", () => {
    root = makeFixture();
    applyInit(root, CONFIG("vercel"));
    expect(existsSync(join(root, "apps/docs/wrangler.jsonc"))).toBe(false);
    expect(existsSync(join(root, "apps/docs/open-next.config.ts"))).toBe(false);
    expect(existsSync(join(root, "apps/docs/Dockerfile"))).toBe(false);
    const docsPkg = JSON.parse(readFileSync(join(root, "apps/docs/package.json"), "utf8"));
    expect(docsPkg.scripts["cf:build"]).toBeUndefined();
    expect(docsPkg.scripts.build).toBe("next build");
    expect(docsPkg.devDependencies.wrangler).toBeUndefined();
    expect(docsPkg.devDependencies.typescript).toBeDefined();
  });

  it("docker: keeps the apps/docs Dockerfile, drops its cloudflare config", () => {
    root = makeFixture();
    applyInit(root, CONFIG("docker"));
    expect(existsSync(join(root, "apps/docs/Dockerfile"))).toBe(true);
    expect(existsSync(join(root, "apps/docs/wrangler.jsonc"))).toBe(false);
  });

  it("host pruning alone never touches the root docs/", () => {
    root = makeFixture();
    applyInit(root, CONFIG("cloudflare"));
    expect(existsSync(join(root, "docs/package.json"))).toBe(true);
  });

  it("tolerates a clone with apps/docs deleted", () => {
    root = makeFixture();
    rmSync(join(root, "apps/docs"), { recursive: true, force: true });
    expect(() => applyInit(root, CONFIG("cloudflare"))).not.toThrow();
    expect(existsSync(join(root, "apps/web/wrangler.jsonc"))).toBe(true);
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

  it("slugs containing the brand keep the compose DB name equal to devDbName", () => {
    root = makeFixture();
    const slug = "my-saasprokit";
    applyInit(root, { ...CONFIG("docker"), slug });
    const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");
    expect(compose).toContain(devDbName(slug));
    expect(compose).not.toContain("my_my-saasprokit_dev");
  });
});

describe("env file safety", () => {
  it("keeps existing env files when overwrite was declined", () => {
    root = makeFixture();
    writeFileSync(join(root, "apps/web/.env.local"), "BETTER_AUTH_SECRET=live\n");
    const log = applyInit(root, { ...CONFIG("vercel"), overwriteEnv: false });
    expect(readFileSync(join(root, "apps/web/.env.local"), "utf8")).toBe(
      "BETTER_AUTH_SECRET=live\n"
    );
    expect(log).toContain("kept existing apps/web/.env.local");
    // The file that did not exist is still written
    expect(existsSync(join(root, "packages/database/.env"))).toBe(true);
  });

  it("replaces them when overwrite was approved", () => {
    root = makeFixture();
    writeFileSync(join(root, "apps/web/.env.local"), "BETTER_AUTH_SECRET=live\n");
    applyInit(root, { ...CONFIG("vercel"), overwriteEnv: true });
    expect(readFileSync(join(root, "apps/web/.env.local"), "utf8")).toContain(
      'NEXT_PUBLIC_APP_NAME="Acme"'
    );
  });
});

describe("removeKitDocs", () => {
  it("deletes the kit documentation", () => {
    root = makeFixture();
    removeKitDocs(root);
    expect(existsSync(join(root, "docs"))).toBe(false);
  });

  it("drops the kit-docs scripts and un-filters build/dev", () => {
    root = makeFixture();
    removeKitDocs(root);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    // turbo hard-errors on a filter matching no package, so these must go
    expect(pkg.scripts.build).toBe("turbo build");
    expect(pkg.scripts.dev).toBe("turbo dev");
    expect(pkg.scripts["kit-docs:dev"]).toBeUndefined();
    expect(pkg.scripts["kit-docs:build"]).toBeUndefined();
    expect(pkg.scripts["kit-docs:deploy"]).toBeUndefined();
    expect(pkg.scripts.setup).toBeDefined();
  });

  it("removes every reference to docs/ while leaving apps/docs alone", () => {
    root = makeFixture();
    removeKitDocs(root);
    const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    expect(workspace).not.toContain('- "docs"');
    expect(workspace).toContain('- "apps/*"');

    const dockerfile = readFileSync(join(root, "docker/dev.Dockerfile"), "utf8");
    expect(dockerfile).not.toContain("COPY docs/");
    expect(dockerfile).toContain("COPY apps/docs/package.json");

    const biome = readFileSync(join(root, "biome.jsonc"), "utf8");
    expect(biome).not.toContain('"!docs/**/*.json"');
    expect(biome).toContain('"!apps/docs/**/*.json"');
  });

  it("is safe on a clone that already lacks those files", () => {
    root = makeFixture();
    for (const file of ["pnpm-workspace.yaml", "docker/dev.Dockerfile", "biome.jsonc", "docs"]) {
      rmSync(join(root, file), { recursive: true, force: true });
    }
    expect(() => removeKitDocs(root)).not.toThrow();
  });
});

describe("stripCliTooling", () => {
  it("removes every file the CLI owns", () => {
    root = makeFixture();
    stripCliTooling(root);
    for (const file of CLI_OWNED_FILES) {
      expect(existsSync(join(root, file))).toBe(false);
    }
  });

  it("strips the CI jobs that call the now-deleted CLI scripts", () => {
    root = makeFixture();
    stripCliTooling(root);
    const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
    expect(ci).not.toContain("test:cli");
    expect(ci).not.toContain("setup-cli");
    expect(ci).not.toContain("pnpm run setup");
    expect(ci).toContain("run: pnpm test\n");
  });

  it("drops the CLI's bin and deps but leaves the project's own scripts", () => {
    root = makeFixture();
    stripCliTooling(root);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    expect(pkg.bin).toBeUndefined();
    expect(pkg.scripts.setup).toBeUndefined();
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.scripts.build).toBe("turbo build --filter=!kit-docs");
  });
});
