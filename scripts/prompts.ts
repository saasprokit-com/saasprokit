import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  text,
} from "@clack/prompts";
import {
  applyInit,
  devDbName,
  existingEnvFiles,
  slugify,
  stripCliTooling,
} from "./apply";
import { HOST_TARGETS, type HostId } from "./hosts";
import { type EnvAnswers, generateAuthSecret } from "./transforms/env-file";

export interface InitFlags {
  commit: boolean;
  host?: string;
  install: boolean;
  keepAllHosts: boolean;
  keepSetup: boolean;
  name?: string;
  yes: boolean;
}

const HOST_IDS = Object.keys(HOST_TARGETS) as HostId[];

function run(command: string, rootDir: string): void {
  execSync(command, { cwd: rootDir, stdio: "inherit" });
}

function bail(message: string): never {
  cancel(message);
  process.exit(1);
}

function assertSupportedNode(): void {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22) {
    bail(`Node >= 22 required (found ${process.versions.node}).`);
  }
}

export interface GitStatus {
  dirty: boolean;
  isRepo: boolean;
}

export type CommitPlan =
  | { kind: "ask" }
  | { kind: "commit" }
  | { kind: "skip"; message?: string };

export function planCommit(
  flags: Pick<InitFlags, "commit" | "yes">,
  status: GitStatus
): CommitPlan {
  if (!flags.commit) {
    return { kind: "skip" };
  }
  if (!status.isRepo) {
    return { kind: "skip", message: "skipped commit (not a git repository)" };
  }
  if (status.dirty && flags.yes) {
    return {
      kind: "skip",
      message:
        "skipped commit — the working tree already had uncommitted changes; review and commit yourself",
    };
  }
  return flags.yes ? { kind: "commit" } : { kind: "ask" };
}

function checkGitStatus(rootDir: string): GitStatus {
  try {
    const output = execSync("git status --porcelain", { cwd: rootDir })
      .toString()
      .trim();
    return { isRepo: true, dirty: output.length > 0 };
  } catch {
    return { isRepo: false, dirty: false };
  }
}

async function confirmDirtyTree(
  status: GitStatus,
  yes: boolean
): Promise<void> {
  if (!status.dirty || yes) {
    return;
  }
  const proceed = await confirm({
    message: "Working tree has uncommitted changes. Continue anyway?",
    initialValue: false,
  });
  if (isCancel(proceed) || !proceed) {
    bail("Aborted — commit or stash first.");
  }
}

async function resolveName(flags: InitFlags): Promise<string> {
  if (flags.name !== undefined) {
    return flags.name;
  }
  const answer = await text({
    message: "Project name?",
    placeholder: "acme",
    validate: (v) => (v?.trim() ? undefined : "Required"),
  });
  if (isCancel(answer)) {
    bail("Aborted.");
  }
  return answer;
}

async function resolveHost(flags: InitFlags): Promise<HostId> {
  const fromFlag = flags.host as HostId | undefined;
  const host =
    fromFlag ??
    (await (async () => {
      const answer = await select({
        message: "Where will you deploy?",
        options: HOST_IDS.map((id) => ({
          value: id,
          label: HOST_TARGETS[id].label,
        })),
      });
      if (isCancel(answer)) {
        bail("Aborted.");
      }
      return answer;
    })());
  if (!HOST_IDS.includes(host)) {
    bail(`Unknown host "${host}". Expected: ${HOST_IDS.join(" | ")}`);
  }
  return host;
}

async function collectStripeAnswers(answers: EnvAnswers): Promise<void> {
  const stripeKey = await text({
    message: "Stripe secret key? (empty to skip — dev works without it)",
    defaultValue: "",
  });
  if (isCancel(stripeKey) || !stripeKey) {
    return;
  }
  answers.stripeSecretKey = stripeKey;
  const webhookSecret = await text({
    message: "Stripe webhook secret? (empty to skip)",
    defaultValue: "",
  });
  if (!isCancel(webhookSecret) && webhookSecret) {
    answers.stripeWebhookSecret = webhookSecret;
  }
}

async function collectOauthAnswers(answers: EnvAnswers): Promise<void> {
  const wantsOauth = await confirm({
    message: "Configure Google/GitHub OAuth now?",
    initialValue: false,
  });
  if (isCancel(wantsOauth) || !wantsOauth) {
    return;
  }
  const oauthKeys = [
    ["googleClientId", "Google client ID?"],
    ["googleClientSecret", "Google client secret?"],
    ["githubClientId", "GitHub client ID?"],
    ["githubClientSecret", "GitHub client secret?"],
  ] as const;
  for (const [key, message] of oauthKeys) {
    const value = await text({ message, defaultValue: "" });
    if (!isCancel(value) && value) {
      answers[key] = value;
    }
  }
}

async function collectAnswers(name: string, slug: string): Promise<EnvAnswers> {
  const answers = defaultAnswers(name, slug);
  const databaseUrl = await text({
    message: "Dev DATABASE_URL?",
    initialValue: answers.databaseUrl,
  });
  if (isCancel(databaseUrl)) {
    bail("Aborted.");
  }
  answers.databaseUrl = databaseUrl;

  const adminEmails = await text({
    message: "Admin email(s), comma-separated? (empty to skip)",
    defaultValue: "",
  });
  if (!isCancel(adminEmails) && adminEmails) {
    answers.adminEmails = adminEmails;
  }

  await collectStripeAnswers(answers);
  await collectOauthAnswers(answers);
  return answers;
}

function defaultAnswers(name: string, slug: string): EnvAnswers {
  return {
    appName: name,
    databaseUrl: `postgresql://dev:dev@localhost:5432/${devDbName(slug)}`,
    authSecret: generateAuthSecret(),
  };
}

async function resolveOverwriteEnv(
  rootDir: string,
  yes: boolean
): Promise<boolean> {
  const existing = existingEnvFiles(rootDir);
  if (existing.length === 0) {
    return true;
  }
  if (yes) {
    return false;
  }
  const answer = await confirm({
    message: `Overwrite existing ${existing.join(" and ")}? A new BETTER_AUTH_SECRET invalidates current sessions.`,
    initialValue: false,
  });
  return !isCancel(answer) && answer;
}

// comment-json and JSON.stringify both emit shapes Biome rejects, so the
// customer's first `pnpm check` would fail on files the CLI wrote.
function formatGeneratedFiles(rootDir: string, files: string[]): void {
  const present = files.filter((file) => existsSync(join(rootDir, file)));
  if (present.length === 0) {
    return;
  }
  try {
    execSync(`pnpm exec biome format --write ${present.join(" ")}`, {
      cwd: rootDir,
      stdio: "ignore",
    });
  } catch {
    log.warn("could not run biome format — run `pnpm fix` after install");
  }
}

function maybeInstall(flags: InitFlags, rootDir: string): void {
  if (!flags.install) {
    return;
  }
  run("pnpm install --no-frozen-lockfile", rootDir);
  run("pnpm --filter @repo/database build", rootDir);
}

async function maybeCommit(
  flags: InitFlags,
  rootDir: string,
  slug: string,
  status: GitStatus
): Promise<void> {
  const plan = planCommit(flags, status);
  if (plan.kind === "skip") {
    if (plan.message) {
      log.step(plan.message);
    }
    return;
  }
  if (plan.kind === "ask") {
    const confirmed = await confirm({
      message: "Commit the initialized project?",
      initialValue: true,
    });
    if (isCancel(confirmed) || !confirmed) {
      return;
    }
  }
  run("git add -A", rootDir);
  run(`git commit -m "chore: initialize ${slug} from saasprokit"`, rootDir);
}

export async function runInit(
  rootDir: string,
  flags: InitFlags
): Promise<void> {
  intro("SaaSProKit setup");
  assertSupportedNode();
  const gitStatus = checkGitStatus(rootDir);
  await confirmDirtyTree(gitStatus, flags.yes);

  const name = await resolveName(flags);
  const slug = slugify(name);
  if (!slug) {
    bail(`Project name "${name}" contains no usable characters (a-z, 0-9).`);
  }
  const host = await resolveHost(flags);
  const answers = flags.yes
    ? defaultAnswers(name, slug)
    : await collectAnswers(name, slug);

  const overwriteEnv = await resolveOverwriteEnv(rootDir, flags.yes);
  const applyLog = applyInit(rootDir, {
    slug,
    host,
    keepAllHosts: flags.keepAllHosts,
    answers,
    overwriteEnv,
  });
  for (const line of applyLog) {
    log.step(line);
  }

  if (!flags.keepSetup) {
    stripCliTooling(rootDir);
    log.step("removed setup tooling");
  }

  formatGeneratedFiles(rootDir, [
    "package.json",
    "apps/web/package.json",
    "apps/web/wrangler.jsonc",
    "apps/docs/package.json",
    "apps/docs/wrangler.jsonc",
  ]);

  maybeInstall(flags, rootDir);

  await maybeCommit(flags, rootDir, slug, gitStatus);

  note(HOST_TARGETS[host].nextSteps.join("\n"), "Next steps");
  outro("Done. Start hacking: pnpm dev");
}
