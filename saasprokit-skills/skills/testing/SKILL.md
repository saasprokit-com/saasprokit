---
name: testing
description: Testing and CI for this repo — Vitest unit tests (app, @repo/auth), the four Playwright E2E projects and their setup dependency chain, the accurate Turbo task graph, and CI's self-containment rules. Read before writing, running, or debugging tests or editing GitHub Actions workflows.
---

# Testing & CI

Two independent layers: **Vitest** unit tests (fast, no DB) and **Playwright**
E2E (real Postgres + Maildev + a built app). They share no runner and no config.

## Commands

```bash
pnpm test                        # all unit tests via `turbo test` (app, @repo/auth)
pnpm --filter @repo/auth test    # one package's unit tests (vitest run)
pnpm --filter app test           # web-app unit tests (vitest run)
pnpm --filter app test:e2e       # all Playwright projects
pnpm --filter app test:e2e:ui    # Playwright UI mode
pnpm --filter app test:e2e:auth  # --project=no-auth   (name is a misnomer)
pnpm --filter app test:e2e:app   # --project=authenticated
```

`pnpm check` / `pnpm fix` run lint; `pnpm --filter app typecheck` runs `tsc`
(see Turbo graph — none of these are turbo `test`).

## Layout — unit tests

Runner: Vitest 4.x, one `vitest.config.mts` per runnable package. Tests are
co-located as `**/*.test.{ts,tsx}` (`apps/web/vitest.config.mts:10`). Two
packages have configs + a `test` script: **app** (`environment: "jsdom"`,
`apps/web/vitest.config.mts:8`) and **@repo/auth** (`environment: "node"`).
Real files: `packages/auth/permissions.test.ts`, `billing-authorize.test.ts`,
`ba-i18n.test.ts`, `helpers.test.ts`;
`apps/web/lib/routes.test.ts`, `lib/parsers.test.ts`, `lib/auth/action-error.test.ts`.

## Layout — E2E (Playwright)

Config: `apps/web/playwright.config.ts`. Specs live in `apps/web/e2e/**/*.spec.ts`
(these are **not** Vitest). **Four projects** (`playwright.config.ts:23-56`):

- `auth-setup` — signs a user in, writes `e2e/.auth/user.json`.
- `org-setup` — `dependencies: ["auth-setup"]` (`:33`); reuses that storageState.
- `no-auth` — public/auth specs, no login (`:39`, matches `public|auth`).
- `authenticated` — account/admin/dashboard/members/payment specs (`:49`);
  `dependencies: ["auth-setup", "org-setup"]` (`:54`) and loads `user.json`.

So the setup projects run first and gate `authenticated`. Local infra:
`docker compose -f docker-compose.e2e.yml up` (Postgres on **5433**, Maildev).

## CI (`.github/workflows/`)

- `ci.yml` — three jobs: **lint** (`pnpm check`, Biome, `:34`), **typecheck**
  (`pnpm --filter app typecheck`, `:65`), **test** (`pnpm test`, unit, `:98`).
  No DB is provisioned — a stub `DATABASE_URL` env is enough (`ci.yml:40,71`).
- `e2e.yml` — Playwright, **gated behind the `e2e` PR label**
  (`if: contains(... 'e2e')`, `e2e.yml:24`). Provisions Postgres as a service
  container (`:27`) and Maildev via `docker run` (`:62`), then push/seed/build/run.

**CI must be self-contained.** Provision Postgres/Maildev via GitHub Actions
service containers (or `docker run`) — never external DBs or production secrets.
`docker-compose.yml` (dev) and `docker-compose.e2e.yml` are the source of truth
for which services CI needs.

## Turbo task graph (`turbo.json`)

There are **no `lint`, `typecheck`, or `boundaries` tasks**. Defined tasks:

- `build` → `dependsOn: ["^build"]`, cached (`:7`).
- `test` → `dependsOn: ["^test"]`, cached (`:41`) — a **sibling** of build.
- `analyze` → `dependsOn: ["^analyze"]` (`:52`).
- `dev` → `{cache: false, persistent: true}` (`:55`).
- `clean`, `//#clean`, `check`, `fix` → all `{cache: false}` (`:59-70`).

`check`/`fix` shell out to ultracite first, then `turbo check`/`turbo fix`
(`package.json:13-14`); typecheck is an apps/web script (`tsc --noEmit`), not a
turbo task.

## Gotchas

- Vitest `include` is `*.test.*` only — `e2e/*.spec.ts` are excluded on purpose.
- `test:e2e:auth` runs the `no-auth` project (script name ≠ project name).
- Editing `authenticated` specs? The `auth-setup`/`org-setup` chain must pass
  first or every test errors before assertions.

See saasprokit:env-setup, saasprokit:data-access.
