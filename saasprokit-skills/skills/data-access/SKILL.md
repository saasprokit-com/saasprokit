---
name: data-access
description: Data-access conventions for apps/web — the servers/ (domain queries and actions) vs lib/ (auth foundation, infrastructure, env, routes) split, where new server queries, actions, and helpers belong, and the @repo/database Prisma workflow. Read before adding server code or when unsure where a file belongs.
---

# Data Access Layer

Server-side code in `apps/web` lives in two folders, split by **what you are building**:

- **`servers/<domain>/`** — the domain data-access layer: `queries.ts` (reads) and `actions.ts` (writes) that touch app-feature tables. **This is where new feature queries/actions go.** Every file is `import "server-only"`.
- **`lib/`** — the foundation and cross-cutting infrastructure: the auth/session/authorization layer, revalidation, env, routes, parsers, plus a few helper modules coupled to a specific package (billing, storage).

**Decision rule:** building a feature's data layer (list/create/update a domain record) → `servers/<domain>/`. Touching auth/session guards, revalidation, env, routes, or logic tied to `@repo/payment`/storage → `lib/`.

## Map — `servers/` (by domain)

| File | Purpose |
| --- | --- |
| `servers/organization/queries.ts` | Org membership validation, org listing, role/permission lookups. **No `actions.ts` here.** |
| `servers/files/queries.ts` | File listing / lookup queries |
| `servers/files/actions.ts` | File mutation helpers (`server-only`, not a `"use server"` module) |
| `servers/admin/audit.ts` | `AuditLog` write helpers for platform-admin mutations |

## Map — `lib/`

| Path | Purpose |
| --- | --- |
| `lib/auth/` | Session + authorization foundation: `getServerSession`/`requireAuth` (`auth.ts`), `verifySession` action guard (`action-auth.ts`), `toActionError` (`action-error.ts`), `enforceRateLimit` (`rate-limit.ts`), platform-admin guard (`admin.ts`), auth server actions (`actions.ts`). See `saasprokit:auth`. |
| `lib/billing/subscription-queries.ts` | Subscription + usage queries feeding `@repo/payment` plan logic |
| `lib/organization/personal-org.ts` | Personal-org creation + unique slug generation |
| `lib/files/storage-quota.ts` | Per-org storage quota enforcement |
| `lib/infrastructure/revalidation.ts` | `revalidateOrgPage` / locale resolution (`revalidation.ts:17`) |
| `lib/validation/organization-metadata-schema.ts` | Zod schema for org metadata |
| Root: `env.ts`, `routes.ts` (`ORG_PAGES`, `orgRoutes` — `routes.ts:85`), `parsers.ts` (`sortingStateParser`), `seo-config.ts`, `version.ts` | Env validation, centralized route builders, nuqs parsers, SEO, version |

## Prisma workflow

Schema: `packages/database/prisma/schema.prisma` — **16 models**: `User`, `Session`, `Account`, `Verification`, `TwoFactor`, `Organization`, `Member`, `Invitation`, `Subscription`, `InviteLink`, `File`, `AuditLog`, `WebhookEvent`, `Team`, `TeamMember`, `RateLimit`.

1. Edit `schema.prisma`.
2. Run `pnpm migrate` — `prisma format && prisma generate && prisma db push` (`package.json:21`). This is **`db push` schema-sync, not versioned migration files.**
3. Import the client: `import { database } from "@repo/database"` (`servers/organization/queries.ts:5`); Prisma types via `import type { Prisma } from "@repo/database"`. The package resolves `.` → `index.ts` (`packages/database/package.json:7`).

## Gotchas

- **`lib/` is not DB-free.** `lib/auth/` (`admin.ts`, `rate-limit.ts`), `lib/billing/`, and `lib/organization/` run Prisma directly; `lib/files/storage-quota.ts` is `import "server-only"` but reaches the DB transitively via `lib/billing`. The dividing line is **foundation vs. feature-domain**, not pure vs. impure — so never assume a `lib/` file is client-safe; check for the `server-only` guard.
- **`servers/files/actions.ts` is `server-only`, not a `"use server"` module** — its first line is `import "server-only"`, so it holds mutation *helpers*, not directly-callable Server Actions. Feature Server Actions live colocated with the feature (see `saasprokit:forms`).
- **Only `organization` and `files` have query modules under `servers/`; there is no `billing` server dir** — billing reads live in `lib/billing/`.

See `saasprokit:auth`, `saasprokit:forms`, `saasprokit:tables`.
