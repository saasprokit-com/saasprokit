# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-grade Next.js 16 monorepo using pnpm workspaces and Turborepo. Features a multi-organization SaaS dashboard with Better Auth for authentication, Prisma ORM with PostgreSQL (Neon), and Stripe integration for billing. The app includes multi-language support, international routing, and both organization and personal account management.

The app uses grouped routes with `(app)` and `(frontier)` route groups under `/[locale]/(app)/` namespace.

## Commands

```bash
# Development
pnpm dev                      # Run all apps in dev mode
pnpm --filter app dev         # Main app only (port 3000)
pnpm --filter docs dev        # Documentation (port 3004)
pnpm --filter storybook dev   # Component library (port 6006)
pnpm --filter email dev       # Email preview (port 3003)
pnpm --filter studio dev      # Prisma Studio (port 3005)

# Build & Quality
pnpm build                    # Build all apps and packages
pnpm check                    # Lint check via ultracite + Biome
pnpm fix                      # Auto-fix lint issues
pnpm --filter app typecheck   # Type check web app

# Testing (details: saasprokit:testing skill)
pnpm test                     # All unit tests via turbo (@repo/auth, @repo/payment, app)
pnpm --filter app test:e2e    # Playwright E2E tests

# Database (details: saasprokit:data-access skill)
pnpm migrate                  # Format, generate, and push Prisma schema

# Local infra (details: saasprokit:env-setup skill)
docker compose up postgres maildev   # DB + mail catcher (recommended for app dev)
```

## Monorepo Structure

**Apps** (independently deployable): `web` (main SaaS app, port 3000), `docs` (Fumadocs, 3004), `email` (React Email previews, 3003), `storybook` (design system, 6006), `studio` (Prisma Studio, 3005).

**Core packages**: `@repo/auth` (Better Auth, dual RBAC), `@repo/database` (Prisma), `@repo/design-system` (shadcn/ui + Radix), `@repo/payment` (Stripe, plans), `@repo/email` (React Email + Resend).

**Supporting packages**: `@repo/utils`, `@repo/logger` (Pino, `/server` + `/client` exports), `@repo/internationalization`, `@repo/seo`, `@repo/storage`, `@repo/typescript-config`.

## SaaSProKit Skills (read before working in these areas)

Detailed architecture docs live as skills in the `saasprokit` plugin at `saasprokit-skills/skills/*/SKILL.md`. Once the plugin is installed they are invocable as `/saasprokit:<name>`; either way, read the relevant SKILL.md BEFORE writing code in its area:

- `saasprokit:auth` — Better Auth setup, role systems, server-side session helpers (`getServerSession`, `requireAuth`, `hasOrgPermission`), `validateOrgMembershipBySlug`, server action auth (`verifySession`, `toActionError`), client-side usage
- `saasprokit:routing` — Route structure, edge middleware (`apps/web/proxy.ts`), centralized routes (`@/lib/routes`), locale handling
- `saasprokit:data-access` — `servers/` vs `lib/` split in `apps/web`, Prisma workflow
- `saasprokit:forms` — Form patterns (RHF + zod + server actions), scaffold recipes for new forms and dialogs
- `saasprokit:tables` — Server-driven data table pages (TanStack Table manual mode + nuqs URL state + Prisma), scaffold recipe for list/table pages
- `saasprokit:billing` — Stripe integration, subscription plans, webhook config
- `saasprokit:conventions` — No barrel imports, Next.js 16 async params, interface-over-type, comments explain why (no redundant docblocks)
- `saasprokit:workflows` — Recipes for new org-scoped pages, account pages, API routes
- `saasprokit:testing` — Vitest/Playwright layout, CI rules, Turbo build graph
- `saasprokit:env-setup` — Env vars, Docker Compose, MailDev

**Plugin setup** (once per machine): `/plugin marketplace add ./` then `/plugin install saasprokit@saasprokit`, then `/reload-plugins`. The marketplace manifest lives at `.claude-plugin/marketplace.json`; the plugin at `saasprokit-skills/`.

## Key Conventions

### Path Aliases

- `@/*` — Resolves to root of web app (use for web-specific files)
- `@repo/*` — Resolves to `packages/` (use for shared code)

### Linting & Formatting

**Biome** (`biome.jsonc`) extends `ultracite/core`, `ultracite/react`, `ultracite/next`. Test files are excluded from linting; `noBarrelFile` and `noNonNullAssertion` are disabled; design system `ui/`, `lib/`, `hooks/` directories are excluded.

### Design System

`DESIGN.md` (repo root) is the source of truth for the marketing/homepage UI — shadcn `new-york`/`neutral` foundation, OKLCH tokens, typography scale, and a decisions log. Read it before touching homepage sections or `packages/design-system` tokens.

## Skills & Plugins

**Vercel plugin** (`vercel@claude-plugins-official`) is installed and injects skills dynamically via hooks.

**Agent Skills** come from two places:
- `saasprokit-skills/skills/` — SaaSProKit-owned skills, tracked in git and shipped as the `saasprokit` plugin (see list above). Also symlinked into `.agents/skills/` so other agents (Codex, Cursor, etc.) discover the same skills; `AGENTS.md` at the repo root carries the equivalent guidance for those tools.
- `.agents/skills/` — third-party skills managed by `skills-lock.json`, restored on demand via `pnpm skills:install` (Better Auth, Prisma, Stripe, Vercel/React, shadcn, Turborepo, web design). Not automatic on `pnpm install` — it shells out to `git`, which the Docker images lack. Update with `npx skills check` then `npx skills update`.

**When the user requests a review**, read the relevant SKILL.md files before starting. For auth-related reviews, read the Better Auth skills. For database/schema reviews, read the Prisma skills. Include a subtractive pass: flag redundant checks (confirm what callees already guarantee by reading their installed source) and copy that overpromises.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

## Confirmation

- End every completed task with `---DONE---`
