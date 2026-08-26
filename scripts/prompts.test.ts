import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type GitStatus,
  localNextSteps,
  planCommit,
  runInit,
} from "./prompts";

const hoisted = vi.hoisted(() => ({ onExec: (_command: string) => undefined }));

vi.mock("node:child_process", () => ({
  execSync: (command: string) => {
    hoisted.onExec(command);
    return Buffer.from("");
  },
}));

vi.mock("@clack/prompts", () => ({
  cancel: () => undefined,
  confirm: () => Promise.resolve(true),
  intro: () => undefined,
  isCancel: () => false,
  log: { step: () => undefined, warn: () => undefined },
  note: () => undefined,
  outro: () => undefined,
  select: () => Promise.resolve("docker"),
  text: () => Promise.resolve(""),
}));

const CLEAN: GitStatus = { isRepo: true, dirty: false };
const DIRTY: GitStatus = { isRepo: true, dirty: true };
const NO_REPO: GitStatus = { isRepo: false, dirty: false };

describe("planCommit", () => {
  it("asks before committing when the run is interactive", () => {
    expect(planCommit({ commit: true, yes: false }, CLEAN)).toEqual({
      kind: "ask",
    });
  });

  it("commits without asking on a clean tree under --yes", () => {
    expect(planCommit({ commit: true, yes: true }, CLEAN)).toEqual({
      kind: "commit",
    });
  });

  it("refuses to commit a dirty tree under --yes", () => {
    const plan = planCommit({ commit: true, yes: true }, DIRTY);
    expect(plan.kind).toBe("skip");
    expect(plan).toHaveProperty("message");
  });

  it("still asks on a dirty tree when interactive", () => {
    expect(planCommit({ commit: true, yes: false }, DIRTY)).toEqual({
      kind: "ask",
    });
  });

  it("says nothing when --no-commit was passed", () => {
    expect(planCommit({ commit: false, yes: true }, DIRTY)).toEqual({
      kind: "skip",
    });
    expect(planCommit({ commit: false, yes: false }, NO_REPO)).toEqual({
      kind: "skip",
    });
  });

  it("explains the skip outside a git repo, but only if a commit was wanted", () => {
    expect(planCommit({ commit: true, yes: true }, NO_REPO)).toEqual({
      kind: "skip",
      message: "skipped commit (not a git repository)",
    });
  });
});

const FIXTURE: Record<string, string> = {
  "package.json": JSON.stringify({ name: "saasprokit", scripts: {} }),
  "apps/web/package.json": JSON.stringify({ name: "app", scripts: {} }),
  "apps/web/.env.example": 'DATABASE_URL=""\nBETTER_AUTH_SECRET=\n',
  "packages/database/prisma/schema.prisma":
    'generator client {\n  provider = "prisma-client"\n}\n',
  "scripts/index.ts": "// cli\n",
  "dist/index.js": "// bundle\n",
};

describe("localNextSteps", () => {
  it("leads with the database steps the app cannot start without", () => {
    expect(localNextSteps({ install: true })).toEqual([
      "docker compose up postgres maildev",
      "pnpm migrate",
      "pnpm --filter @repo/database db:seed   # wipes existing rows",
      "pnpm dev",
    ]);
  });

  it("warns that seeding is destructive", () => {
    const seed = localNextSteps({ install: true }).find((step) =>
      step.includes("db:seed")
    );
    expect(seed).toContain("wipes");
  });

  it("prepends install when the CLI skipped it", () => {
    const steps = localNextSteps({ install: false });
    expect(steps[0]).toBe("pnpm install");
    expect(steps).toHaveLength(5);
  });
});

describe("runInit", () => {
  let root: string;
  afterEach(() => {
    hoisted.onExec = () => undefined;
    rmSync(root, { recursive: true, force: true });
  });

  it("removes the CLI before installing, so the lockfile matches the pruned manifests", async () => {
    root = mkdtempSync(join(tmpdir(), "saasprokit-init-"));
    for (const [file, content] of Object.entries(FIXTURE)) {
      mkdirSync(join(root, file, ".."), { recursive: true });
      writeFileSync(join(root, file), content);
    }

    const seen: { cliPresent: boolean; command: string }[] = [];
    hoisted.onExec = (command) => {
      seen.push({ command, cliPresent: existsSync(join(root, "scripts")) });
      return undefined;
    };

    await runInit(root, {
      name: "acme",
      host: "docker",
      yes: true,
      commit: false,
      install: true,
      keepSetup: false,
      keepAllHosts: false,
    });

    const install = seen.find((call) => call.command.startsWith("pnpm install"));
    expect(install).toBeDefined();
    expect(install?.cliPresent).toBe(false);
  });
});
