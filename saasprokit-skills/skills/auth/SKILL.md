---
name: auth
description: Authentication & authorization patterns for this repo — Better Auth setup, role systems, server-side session helpers, org membership validation, server action auth, and client-side usage. Read before writing or reviewing any code that touches sessions, permissions, roles, or protected pages/actions.
---

# Authentication & Authorization

## Better Auth Setup (`packages/auth`)

- Adapter: Prisma (PostgreSQL)
- Methods: Email/password, social (Google/GitHub), magic links, 2FA, email OTP
- Dual RBAC system: platform-level admin roles + organization-scoped roles

## Package Exports

- `@repo/auth` — Full exports (server + permissions)
- `@repo/auth/server` — Server-only auth instance
- `@repo/auth/client` — Client hooks and methods
- `@repo/auth/permissions` — Role constants, access control, permission checks

## Role Systems (`packages/auth/permissions.ts`)

Platform-level admin roles (`ADMIN_ROLES`):
- `admin` — Full platform access
- `moderator` — Content and member management, no billing
- `user` — Basic access

Organization-scoped roles (`ORG_ROLES`):
- `owner` — Full org control including deletion
- `admin` — Org management without deletion
- `member` — Read-only access

## Server-side Auth Helpers (`apps/web/lib/auth/auth.ts`)

Prefer these cached helpers over raw `auth.api.getSession()`:

```typescript
import { getServerSession, requireAuth } from "@/lib/auth/auth";

// Cached session (deduplicated across layout + page in one request)
const session = await getServerSession();

// Require auth or redirect to sign-in
const session = await requireAuth();

// Check org-level permissions
import { hasOrgPermission } from "@/lib/auth/auth";
const result = await hasOrgPermission(orgId, { member: ["read"] });
```

## Organization Access (`apps/web/servers/organization/queries.ts`)

```typescript
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";

// Validate slug + membership (React.cache-wrapped, redirects if unauthorized)
const { organizationId, userId, role, organizationSlug, organizationName } =
  await validateOrgMembershipBySlug(orgSlug);
```

## Server Action Auth (`apps/web/lib/auth/action-auth.ts`)

```typescript
import { verifySession } from "@/lib/auth/action-auth";
import { toActionError } from "@/lib/auth/action-error";

// In server actions — returns error instead of redirecting
const { session, error } = await verifySession();
if (error) return error;

// Unified error handler for catch blocks (handles ZodError, APIError, generic)
try { ... } catch (err) { return toActionError(err); }
```

### When you DON'T need `verifySession()`

Any `auth.api.*({ headers: await headers() })` call authenticates the caller
itself from the session cookie in those headers — sensitive endpoints
(`deleteUser`, 2FA, password) even re-read the session authoritatively from the
DB (bypassing the cookie cache) and enforce freshness. So a `verifySession()`
pre-check adds **no security** when the action's work goes entirely through
Better Auth. Pass `headers` and skip the guard.

```typescript
// ✅ No verifySession — revokeOtherSessions verifies the caller and scopes to them
export async function logoutAllOtherSessionsAction() {
  try {
    await auth.api.revokeOtherSessions({ headers: await headers() });
    return { success: true };
  } catch (err) {
    return toActionError(err, { fallback: "logoutAllSessions", baFallback: "unknownError" });
  }
}
```

Keep `verifySession()` when the action:
- reads/writes **outside** Better Auth (raw Prisma) and needs `session.user.id`
  (e.g. `updateProfileAction`), or
- wants a localized early-return error / `session.user.id` for a log line
  before the call.

When routing a `toActionError` catch to a Better Auth call, pass `baFallback`
so `APIError` codes map through `errors.ba[code]` (e.g. `SESSION_EXPIRED`,
`UNAUTHORIZED`).

## Platform Admin (`/admin`)

Platform staff (Better Auth admin-plugin roles `admin` / `moderator`) operate the
SaaS at `/admin` — distinct from org-scoped roles. Helpers:

```typescript
// packages/auth/permissions.ts — in-memory role checks (mirror canOrg)
import { canAdmin, isAdminAreaRole } from "@repo/auth/permissions";

// apps/web/lib/auth/admin.ts — server-side gates (read DB-fresh roles internally)
import { requireAdminArea, hasAdminPermission } from "@/lib/auth/admin";

// Layout AND every /admin page (layouts don't re-run on soft nav):
const ctx = await requireAdminArea(); // → {userId, isAdmin}; redirects anon, notFound() non-staff
if (!ctx.isAdmin) notFound();         // moderators can't reach user-management pages

// First line of every admin server action — boolean gate (mirrors hasOrgPermission).
// Read the actor's id from getServerSession() when you need it for audit/self-guards.
const session = await getServerSession();
if (!session?.user?.id) return actionError("unauthorized");
if (!(await hasAdminPermission({ user: ["ban"] }))) return actionError("unauthorized");
const actorId = session.user.id;
```

**Freshness:** admin gates re-read `role`/`banned` from the DB every request
(`getFreshRole`), because the session cookie cache is up to
`COOKIE_CACHE_MAX_AGE_MINUTES` stale — a just-demoted/banned admin must lose access
at once. Better Auth's own admin endpoints re-check the authoritative session too, so
mutations are defended twice. The rest of the app accepts the read-only stale window.

**Guardrails:** a pure `guardUserMutation` (admin/users/guards.ts) blocks self
set-role/ban/delete/impersonate; peer model otherwise (admins may act on other
admins). Better Auth authoritatively blocks self-ban/self-delete and admin→admin
**impersonation** (its `adminRole` lacks `user:["impersonate-admins"]`) — keep the
`admin()` plugin's `adminRoles` option **unset** or that block breaks. `setRole` has
no built-in self-guard, so a `before` hook on `/admin/set-role` (server.ts) throws
`CANNOT_CHANGE_OWN_ROLE` — making self-demotion bypass-proof at the auth layer, with
`guardUserMutation` as the friendly first-line message. Moderators hold no
`user`/`session` statements, so `hasAdminPermission` denies them every user mutation.

**Impersonation:** 1-hour session with `impersonatedBy`; an amber banner mounts in
`(app)/layout.tsx`; exit via the `stopImpersonatingAction` server action. Admin
mutations write to `AuditLog` via `recordAdminAudit` (view in Prisma Studio, port 3005).

**Seed staff (dev):** `admin@example.com` / `moderator@example.com` /
`banned@example.com`, password `Password@saaspro`.

## Client-side Usage (React components)

```typescript
import { signIn, useSession, authClient } from "@repo/auth/client";
const { data: session } = useSession();
```
