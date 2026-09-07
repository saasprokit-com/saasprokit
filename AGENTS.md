# AGENTS.md

Guidance for AI coding agents (Codex, Cursor, and other AGENTS.md-compatible tools) working in this repository. Claude Code users: see `CLAUDE.md`.

## Project Overview

A production-grade Next.js 16 monorepo using pnpm workspaces and Turborepo. Multi-organization SaaS dashboard with Better Auth, Prisma + PostgreSQL (Neon), Stripe billing per organization, and i18n.

`apps/web/app/[locale]/` holds `(frontier)` (marketing home), `auth/`, `(app)` (dashboard: `[orgSlug]/`, `account/`, `admin/`, `invite/`), and top-level `org/` (post-login redirect hop **outside** `(app)`). Details: `routing` skill.

`apps/docs` is an empty Fumadocs starter for the **customer's** product docs (port 3004). Root `docs/` is kit-docs (port 3006), excluded from default `pnpm dev` / `pnpm build`. `pnpm setup` keeps `apps/docs` and deletes `docs/` plus every kit-docs reference. Scratch plans/reviews go in **`.docs/`** (gitignored), never `docs/`.

## Commands

```bash
pnpm install && pnpm run setup          # CLI is a devDependency — install first
docker compose up postgres maildev
pnpm migrate                            # prisma format + generate + db push
pnpm --filter @repo/database db:seed    # wipes tables, seeds admin@example.com

pnpm dev                                # All apps except kit-docs (main app: 3000)
pnpm --filter web dev                   # Main app only
pnpm kit-docs:dev                       # SaaSProKit's own docs (port 3006)
pnpm build                              # All apps and packages (excludes kit-docs)
pnpm check                              # Lint (Biome via ultracite)
pnpm --filter web typecheck
pnpm test                               # Unit tests via turbo (web, @repo/auth)
pnpm --filter web test:e2e              # Playwright
```

Optional: `pnpm skills:install` restores third-party skills into `.agents/skills/` (needs `git`; not part of `pnpm install`).

## Skills

Architecture docs and recipes live as Agent Skills in `.agents/skills/` — symlinked from `saasprokit-skills/skills/`. Codex and Cursor discover them automatically; invoke with `$<name>` (Codex) or `/` in Agent chat (Cursor), or let the description trigger them. **Read the relevant skill before writing code in its area:**

- `auth` — Better Auth, dual admin + org RBAC, session helpers (`getServerSession`, `requireAuth`, `hasOrgPermission`), org-slug access (`getActiveOrganization`), server-action auth (`verifySession`, `toActionError`), which org mutations delegate to Better Auth (members, roles, seat limits)
- `routing` — Route groups, edge `apps/web/middleware.ts`, centralized routes (`@/lib/routes`), locale handling
- `data-access` — unified `lib/` server-side data layer in `apps/web`, Prisma workflow
- `forms` — Recipe A (RHF + `useActionState` + typed values), Recipe B (`<form action>`), `useTransition` for non-forms; one zod schema on client and server
- `tables` — Server-driven data tables (TanStack Table manual mode + nuqs + Prisma)
- `billing` — Stripe, subscription plans, webhook config
- `conventions` — No barrel imports, Next.js 16 async params, interface-over-type, comments explain why
- `deployment` — Cloudflare Workers / Vercel / AWS: host-specific vs shared, env-driven seams, workerd constraints
- `workflows` — Recipes for new org-scoped pages, account pages, API routes
- `testing` — Vitest/Playwright layout, CI rules, Turbo graph
- `env-setup` — Env vars, Docker Compose, MailDev, `pnpm run setup`

Third-party skills (Better Auth, Prisma, Stripe, shadcn, Turborepo, …) are restored into `.agents/skills/` via `pnpm skills:install` (`skills-lock.json`).

## Key Conventions

- Path aliases: `@/*` → web app root; `@repo/*` → `packages/`
- No barrel files; Next.js 16 async params; prefer `interface` over `type`; comments explain why, not what (details: `conventions` skill)
- Submitted `<form>`s use `useActionState` gated on that hook's `isPending` (never RHF `isSubmitting`). Menus, `onChange`, redirects, uploads use `useTransition`; re-wrap `setState` after `await` in a nested transition (details: `forms` skill)
- Every server action validates with its zod schema and authenticates independently (details: `forms` and `auth` skills)
- Linting: Biome via ultracite (`biome.jsonc`); run `pnpm check` before committing. Read that file rather than assuming a rule is on (`noBarrelFile` is off)
- Marketing/homepage UI: read `DESIGN.md` before touching homepage sections or design-system tokens
