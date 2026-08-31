import type { HostTarget } from "../hosts";
import { KIT_DOCS_FILTER } from "./kit-docs";

export interface PackageJsonShape {
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: string[];
  name?: string;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

const CLI_DEPS = ["@clack/prompts", "commander", "comment-json"];
const CLI_SCRIPTS = ["setup", "test:cli", "typecheck:cli"];
const CLI_DEV_DEPS = ["tsup"];

function omit(record: Record<string, string> | undefined, keys: string[]) {
  if (!record) {
    return;
  }
  const next = Object.fromEntries(
    Object.entries(record).filter(([key]) => !keys.includes(key))
  );
  return Object.keys(next).length > 0 ? next : undefined;
}

export function pruneAppPackage(
  pkg: PackageJsonShape,
  target: HostTarget
): PackageJsonShape {
  return {
    ...pkg,
    scripts: omit(pkg.scripts, target.stripScripts),
    devDependencies: omit(pkg.devDependencies, target.stripDevDeps),
  };
}

export function renameRootPackage(
  pkg: PackageJsonShape,
  slug: string
): PackageJsonShape {
  return { ...pkg, name: slug };
}

const KIT_DOCS_SCRIPTS = ["kit-docs:dev", "kit-docs:build", "kit-docs:deploy"];

export function stripKitDocsFromRootPackage(
  pkg: PackageJsonShape
): PackageJsonShape {
  const kept = omit(pkg.scripts, KIT_DOCS_SCRIPTS);
  return {
    ...pkg,
    scripts:
      kept &&
      Object.fromEntries(
        Object.entries(kept).map(([name, command]) => [
          name,
          command.replace(KIT_DOCS_FILTER, ""),
        ])
      ),
  };
}

export function stripCliFromRootPackage(
  pkg: PackageJsonShape
): PackageJsonShape {
  const { bin: _bin, files: _files, ...rest } = pkg;
  return {
    ...rest,
    scripts: omit(pkg.scripts, CLI_SCRIPTS),
    dependencies: omit(pkg.dependencies, CLI_DEPS),
    devDependencies: omit(pkg.devDependencies, CLI_DEV_DEPS),
  };
}
