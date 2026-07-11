---
name: workflows
description: Step-by-step recipes for common tasks in this repo — creating a new organization-scoped page, a personal account page, or an API route. Read when adding any new page or endpoint to the web app.
---

# Common Developer Workflows

## Creating a new organization-scoped page

1. Create folder under `/apps/web/app/[locale]/(app)/[orgSlug]/your-feature/`
2. Use `validateOrgMembershipBySlug(orgSlug)` from `@/servers/organization/queries` for auth + membership check
3. Add route to `orgRoutes` in `@/lib/routes` if needed
4. Use role-based checks via `ORG_ROLES` from `@repo/auth/permissions`

## Creating a new user account page

1. Create folder under `/apps/web/app/[locale]/(app)/account/your-feature/`
2. Use `requireAuth()` from `@/lib/auth/auth` (no org check needed)

## Adding a new API route

1. Create folder under `apps/web/app/api/your-endpoint/route.ts`
2. Add route constant to `API_ROUTES` in `@/lib/routes`
3. Use `getServerSession()` for auth checks

See `saasprokit:auth` for the auth helper details and `saasprokit:routing` for route structure and middleware implications.
