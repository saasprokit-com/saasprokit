---
name: billing
description: Billing and payment architecture for this repo — Stripe via @better-auth/stripe, plan tiers and subscription logic in @repo/auth (plans, guards, helpers, types, use-subscription), org-scoped subscriptions, and webhooks mounted on the Better Auth catch-all route. Read before touching checkout, subscriptions, plans, or Stripe webhooks.
---

# Billing & Payment

Billing is **Stripe through the `@better-auth/stripe` plugin**, wired once into the
auth server. Subscriptions are **org-scoped**: `referenceId` is always an
`organizationId`. There is no bespoke Stripe SDK code, no dedicated webhook route,
and no billing state machine — Better Auth owns checkout, the portal, and webhook
dispatch; the repo supplies plan configs, an authorization callback, and email
side-effect hooks.

## One package, one source of truth

All billing config and logic lives in **`packages/auth`** (exports include
`./plans ./guards ./helpers ./types ./use-subscription` — see
`packages/auth/package.json`):

- **Plan/tier source of truth is `packages/auth/plans.ts`** — the `PLANS` record
  (`free`, `pro`, `enterprise`), plus `buildStripePlans`/`getPlanNameFromPriceId`
  (Stripe plumbing) and tier math (`comparePlans`, `isPlanHigherTier`,
  `getPlanLimits`, `getAllPlans`, `getMonthlyFromAnnual`, `getAnnualSavingsPercent`).
  Prices, limits, and names come from `@repo/utils/payment`.
- **`packages/auth/helpers.ts`** = status/plan helpers (`getCurrentPlan`,
  `isSubscriptionActive`, `calculateUsageStats`, formatters).
- **`packages/auth/guards.ts`** = `guardDowngrade`.
- **`packages/auth/types.ts`** = `Subscription` + `SubscriptionSchema`.
- **`packages/auth/use-subscription.ts`** = client React hooks `useSubscription`
  / `useCancel` (call `subscription.*` from `@repo/auth/client`). Not to be
  confused with `packages/auth/stripe-hooks.ts` (server-side webhook lifecycle).
- **Env keys live in `packages/auth/keys.ts:22-27`.**

## Where things run

- **Plugin wiring**: `packages/auth/server.ts:453-480` — `stripe()` is added only
  when `stripeClient && STRIPE_WEBHOOK_SECRET`. It sets `organization.enabled`,
  the `handleSubscription*` hooks, `buildStripePlans(...)`, and `authorizeReference
  → authorizeBillingAction` (`packages/auth/billing-authorize.ts:50` — members may
  read, owners/admins may mutate).
- **Web helpers (server-only)**: `apps/web/lib/billing/subscription-queries.ts`
  is the **only** file in that folder (`getActiveSubscription`,
  `getCurrentPlanForOrg`, `getOrgUsageStats`, `getOrgMemberCount`,
  `canOrgAddMember`, `canOrgAcceptMember`, `canUserCreateOrg`, …).
- **Org billing page**: `apps/web/app/[locale]/(app)/[orgSlug]/billing/`. Its
  `actions.ts` server actions wrap `auth.api.*`: `upgradeSubscriptionAction`,
  `openBillingPortalAction`, and `cancelSubscriptionAction` return
  `ActionResult<{ url? }>` for the client to redirect to, while `changePlanAction`
  returns `ActionResult<ChangePlanResult>` (`{ action: "cancel" | "changed";
  blockReason? }`) to drive cancel-vs-change UI, not a redirect. Page gated by
  `OrgPermissionGate` `organization:["update"]` (`page.tsx:53`).

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

- **Upgrading an org that already has an active subscription never reaches Stripe
  Checkout.** With this repo's plan shape (single price, no seats/line-items),
  `@better-auth/stripe` routes it to the Stripe customer portal's
  `subscription_update_confirm` flow; the `successUrl`/`cancelUrl` passed by
  `upgradeSubscriptionAction` are ignored (user returns via `returnUrl`). Charge
  timing is controlled by the **Stripe portal configuration**, not repo code:
  `features.subscription_update.proration_behavior` must be `always_invoice` so the
  prorated true-up is charged at confirm time — the default (`create_prorations`)
  silently defers it to the next cycle. The plugin's per-plan `prorationBehavior`
  option is dead code for this plan shape. This is per-Stripe-account config
  (API-only, not in the Dashboard portal settings UI); re-apply it on any new or
  live-mode account via
  `POST /v1/billing_portal/configurations/:id` on the default configuration.

- **`API_ROUTES.STRIPE_WEBHOOK = "/api/stripe/webhook"`** (`apps/web/lib/routes.ts:138`)
  is a stale constant — it does **not** match the real `/api/auth/stripe/webhook`
  path and has **no handler**. Do not point Stripe at it or reference it.
- Plugin is **conditional** — miss `STRIPE_WEBHOOK_SECRET` and all billing
  endpoints silently 404.
- Don't add `hasOrgPermission` before the thin `auth.api.*` wrappers
  (`upgradeSubscriptionAction`, `openBillingPortalAction`, `cancelSubscriptionAction`) —
  `authorizeReference` already enforces owner/admin. **`changePlanAction` is the
  exception**: it gates with `hasOrgPermission(orgId, { organization: ["update"] })`
  because it does authorization-sensitive pre-work (`guardDowngrade`, member/storage
  reads) and can return early (cancel / blocked) *without* ever reaching `auth.api.*`.
  No separate session-existence guard is needed there — `hasOrgPermission` throws
  `UNAUTHORIZED` when unauthenticated (it runs behind Better Auth's `sessionMiddleware`);
  the `getServerSession` call in `changePlanAction` exists only to source the `userId`
  log field, so its `if (!session)` branch is effectively dead.
- Edit plans in `packages/auth/plans.ts` — the single source of truth for tiers and tier math.

See `saasprokit:auth`, `saasprokit:data-access`, `saasprokit:env-setup`.
