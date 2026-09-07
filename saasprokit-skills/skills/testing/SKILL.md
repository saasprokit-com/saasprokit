---
name: testing
description: Use when writing, running, or debugging unit or E2E tests in this repo, or when editing GitHub Actions workflows or turbo.json tasks. Covers Vitest layout, the four Playwright projects and their setup chain, and CI's self-containment rule.
---

# Testing & CI

Two independent layers: **Vitest** unit tests (fast, no DB) and **Playwright** E2E
(real Postgres + Maildev + a built app). They share no runner and no config.

## Commands

```bash
pnpm test                        # all unit tests via `turbo test` (app, @repo/auth, @repo/database)
pnpm --filter @repo/auth test    # one package's unit tests (vitest run)
pnpm --filter web test           # web-app unit tests (vitest run)
pnpm --filter @repo/database test # database package unit tests (vitest run)
pnpm --filter web test:e2e       # all Playwright projects
pnpm --filter web test:e2e:ui    # Playwright UI mode
pnpm --filter web test:e2e:auth  # --project=no-auth   (name is a misnomer)
pnpm --filter web test:e2e:app   # --project=authenticated
```

`pnpm check` / `pnpm fix` run lint; `pnpm --filter web typecheck` runs `tsc`. None
of these are turbo `test` — see the task graph below.

## Layout — unit tests

Runner: Vitest 4.x, one `vitest.config.mts` per runnable package. Tests are
co-located as `**/*.test.{ts,tsx}` next to the code they cover. Three packages have a
config **and** a `test` script: **app** (`environment: "jsdom"`), **@repo/auth**
(`environment: "node"`), and **@repo/database** (`redact.test.ts`). Anything outside
those three is not run by `pnpm test`.

## Layout — E2E (Playwright)

Config: `apps/web/playwright.config.ts`. Specs live in `apps/web/e2e/**/*.spec.ts`
(these are **not** Vitest). **Four projects**:

| Project | Matches | Depends on |
| --- | --- | --- |
| `auth-setup` | `setup/auth.setup.ts` — signs in, writes `e2e/.auth/user.json` | — |
| `org-setup` | `setup/org.setup.ts` | `auth-setup` |
| `no-auth` | `(public|auth)/*.spec.ts` — no login | — |
| `authenticated` | `(account|admin|dashboard|members|payment)/*.spec.ts` | `auth-setup`, `org-setup` |

So the setup projects run first and gate `authenticated`. Local infra:
`docker compose -f docker-compose.e2e.yml up` (Postgres on **5433**, Maildev).

## CI (`.github/workflows/`)

- `ci.yml` — four jobs: **lint** (`pnpm check`), **typecheck** (`pnpm --filter web
  typecheck`), **test** (`pnpm test`, unit), and **setup-cli**. No DB is
  provisioned — a stub `DATABASE_URL` env is enough.
- `e2e.yml` — Playwright, **gated behind the `e2e` PR label**
  (`if: contains(github.event.pull_request.labels.*.name, 'e2e')`). Provisions
  Postgres as a service container and Maildev via `docker run`, then
  push/seed/build/run.

**CI must be self-contained.** Provision Postgres/Maildev via GitHub Actions service
containers (or `docker run`) — never external DBs or production secrets.
`docker-compose.yml` (dev) and `docker-compose.e2e.yml` are the source of truth for
which services CI needs.

## Turbo task graph (`turbo.json`)

There are **no `lint`, `typecheck`, or `boundaries` tasks**. Defined tasks:

- `build` → `dependsOn: ["^build"]`, cached.
- `test` → `dependsOn: ["^test"]`, cached — a **sibling** of build, not downstream.
- `analyze` → `dependsOn: ["^analyze"]`.
- `dev` → `{cache: false, persistent: true}`.
- `clean`, `//#clean`, `check`, `fix` → all `{cache: false}`.

`check`/`fix` shell out to ultracite first, then `turbo check`/`turbo fix`;
typecheck is an apps/web script (`tsc --noEmit`), not a turbo task.

## Gotchas

- Vitest `include` is `*.test.*` only — `e2e/*.spec.ts` are excluded on purpose.
- `test:e2e:auth` runs the `no-auth` project (script name ≠ project name).
- Editing `authenticated` specs? The `auth-setup`/`org-setup` chain must pass first
  or every test errors before assertions.

See `saasprokit:env-setup`, `saasprokit:data-access`.
