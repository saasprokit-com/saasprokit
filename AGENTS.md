# AGENTS.md

Guidance for AI coding agents (Codex, Cursor, and other AGENTS.md-compatible tools) working in this repository. Claude Code users: see `CLAUDE.md`.

## Project Overview

A production-grade Next.js 16 monorepo using pnpm workspaces and Turborepo. Multi-organization SaaS dashboard with Better Auth (authentication), Prisma + PostgreSQL (Neon), and Stripe (billing). Multi-language support with international routing under `/[locale]/(app)/`.

## Commands

```bash
pnpm dev                      # Run all apps in dev mode (main app: port 3000)
pnpm build                    # Build all apps and packages
pnpm check                    # Lint check via ultracite + Biome
pnpm fix                      # Auto-fix lint issues
pnpm --filter app typecheck   # Type check web app
pnpm test                     # All unit tests via turbo
pnpm --filter app test:e2e    # Playwright E2E tests
pnpm migrate                  # Format, generate, and push Prisma schema
```

## Skills

Detailed architecture docs and recipes live as Agent Skills (SKILL.md format) in `.agents/skills/` — symlinked to their canonical home in `saasprokit-skills/skills/`. Codex and Cursor discover them automatically; invoke explicitly with `$<name>` (Codex) or `/` in Agent chat (Cursor), or let the description trigger them. **Read the relevant skill BEFORE writing code in its area:**

- `auth` — Better Auth setup, role systems, session helpers (`getServerSession`, `requireAuth`, `checkOrgPermission`), server action auth (`verifySession`, `toActionError`)
- `routing` — Route structure, edge middleware (`apps/web/proxy.ts`), centralized routes (`@/lib/routes`), locale handling
- `data-access` — `servers/` vs `lib/` split in `apps/web`, Prisma workflow
- `forms` — Form patterns (react-hook-form + zod + server actions), scaffold recipes for new forms and dialogs
- `tables` — Server-driven data table pages (TanStack Table manual mode + nuqs URL state + Prisma), scaffold recipe for list/table pages
- `billing` — Stripe integration, subscription plans, webhook config
- `conventions` — No barrel imports, Next.js 16 async params, interface-over-type
- `workflows` — Recipes for new org-scoped pages, account pages, API routes
- `testing` — Vitest/Playwright layout, CI rules, Turbo build graph
- `env-setup` — Env vars, Docker Compose, MailDev

Additional third-party skills (Better Auth, Prisma, Stripe, shadcn, Turborepo, …) are restored into `.agents/skills/` via `pnpm skills:install` (managed by `skills-lock.json`).

## Key Conventions

- Path aliases: `@/*` → web app root; `@repo/*` → `packages/`
- No barrel files; Next.js 16 async params; prefer `interface` over `type` (details: `conventions` skill)
- Every server action must validate input with its zod schema and check auth independently (details: `forms` and `auth` skills)
- Linting: Biome via ultracite presets (`biome.jsonc`); run `pnpm check` before committing
