---
name: workflows
description: Step-by-step recipes for adding a new organization-scoped page (getActiveOrganization guard), a personal account page (requireAuth in the account layout), or an API route (getServerSession) — with the exact auth helper, folder location, and route wiring (ORG_PAGES, orgRoutes, accountRoutes, API_ROUTES) for each. Read before adding any new page or endpoint to the web app.
---

# Common Developer Workflows

Three recipes: an **org-scoped page**, an **account page**, and an **API route**.
Each names its real auth guard, folder, and route wiring. Next.js 16 `params` are
always a `Promise` — `await` them (see `saasprokit:conventions`).

## Recipe 1: new organization-scoped page

1. Create `apps/web/app/[locale]/(app)/[orgSlug]/your-feature/page.tsx`.
   `params: Promise<{ locale: string; orgSlug: string }>`.
2. Guard with `const org = await getActiveOrganization(orgSlug)` from
   `@/servers/organization/queries` (`queries.ts:107`). It returns
   `OrganizationContext` `{ organizationId, organizationName, organizationSlug,
   role, userId }`, **redirects anonymous users to sign-in** (calls `requireAuth`
   internally), and `notFound()`s non-members (identical response, so slugs can't
   be enumerated). It's `cache()`d — call it in **every** page even though the
   layout already did, because layouts don't re-render on client-side nav between
   sibling pages.
3. Scope every query by `org.organizationId` (see `saasprokit:data-access`).
4. Role-gate in the page with `canOrg(org.role, { organization: ["update"] })`
   from `@repo/auth/permissions` — pass the DB-sourced role, get a boolean
   (`ORG_ROLES` holds the names). Reference: `settings/page.tsx:31`. Mutations
   re-check server-side with `hasOrgPermission` (see `saasprokit:forms`).
5. Wire `ORG_PAGES.X` **and** `orgRoutes.x(slug)` in `@/lib/routes`
   (`routes.ts:85,97`); add a sidebar item in `org-sidebar.tsx`.

## Recipe 2: new account (personal) page

1. Create `apps/web/app/[locale]/(app)/account/your-feature/page.tsx`.
   `params: Promise<{ locale: string }>`.
2. Auth is already enforced by the account **layout's** `requireAuth()`
   (`account/layout.tsx:23`) — **no org check**. Read the session inside the page
   with `getServerSession()` from `@/lib/auth/auth`; `session!.user` is safe
   because the layout guarantees it (`profile/`, `security/` pages do this). Call
   `requireAuth()` directly only if the page must self-guard.
3. Wire `PAGE_ROUTES.ACCOUNT_*` + `accountRoutes.x()` in `@/lib/routes`
   (`routes.ts:106`); add to `account-sidebar.tsx`.

## Recipe 3: new API route

1. Create `apps/web/app/api/your-endpoint/route.ts`; export `GET`/`POST`/`DELETE`
   returning `NextResponse`. Real routes: `health/` (no auth), `upload/`,
   `user/activity/`, `auth/[...all]/` (Better Auth's own handler via
   `toNextJsHandler`).
2. Guard with `const session = await getServerSession()` from `@/lib/auth/auth`;
   `if (!session?.user?.id) return new NextResponse(null, { status: 401 })`.
   (`upload`/`user-activity` inline `auth.api.getSession({ headers })` — that call
   is exactly what `getServerSession` wraps and caches.)
3. Add `createRequestLogger` from `@repo/logger/server`; scope all work by
   `session.user.id`, never a client-supplied id.
4. Add the path to `API_ROUTES` in `@/lib/routes` (`routes.ts:134`).

See `saasprokit:auth`, `saasprokit:routing`, `saasprokit:data-access`,
`saasprokit:forms`, `saasprokit:tables`.
