---
name: env-setup
description: Local environment setup for this monorepo — the two required .env files (apps/web/.env.local and packages/database/.env for the Prisma CLI), the real pnpm scripts, Docker Compose services (postgres, maildev), and MailDev email catching. Read when setting up the repo, debugging env/config, or adding an env var.
---

# Environment Setup

Two `.env` files are **both** required — the Prisma CLI loads its own env in a
separate process from the Next app, so `DATABASE_URL` must exist in both places.

| File | Copy from | Loaded by |
| --- | --- | --- |
| `apps/web/.env.local` | `apps/web/.env.example` (~28 vars) | the Next.js app (`turbo dev` / build) |
| `packages/database/.env` | `packages/database/.env.example` — one var, `DATABASE_URL` (`packages/database/.env.example:1`) | Prisma CLI: `pnpm migrate`, `pnpm --filter @repo/database studio`, `... db:seed` |

Per-package `.env.example` files also exist as reference for their var families
(`packages/auth`, `packages/storage`, `packages/email`); the web app
consolidates all of them into `apps/web/.env.local`.

## Variable families (apps/web/.env.example)

- **App** (required): `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_DOCS_URL`
- **Database** (required): `DATABASE_URL` — default `postgresql://dev:dev@localhost:5432/saasprokit_dev` matches the Docker postgres (`docker-compose.yml:20-28`)
- **Better Auth** (required): `BETTER_AUTH_SECRET` (generate `openssl rand -base64 48`), `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`; optional `ADMIN_EMAILS` — comma-separated emails promoted to platform admin at signup (first-admin bootstrap for production; dev uses the seeded `admin@example.com`)
- **OAuth** (optional): `GOOGLE_CLIENT_ID`/`_SECRET`, `GITHUB_CLIENT_ID`/`_SECRET`
- **Stripe** (optional in dev): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_{PRO,ENTERPRISE}_PRICE_ID_{MONTHLY,ANNUAL}`
- **Email**: `EMAIL_FROM`, `RESEND_API_KEY` (prod), `SMTP_*` (dev — defaults to MailDev on `localhost:1025`); `EMAIL_PROVIDER` auto-detected (prod + `RESEND_API_KEY` → resend, else nodemailer)
- **Storage**: `STORAGE_PROVIDER` (`local` default / `s3`), `STORAGE_LOCAL_PATH`, `STORAGE_BASE_URL`, `AWS_*` (for s3)
- **Optional tunables** (commented, defaults shown): `MAX_ORGS_PER_USER`, `ALLOWED_ORIGINS`, `HEALTH_CHECK_TIMEOUT_MS`, `ORG_QUERY_TIMEOUT_MS`

## Database schema

`pnpm migrate` (`package.json:21`) = `cd packages/database && npx prisma format
&& npx prisma generate && npx prisma db push`. It reads `packages/database/.env`,
not `apps/web/.env.local`. There is **no** `predev`/bootstrap step — `pnpm dev`
is exactly `turbo dev` (`package.json:12`) and does **not** start Postgres or
MailDev.

## Local Infrastructure (Docker Compose)

Start infra **manually** before `pnpm dev` — nothing does it for you. (The
`dev:infra` / `dev:infra:stop` scripts referenced by older docs do **not**
exist anywhere in the repo.)

```bash
docker compose up postgres maildev              # just the infra the app needs (recommended)
docker compose up                               # full stack: + web/docs/email/storybook/studio
docker compose -f docker-compose.e2e.yml up     # isolated E2E stack
```

`docker-compose.yml` services and ports: `postgres` (5432), `maildev` (SMTP
1025, UI 1080), `web` (3000), `docs` (3004), `email` (3003), `storybook`
(6006), `studio` (3005). The `web` / `studio` containers override
`DATABASE_URL` to the container host `postgres:5432`
(`docker-compose.yml:77,137`).

`docker-compose.e2e.yml` runs an isolated `e2e-postgres` on **5433** (→5432,
tmpfs, no persistent volume) plus `e2e-maildev`, to avoid clashing with the dev
Postgres on 5432.

## MailDev

MailDev catches local outbound mail so email flows (password reset, magic link,
verify email) work without Resend — keep `SMTP_HOST=localhost` /
`SMTP_PORT=1025` (the `.env.example` defaults). Read caught mail at the web UI
on http://localhost:1080. The container healthcheck currently probes
`http://localhost:1080` (`docker-compose.yml:52`, `docker-compose.e2e.yml:41`);
if it flaps because the UI binds IPv4-only while `localhost` resolves to `::1`
in the container, switch that probe to `127.0.0.1`.

See saasprokit:billing, saasprokit:testing, saasprokit:data-access.
