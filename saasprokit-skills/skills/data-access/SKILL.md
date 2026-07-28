---
name: data-access
description: Data-access conventions for apps/web — the unified lib/ server-side layer (domain queries.ts/actions.ts alongside the auth foundation, infrastructure, env, routes), where new server queries, actions, and helpers belong, and the @repo/database Prisma workflow. Read before adding server code or when unsure where a file belongs.
---

# Data Access Layer

All server-side code in `apps/web` lives under a single **`lib/`** folder, organized by **domain sub-folder**. There is no separate `servers/` tree — domain data-access (`queries.ts` reads / `actions.ts` writes) and cross-cutting foundation (auth, env, routes, revalidation) co-exist under `lib/`, grouped by what they concern.

- **`lib/<domain>/`** — a domain's server-side modules: `queries.ts` (reads) and `actions.ts` (mutation helpers) that touch that domain's tables, plus any domain-specific infrastructure. **This is where new feature queries/actions go.** Every file is `import "server-only"`.
- **`lib/auth/`, `lib/infrastructure/`, root `lib/*.ts`** — the foundation and cross-cutting infrastructure: the auth/session/authorization layer, revalidation, env, routes, parsers.

**Decision rule:** building a feature's data layer (list/create/update a domain record) → `lib/<domain>/queries.ts` or `actions.ts`. Touching auth/session guards, revalidation, env, routes → `lib/auth/`, `lib/infrastructure/`, or root `lib/`. When a domain folder already exists (`organization`, `files`, `billing`, `admin`), add to it rather than creating a parallel location.

## Map — `lib/` by domain

| Path | Purpose |
| --- | --- |
| `lib/organization/queries.ts` | Org membership validation, org context/listing, role/permission lookups (`getActiveOrganization`, `validateOrganizationMembership`). |
| `lib/organization/personal-org.ts` | Personal-org creation + unique slug generation. |
| `lib/files/queries.ts` | File upload validation + listing / lookup queries. |
| `lib/files/actions.ts` | File mutation helpers (`server-only`, not a `"use server"` module). |
| `lib/files/storage-quota.ts` | Per-org storage quota enforcement (coupled to plan limits via `lib/billing`). |
| `lib/billing/subscription-queries.ts` | Subscription + usage queries feeding `@repo/auth` plan logic. **No `billing` action module — reads only.** |
| `lib/billing/checkout-queries.ts` | `verifyCheckoutSession` — Stripe Checkout session verification (paid + owned by org) for the checkout success page. |
| `lib/admin/audit.ts` | `AuditLog` write helpers for platform-admin mutations. |

## Map — `lib/` foundation & infrastructure

| Path | Purpose |
| --- | --- |
| `lib/auth/` | Session + authorization foundation: `getServerSession`/`requireAuth` (`auth.ts`), `verifySession` action guard (`action-auth.ts`), `toActionError` (`action-error.ts`), `enforceRateLimit` (`rate-limit.ts`), platform-admin guard (`admin.ts`), auth server actions (`actions.ts`). See `saasprokit:auth`. |
| `lib/infrastructure/revalidation.ts` | `revalidateOrgPage` / locale resolution (`revalidation.ts:17`) |
| `lib/validation/organization-metadata-schema.ts` | Zod schema for org metadata |
| Root: `env.ts`, `routes.ts` (`ORG_PAGES`, `orgRoutes` — `routes.ts:85`), `parsers.ts` (`sortingStateParser`), `forms.ts`, `seo-config.ts`, `version.ts` | Env validation, centralized route builders, nuqs parsers, form helpers, SEO, version |

## Prisma workflow

Schema: `packages/database/prisma/schema.prisma` — **16 models**: `User`, `Session`, `Account`, `Verification`, `TwoFactor`, `Organization`, `Member`, `Invitation`, `Subscription`, `InviteLink`, `File`, `AuditLog`, `WebhookEvent`, `Team`, `TeamMember`, `RateLimit`.

1. Edit `schema.prisma`.
2. Run `pnpm migrate` — `prisma format && prisma generate && prisma db push` (`package.json:21`). This is **`db push` schema-sync, not versioned migration files.**
3. Import the client: `import { database } from "@repo/database"` (`lib/organization/queries.ts:5`); Prisma types via `import type { Prisma } from "@repo/database"`. The package resolves `.` → `index.ts` (`packages/database/package.json:7`).

## Gotchas

- **`lib/` is not client-safe and not DB-free.** `lib/auth/` (`admin.ts`, `rate-limit.ts`), `lib/billing/`, `lib/organization/`, `lib/files/`, and `lib/admin/` run Prisma directly. The line between a *domain data-access* module and a *foundation* module is organizational, not pure-vs-impure — so never assume a `lib/` file is client-safe; check for the `import "server-only"` guard.
- **`lib/files/actions.ts` and `lib/admin/audit.ts` are `server-only`, not `"use server"` modules** — their first line is `import "server-only"`, so they hold mutation *helpers*, not directly-callable Server Actions. Feature Server Actions live colocated with the feature (see `saasprokit:forms`).
- **Only `organization` and `files` have both query and (files) action modules; `billing` is reads-only and `admin` is a single audit-write helper.** Add new domain folders under `lib/<domain>/` following the same `queries.ts`/`actions.ts` shape.

See `saasprokit:auth`, `saasprokit:forms`, `saasprokit:tables`.
