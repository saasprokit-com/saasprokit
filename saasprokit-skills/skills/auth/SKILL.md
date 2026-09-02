---
name: auth
description: Use when touching sessions, roles, permissions, protected pages, server-action auth, or the platform /admin area in this repo. Covers Better Auth setup, the dual admin + org RBAC systems, session helpers, org-slug guards, rate limiting, and which org mutations (members, roles, invitations, seat limits) delegate to Better Auth.
---

# Authentication & Authorization

Two independent RBAC systems run side by side: **platform admin roles** (staff who
operate `/admin`) and **organization roles** (members inside one org). Every
protected surface authenticates the caller from the session cookie carried in
request headers — **pages** redirect/`notFound()`, **server actions** return a typed
`ActionResult` error. Rendering a page on a protected route is never the security
boundary; each page and each action re-asserts. (Edge middleware only checks cookie
*presence* — see `saasprokit:routing`.)

## Map of the area

| Concern | Canonical file |
| --- | --- |
| Better Auth instance + all plugins | `packages/auth/server.ts` |
| Client (`authClient`, `signIn`/`useSession`/…, `Session`/`User` types) | `packages/auth/client.ts` |
| Role defs, `ac`/`orgAc`, `canOrg`/`canAdmin`/`isAdminAreaRole` | `packages/auth/permissions.ts` |
| `ActionResult<T>`, `getServerSession`, `requireAuth`, `hasOrgPermission` | `apps/web/lib/auth/auth.ts` |
| `verifySession()` (server-action guard) | `apps/web/lib/auth/action-auth.ts` |
| `toActionError`/`actionError`, `ActionErrorCode` | `apps/web/lib/auth/action-error.ts` |
| Org-slug access: `getActiveOrganization`, `validateOrganizationMembership` | `apps/web/lib/organization/queries.ts` |
| Admin gates: `requireAdminArea`, `hasAdminPermission`, `AdminContext` | `apps/web/lib/auth/admin.ts` |
| Rate limiting for auth actions: `RATE_LIMITS`, `enforceRateLimit`, `RateLimitError` | `apps/web/lib/auth/rate-limit.ts` |

Package exports: `@repo/auth/server`, `/client`, `/permissions`, `/keys`, `/plans`,
`/stripe-client`, `/guards`, `/helpers`, `/types`, `/ip-headers`. Plugins on the
instance, in order: `admin`, `magicLink`, `emailOTP`, `twoFactor`, `multiSession`,
`organization` (teams enabled), `stripe` (only when keys set), `@better-auth/i18n`,
`nextCookies`.

**`nextCookies()` must stay last in the `plugins` array** — Better Auth requires it
(it wraps the response to set cookies, so any plugin appended after it is not
covered). Add new plugins *before* it, never at the end.

## Role systems (`packages/auth/permissions.ts`)

- **Admin** (`ADMIN_ROLES`): `admin` (full), `moderator` (content/members, no
  billing/org), `user` (default). Area membership is a name allowlist —
  `ADMIN_AREA_ROLES` = admin + moderator.
- **Org** (`ORG_ROLES`): `owner` (incl. delete), `admin` (manage, no delete),
  `member` (read-only).
- `canOrg(role, perms)` and `canAdmin(role, perms)` evaluate a **DB-sourced** role
  in memory (same result as Better Auth's `hasPermission`, no round-trip). They
  trust their argument — never pass a client-supplied role.

## Server-side helpers (`apps/web/lib/auth/auth.ts`)

- `getServerSession()` — `React.cache`-wrapped `auth.api.getSession`, deduped across
  layout + page in one request. Prefer over raw `auth.api.getSession`.
- `requireAuth(returnTo?)` — session or redirect to sign-in.
- `hasOrgPermission(orgId, { member: ["read"] })` → `Promise<boolean>` via
  `auth.api.hasPermission`.

## Org access (`apps/web/lib/organization/queries.ts`)

- `getActiveOrganization(slug)` is the **slug guard every org-scoped page calls**.
  Returns `OrganizationContext { organizationId, organizationName,
  organizationSlug, role, userId }`; redirects anon to sign-in, `notFound()` if the
  org is missing OR the user isn't a member (identical response so slugs can't be
  enumerated).
- `validateOrganizationMembership(organizationId, userId)` → `Promise<boolean>` — a
  lower-level membership check, not the page guard.
- Also here: `getUserOrganizations`, `getDefaultOrganization` (both `cache()`d).

## The server-action auth contract (non-negotiable)

1. **Validate** — `schema.safeParse(input)` (`saasprokit:forms`).
2. **Authenticate** — `const { session, error } = await verifySession(); if (error) return error;`.
   Skip it when the action's work goes **entirely** through
   `auth.api.*({ headers: await headers() })`: those calls authenticate the caller
   from the cookie themselves (sensitive ones re-read the session DB-fresh), so a
   `verifySession` pre-check adds no security. Keep it when you touch raw Prisma or
   need `session.user.id`.
3. **Authorize** — org: `hasOrgPermission`; admin: `hasAdminPermission`; else
   `actionError("unauthorized")`. Place `hasOrgPermission` only where a raw Prisma
   read or write follows it. In front of a bare `auth.api.*` call it is redundant:
   `createInvitation`, `cancelInvitation`, `removeMember`, `updateMemberRole`,
   `updateOrganization`, `deleteOrganization` and the billing endpoints each re-derive
   membership and re-check the same permission from the session (verified in the
   installed plugin source). Admin actions keep `hasAdminPermission` regardless — it
   is the only per-request `banned` check (see Platform admin).
4. **Identity from the session, never the payload.**
5. **Return `ActionResult<T>`**; in `catch`, `return toActionError(error, { fallback })`.

`auth.api.*` calls **bypass** Better Auth's HTTP rate limits (those run only on
`/api/auth/*`), so brute-forceable auth flows re-apply `enforceRateLimit(scope)`
from `rate-limit.ts` — do not remove it. BA `APIError`s arrive **pre-localized** by
the i18n plugin; `toActionError` surfaces that message, else the localized
`errors.action[fallback]`, and always sets `code` (BA `body.code` when present, else
the fallback `ActionErrorCode`). New BA codes go in
`packages/internationalization/ba-errors/<locale>.json` — **6 locales** (de, en, es,
fr, pt, zh), key-parity enforced by `packages/auth/ba-i18n.test.ts`.

## Org mutations go through Better Auth

Member and organization writes are `auth.api.*` calls, never raw Prisma on
`member` / `organization` / `invitation`: `removeMember` also deletes the member's
`teamMember` rows (teams are enabled), `updateMemberRole` validates the role and the
owner invariants, `updateOrganization` returns the updated org (use its `slug`; don't
pre-read). Product rules stricter than Better Auth — never remove or re-role the
owner or yourself from the members table — stay as pre-guards on a scoped
`member.findFirst`/`findMany`, which is what the preceding `hasOrgPermission`
protects. Two writes remain raw by necessity: `transferOwnershipAction` (no Better
Auth transfer primitive; two role updates in one `$transaction`) and the custom
`InviteLink` table.

**Seat limits are members-only and enforced once**, by the organization plugin's
`membershipLimit` callback (`packages/auth/membership-limit.ts`, plan `maxMembers`)
inside `acceptInvitation` and `addMember`. `createInvitation` is not gated, pending
invitations reserve nothing, and an over-invited org rejects acceptances once full
(`ORGANIZATION_MEMBERSHIP_LIMIT_REACHED`, localized in all 6 locales; the invitation
stays pending so it can be retried). Do not add an app-level seat pre-check. The
count-then-insert inside Better Auth is not atomic, so a burst of concurrent
acceptances can overshoot by the burst size; this is accepted.

**Invite links** (`acceptInviteLinkAction`) reserve a use with one conditional
`inviteLink.updateMany` (`isActive: true`, `usedCount < maxUses` when capped) *before*
`auth.api.addMember`, and release it with a guarded decrement if `addMember` throws.
The session read there is the entire authorization: `addMember` is server-only and
trusts the `userId` it is handed.

## Platform admin (`/admin`, `apps/web/lib/auth/admin.ts`)

- `requireAdminArea()` gates the layout **and every page** (layouts don't re-run on
  soft nav) → `AdminContext { userId, isAdmin }`; redirects anon, `notFound()` for
  non-staff. `if (!ctx.isAdmin) notFound()` blocks moderators from user-management
  pages.
- `hasAdminPermission(perms)` — first line of every admin action, mirrors
  `hasOrgPermission`.
- **Freshness:** both re-read `role`/`banned` from the DB because the cookie cache is
  stale up to `COOKIE_CACHE_MAX_AGE_MINUTES` — a just-demoted/banned admin loses
  access at once. The rest of the app accepts that stale window.
- **Guardrails:** `guardUserMutation` (`admin/users/guards.ts`) is the friendly
  first-line block on self set-role/ban/delete/impersonate; Better Auth
  authoritatively blocks self-ban/delete and admin→admin impersonation, and a
  `before` hook on `/admin/set-role` throws `CANNOT_CHANGE_OWN_ROLE`
  (`packages/auth/server.ts`). Keep the `admin()` plugin's `adminRoles` option unset
  or the impersonation block breaks.
- **Impersonation:** amber banner mounts in `(app)/layout.tsx`; exit via
  `stopImpersonatingAction`. Mutations write `AuditLog` via `recordAdminAudit`.
- **Seed staff (dev):** `admin@example.com`, `moderator@example.com`,
  `banned@example.com` — password `Password@saaspro`.

## Gotchas

- `hasOrgPermission`/`hasAdminPermission` return `boolean`, not `ActionResult` —
  branch to `actionError("unauthorized")` yourself.
- `hasOrgPermission` **throws** (Better Auth `UNAUTHORIZED`) when the caller is not a
  member of the org at all; its `false` branch only runs for members lacking the
  permission. Both paths fail closed — a non-member just receives the mapped
  fallback message instead of `unauthorized`.
- Don't remove `enforceRateLimit` from auth actions believing the client transport
  still protects them; these are server actions, not `/api/auth/*` requests.
- Never pass a client-supplied role to `canOrg`/`canAdmin`.

See `saasprokit:forms`, `saasprokit:data-access`, `saasprokit:routing`.
