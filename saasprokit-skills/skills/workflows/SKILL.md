---
name: workflows
description: Use when adding a new page or endpoint to apps/web — an organization-scoped page, a personal account page, or an API route. Gives the auth guard, folder location, and route wiring for each.
---

# Common Developer Workflows

Three recipes: an **org-scoped page**, an **account page**, and an **API route**.
Each names its real auth guard, folder, and route wiring. Next.js 16 `params` are
always a `Promise` — `await` them (see `saasprokit:conventions`).

## Recipe 1: new organization-scoped page

1. Create `apps/web/app/[locale]/(app)/[orgSlug]/your-feature/page.tsx` with
   `params: Promise<{ locale: string; orgSlug: string }>`.
2. Guard with `const org = await getActiveOrganization(orgSlug)` from
   `@/lib/organization/queries`. It returns `OrganizationContext { organizationId,
   organizationName, organizationSlug, role, userId }`, **redirects anonymous users
   to sign-in** (calls `requireAuth` internally), and `notFound()`s non-members
   (identical response, so slugs can't be enumerated). It's `cache()`d — call it in
   **every** page even though the layout already did, because layouts don't re-render
   on client-side nav between sibling pages.
3. Scope every query by `org.organizationId` (see `saasprokit:data-access`).
4. Role-gate in the page with `canOrg(org.role, { organization: ["update"] })` from
   `@repo/auth/permissions` — pass the DB-sourced role, get a boolean. Reference:
   `[orgSlug]/settings/page.tsx`. Mutations re-check server-side with
   `hasOrgPermission` (see `saasprokit:forms`).
5. Wire `ORG_PAGES.X` **and** `orgRoutes.x(slug)` in `@/lib/routes`; add a sidebar
   item in `[orgSlug]/components/org-sidebar.tsx`.

## Recipe 2: new account (personal) page

1. Create `apps/web/app/[locale]/(app)/account/your-feature/page.tsx` with
   `params: Promise<{ locale: string }>`.
2. Auth is already enforced by the account **layout's** `requireAuth()` — **no org
   check**. Read the session inside the page with `getServerSession()` from
   `@/lib/auth/auth`; `session!.user` is safe because the layout guarantees it
   (`profile/`, `security/` pages do this). Call `requireAuth()` directly only if the
   page must self-guard.
3. Wire `PAGE_ROUTES.ACCOUNT_*` + `accountRoutes.x()` in `@/lib/routes`; add to
   `account/components/account-sidebar.tsx`.

## Recipe 3: new API route

1. Create `apps/web/app/api/your-endpoint/route.ts`; export `GET`/`POST`/`DELETE`
   returning `NextResponse`. Real routes: `health/` (no auth) and
   `auth/[...all]/` (Better Auth's own handler via `toNextJsHandler`).
2. Guard with `const session = await getServerSession()` from `@/lib/auth/auth`;
   `if (!session?.user?.id) return new NextResponse(null, { status: 401 })`.
   Never inline `auth.api.getSession({ headers })` — `getServerSession` wraps
   and caches exactly that call.
3. Add `createRequestLogger` from `@repo/logger/log`; scope all work by
   `session.user.id`, never a client-supplied id.

Note: `app/api/*` is skipped by the edge middleware matcher, so an API route gets
**no** default-deny protection — the session check in step 2 is the only gate.

See `saasprokit:auth`, `saasprokit:routing`, `saasprokit:data-access`,
`saasprokit:forms`, `saasprokit:tables`.
