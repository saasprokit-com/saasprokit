# =============================================================================
# Production Dockerfile for the SaaSProKit documentation site (Next.js 16 + Fumadocs)
# Uses multi-stage builds with turbo prune for minimal Docker context
#
# Build:
#   docker build -f docs/Dockerfile -t saasprokit-docs:latest .
#
# Run:
#   docker run -p 3006:3006 saasprokit-docs:latest
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
RUN turbo prune kit-docs --docker

# ---------------------------------------------------------------------------
# Stage 3: builder — Install dependencies and build
# ---------------------------------------------------------------------------
FROM base AS builder

# Copy pruned package.json files + lockfile (cached layer — only busts on dep changes)
COPY --from=pruner /app/out/json/ .

# Install dependencies with BuildKit cache mount for pnpm store
# Note: pnpm install triggers the fumadocs-mdx postinstall script,
# which generates type definitions required by the build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy full source code (busts cache on any source change)
COPY --from=pruner /app/out/full/ .

# Build Next.js kit-docs app (do not use `pnpm build --filter=kit-docs` —
# the root `build` script already passes `--filter=!kit-docs`, so that
# combination matches zero packages).
RUN pnpm --filter kit-docs build

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
COPY --from=builder --chown=nextjs:nodejs /app/docs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/docs/.next/static ./docs/.next/static

USER nextjs

ENV HOSTNAME=0.0.0.0
ENV PORT=3006
EXPOSE 3006

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "docs/server.js"]
