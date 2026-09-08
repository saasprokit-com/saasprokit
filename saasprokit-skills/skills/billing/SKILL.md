---
name: billing
description: Use when touching checkout, subscriptions, plan tiers, seat/storage limits, the billing page, or Stripe webhooks in this repo. Covers Stripe via @better-auth/stripe, org-scoped subscriptions, and where plan config lives.
---

# Billing & Payment

Billing is **Stripe through the `@better-auth/stripe` plugin**, wired once into the
auth server. Subscriptions are **org-scoped**: `referenceId` is always an
`organizationId`. There is no bespoke Stripe SDK code, no dedicated webhook route,
and no billing state machine — Better Auth owns checkout, the portal, and webhook
dispatch; the repo supplies plan configs, an authorization callback, and email
side-effect hooks.

## One package, one source of truth

All billing config and logic lives in **`packages/auth`** (exports `./plans`,
`./guards`, `./helpers`, `./types`, `./stripe-client`):

- **`plans.ts` is the plan/tier source of truth** — the `PLANS` record (`free`,
  `pro`, `enterprise`), plus `buildStripePlans`/`getPlanNameFromPriceId` (Stripe
  plumbing) and tier math (`comparePlans`, `isPlanHigherTier`, `getPlanLimits`,
  `getAllPlans`, `getMonthlyFromAnnual`, `getAnnualSavingsPercent`). Prices, limits,
  and names come from `@repo/utils/payment`.
- **`helpers.ts`** — status/plan helpers (`getCurrentPlan`, `isSubscriptionActive`,
  `isSubscriptionPendingCancel`, `calculateUsageStats`, formatters).
- **`guards.ts`** — `guardDowngrade`.
- **`types.ts`** — `SubscriptionWithPlan`, `FeatureAccess`, `UsageStats`,
  `UpgradeOptions`, `CancelOptions`. The row shape itself is Prisma's: import
  `Subscription` from `@repo/database`. There is deliberately **no** hand-maintained
  interface or zod schema for it — don't reintroduce one.
- **`stripe-hooks.ts`** — server-side webhook lifecycle
  (`handleSubscriptionComplete`/`Update`/`Deleted`).
- **Env keys** live in `keys.ts`.

## Where things run

- **Plugin wiring**: `packages/auth/server.ts` — `stripe()` is added only when
  `stripeClient && STRIPE_WEBHOOK_SECRET`. It sets `organization.enabled`, the
  `handleSubscription*` hooks, `buildStripePlans(...)`, and `authorizeReference →
  authorizeBillingAction` (`packages/auth/billing-authorize.ts` — members may read,
  owners/admins may mutate).
- **Web helpers (server-only)**: `apps/web/lib/billing/` holds
  `subscription-queries.ts` (`getActiveSubscription`, `getCurrentPlanForOrg`,
  `getOrgUsageStats` (members only — pending invitations occupy no seat),
  `getOrgMemberCount`, `canUserCreateOrg`, …) and `checkout-queries.ts` (`verifyCheckoutSession` —
  confirms a Stripe Checkout session is paid and owned by the org; consumed by the
  checkout success page).
- **Org billing page**: `apps/web/app/[locale]/(app)/[orgSlug]/billing/`. Its
  `actions.ts` exports four server actions: `upgradeSubscriptionAction`,
  `openBillingPortalAction`, and `cancelSubscriptionAction` wrap `auth.api.*` and
  return `ActionResult<{ url? }>` for the client to redirect to, while
  `changePlanAction` returns `ActionResult<ChangePlanResult>` (`{ action: "cancel" |
  "changed"; blockReason? }`) to drive cancel-vs-change UI, not a redirect. Page
  gated by `OrgPermissionGate` `organization:["update"]`.

## Stripe webhook

Point the Stripe Dashboard endpoint at
**`${NEXT_PUBLIC_APP_URL}/api/auth/stripe/webhook`**. There is **no dedicated
webhook route file** — the plugin mounts it under the Better Auth catch-all
`apps/web/app/api/auth/[...all]/route.ts` (`toNextJsHandler(auth)`). The plugin does
signature verification and event dispatch; the repo's custom side-effects
(subscription emails, idempotency) live in `packages/auth/stripe-hooks.ts`.

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRO_PRICE_ID_{MONTHLY,ANNUAL}`,
`STRIPE_ENTERPRISE_PRICE_ID_{MONTHLY,ANNUAL}` (`apps/web/.env.example`).

## Gotchas

- **Upgrading an org that already has an active subscription never reaches Stripe
  Checkout.** With this repo's plan shape (single price, no seats/line-items),
  `@better-auth/stripe` routes it to the customer portal's
  `subscription_update_confirm` flow; the `successUrl`/`cancelUrl` passed by
  `upgradeSubscriptionAction` are ignored (user returns via `returnUrl`). Charge
  timing is controlled by the **Stripe portal configuration**, not repo code:
  `features.subscription_update.proration_behavior` must be `always_invoice` so the
  prorated true-up is charged at confirm time — the default (`create_prorations`)
  silently defers it to the next cycle. The plugin's per-plan `prorationBehavior`
  option is dead code for this plan shape. This is per-Stripe-account config
  (API-only, not in the Dashboard portal settings UI); re-apply it on any new or
  live-mode account via `POST /v1/billing_portal/configurations/:id` on the default
  configuration.
- The webhook path is **`/api/auth/stripe/webhook`** (Better Auth catch-all). Do not invent a `/api/stripe/webhook` route.
- Plugin is **conditional** — miss `STRIPE_WEBHOOK_SECRET` and all billing endpoints
  silently 404.
- Don't add `hasOrgPermission` before the thin `auth.api.*` wrappers
  (`upgradeSubscriptionAction`, `openBillingPortalAction`,
  `cancelSubscriptionAction`) — `authorizeReference` already enforces owner/admin.
  **`changePlanAction` is the exception**: it gates with `hasOrgPermission(orgId, {
  organization: ["update"] })` because it does authorization-sensitive pre-work
  (`guardDowngrade`, member/storage reads) and can return early (cancel / blocked)
  *without* ever reaching `auth.api.*`. No separate session-existence guard is
  needed there — `hasOrgPermission` throws `UNAUTHORIZED` when unauthenticated.
- Edit plans in `packages/auth/plans.ts` — the single source of truth for tiers and
  tier math.
- **Seat limits are not checked in the web app.** `maxMembers` is enforced once, by
  the organization plugin's `membershipLimit` callback
  (`packages/auth/membership-limit.ts`) when an invitation is accepted or a member is
  added; invitations can always be sent. Details in `saasprokit:auth`.

See `saasprokit:auth`, `saasprokit:data-access`, `saasprokit:env-setup`.
