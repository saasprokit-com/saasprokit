# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-grade Next.js 16 monorepo using pnpm workspaces and Turborepo. Features a multi-organization SaaS dashboard with Better Auth for authentication, Prisma ORM with PostgreSQL (Neon), and Stripe integration for billing. The app includes multi-language support, international routing, and both organization and personal account management.

The app uses grouped routes with `(app)` and `(frontier)` route groups under `/[locale]/(app)/` namespace.

## Commands

### Development
```bash
pnpm dev                      # Run all apps in dev mode
pnpm --filter app dev         # Main app only (port 3000)
pnpm --filter docs dev        # Documentation (port 3004)
pnpm --filter storybook dev   # Component library (port 6006)
pnpm --filter email dev       # Email preview (port 3003)
pnpm --filter studio dev      # Prisma Studio (port 3005)
```

### Build & Quality
```bash
pnpm build                    # Build all apps and packages
pnpm check                    # Lint check via ultracite + Biome
pnpm fix                      # Auto-fix lint issues
pnpm --filter app typecheck   # Type check web app
```

### Testing
```bash
pnpm test                     # Run all tests (vitest)
pnpm --filter app test        # Run tests for web app only
pnpm --filter [package] test  # Run tests for specific package
pnpm --filter app test:e2e    # Run Playwright E2E tests
pnpm --filter app test:e2e:ui # Run E2E tests with UI
```

### Database (Prisma)
```bash
pnpm migrate                  # Format, generate, and push schema
cd packages/database && npx prisma generate    # Generate Prisma client
npx prisma db push            # Push schema changes
npx prisma studio             # Open Prisma Studio
npx prisma migrate dev        # Create and apply migrations
```

## Architecture

### Route Structure

The Next.js app uses grouped routes (parentheses in directory names) to organize different sections:

**Locale-level routes** (`/[locale]/`):
- `(app)` — Authenticated app pages
  - `[orgSlug]` — Organization-scoped pages: billing, members, settings
  - `account` — Personal account management: profile, security, danger zone, new-org
  - `invite` — Organization invitation handling
  - `org` — Organization selection/management
- `(frontier)` — Public/marketing pages: home, pricing, etc.
- `auth` — Authentication flows: sign-in, sign-up, magic links, password reset, 2FA

**API routes** (`/api/`):
- `auth/[...all]/` — Better Auth handler
- `health/` — Health check endpoint (database + auth validation)
- `stripe/webhook/` — Stripe event handling
- `upload/` — File uploads
- `user/activity/` — User activity tracking

### Monorepo Structure

**Apps** (independently deployable):
- `web` — Main SaaS application (port 3000)
- `docs` — Documentation site powered by Fumadocs (port 3004)
- `email` — React Email template previews (port 3003)
- `storybook` — Component library & design system (port 6006)
- `studio` — Prisma Studio wrapper (port 3005)

**Core Packages**:
- `auth` (`@repo/auth`) — Better Auth configuration with dual RBAC (admin + org)
- `database` (`@repo/database`) — Prisma schema, client, and types
- `design-system` (`@repo/design-system`) — shadcn/ui components + Radix
- `payment` (`@repo/payment`) — Stripe integration, billing logic, subscription plans
- `email` (`@repo/email`) — React Email templates with Resend

**Supporting Packages**:
- `utils` (`@repo/utils`) — Shared utilities (slug, date, validation, organization, payment helpers)
- `logger` (`@repo/logger`) — Structured logging with Pino (separate `/server` and `/client` exports)
- `internationalization` (`@repo/internationalization`) — Multi-language support
- `seo` (`@repo/seo`) — Metadata, sitemaps, JSON-LD
- `storage` (`@repo/storage`) — File upload and storage management
- `typescript-config` (`@repo/typescript-config`) — Shared TypeScript configurations

### Authentication & Authorization

**Better Auth Setup** (`packages/auth`):
- Adapter: Prisma (PostgreSQL)
- Methods: Email/password, social (Google/GitHub), magic links, 2FA, email OTP
- Dual RBAC system: platform-level admin roles + organization-scoped roles

**Package Exports**:
- `@repo/auth` — Full exports (server + permissions)
- `@repo/auth/server` — Server-only auth instance
- `@repo/auth/client` — Client hooks and methods
- `@repo/auth/permissions` — Role constants, access control, permission checks

**Role Systems** (from `packages/auth/permissions.ts`):

Platform-level admin roles (`ADMIN_ROLES`):
- `admin` — Full platform access
- `moderator` — Content and member management, no billing
- `user` — Basic access

Organization-scoped roles (`ORG_ROLES`):
- `owner` — Full org control including deletion
- `admin` — Org management without deletion
- `member` — Read-only access

**Server-side Auth Helpers** (`apps/web/lib/auth/auth.ts`):

Prefer these cached helpers over raw `auth.api.getSession()`:

```typescript
import { getServerSession, requireAuth } from "@/lib/auth/auth";

// Cached session (deduplicated across layout + page in one request)
const session = await getServerSession();

// Require auth or redirect to sign-in
const session = await requireAuth();

// Check org-level permissions
import { checkOrgPermission } from "@/lib/auth/auth";
const result = await checkOrgPermission(orgId, { member: ["read"] });
```

**Organization Access** (`apps/web/servers/organization/queries.ts`):

```typescript
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";

// Validate slug + membership (React.cache-wrapped, redirects if unauthorized)
const { organizationId, userId, role, organizationSlug, organizationName } =
  await validateOrgMembershipBySlug(orgSlug);
```

**Server Action Auth** (`apps/web/lib/auth/action-auth.ts`):

```typescript
import { verifySession } from "@/lib/auth/action-auth";
import { toActionError } from "@/lib/auth/action-error";

// In server actions — returns error instead of redirecting
const { session, error } = await verifySession();
if (error) return error;

// Unified error handler for catch blocks (handles ZodError, APIError, generic)
try { ... } catch (err) { return toActionError(err); }
```

**Client-side usage** (React components):
```typescript
import { signIn, useSession, authClient } from "@repo/auth/client";
const { data: session } = useSession();
```

### Data Access Layer (`apps/web/servers/`)

Server-side queries and actions are organized by domain under `servers/`:
- `servers/organization/queries.ts` — Org membership validation, org listing, defaults
- `servers/organization/actions.ts` — Org mutations (server actions)
- `servers/files/queries.ts` — File storage queries

This is separate from `apps/web/lib/` which holds utilities, auth helpers, and infrastructure.

### Centralized Route Definitions

All routes are defined in `apps/web/lib/routes.ts`:

```typescript
import { PAGE_ROUTES, orgRoutes, API_ROUTES } from "@/lib/routes";

PAGE_ROUTES.SIGN_IN        // "/auth/sign-in"
orgRoutes.billing("my-org") // "/my-org/billing"
API_ROUTES.ORG_CHECKOUT(id) // "/api/organizations/{id}/checkout"
```

### Billing & Payment

**Payment Package** (`packages/payment`):
- Stripe integration via `@better-auth/stripe` plugin
- Plan configs and utilities in `plans.ts`, constants in `keys.ts`, types in `types.ts`
- Subscription tiers: free, pro, enterprise
- Organization-scoped billing (per-organization subscriptions)

**Organization Billing Page**: `/[locale]/(app)/[orgSlug]/billing/`

### Design System

**No Barrel Imports** — always import directly from source files:
```typescript
// Correct
import { Button } from "@repo/design-system/components/ui/button";

// Wrong
import { Button } from "@repo/design-system/components/ui";
```

Use `cn()` utility from `@repo/design-system/lib/utils` for class merging.

## Important Architectural Patterns

### Server Components & Async Params (Next.js 16)

All layout and page components use async function syntax to access `params`:

```typescript
type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
};

const Layout = async ({ children, params }: LayoutProps) => {
  const { locale, orgSlug } = await params;  // MUST await params!
  return <>{children}</>;
};
```

### Locale Handling

```typescript
import { locales } from "@repo/internationalization";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
```

## Key Conventions

### Path Aliases

- `@/*` — Resolves to root of web app (use for web-specific files)
- `@repo/*` — Resolves to `packages/` (use for shared code)

### TypeScript

**Prefer `type` over `interface`** except for declaration merging.

### Linting & Formatting

**Biome** (`biome.jsonc`) extends `ultracite/core`, `ultracite/react`, `ultracite/next`.

Notable config:
- Test files (`*.test.ts`, `*.spec.ts`) are excluded from linting
- `noBarrelFile` rule is disabled
- `noNonNullAssertion` rule is disabled
- Design system `ui/`, `lib/`, `hooks/` directories are excluded

### Turbo Build Graph

- `build` depends on `^build` (dependencies) + `test`
- `dev` is uncached and persistent
- `test` depends on `^test`
- Additional tasks: `analyze`, `translate`, `clean`, `boundaries`

### Database (Prisma)

**Location**: `packages/database/prisma/schema.prisma`

Workflow: Modify schema → `pnpm migrate` → Import via `import { database } from "@repo/database"`

### Testing

- Unit tests: `**/*.test.ts` or `**/*.spec.ts` (co-located with source files)
- Unit test runner: Vitest (v4.x) with configs in `vitest.config.mts`
- Packages with test configs: `web`, `auth`, `payment`, `storage`
- E2E tests: Playwright (`apps/web/playwright.config.ts`)

### Environment Setup

Create `.env.local` in `apps/web/` (see `.env.example` for complete list):

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRO_PRICE_ID_MONTHLY=...
STRIPE_PRO_PRICE_ID_ANNUAL=...
STRIPE_ENTERPRISE_PRICE_ID_MONTHLY=...
STRIPE_ENTERPRISE_PRICE_ID_ANNUAL=...
RESEND_API_KEY=...
EMAIL_FROM=noreply@yourdomain.com
STORAGE_PROVIDER=local
```

## Common Developer Workflows

**Creating a new organization-scoped page**:
1. Create folder under `/apps/web/app/[locale]/(app)/[orgSlug]/your-feature/`
2. Use `validateOrgMembershipBySlug(orgSlug)` from `@/servers/organization/queries` for auth + membership check
3. Add route to `orgRoutes` in `@/lib/routes` if needed
4. Use role-based checks via `ORG_ROLES` from `@repo/auth/permissions`

**Creating a new user account page**:
1. Create folder under `/apps/web/app/[locale]/(app)/account/your-feature/`
2. Use `requireAuth()` from `@/lib/auth/auth` (no org check needed)

**Adding a new API route**:
1. Create folder under `apps/web/app/api/your-endpoint/route.ts`
2. Add route constant to `API_ROUTES` in `@/lib/routes`
3. Use `getServerSession()` for auth checks

## Skills & Plugins

**Vercel plugin** (`vercel@claude-plugins-official`) is installed and injects skills dynamically via hooks.

**Agent Skills** (installed in `.claude/skills/` via `npx skills`, managed by `skills-lock.json`):

Better Auth skills (5):
- `.claude/skills/better-auth-best-practices/SKILL.md`
- `.claude/skills/better-auth-security-best-practices/SKILL.md`
- `.claude/skills/email-and-password-best-practices/SKILL.md`
- `.claude/skills/organization-best-practices/SKILL.md`
- `.claude/skills/two-factor-authentication-best-practices/SKILL.md`

Prisma skills (4):
- `.claude/skills/prisma-cli/SKILL.md` — CLI commands (migrate, generate, studio)
- `.claude/skills/prisma-client-api/SKILL.md` — Prisma Client API patterns
- `.claude/skills/prisma-database-setup/SKILL.md` — Database setup and config
- `.claude/skills/prisma-postgres/SKILL.md` — Prisma Postgres specifics

Other skills:
- `.claude/skills/prisma-postgres-setup/SKILL.md` — Prisma Postgres setup
- `.claude/skills/deploy-to-vercel/SKILL.md` — Vercel deployment
- `.claude/skills/shadcn/SKILL.md` — shadcn/ui components
- `.claude/skills/vercel-cli-with-tokens/SKILL.md` — Vercel CLI with tokens
- `.claude/skills/vercel-composition-patterns/SKILL.md` — React composition patterns
- `.claude/skills/vercel-react-best-practices/SKILL.md` — React best practices
- `.claude/skills/vercel-react-view-transitions/SKILL.md` — View transitions
- `.claude/skills/web-design-guidelines/SKILL.md` — Web design guidelines

Update skills: `npx skills check` then `npx skills update`.

**When the user requests a review**, read the relevant SKILL.md files before starting. For auth-related reviews, read the Better Auth skills. For database/schema reviews, read the Prisma skills.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
