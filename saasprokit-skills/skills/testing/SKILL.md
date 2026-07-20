---
name: testing
description: Testing and CI setup for this repo — Vitest unit tests, Playwright E2E projects, which packages actually have runnable tests, and CI self-containment rules. Read before writing, running, or debugging tests, or editing GitHub Actions workflows.
---

# Testing & CI

## Commands

```bash
pnpm test                     # Run all unit tests via turbo (auth, payment, app)
pnpm --filter @repo/auth test    # Unit tests for a specific package
pnpm --filter @repo/payment test # Unit tests for a specific package
pnpm --filter app test         # Unit tests for the web app (vitest run)
pnpm --filter app test:e2e    # Run Playwright E2E tests
pnpm --filter app test:e2e:ui # Run E2E tests with UI
pnpm --filter app test:e2e:auth  # E2E "no-auth" project only
pnpm --filter app test:e2e:app   # E2E "authenticated" project only
```

## Layout

- Unit tests: `**/*.test.ts` (co-located with source). Runner: Vitest (v4.x), config in each package's `vitest.config.mts`
- Vitest configs and a runnable `test` script (`vitest run`) exist in `app`, `auth`, and `payment`. Unit tests live in `apps/web/lib/*.test.ts`, `apps/web/app/**/*.test.ts`, `packages/auth/*.test.ts`, and `packages/payment/*.test.ts`
- E2E tests: Playwright (`apps/web/playwright.config.ts`). All `apps/web/e2e/**/*.spec.ts` files are Playwright specs (not Vitest), split into `no-auth` and `authenticated` projects
- E2E environment: `docker compose -f docker-compose.e2e.yml up`

## CI (`.github/workflows/`)

- `ci.yml` — Lint, typecheck, unit tests
- `e2e.yml` — Playwright E2E run

**CI must be self-contained.** Always provision Postgres (and any other service dependencies) via GitHub Actions service containers — never wire CI jobs to external databases or pass production-style secrets. The Docker Compose files (`docker-compose.yml`, `docker-compose.e2e.yml`) are the source of truth for which services CI needs.

## Turbo Build Graph

- `build` depends on `^build` (dependency builds) — `test` is a **sibling** task, not a build prerequisite
- `test` depends on `^test`
- `dev` is uncached and persistent; `check`, `fix`, `clean` are uncached
- Additional tasks: `analyze`, `clean`, `boundaries`
