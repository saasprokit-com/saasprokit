import { execSync } from "node:child_process";
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
import { applyInit, slugify, stripCliTooling } from "./apply";
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

async function confirmDirtyTree(rootDir: string, yes: boolean): Promise<void> {
  const dirty = execSync("git status --porcelain", { cwd: rootDir })
    .toString()
    .trim();
  if (!dirty || yes) {
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
    validate: (v) => (v.trim() ? undefined : "Required"),
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
    databaseUrl: `postgresql://dev:dev@localhost:5432/${slug.replaceAll("-", "_")}_dev`,
    authSecret: generateAuthSecret(),
  };
}

function maybeInstall(flags: InitFlags, rootDir: string): void {
  if (!flags.install) {
    return;
  }
  // Pruned devDeps invalidate the committed lockfile on purpose.
  run("pnpm install --no-frozen-lockfile", rootDir);
  run("pnpm --filter @repo/database build", rootDir);
}

async function maybeCommit(
  flags: InitFlags,
  rootDir: string,
  slug: string
): Promise<void> {
  let doCommit = flags.commit;
  if (doCommit && !flags.yes) {
    const confirmed = await confirm({
      message: "Commit the initialized project?",
      initialValue: true,
    });
    doCommit = !isCancel(confirmed) && confirmed;
  }
  if (doCommit) {
    run("git add -A", rootDir);
    run(`git commit -m "chore: initialize ${slug} from saasprokit"`, rootDir);
  }
}

export async function runInit(
  rootDir: string,
  flags: InitFlags
): Promise<void> {
  intro("SaaSProKit setup");
  assertSupportedNode();
  await confirmDirtyTree(rootDir, flags.yes);

  const name = await resolveName(flags);
  const slug = slugify(name);
  if (!slug) {
    bail(`Project name "${name}" contains no usable characters (a-z, 0-9).`);
  }
  const host = await resolveHost(flags);
  const answers = flags.yes
    ? defaultAnswers(name, slug)
    : await collectAnswers(name, slug);

  const applyLog = applyInit(rootDir, {
    slug,
    host,
    keepAllHosts: flags.keepAllHosts,
    answers,
  });
  for (const line of applyLog) {
    log.step(line);
  }

  if (!flags.keepSetup) {
    stripCliTooling(rootDir);
    log.step("removed setup tooling");
  }

  // Self-removal must happen before install: pnpm install regenerates
  // pnpm-lock.yaml against whatever package manifests exist on disk at
  // that moment. Installing first would commit a lockfile still shaped
  // by the (soon-to-be-stripped) CLI deps, so the customer's very first
  // `pnpm install --frozen-lockfile` would fail. Deleting scripts/ and
  // dist/ while this process is still running off them is safe — Node
  // already has the modules loaded in memory.
  maybeInstall(flags, rootDir);

  await maybeCommit(flags, rootDir, slug);

  note(HOST_TARGETS[host].nextSteps.join("\n"), "Next steps");
  outro("Done. Start hacking: pnpm dev");
}
