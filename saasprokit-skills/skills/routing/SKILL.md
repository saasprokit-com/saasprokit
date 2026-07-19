---
name: routing
description: Route structure, edge middleware (proxy.ts), and centralized route definitions for this repo. Read before adding pages or API routes, changing public/auth route allowlists, touching locale handling, or adjusting CSP.
---

# Routing

## Route Structure

The Next.js app uses grouped routes (parentheses in directory names) to organize different sections:

**Locale-level routes** (`/[locale]/`):
- `(app)` — Authenticated app pages
  - `[orgSlug]` — Organization-scoped pages: `billing`, `members`, `settings`, and `checkout` (Stripe return URLs: `checkout/success`, `checkout/canceled`)
  - `account` — Personal account management: `profile`, `security`, `danger` (delete account), `new-org`
  - `invite` — Organization invitation handling (`invite/[token]`, `invite/accept`)
  - `org` — Organization selection landing (post-login redirect target)
- `(frontier)` — Public marketing home page (Hero, Features, Pricing blocks live on the single home route — there is no separate `/pricing` page)
- `auth` — Authentication flows: `sign-in`, `sign-up`, `magic-link`, `forgot-password`, `reset-password`, `verify-email`, `2fa`

**API routes** (`/api/`):
- `auth/[...all]/` — Better Auth handler (incl. Stripe webhooks via `@better-auth/stripe`)
- `health/` — Health check endpoint (database + auth validation)
- `upload/` — File uploads
- `user/activity/` — User activity tracking

## Edge Middleware (`apps/web/proxy.ts`)

Next.js 16 renamed `middleware.ts` → `proxy.ts`. Single entry point, executed in this order:

1. **Skip** `/api`, `/_next`, and any path containing a `.` (static files) — these bypass the proxy entirely (no CSP applied).
2. **i18n first** — runs `internationalizationMiddleware` and returns immediately if it produces a non-200 (locale detection/redirect). Everything below only runs once the locale is settled.
3. **Strip locale** — `stripLocale()` normalizes `/vi/org`, `/fr/org`, etc. to `/org` so route checks are locale-agnostic.
4. **Gate routes** — matches the normalized path against `AUTH_ROUTE_PREFIXES` (`startsWith`) and `PUBLIC_ROUTE_PREFIXES` (exact `===`, currently just `HOME`) from `@/lib/routes`. Unauthenticated users on protected routes redirect to sign-in (with `callbackUrl`); authenticated users on auth routes redirect to `/org`.
5. **Fail closed** — if the session check throws, protected routes still redirect to sign-in; only public/auth routes are allowed through.

It also generates a per-request CSP nonce and sets `x-nonce` on the response (via `applyNonceCsp`) so Server Components can read it via `headers()`. Touch this file whenever you add a new top-level route group, change the public/auth allowlists, or need to adjust CSP.

## Centralized Route Definitions

All routes are defined in `apps/web/lib/routes.ts`:

```typescript
import { PAGE_ROUTES, orgRoutes, adminRoutes, API_ROUTES } from "@/lib/routes";

PAGE_ROUTES.SIGN_IN        // "/auth/sign-in"
orgRoutes.billing("my-org") // "/my-org/billing"
adminRoutes.user(userId)    // "/admin/users/{userId}"
API_ROUTES.ORG_CHECKOUT(id) // "/api/organizations/{id}/checkout"
```

`/admin` is a protected subtree: the default-deny middleware forces sign-in, and
role gating happens **server-side** in the admin layout/pages via `requireAdminArea`
(no `proxy.ts` change needed). `"admin"` is a reserved slug (`packages/utils/slug.ts`),
so it never collides with a top-level org slug.

## Locale Handling

```typescript
import { locales } from "@repo/internationalization";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
```
