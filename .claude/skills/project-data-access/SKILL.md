---
name: project-data-access
description: Data access layer conventions for this repo — the servers/ vs lib/ split in apps/web, where queries/actions/helpers live, and the Prisma workflow. Read before adding server queries, server actions, or shared helpers, or when unsure where a new file belongs.
---

# Data Access Layer

## `apps/web/servers/`

Server-side queries and actions are organized by domain under `servers/`:
- `servers/organization/queries.ts` — Org membership validation, org listing, defaults
- `servers/organization/actions.ts` — Org mutations (server actions)
- `servers/files/queries.ts` — File storage queries

## The `servers/` vs `lib/` Split

The split is intentional: `servers/` holds anything that touches the database or Better Auth API (callable from Server Components and Server Actions), while `lib/` holds environment-pure helpers and infrastructure code. Notable `lib/` subdirectories:

- `lib/auth/` — `auth.ts` (cached session helpers), `action-auth.ts`, `action-error.ts`
- `lib/billing/` — Stripe checkout, portal, subscription helpers tied to the web app
- `lib/organization/` — Web-side org helpers (slug parsing, etc.)
- `lib/files/` — Upload/path helpers used by API routes
- `lib/infrastructure/` — Cross-cutting concerns (logger wiring, instrumentation)
- `lib/validation/` — Shared Zod schemas
- `lib/env.ts`, `lib/routes.ts`, `lib/parsers.ts`, `lib/seo-config.ts`, `lib/version.ts` — Root utilities

## Database (Prisma)

**Location**: `packages/database/prisma/schema.prisma`

Workflow: Modify schema → `pnpm migrate` → Import via `import { database } from "@repo/database"`

```bash
pnpm migrate                  # Format, generate, and push schema
cd packages/database && npx prisma generate    # Generate Prisma client
npx prisma db push            # Push schema changes
npx prisma studio             # Open Prisma Studio
npx prisma migrate dev        # Create and apply migrations
```
