---
name: billing
description: Billing and payment architecture for this repo — Stripe via @better-auth/stripe, plan tiers defined in @repo/auth/plans, org-scoped subscriptions, the @repo/payment logic package, and webhooks mounted on the Better Auth catch-all route. Read before touching checkout, subscriptions, plans, or Stripe webhooks.
---

# Billing & Payment

Billing is **Stripe through the `@better-auth/stripe` plugin**, wired once into the
auth server. Subscriptions are **org-scoped**: `referenceId` is always an
`organizationId`. There is no bespoke Stripe SDK code, no dedicated webhook route,
and no billing state machine — Better Auth owns checkout, the portal, and webhook
dispatch; the repo supplies plan configs, an authorization callback, and email
side-effect hooks.

## Two packages, one source of truth

- **Plan/tier source of truth is `packages/auth/plans.ts`** — the `PLANS` record
  (`free`, `pro`, `enterprise`) is defined at `packages/auth/plans.ts:23`, along
  with `buildStripePlans` and `getPlanNameFromPriceId` (`:94`, `:109`). Prices,
  limits, and names come from `@repo/utils/payment`.
- **`packages/payment/` is pure logic** (exports: `./plans ./guards ./helpers
  ./types ./hooks` — see `packages/payment/package.json`). `plans.ts`
  **re-exports** `PLANS`/`PlanConfig` from `@repo/auth/plans`
  (`packages/payment/plans.ts:10`) and adds tier math (`comparePlans`,
  `isPlanHigherTier`, `getPlanLimits`). `helpers.ts` = status/plan helpers
  (`getCurrentPlan`, `isSubscriptionActive`, `calculateUsageStats`). `guards.ts` =
  `guardDowngrade`. `types.ts` = `Subscription` + `SubscriptionSchema`. `hooks.ts`
  = client `useSubscription` (calls `subscription.list` from `@repo/auth/client`).
- **Env keys live in `packages/auth/keys.ts:22-27`, NOT in `@repo/payment`.**

## Where things run

- **Plugin wiring**: `packages/auth/server.ts:453-480` — `stripe()` is added only
  when `stripeClient && STRIPE_WEBHOOK_SECRET`. It sets `organization.enabled`,
  the `handleSubscription*` hooks, `buildStripePlans(...)`, and `authorizeReference
  → authorizeBillingAction` (`packages/auth/billing-authorize.ts:50` — members may
  read, owners/admins may mutate).
- **Web helpers (server-only)**: `apps/web/lib/billing/subscription-queries.ts`
  is the **only** file in that folder (`getOrgSubscription`,
  `getActiveSubscription`, `getOrgUsageStats`, `canOrgAddMember`, …).
- **Org billing page**: `apps/web/app/[locale]/(app)/[orgSlug]/billing/`. Its
  `actions.ts` server actions wrap `auth.api.*`: `upgradeSubscriptionAction`,
  `openBillingPortalAction`, and `cancelSubscriptionAction` return
  `ActionResult<{ url? }>` for the client to redirect to, while `changePlanAction`
  returns `ActionResult<ChangePlanResult>` (`{ action: "cancel" | "changed";
  blockReason? }`) to drive cancel-vs-change UI, not a redirect. Page gated by
  `PermissionGate` `organization:["update"]` (`page.tsx:44`).

## Stripe webhook

Point the Stripe Dashboard endpoint at **`${NEXT_PUBLIC_APP_URL}/api/auth/stripe/webhook`**.
There is **no dedicated webhook route file** — the `@better-auth/stripe` plugin
mounts it under the Better Auth catch-all `apps/web/app/api/auth/[...all]/route.ts`
(`toNextJsHandler(auth)`). The plugin does signature verification and event
dispatch; the repo's custom side-effects (subscription emails, idempotency) live in
`packages/auth/stripe-hooks.ts` (`handleSubscriptionComplete/Update/Deleted`).

Env vars (`apps/web/.env.example:25-30`): `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID_MONTHLY`, `STRIPE_PRO_PRICE_ID_ANNUAL`,
`STRIPE_ENTERPRISE_PRICE_ID_MONTHLY`, `STRIPE_ENTERPRISE_PRICE_ID_ANNUAL`.

## Gotchas

- **`API_ROUTES.STRIPE_WEBHOOK = "/api/stripe/webhook"`** (`apps/web/lib/routes.ts:138`)
  is a stale constant — it does **not** match the real `/api/auth/stripe/webhook`
  path and has **no handler**. Do not point Stripe at it or reference it.
- Plugin is **conditional** — miss `STRIPE_WEBHOOK_SECRET` and all billing
  endpoints silently 404.
- Don't add `hasOrgPermission` before `auth.api.upgradeSubscription/cancel/portal`
  — `authorizeReference` already enforces owner/admin (see `upgradeSubscriptionAction`).
- Edit plans in `packages/auth/plans.ts`, never `packages/payment/plans.ts` (re-export only).

See `saasprokit:auth`, `saasprokit:data-access`, `saasprokit:env-setup`.
