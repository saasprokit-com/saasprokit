export const KIT_DOCS_FILTER = " --filter=!kit-docs";

export const KIT_DOCS_REFERENCES: { file: string; lines: string[] }[] = [
  { file: "pnpm-workspace.yaml", lines: ['- "docs"'] },
  { file: "docker/dev.Dockerfile", lines: ["COPY docs/"] },
  { file: "biome.jsonc", lines: ['"!docs/**/*.json"'] },
  { file: "README.md", lines: ["SaaSProKit's own documentation"] },
  {
    file: ".github/workflows/ci.yml",
    lines: ["Typecheck kit-docs", "pnpm --filter kit-docs typecheck"],
  },
];

/** Whole-string swaps so leftover prose does not mention a deleted package. */
export const KIT_DOCS_TEXT_REPLACEMENTS: {
  file: string;
  from: string;
  to: string;
}[] = [
  {
    file: "CLAUDE.md",
    from: "pnpm dev                      # All apps except kit-docs",
    to: "pnpm dev                      # All apps",
  },
  {
    file: "CLAUDE.md",
    from: "pnpm kit-docs:dev             # SaaSProKit's own documentation (port 3006)\n",
    to: "",
  },
  {
    file: "CLAUDE.md",
    from: "pnpm build                    # All apps and packages (excludes kit-docs)",
    to: "pnpm build                    # All apps and packages",
  },
  {
    file: "CLAUDE.md",
    from: "`apps/docs` ships as an **empty** Fumadocs starter — it is the customer's product documentation, not ours. SaaSProKit's own documentation is the root **`docs/`** folder (workspace package `kit-docs`, port 3006), excluded from the default `pnpm dev` / `pnpm build` fan-out. `pnpm setup` initializes `apps/docs` alongside `apps/web`, then deletes `docs/` and every reference to it (workspace entry, `kit-docs:*` scripts, the `--filter=!kit-docs` guards, the dev Dockerfile COPY, the Biome exclude, the README tree line, the VS Code launch config, the CI typecheck step, and kit-docs mentions in CLAUDE.md / AGENTS.md / env-setup) — the customer's clone keeps none of our documentation.",
    to: "`apps/docs` ships as an **empty** Fumadocs starter — it is the product documentation site (port 3004).",
  },
  {
    file: "CLAUDE.md",
    from: "Scratch plans, reviews, and specs go in **`.docs/`** (gitignored). Do not put them in `docs/` — that is kit-docs, the product we ship.",
    to: "Scratch plans, reviews, and specs go in **`.docs/`** (gitignored).",
  },
  {
    file: "AGENTS.md",
    from: "`apps/docs` is an empty Fumadocs starter for the **customer's** product docs (port 3004). Root `docs/` is kit-docs (port 3006), excluded from default `pnpm dev` / `pnpm build`. `pnpm setup` keeps `apps/docs` and deletes `docs/` plus every kit-docs reference. Scratch plans/reviews go in **`.docs/`** (gitignored), never `docs/`.",
    to: "`apps/docs` is an empty Fumadocs starter for product docs (port 3004). Scratch plans/reviews go in **`.docs/`** (gitignored).",
  },
  {
    file: "AGENTS.md",
    from: "pnpm dev                                # All apps except kit-docs (main app: 3000)",
    to: "pnpm dev                                # All apps (main app: 3000)",
  },
  {
    file: "AGENTS.md",
    from: "pnpm kit-docs:dev                       # SaaSProKit's own docs (port 3006)\n",
    to: "",
  },
  {
    file: "AGENTS.md",
    from: "pnpm build                              # All apps and packages (excludes kit-docs)",
    to: "pnpm build                              # All apps and packages",
  },
  {
    file: "README.md",
    from: "pnpm dev                      # All apps except kit-docs (main app: 3000)",
    to: "pnpm dev                      # All apps (main app: 3000)",
  },
  {
    file: "README.md",
    from: "pnpm build                    # Build all apps except kit-docs",
    to: "pnpm build                    # Build all apps",
  },
  {
    file: "saasprokit-skills/skills/env-setup/SKILL.md",
    from: "The `docs` service is `apps/docs` — the customer's own,\nempty-by-default docs site. SaaSProKit's own documentation is the root `docs/`\nfolder (`kit-docs`, port 3006); it has no compose service, run `pnpm kit-docs:dev`.",
    to: "The `docs` service is `apps/docs` — the customer's own,\nempty-by-default docs site (port 3004).",
  },
  {
    file: ".agents/skills/env-setup/SKILL.md",
    from: "The `docs` service is `apps/docs` — the customer's own,\nempty-by-default docs site. SaaSProKit's own documentation is the root `docs/`\nfolder (`kit-docs`, port 3006); it has no compose service, run `pnpm kit-docs:dev`.",
    to: "The `docs` service is `apps/docs` — the customer's own,\nempty-by-default docs site (port 3004).",
  },
];

export function dropLines(text: string, needles: string[]): string {
  return text
    .split("\n")
    .filter((line) => !needles.some((needle) => line.includes(needle)))
    .join("\n");
}

export function applyTextReplacements(
  text: string,
  replacements: { from: string; to: string }[]
): string {
  return replacements.reduce(
    (next, { from, to }) => next.replaceAll(from, to),
    text
  );
}

interface LaunchConfig {
  name?: string;
  [key: string]: unknown;
}

interface LaunchFile {
  configurations?: LaunchConfig[];
  version?: string;
  [key: string]: unknown;
}

export function stripKitDocsLaunchConfig(text: string): string {
  try {
    const parsed = JSON.parse(text) as LaunchFile;
    if (!Array.isArray(parsed.configurations)) {
      return text;
    }
    parsed.configurations = parsed.configurations.filter(
      (config) => !String(config.name ?? "").includes("kit-docs")
    );
    return `${JSON.stringify(parsed, null, 2)}\n`;
  } catch {
    return text;
  }
}
