# =============================================================================
# Production Dockerfile for the web app (Next.js 16 SaaS dashboard)
# Uses multi-stage builds with turbo prune for minimal Docker context
#
# Build:
#   docker build -f apps/web/Dockerfile -t saasprokit-web:latest .
#
# Build with public env vars:
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_APP_URL=https://app.example.com \
#     --build-arg NEXT_PUBLIC_DOCS_URL=https://docs.example.com \
#     -t saasprokit-web:latest .
#
# Run:
#   docker run -p 3000:3000 --env-file .env saasprokit-web:latest
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: base — Node.js + pnpm setup
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: pruner — Create minimal monorepo subset via turbo prune
# ---------------------------------------------------------------------------
FROM base AS pruner

RUN pnpm add -g turbo@^2
COPY . .

# Turbo 2.x positional syntax: turbo prune <package> --docker
RUN turbo prune web --docker

# ---------------------------------------------------------------------------
# Stage 3: builder — Install dependencies and build
# ---------------------------------------------------------------------------
FROM base AS builder

# Copy pruned package.json files + lockfile (cached layer — only busts on dep changes)
COPY --from=pruner /app/out/json/ .

# Install dependencies with BuildKit cache mount for pnpm store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy full source code (busts cache on any source change)
COPY --from=pruner /app/out/full/ .

# Build-time args for NEXT_PUBLIC_* variables (non-sensitive, baked into client bundle)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_DOCS_URL

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL

# Generate Prisma client + build Next.js app
# turbo handles the dependency graph: prisma generate → next build
RUN pnpm build --filter=web

# ---------------------------------------------------------------------------
# Stage 4: runner — Minimal production image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Install tini for proper PID 1 signal handling
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
WORKDIR /app

# Copy standalone server output
# Next.js standalone output includes server.js and a minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
