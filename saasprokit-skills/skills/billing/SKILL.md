---
name: billing
description: Billing and payment architecture for this repo — Stripe integration via @better-auth/stripe, subscription plans, org-scoped billing, and webhook configuration. Read before working on checkout, subscriptions, plans, or Stripe webhooks.
---

# Billing & Payment

## Payment Package (`packages/payment`)

- Stripe integration via `@better-auth/stripe` plugin
- Plan configs and utilities in `plans.ts`, constants in `keys.ts`, types in `types.ts`
- Subscription tiers: free, pro, enterprise
- Organization-scoped billing (per-organization subscriptions)

**Organization Billing Page**: `/[locale]/(app)/[orgSlug]/billing/`

## Stripe Webhook

**Stripe Dashboard webhook URL**: point the webhook endpoint at `${NEXT_PUBLIC_APP_URL}/api/auth/stripe/webhook`. Signature verification and event dispatch are handled by `@better-auth/stripe`; custom handlers live in `packages/auth/stripe-hooks.ts`.

Required env vars (see `apps/web/.env.example`):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRO_PRICE_ID_MONTHLY=...
STRIPE_PRO_PRICE_ID_ANNUAL=...
STRIPE_ENTERPRISE_PRICE_ID_MONTHLY=...
STRIPE_ENTERPRISE_PRICE_ID_ANNUAL=...
```

Web-app-side helpers (checkout, portal, subscription) live in `apps/web/lib/billing/`.
