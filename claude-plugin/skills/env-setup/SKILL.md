---
name: env-setup
description: Local environment setup for this repo — required env vars in apps/web/.env.local and packages/database/.env, Docker Compose services, and MailDev for local email. Read when setting up the project, debugging env/config issues, or adding new environment variables.
---

# Environment Setup

## Environment Variables

Create `.env.local` in `apps/web/` (see `.env.example` for complete list):

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRO_PRICE_ID_MONTHLY=...
STRIPE_PRO_PRICE_ID_ANNUAL=...
STRIPE_ENTERPRISE_PRICE_ID_MONTHLY=...
STRIPE_ENTERPRISE_PRICE_ID_ANNUAL=...
RESEND_API_KEY=...
EMAIL_FROM=noreply@yourdomain.com
STORAGE_PROVIDER=local
```

Also create `.env` in `packages/database/` (see `.env.example`) with a matching `DATABASE_URL`:

```
DATABASE_URL=postgresql://...
```

This is required in addition to `apps/web/.env.local`, not instead of it. Prisma CLI commands (`pnpm migrate`, `pnpm --filter database studio`, `pnpm --filter @repo/database db:seed`) run as a separate process from the Next.js app and load their own `.env` from `packages/database/` — they don't inherit `apps/web`'s env loading. This matches next-forge's own convention of keeping a per-package `.env` rather than sharing one file.

## Local Infrastructure (Docker Compose)

```bash
pnpm dev:infra                       # DB + mail catcher, detached, waits for healthchecks (recommended for app dev)
pnpm dev:infra:stop                  # Stop DB + mail catcher
docker compose up                    # Full stack: web/docs/email/storybook/studio + deps
docker compose -f docker-compose.e2e.yml up    # E2E test environment
```

`pnpm dev` runs `dev:infra` first, so the database and mail catcher are healthy before any app starts. If Docker isn't running, `pnpm dev` fails fast — start Docker Desktop, or bypass infra with `pnpm exec turbo dev` (e.g. when using a remote/Neon `DATABASE_URL`).

MailDev catches outbound mail locally so flows like password reset and magic links work without Resend. Its container healthcheck must target `127.0.0.1`, not `localhost` — the web UI binds IPv4-only and `localhost` resolves to `::1` in the container.
