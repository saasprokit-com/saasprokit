---
name: routing
description: Use when adding a page or API route to apps/web, editing route allowlists or middleware, or working on locale prefixes, CSP nonces, or the sign-in redirect. Covers the [locale] route groups, the top-level org slug, and @/lib/routes.
---

# Routing

**Mental model:** one edge entry (`apps/web/middleware.ts`) runs i18n, strips the
locale, then gates every path against allowlists — **default-deny**: anything not
public and not an auth route needs a session cookie. Route strings live in one
file (`apps/web/lib/routes.ts`); import them, never hardcode.

## Route structure

`apps/web/app/[locale]/` — root holds `layout.tsx`, `loading.tsx`, `error.tsx`,
`not-found.tsx` plus these groups (parenthesized = URL-invisible):

- **`(app)`** — authenticated app; own `layout.tsx`/`loading.tsx`/`not-found.tsx`:
  - `[orgSlug]/` — org-scoped: index, `billing`, `members` (+ `members/invitations`,
    `members/invite-links`), `settings`, `checkout/success`, `checkout/canceled`
  - `account/` — `profile`, `security`, `danger`, `new-org`
  - `admin/` — platform admin: index, `users` (+ `users/[userId]`), `organizations`
    (+ `organizations/[orgId]`)
  - `invite/` — `invite/[token]`, `invite/accept`
- **`org/`** — **top-level, OUTSIDE `(app)`** (`app/[locale]/org/page.tsx`): the
  post-login redirect hop — no UI; it `redirect()`s to the user's default org slug,
  or to `/account/new-org` when they have none. `PAGE_ROUTES.ORG` = `/org`.
- **`(frontier)`** — public marketing home (`page.tsx`); Hero/Features/Pricing are
  blocks on `/`, there is no `/pricing` page.
- **`auth/`** — `sign-in`, `sign-up`, `forgot-password`, `reset-password`,
  `verify-email`, `2fa` (+ `layout.tsx`, `actions.ts`). `MAGIC_LINK` is defined and
  gated in `routes.ts` but has no page dir yet.

Because org pages sit at the top level (`/[orgSlug]`), an unknown `/typo` is
indistinguishable from a real `/acme` at the edge without a DB lookup — hence
default-deny.

**API** (`app/api/`, all bypass the middleware matcher): `auth/[...all]` (Better
Auth handler, incl. the Stripe webhook via `@better-auth/stripe`), `health`.

## Edge middleware — `apps/web/middleware.ts`

Next.js 16 renamed `middleware.ts` → `proxy.ts`, but this app keeps
`middleware.ts`: `proxy` is Node-runtime-only and OpenNext/Cloudflare rejects Node
middleware (see `saasprokit:deployment`). Ordered flow:

1. **Skip** `/api`, `/_next`, or any path containing `.` → `NextResponse.next()`,
   no CSP.
2. **i18n first** — `internationalizationMiddleware(request)`; return immediately
   if `status !== 200` (locale redirect).
3. **Strip locale** — `stripLocale()` maps `/fr/org` → `/org` so checks are
   locale-agnostic.
4. **Classify** — `isAuthRoute` = `AUTH_ROUTE_PREFIXES.some(startsWith)`;
   `isPublicRoute` = `PUBLIC_ROUTE_EXACT.some(===)` **or**
   `PUBLIC_ROUTE_PREFIXES.some(startsWith)`.
5. **Public short-circuit** — public-and-not-auth returns with CSP, no session check.
6. **Cookie gate** — `getSessionCookie(request)` from `better-auth/cookies`. No
   cookie and not an auth route → redirect to `SIGN_IN` with
   `?callbackUrl=<original pathname>`.

**This check is optimistic, not authoritative.** It reads cookie *presence* only —
it never calls `auth.api.getSession`, never touches the DB, and has no try/catch,
because the edge has no TCP on Vercel and no Node runtime on workerd. Spoofing the
cookie only gets an attacker past the redirect; **the layout gating each subtree
re-verifies against the DB** (`[orgSlug]` and `account` call `requireAuth`, `admin`
calls `requireAdminArea`), and every server action authenticates — either through
`verifySession` or through the `auth.api.*` call it wraps (`saasprokit:auth`).
`(app)/layout.tsx` itself only *reads* the session for the impersonation banner; it
is not a gate. Never treat middleware as the security boundary.

The reverse redirect — a signed-in user landing on an auth page goes to `/org` —
is **not** in middleware; it lives in `app/[locale]/auth/layout.tsx`.

CSP: `applyNonceCsp` mints a per-request nonce and sets `Content-Security-Policy`
plus `x-nonce`, so Server Components read it via `headers()`.

## Centralized routes — `apps/web/lib/routes.ts`

Exports, in file order: `PAGE_ROUTES`, `PUBLIC_ROUTE_EXACT` (`[HOME]`),
`PUBLIC_ROUTE_PREFIXES` (`[INVITE]`), `resolveCallbackUrl` (open-redirect guard),
`AUTH_ROUTE_PREFIXES`, `ORG_PAGES`, `orgRoutes`, `accountRoutes`, `ADMIN_PAGES`,
`adminRoutes`.

```ts
import { PAGE_ROUTES, orgRoutes, adminRoutes } from "@/lib/routes";
PAGE_ROUTES.SIGN_IN          // "/auth/sign-in"
orgRoutes.billing("acme")    // "/acme/billing"
adminRoutes.user(userId)     // "/admin/users/{userId}"
```

`ORG_PAGES` / `ADMIN_PAGES` values feed `revalidateOrgPage` and the route helpers.

## Locale handling

`locales = ["en","es","de","zh","fr","pt"]`, `DEFAULT_LOCALE = "en"`
(`packages/internationalization/shared.ts`). The i18n middleware wraps
next-international with `urlMappingStrategy: "rewriteDefault"` (default locale
served without a prefix) (`packages/internationalization/proxy.ts`). Pages
pre-render locales via `generateStaticParams` returning `locales.map(...)`.

## Gotchas

- **`/admin` needs no middleware change.** Default-deny forces sign-in; role gating
  is server-side via `requireAdminArea()` (`apps/web/lib/auth/admin.ts`), called in
  `(app)/admin/layout.tsx` — redirects anon, 404s non-staff.
- **`admin`, `org`, `account`, `invite` (and more) are reserved slugs**
  (`isReservedSlug`, `packages/utils/slug.ts`) so a top-level org slug never
  collides with a system route.
- **Adding a new top-level route group?** Add it to `PUBLIC_ROUTE_PREFIXES` or an
  auth allowlist as needed — otherwise it is protected by default.
- **`HOME` is exact, not a prefix**: `/` as a `startsWith` prefix would match
  every path.
- **`callbackUrl` is sanitized** — only same-origin relative paths survive
  `resolveCallbackUrl`; everything else falls back to `/org`.

See `saasprokit:workflows`, `saasprokit:auth`.
