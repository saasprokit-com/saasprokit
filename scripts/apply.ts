import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HOST_TARGETS, type HostId } from "./hosts";
import { stripCliCi } from "./transforms/ci-workflow";
import {
  type EnvAnswers,
  renderDatabaseEnv,
  renderEnvLocal,
} from "./transforms/env-file";
import {
  type PackageJsonShape,
  pruneAppPackage,
  renameRootPackage,
  stripCliFromRootPackage,
} from "./transforms/package-json";
import { setPrismaRuntime } from "./transforms/prisma-schema";
import { customizeWrangler } from "./transforms/wrangler";

export interface ApplyConfig {
  answers: EnvAnswers;
  host: HostId;
  keepAllHosts: boolean;
  overwriteEnv: boolean;
  slug: string;
}

export const ENV_TARGETS = [
  "apps/web/.env.local",
  "packages/database/.env",
] as const;

const APP_PACKAGES = ["apps/web/package.json", "apps/docs/package.json"];

const WRANGLER_TARGETS = [
  "apps/web/wrangler.jsonc",
  "apps/docs/wrangler.jsonc",
];

export function existingEnvFiles(rootDir: string): string[] {
  return ENV_TARGETS.filter((file) => existsSync(join(rootDir, file)));
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function devDbName(slug: string): string {
  return `${slug.replaceAll("-", "_")}_dev`;
}

function editJson(
  path: string,
  edit: (pkg: PackageJsonShape) => PackageJsonShape
): void {
  const pkg = JSON.parse(readFileSync(path, "utf8")) as PackageJsonShape;
  writeFileSync(path, `${JSON.stringify(edit(pkg), null, 2)}\n`);
}

export function applyInit(rootDir: string, config: ApplyConfig): string[] {
  const target = HOST_TARGETS[config.host];
  const log: string[] = [];

  if (!config.keepAllHosts) {
    for (const file of target.deleteFiles) {
      const path = join(rootDir, file);
      if (existsSync(path)) {
        rmSync(path, { recursive: true });
        log.push(`removed ${file}`);
      }
    }
    for (const file of APP_PACKAGES) {
      const path = join(rootDir, file);
      if (existsSync(path)) {
        editJson(path, (pkg) => pruneAppPackage(pkg, target));
        log.push(`pruned ${file} for ${target.id}`);
      }
    }

    const schemaPath = join(rootDir, "packages/database/prisma/schema.prisma");
    writeFileSync(
      schemaPath,
      setPrismaRuntime(readFileSync(schemaPath, "utf8"), target.prismaRuntime)
    );
    log.push(`prisma runtime: ${target.prismaRuntime ?? "node (default)"}`);
  }

  for (const file of WRANGLER_TARGETS) {
    const wranglerPath = join(rootDir, file);
    if (existsSync(wranglerPath)) {
      writeFileSync(
        wranglerPath,
        customizeWrangler(readFileSync(wranglerPath, "utf8"), config.slug)
      );
      log.push(`customized ${file} (named envs removed, rebranded)`);
    }
  }

  const dockerComposePath = join(rootDir, "docker-compose.yml");
  if (existsSync(dockerComposePath)) {
    const rebranded = readFileSync(dockerComposePath, "utf8").replaceAll(
      "saasprokit_dev",
      devDbName(config.slug)
    );
    writeFileSync(dockerComposePath, rebranded);
    log.push("rebranded docker-compose.yml");
  }

  editJson(join(rootDir, "package.json"), (pkg) =>
    renameRootPackage(pkg, config.slug)
  );

  const example = readFileSync(join(rootDir, "apps/web/.env.example"), "utf8");
  const rendered: Record<(typeof ENV_TARGETS)[number], string> = {
    "apps/web/.env.local": renderEnvLocal(example, config.answers),
    "packages/database/.env": renderDatabaseEnv(config.answers.databaseUrl),
  };
  for (const file of ENV_TARGETS) {
    const path = join(rootDir, file);
    // Both paths are gitignored, so the dirty-tree check upstream cannot see
    // them — without this guard a second run silently replaces live secrets.
    if (!config.overwriteEnv && existsSync(path)) {
      log.push(`kept existing ${file}`);
      continue;
    }
    writeFileSync(path, rendered[file]);
    log.push(`wrote ${file}`);
  }

  return log;
}

export function stripCliTooling(rootDir: string): void {
  editJson(join(rootDir, "package.json"), stripCliFromRootPackage);

  const ciPath = join(rootDir, ".github/workflows/ci.yml");
  if (existsSync(ciPath)) {
    writeFileSync(ciPath, stripCliCi(readFileSync(ciPath, "utf8")));
  }

  for (const file of [
    "scripts",
    "tsup.config.ts",
    "vitest.config.mts",
    "dist",
  ]) {
    rmSync(join(rootDir, file), { recursive: true, force: true });
  }
}
