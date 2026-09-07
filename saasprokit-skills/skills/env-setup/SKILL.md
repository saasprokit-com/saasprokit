---
name: env-setup
description: Use when setting up this repo locally, adding or debugging an env var, or starting Postgres/MailDev. Covers the two required .env files, the real pnpm scripts, Docker Compose services, and local email catching.
---

# Environment Setup

After `pnpm install` (the CLI is built by devDependencies, so a cold clone
must install first), `pnpm run setup` generates `apps/web/.env.local` and
`packages/database/.env` interactively (project name, deploy target, dev env
prompts) — the manual steps below remain for reference and for adjusting
values later.

Two `.env` files are **both** required — the Prisma CLI loads its own env in a
separate process from the Next app, so `DATABASE_URL` must exist in both places.

| File | Copy from | Loaded by |
| --- | --- | --- |
| `apps/web/.env.local` | `apps/web/.env.example` (28 vars) | the Next.js app (`turbo dev` / build) |
| `packages/database/.env` | `packages/database/.env.example` — `DATABASE_URL` plus optional `DIRECT_URL` | Prisma CLI: `pnpm migrate`, `pnpm --filter @repo/database studio`, `… db:seed` |

Per-package `.env.example` files also exist as reference for their var families
(`packages/auth`, `packages/storage`, `packages/email`); the web app consolidates all
of them into `apps/web/.env.local`.

## Variable families (`apps/web/.env.example`)

Optional vars ship **commented out** — uncomment rather than adding new lines.

- **App** (required): `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`,
  `NEXT_PUBLIC_DOCS_URL`
- **Database** (required): `DATABASE_URL` — default
  `postgresql://dev:dev@localhost:5432/saasprokit_dev` matches the Docker postgres.
  Optional `DIRECT_URL` — non-pooled endpoint for the Prisma CLI when
  `DATABASE_URL` is pooled (e.g. Neon `-pooler`).
- **Better Auth** (required): `BETTER_AUTH_SECRET` (generate `openssl rand -base64
  48`), `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`. Optional `ADMIN_EMAILS` —
  comma-separated emails promoted to platform admin at signup (first-admin bootstrap
  for production; dev uses the seeded `admin@example.com`).
- **OAuth** (optional): `GOOGLE_CLIENT_ID`/`_SECRET`, `GITHUB_CLIENT_ID`/`_SECRET`
- **Stripe** (optional in dev): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_{PRO,ENTERPRISE}_PRICE_ID_{MONTHLY,ANNUAL}`
- **Email**: `EMAIL_FROM`, `RESEND_API_KEY` (prod), `SMTP_*` (dev — defaults to
  MailDev on `localhost:1025`); `EMAIL_PROVIDER` is auto-detected (prod +
  `RESEND_API_KEY` → resend, else nodemailer) and only needs setting to override.
- **Storage**: `STORAGE_PROVIDER` (`local` default / `s3`), `STORAGE_LOCAL_PATH`,
  `STORAGE_BASE_URL`; for s3: `AWS_ACCESS_KEY_ID`/`_SECRET_ACCESS_KEY`,
  `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_S3_ENDPOINT` (S3-compatible stores like R2 —
  then `AWS_S3_PUBLIC_URL` is required for public uploads),
  `AWS_S3_SIGNED_URL_EXPIRES`
- **Optional tunables** (commented, defaults shown): `MAX_ORGS_PER_USER`,
  `ALLOWED_ORIGINS`, `HEALTH_CHECK_TIMEOUT_MS`, `ORG_QUERY_TIMEOUT_MS`

## Database schema

`pnpm migrate` = `cd packages/database && npx prisma format && npx prisma generate
&& npx prisma db push`. It reads `packages/database/.env`, **not**
`apps/web/.env.local`. There is **no** `predev`/bootstrap step — `pnpm dev` is
exactly `turbo dev` and does **not** start Postgres or MailDev.

`pnpm migrate` leaves the database empty. Seed dev data (users incl.
`admin@example.com` / `Password@saaspro`, orgs, subscriptions) with
`pnpm --filter @repo/database db:seed`.

## Local infrastructure (Docker Compose)

Start infra **manually** before `pnpm dev` — nothing does it for you.

```bash
docker compose up postgres maildev              # just the infra the app needs (recommended)
docker compose up                               # full stack: + web/docs/email/storybook/studio
docker compose -f docker-compose.e2e.yml up     # isolated E2E stack
```

`docker-compose.yml` services and ports: `postgres` (5432), `maildev` (SMTP 1025,
UI 1080), `web` (3000), `docs` (3004), `email` (3003), `storybook` (6006), `studio`
(3005). The `web` / `studio` containers override `DATABASE_URL` to the container
host `postgres:5432`. The `docs` service is `apps/docs` — the customer's own,
empty-by-default docs site (port 3004).

`docker-compose.e2e.yml` runs an isolated `e2e-postgres` on **5433** (→5432, tmpfs,
no persistent volume) plus a `maildev` service, to avoid clashing with the dev
Postgres on 5432.

## MailDev

MailDev catches local outbound mail so email flows (password reset, magic link,
verify email) work without Resend — keep `SMTP_HOST=localhost` / `SMTP_PORT=1025`
(the `.env.example` defaults). Read caught mail at http://localhost:1080.

See `saasprokit:billing`, `saasprokit:testing`, `saasprokit:data-access`.
