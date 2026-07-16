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

## Client-side Usage (React components)

```typescript
import { signIn, useSession, authClient } from "@repo/auth/client";
const { data: session } = useSession();
```
