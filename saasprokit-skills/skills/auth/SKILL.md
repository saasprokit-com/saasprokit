---
name: auth
description: Authentication and authorization for this repo — Better Auth server/client setup, the dual admin + org RBAC systems, cached session helpers, org-slug access guards, the server-action auth contract, and platform /admin gates. Read before touching sessions, roles, permissions, protected pages, or auth server actions.
---

# Authentication & Authorization

Two independent RBAC systems run side by side: **platform admin roles** (staff who operate `/admin`) and **organization roles** (members inside one org). Every protected surface authenticates the caller from the session cookie carried in request headers — **pages** redirect/`notFound()`, **server actions** return a typed `ActionResult` error. Rendering a page on a protected route is never the security boundary; each page and each action re-asserts.

## Map of the area

| Concern | Canonical file |
| --- | --- |
| Better Auth instance + all plugins | `packages/auth/server.ts:208` |
| Client (`authClient`, `signIn`/`useSession`/…, `Session`/`User` types) | `packages/auth/client.ts:27` |
| Role defs, `ac`/`orgAc`, `canOrg`/`canAdmin`/`isAdminAreaRole` | `packages/auth/permissions.ts` |
| `ActionResult<T>`, `getServerSession`, `requireAuth`, `hasOrgPermission` | `apps/web/lib/auth/auth.ts` |
| `verifySession()` (server-action guard) | `apps/web/lib/auth/action-auth.ts:9` |
| `toActionError`/`actionError`, `ActionErrorCode` | `apps/web/lib/auth/action-error.ts` |
| Org-slug access: `getActiveOrganization`, `validateOrganizationMembership` | `apps/web/lib/organization/queries.ts` |
| Admin gates: `requireAdminArea`, `hasAdminPermission`, `AdminContext` | `apps/web/lib/auth/admin.ts` |
| Server-side rate limiting for auth actions | `apps/web/lib/auth/rate-limit.ts` |

Exports: `@repo/auth/server` (auth instance), `@repo/auth/client` (hooks + `Session`/`User`), `@repo/auth/permissions` (roles + checks). Plugins on the instance: `admin`, `magicLink`, `emailOTP`, `twoFactor`, `multiSession`, `organization` (teams enabled), `stripe` (only when keys set), `@better-auth/i18n`, `nextCookies`.

## Role systems (`packages/auth/permissions.ts`)

- **Admin** (`ADMIN_ROLES`, `permissions.ts:6`): `admin` (full), `moderator` (content/members, no billing/org), `user` (default). Area membership is a name allowlist — `ADMIN_AREA_ROLES` (`:225`) = admin + moderator.
- **Org** (`ORG_ROLES`, `permissions.ts:14`): `owner` (incl. delete), `admin` (manage, no delete), `member` (read-only).
- `canOrg(role, perms)` (`:178`) and `canAdmin(role, perms)` (`:204`) evaluate a **DB-sourced** role in memory (same result as Better Auth's `hasPermission`, no round-trip). They trust their argument — never pass a client-supplied role.

## Server-side helpers (`apps/web/lib/auth/auth.ts`)

- `getServerSession()` (`:15`) — `React.cache`-wrapped `auth.api.getSession`, deduped across layout + page in one request. Prefer over raw `auth.api.getSession`.
- `requireAuth(returnTo?)` (`:22`) — session or redirect to sign-in.
- `hasOrgPermission(orgId, { member: ["read"] })` (`:35`) → `Promise<boolean>` via `auth.api.hasPermission`.

## Org access (`apps/web/lib/organization/queries.ts`)

- `getActiveOrganization(slug)` (`:107`) is the **slug guard every org-scoped page calls**. Returns `OrganizationContext { organizationId, organizationName, organizationSlug, role, userId }`; redirects anon to sign-in, `notFound()` if the org is missing OR the user isn't a member (identical response so slugs can't be enumerated). (`validateOrgMembershipBySlug` does **not** exist.)
- `validateOrganizationMembership(organizationId, userId)` (`:49`) → `Promise<boolean>` — a lower-level membership check, not the page guard.

## The server-action auth contract (non-negotiable)

1. **Validate** — `schema.parse(input)` (`saasprokit:forms`).
2. **Authenticate** — `const { session, error } = await verifySession(); if (error) return error;`. Skip it when the action's work goes **entirely** through `auth.api.*({ headers: await headers() })`: those calls authenticate the caller from the cookie themselves (sensitive ones re-read the session DB-fresh), so a `verifySession` pre-check adds no security. Keep it when you touch raw Prisma or need `session.user.id`.
3. **Authorize** — org: `hasOrgPermission`; admin: `hasAdminPermission`; else `actionError("unauthorized")`.
4. **Identity from the session, never the payload.**
5. **Return `ActionResult<T>`**; in `catch`, `return toActionError(error, { fallback })`.

`auth.api.*` calls **bypass** Better Auth's HTTP rate limits (those run only on `/api/auth/*`), so brute-forceable auth flows re-apply `enforceRateLimit(scope)` from `rate-limit.ts` (`RATE_LIMITS`, `:24`) — do not remove it. BA `APIError`s arrive **pre-localized** by the i18n plugin (`server.ts:490`); `toActionError` surfaces that message, else the localized `errors.action[fallback]`, and always sets `code` (BA `body.code` when present, else the fallback `ActionErrorCode`). New BA codes go in `packages/internationalization/ba-errors/[locale].json` — **6 locales** (de, en, es, fr, pt, zh; no vi), key-parity enforced by `packages/auth/ba-i18n.test.ts`.

## Platform admin (`/admin`, `apps/web/lib/auth/admin.ts`)

- `requireAdminArea()` (`:34`) gates the layout **and every page** (layouts don't re-run on soft nav) → `AdminContext { userId, isAdmin }`; redirects anon, `notFound()` for non-staff. `if (!ctx.isAdmin) notFound()` blocks moderators from user-management pages.
- `hasAdminPermission(perms)` (`:48`) — first line of every admin action, mirrors `hasOrgPermission`.
- **Freshness:** both re-read `role`/`banned` from the DB (`getFreshRole`, `:21`) because the cookie cache is stale up to `COOKIE_CACHE_MAX_AGE_MINUTES` — a just-demoted/banned admin loses access at once. The rest of the app accepts that stale window.
- **Guardrails:** `guardUserMutation` (`admin/users/guards.ts:26`) is the friendly first-line block on self set-role/ban/delete/impersonate; Better Auth authoritatively blocks self-ban/delete and admin→admin impersonation, and a `before` hook on `/admin/set-role` throws `CANNOT_CHANGE_OWN_ROLE` (`server.ts:231`). Keep the `admin()` plugin's `adminRoles` option unset or the impersonation block breaks.
- **Impersonation:** amber banner mounts in `(app)/layout.tsx:16`; exit via `stopImpersonatingAction`. Mutations write `AuditLog` via `recordAdminAudit`.
- **Seed staff (dev):** `admin@example.com`, `moderator@example.com`, `banned@example.com` — password `Password@saaspro`.

## Gotchas

- The page guard is `getActiveOrganization(slug)`, not the nonexistent `validateOrgMembershipBySlug`.
- `hasOrgPermission`/`hasAdminPermission` return `boolean`, not `ActionResult` — branch to `actionError("unauthorized")` yourself.
- Don't remove `enforceRateLimit` from auth actions believing the client transport still protects them; these are server actions now.
- Never pass a client-supplied role to `canOrg`/`canAdmin`.

See `saasprokit:forms`, `saasprokit:data-access`, `saasprokit:routing`.
