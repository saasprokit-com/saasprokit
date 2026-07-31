import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HOST_TARGETS, type HostId } from "./hosts";
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
  slug: string;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    editJson(join(rootDir, "apps/web/package.json"), (pkg) =>
      pruneAppPackage(pkg, target)
    );
    log.push(`pruned apps/web/package.json for ${target.id}`);

    const schemaPath = join(rootDir, "packages/database/prisma/schema.prisma");
    writeFileSync(
      schemaPath,
      setPrismaRuntime(readFileSync(schemaPath, "utf8"), target.prismaRuntime)
    );
    log.push(`prisma runtime: ${target.prismaRuntime ?? "node (default)"}`);
  }

  const wranglerPath = join(rootDir, "apps/web/wrangler.jsonc");
  if (existsSync(wranglerPath)) {
    writeFileSync(
      wranglerPath,
      customizeWrangler(readFileSync(wranglerPath, "utf8"), config.slug)
    );
    log.push("customized wrangler.jsonc (demo env removed, rebranded)");
  }

  editJson(join(rootDir, "package.json"), (pkg) =>
    renameRootPackage(pkg, config.slug)
  );

  const example = readFileSync(join(rootDir, "apps/web/.env.example"), "utf8");
  writeFileSync(
    join(rootDir, "apps/web/.env.local"),
    renderEnvLocal(example, config.answers)
  );
  writeFileSync(
    join(rootDir, "packages/database/.env"),
    renderDatabaseEnv(config.answers.databaseUrl)
  );
  log.push("wrote apps/web/.env.local and packages/database/.env");

  return log;
}

export function stripCliTooling(rootDir: string): void {
  editJson(join(rootDir, "package.json"), stripCliFromRootPackage);
  for (const file of [
    "scripts",
    "tsup.config.ts",
    "vitest.config.mts",
    "dist",
  ]) {
    rmSync(join(rootDir, file), { recursive: true, force: true });
  }
}
