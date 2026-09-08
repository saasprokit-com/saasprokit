---
name: data-access
description: Use when adding server-side code to apps/web, deciding where a query/action/helper file belongs, or changing the Prisma schema. Covers the unified lib/ layer and the db-push workflow.
---

# Data Access Layer

All server-side code in `apps/web` lives under a single **`lib/`** folder, organized
by **domain sub-folder**. There is no separate `servers/` tree — domain data-access
(`queries.ts` reads / `actions.ts` writes) and cross-cutting foundation (auth, env,
routes, revalidation) co-exist under `lib/`, grouped by what they concern.

- **`lib/<domain>/`** — a domain's server-side modules: `queries.ts` (reads) and
  `actions.ts` (mutation helpers) that touch that domain's tables, plus any
  domain-specific infrastructure. **This is where new feature queries/actions go.**
- **`lib/auth/`, `lib/infrastructure/`, root `lib/*.ts`** — the foundation and
  cross-cutting infrastructure: the auth/session/authorization layer, revalidation,
  env, routes, parsers.

**Decision rule:** building a feature's data layer (list/create/update a domain
record) → `lib/<domain>/queries.ts` or `actions.ts`. Touching auth/session guards,
revalidation, env, routes → `lib/auth/`, `lib/infrastructure/`, or root `lib/`. When
a domain folder already exists (`organization`, `files`, `billing`, `admin`), add to
it rather than creating a parallel location.

## Map — `lib/` by domain

| Path | Purpose |
| --- | --- |
| `lib/organization/queries.ts` | Org membership validation, org context/listing (`getActiveOrganization`, `validateOrganizationMembership`, `getUserOrganizations`, `getDefaultOrganization`). |
| `lib/files/actions.ts` | `storeOrganizationLogo` (upload → `File` row → atomic logo swap → previous object deleted) and `deleteStoredObjects`. `server-only`, not a `"use server"` module. |
| `lib/files/storage-quota.ts` | Per-org storage quota enforcement (coupled to plan limits via `lib/billing`). |
| `lib/billing/subscription-queries.ts` | Subscription + usage queries feeding `@repo/auth` plan logic. **No `billing` action module — reads only.** |
| `lib/billing/checkout-queries.ts` | `verifyCheckoutSession` — Stripe Checkout session verification (paid + owned by org) for the checkout success page. |
| `lib/ai/models.ts` | Client-safe chat model catalog, fixed image model id, chat request schema. |
| `lib/ai/registry.ts` | Vercel AI SDK provider registry; `isConfigured` / `availableChatModels` hide providers without a key. |
| `lib/ai/queries.ts`, `lib/ai/actions.ts` | Conversation/message reads, monthly usage vs plan quota, mutation helpers (`server-only`). |

## Map — `lib/` foundation & infrastructure

| Path | Purpose |
| --- | --- |
| `lib/auth/` | Session + authorization foundation: `getServerSession`/`requireAuth` (`auth.ts`), `verifySession` (`action-auth.ts`), `toActionError` (`action-error.ts`), `enforceRateLimit` (`rate-limit.ts`), platform-admin guard (`admin.ts`), auth server actions (`actions.ts`). See `saasprokit:auth`. |
| `lib/infrastructure/revalidation.ts` | `revalidateOrgPage` + locale resolution |
| `lib/validation/` | Standalone zod schemas (e.g. org metadata) |
| `lib/stubs/` | Build-time module stubs (Cloudflare — see `saasprokit:deployment`) |
| Root `lib/*.ts` | `env.ts`, `routes.ts` (`ORG_PAGES`, `orgRoutes`), `parsers.ts` (`sortingStateParser`), `forms.ts`, `seo-config.ts`, `version.ts` |

## Prisma workflow

Schema: `packages/database/prisma/schema.prisma` — **19 models**: `User`, `Session`,
`Account`, `Verification`, `TwoFactor`, `Organization`, `Member`, `Invitation`,
`Subscription`, `InviteLink`, `File`, `WebhookEvent`, `Team`,
`TeamMember`, `RateLimit`, `AiConversation`, `AiMessage`, `AiUsage`.

1. Edit `schema.prisma`.
2. Run `pnpm migrate` — `prisma format && prisma generate && prisma db push`. This
   is **`db push` schema-sync, not versioned migration files.**
3. Import the client: `import { database } from "@repo/database"`; Prisma types via
   `import type { Prisma } from "@repo/database"`.

Better Auth owns the shape of its own tables (`user`, `session`, `member`,
`organization`, `subscription`, …) — don't hand-add constraints or migrations to
them.

## Gotchas

- **`lib/` is not client-safe and not DB-free.** `lib/auth/` (`admin.ts`,
  `rate-limit.ts`), `lib/billing/`, `lib/organization/`, and `lib/files/` run
  Prisma directly. The line between a *domain data-access* module
  and a *foundation* module is organizational, not pure-vs-impure — never assume a
  `lib/` file is client-safe; check for the `import "server-only"` guard.
- **`lib/files/actions.ts` is `server-only`, not a `"use server"` module** — its
  first line is `import "server-only"`, so it holds mutation *helpers*, not
  directly-callable Server Actions. Feature Server Actions
  live colocated with the feature (see `saasprokit:forms`).
- **Only `organization`, `files` and `ai` have both query and action modules; `billing` is
  reads-only.** Add new domain folders
  under `lib/<domain>/` following the same `queries.ts`/`actions.ts` shape.

See `saasprokit:auth`, `saasprokit:forms`, `saasprokit:tables`.
