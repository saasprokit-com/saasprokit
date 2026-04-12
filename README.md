# SaaSProKit

**Production-grade Next.js 16 SaaS monorepo with multi-organization support.**

## Overview

A multi-organization SaaS dashboard built with Next.js 16, pnpm workspaces, and Turborepo. Features Better Auth for authentication, Prisma ORM with PostgreSQL (Neon), Stripe integration for billing, multi-language support, and international routing.

## Tech Stack

- **Framework** — Next.js 16 (App Router, Server Components)
- **Auth** — Better Auth (email/password, social, magic links, 2FA)
- **Database** — Prisma ORM + PostgreSQL (Neon)
- **Payments** — Stripe (subscription billing per organization)
- **UI** — shadcn/ui + Radix + Tailwind CSS
- **Email** — React Email + Resend
- **Monorepo** — pnpm workspaces + Turborepo

## Structure

```
saasprokit/
├── apps/
│   ├── web/        # Main SaaS application (port 3000)
│   ├── docs/       # Documentation site (port 3004)
│   ├── email/      # Email template previews (port 3003)
│   ├── storybook/  # Component library (port 6006)
│   └── studio/     # Prisma Studio (port 3005)
└── packages/
    ├── auth/              # Better Auth config + RBAC
    ├── database/          # Prisma schema + client
    ├── design-system/     # shadcn/ui components
    ├── payment/           # Stripe integration
    ├── internationalization/  # i18n support
    ├── utils/             # Shared utilities
    ├── logger/            # Structured logging (Pino)
    ├── seo/               # Metadata + sitemaps
    └── storage/           # File uploads
```

## Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- pnpm 10+
- PostgreSQL database (Neon recommended)
- Stripe CLI (for local webhook testing)

### Setup

1. Clone the repository
2. Copy environment variables: `cp apps/web/.env.example apps/web/.env.local`
3. Set `DATABASE_URL` in `packages/database/.env`
4. Install dependencies: `pnpm install`
5. Run database migrations: `pnpm migrate`
6. Start development: `pnpm dev`

### Development

```bash
pnpm dev                      # All apps
pnpm --filter web dev         # Main app only (port 3000)
pnpm check                    # Lint (Biome via ultracite)
pnpm test                     # Unit tests (Vitest)
pnpm --filter web test:e2e    # E2E tests (Playwright)
pnpm build                    # Build all
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## License

MIT
