---
name: routing
description: Route structure, edge middleware (apps/web/proxy.ts), and centralized route definitions (@/lib/routes) for this Next.js 16 web app — the [locale] route groups plus the top-level org route, the public/auth allowlists, locale handling, and the CSP nonce. Read before adding pages or API routes, editing route allowlists, or touching middleware, locale, or CSP handling.
---

# Routing

**Mental model:** one edge entry (`apps/web/proxy.ts`) runs i18n, strips the
locale, then gates every path against allowlists — **default-deny**: anything not
public and not an auth route needs a session. Route strings live in one file
(`apps/web/lib/routes.ts`); import them, never hardcode.

## Route Structure

`apps/web/app/[locale]/` — root holds `layout.tsx`, `loading.tsx`,
`error.tsx`, `not-found.tsx` plus these groups (parenthesized = URL-invisible):

- **`(app)`** — authenticated app; own `layout.tsx`/`loading.tsx`/`not-found.tsx`:
  - `[orgSlug]/` — org-scoped: index, `billing`, `members` (+ `members/invitations`, `members/invite-links`), `settings`, `checkout/success`, `checkout/canceled`
  - `account/` — `profile`, `security`, `danger`, `new-org`
  - `admin/` — platform admin: index, `users` (+ `users/[userId]`), `organizations` (+ `organizations/[orgId]`)
  - `invite/` — `invite/[token]`, `invite/accept`
- **`org/`** — **top-level, OUTSIDE `(app)`** (`app/[locale]/org/page.tsx`): the post-login org-selection landing. `PAGE_ROUTES.ORG` = `/org`.
- **`(frontier)`** — public marketing home (`page.tsx`); Hero/Features/Pricing are blocks on `/`, there is no `/pricing` page.
- **`auth/`** — `sign-in`, `sign-up`, `forgot-password`, `reset-password`, `verify-email`, `2fa` (+ `layout.tsx`, `actions.ts`). `MAGIC_LINK` is defined and gated in routes but has no page dir yet.

Because org pages sit at the top level (`/[orgSlug]`), an unknown `/typo` is
indistinguishable from a real `/acme` at the edge without a DB lookup — hence
default-deny (`routes.ts:44`).

**API** (`app/api/`, all bypass the proxy): `auth/[...all]` (Better Auth handler,
incl. Stripe webhook via `@better-auth/stripe`), `health`, `upload`, `user/activity`.

## Edge middleware — `apps/web/proxy.ts`

Next.js 16 renamed `middleware.ts` → `proxy.ts`. Ordered flow:

1. **Skip** `/api`, `/_next`, or any path with a `.` — `NextResponse.next()`, no CSP (`proxy.ts:57`).
2. **i18n first** — `internationalizationMiddleware(request)`; return immediately if `status !== 200` (locale redirect) (`proxy.ts:66`).
3. **Strip locale** — `stripLocale()` maps `/vi/org` → `/org` so checks are locale-agnostic (`proxy.ts:17`).
4. **Classify** — `isAuthRoute` = `AUTH_ROUTE_PREFIXES.some(startsWith)`; `isPublicRoute` = `PUBLIC_ROUTE_EXACT.some(===)` **or** `PUBLIC_ROUTE_PREFIXES.some(startsWith)` (`proxy.ts:75`).
5. **Public short-circuit** — public-and-not-auth returns with CSP, no session check (`proxy.ts:84`).
6. **Session gate** — `auth.api.getSession`: no session on a protected route → redirect to `SIGN_IN` with `?callbackUrl=<original pathname>`; session on an auth route → redirect to `ORG` (`proxy.ts:90`).
7. **Fail closed** — on a thrown session check, protected routes still redirect to sign-in; only public/auth pass (`proxy.ts:106`).

CSP: `applyNonceCsp` mints a per-request nonce, sets `Content-Security-Policy`
and `x-nonce` so Server Components read it via `headers()` (`proxy.ts:32`).

## Centralized routes — `apps/web/lib/routes.ts`

Exports: `PAGE_ROUTES` (`:1`), `PUBLIC_ROUTE_EXACT` = `[HOME]` (`:39`),
`PUBLIC_ROUTE_PREFIXES` = `[INVITE]` i.e. `/invite` (`:51`), `resolveCallbackUrl`
(open-redirect guard, `:59`), `AUTH_ROUTE_PREFIXES` (`:72`), `ORG_PAGES` (`:85`),
`orgRoutes` (`:97`), `accountRoutes` (`:106`), `ADMIN_PAGES` (`:117`),
`adminRoutes` (`:123`), `API_ROUTES` (`:134`).

```ts
import { PAGE_ROUTES, orgRoutes, adminRoutes } from "@/lib/routes";
PAGE_ROUTES.SIGN_IN          // "/auth/sign-in"
orgRoutes.billing("acme")    // "/acme/billing"
adminRoutes.user(userId)     // "/admin/users/{userId}"
```

`ORG_PAGES` / `ADMIN_PAGES` values feed `revalidateOrgPage` and the route helpers.

## Locale handling

`locales = ["en","es","de","zh","fr","pt"]`, `DEFAULT_LOCALE = "en"`
(`packages/internationalization/shared.ts:10`). The i18n middleware wraps
next-international with `urlMappingStrategy: "rewriteDefault"` (default locale
served without a prefix) (`packages/internationalization/proxy.ts:46`). Pages
pre-render locales via `generateStaticParams` returning `locales.map(...)`.

## Gotchas

- **`/admin` needs no `proxy.ts` change.** Default-deny forces sign-in; role gating is server-side in the admin layout via `requireAdminArea()` (`apps/web/lib/auth/admin.ts:34`, called at `app/[locale]/(app)/admin/layout.tsx:28`) — redirects anon, 404s non-staff.
- **`admin`, `org`, `account`, `invite` (and more) are reserved slugs** (`packages/utils/slug.ts:7`, `isReservedSlug` at `:35`) so a top-level org slug never collides with a system route.
- **Adding a new top-level route group?** Add it to `PUBLIC_ROUTE_PREFIXES` (public) or an auth/allowlist as needed — otherwise it is protected by default.
- **`HOME` is exact, not a prefix** (`routes.ts:39`): `/` as a `startsWith` prefix would match every path.
- **`callbackUrl` is sanitized** — only same-origin relative paths survive `resolveCallbackUrl`; everything else falls back to `/org`.

See `saasprokit:workflows`, `saasprokit:auth`.
