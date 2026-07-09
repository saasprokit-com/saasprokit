---
name: project-env-setup
description: Local environment setup for this repo — required env vars in apps/web/.env.local, Docker Compose services, and MailDev for local email. Read when setting up the project, debugging env/config issues, or adding new environment variables.
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

## Local Infrastructure (Docker Compose)

```bash
docker compose up postgres maildev   # DB + mail catcher only (recommended for app dev)
docker compose up                    # Full stack: web/docs/email/storybook/studio + deps
docker compose -f docker-compose.e2e.yml up    # E2E test environment
```

MailDev catches outbound mail locally so flows like password reset and magic links work without Resend.
