# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-grade Next.js 16 monorepo using pnpm workspaces and Turborepo. Multi-organization SaaS dashboard with Better Auth, Prisma + PostgreSQL (Neon), Stripe billing per organization, i18n, and both org and personal account surfaces.

`apps/web/app/[locale]/` holds the app: `(frontier)` is the public marketing home, `auth/` is sign-in and related pages, `(app)` is the authenticated dashboard (`[orgSlug]/`, `account/`, `admin/`, `invite/`), and `org/` is a top-level post-login redirect hop **outside** `(app)`. Details: `saasprokit:routing`.

## Commands

```bash
# First-time local (install first — the setup CLI is a devDependency)
pnpm install
pnpm run setup                # Name the app, prune to a deploy target, write env files
docker compose up postgres maildev
pnpm migrate                  # prisma format + generate + db push
pnpm --filter @repo/database db:seed   # wipes every table, then seeds admin@example.com

# Development
pnpm dev                      # All apps except kit-docs
pnpm --filter app dev         # Main app only (port 3000)
pnpm --filter docs dev        # Customer's product docs, empty Fumadocs starter (port 3004)
pnpm --filter storybook dev   # Component library (port 6006)
pnpm --filter email dev       # Email preview (port 3003)
pnpm --filter studio dev      # Prisma Studio (port 3005)
pnpm kit-docs:dev             # SaaSProKit's own documentation (port 3006)

# Build & Quality
pnpm build                    # All apps and packages (excludes kit-docs)
pnpm check                    # Lint via ultracite + Biome
pnpm fix                      # Auto-fix lint issues
pnpm --filter app typecheck   # Type check web app

# Testing (details: saasprokit:testing)
pnpm test                     # Unit tests via turbo (app, @repo/auth, @repo/database)
pnpm --filter app test:e2e    # Playwright E2E
```

Optional: `pnpm skills:install` restores third-party skills into `.agents/skills/` (needs `git`; not part of `pnpm install`).

## Monorepo Structure

**Apps** (independently deployable): `web` (main SaaS app, port 3000, package name `app`), `docs` (customer's Fumadocs, 3004), `email` (React Email previews, 3003), `storybook` (design system, 6006), `studio` (Prisma Studio, 3005).

`apps/docs` ships as an **empty** Fumadocs starter — it is the customer's product documentation, not ours. SaaSProKit's own documentation is the root **`docs/`** folder (workspace package `kit-docs`, port 3006), excluded from the default `pnpm dev` / `pnpm build` fan-out. `pnpm setup` initializes `apps/docs` alongside `apps/web`, then deletes `docs/` and every reference to it (workspace entry, `kit-docs:*` scripts, the `--filter=!kit-docs` guards, the dev Dockerfile COPY, the Biome exclude, the README tree line, the VS Code launch config, and kit-docs mentions in CLAUDE.md / AGENTS.md / env-setup) — the customer's clone keeps none of our documentation.

**Core packages**: `@repo/auth` (Better Auth, dual RBAC, Stripe billing + plans), `@repo/database` (Prisma), `@repo/design-system` (shadcn/ui + Radix), `@repo/email` (React Email + Resend).

**Supporting packages**: `@repo/utils`, `@repo/logger` (Pino, `/server` + `/client` exports), `@repo/internationalization`, `@repo/seo`, `@repo/storage`, `@repo/typescript-config`.

## SaaSProKit Skills (read before working in these areas)

Architecture docs live as skills in the `saasprokit` plugin at `saasprokit-skills/skills/*/SKILL.md`. Once the plugin is installed they are invocable as `/saasprokit:<name>`; either way, read the relevant SKILL.md **before** writing code in its area:

- `saasprokit:auth` — Better Auth, dual admin + org RBAC, session helpers (`getServerSession`, `requireAuth`, `hasOrgPermission`), org-slug access (`getActiveOrganization`), server-action auth (`verifySession`, `toActionError`), platform `/admin` gates
- `saasprokit:routing` — Route groups, edge `apps/web/middleware.ts`, centralized routes (`@/lib/routes`), locale handling
- `saasprokit:data-access` — unified `lib/` server-side data layer in `apps/web` (domain queries/actions + foundation), Prisma workflow
- `saasprokit:forms` — Recipe A (RHF + `useActionState` + typed values), Recipe B (`<form action>`), `useTransition` for non-forms; one zod schema on client and server
- `saasprokit:tables` — Server-driven data tables (TanStack Table manual mode + nuqs + Prisma)
- `saasprokit:billing` — Stripe, subscription plans, webhook config
- `saasprokit:conventions` — No barrel imports, Next.js 16 async params, interface-over-type, comments explain why
- `saasprokit:deployment` — Cloudflare Workers / Vercel / AWS: host-specific vs shared, env-driven seams, workerd constraints
- `saasprokit:workflows` — Recipes for new org-scoped pages, account pages, API routes
- `saasprokit:testing` — Vitest/Playwright layout, CI rules, Turbo graph
- `saasprokit:env-setup` — Env vars, Docker Compose, MailDev, `pnpm run setup`

**Plugin setup** (once per machine): `/plugin marketplace add ./` then `/plugin install saasprokit@saasprokit`, then `/reload-plugins`. Marketplace: `.claude-plugin/marketplace.json`; plugin: `saasprokit-skills/`.

## Key Conventions

### Path aliases

- `@/*` — web app root
- `@repo/*` — `packages/`

### Forms and mutations

Submitted `<form>`s use React 19 **`useActionState`**, gated on that hook's `isPending` (never RHF `isSubmitting`). Field forms are Recipe A (RHF + `startTransition(() => formAction(values))`); confirm/delete are Recipe B (`<form action={formAction}>`). Menus, `onChange` mutations, redirects, and file uploads use **`useTransition`**. After `await` inside `startTransition(async () => …)`, re-wrap `setState` in a nested transition. Details: `saasprokit:forms`.

Every server action validates with its zod schema and authenticates independently — rendering a form on a protected page is not a security boundary. Details: `saasprokit:auth` and `saasprokit:forms`.

### Linting

Biome (`biome.jsonc`) extends `ultracite/biome/core`, `ultracite/biome/react`, `ultracite/biome/next`. Test files and design-system `ui/` / `lib/` / `hooks/` are excluded. `noBarrelFile` and `noNonNullAssertion` are off (among several ultracite 7.9 deferrals — read `biome.jsonc` rather than assuming a rule is on).

### Design system

`DESIGN.md` (repo root) is the source of truth for marketing/homepage UI. Read it before touching homepage sections or `packages/design-system` tokens.

### Generated notes

Scratch plans, reviews, and specs go in **`.docs/`** (gitignored). Do not put them in `docs/` — that is kit-docs, the product we ship.

## Skills & Plugins

**Agent Skills** come from two places:

- `saasprokit-skills/skills/` — SaaSProKit-owned, tracked in git, shipped as the `saasprokit` plugin (list above). Symlinked into `.agents/skills/` so Codex/Cursor see the same set; `AGENTS.md` is the equivalent map for those tools.
- `.agents/skills/` — also holds third-party skills from `skills-lock.json`, restored via `pnpm skills:install` (Better Auth, Prisma, Stripe, Vercel/React, shadcn, Turborepo, web design). Not automatic on `pnpm install`. Update with `npx skills check` then `npx skills update`.

**When the user requests a review**, read the relevant SKILL.md files first. For auth, read the Better Auth skills; for schema, the Prisma skills. Include a subtractive pass: flag redundant checks (confirm what callees already guarantee) and copy that overpromises.

## Skill routing

When the user's request matches an available skill, invoke it using the Skill tool as the first action. Do not answer ad-hoc first — the skill has the repo's recipes.

## Confirmation

- End every completed task with `---DONE---`
