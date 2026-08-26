# SaaSProKit

**Production-grade Next.js 16 SaaS monorepo with multi-organization support.**

## Overview

A multi-organization SaaS dashboard built with Next.js 16, pnpm workspaces, and Turborepo. Features Better Auth for authentication, Prisma ORM with PostgreSQL (Neon), Stripe integration for billing, multi-language support, and international routing.

## Tech Stack

- **Framework** — Next.js 16 (App Router, Server Components)
- **Auth & Billing** — Better Auth (email/password, social, magic links, 2FA) + Stripe subscription billing per organization
- **Database** — Prisma ORM + PostgreSQL (Neon)
- **UI** — shadcn/ui + Radix + Tailwind CSS 4
- **Forms & Tables** — React Hook Form + Zod, TanStack Table + nuqs URL state
- **Email** — React Email + Resend
- **Testing** — Vitest (unit) + Playwright (E2E)
- **Tooling** — Biome (via ultracite), pnpm workspaces + Turborepo

## Structure

```
saasprokit/
├── apps/
│   ├── web/        # Main SaaS application (port 3000)
│   ├── docs/       # Your product's docs — empty Fumadocs starter (port 3004)
│   ├── email/      # Email template previews (port 3003)
│   ├── storybook/  # Component library (port 6006)
│   └── studio/     # Prisma Studio (port 3005)
├── docs/           # SaaSProKit's own documentation (port 3006)
└── packages/
    ├── auth/              # Better Auth config + dual RBAC + Stripe billing
    ├── database/          # Prisma schema + client
    ├── design-system/     # shadcn/ui components
    ├── email/             # React Email templates + Resend
    ├── internationalization/  # i18n support
    ├── utils/             # Shared utilities
    ├── logger/            # Structured logging (Pino)
    ├── seo/               # Metadata + sitemaps
    ├── storage/           # File uploads
    └── typescript-config/ # Shared TypeScript configs
```

## Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- pnpm 10+
- PostgreSQL database (Neon recommended)
- Stripe CLI (for local webhook testing)

### Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Initialize the project: `pnpm run setup` — interactive CLI that names the app, prunes to your deploy target, and generates `apps/web/.env.local` + `packages/database/.env` (manual alternative: copy the two `.env.example` files yourself, then fill in `DATABASE_URL` in both and generate `BETTER_AUTH_SECRET` with `openssl rand -base64 48`)
4. Start local infra: `docker compose up postgres maildev`
5. Push the schema: `pnpm migrate`
6. Seed dev data: `pnpm --filter @repo/database db:seed` — wipes existing rows in every table, then creates `admin@example.com` / `Password@saaspro`
7. Start development: `pnpm dev`
8. (Optional) Install AI coding-assistant skills: `pnpm skills:install` — requires `git`; not run automatically on `pnpm install`

### Development

```bash
pnpm dev                      # All apps except kit-docs (main app: 3000)
pnpm --filter app dev         # Main app only (port 3000)
pnpm check                    # Lint (Biome via ultracite)
pnpm test                     # Unit tests (Vitest)
pnpm --filter app test:e2e    # E2E tests (Playwright)
pnpm build                    # Build all apps except kit-docs
```

## License

Commercial license — see [LICENSE.md](LICENSE.md). All rights reserved.
