# =============================================================================
# Shared development Dockerfile for all monorepo services
# Installs full workspace dependencies; each service overrides the command
# via docker-compose.
#
# Build context must be the monorepo root.
#
# Usage (via docker-compose):
#   docker compose up web        # starts web dev server
#   docker compose up storybook  # starts storybook dev server
# =============================================================================

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

# Copy package manifests + lockfile for dependency install layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/docs/package.json apps/docs/source.config.ts ./apps/docs/
COPY docs/package.json docs/source.config.ts ./docs/
COPY apps/email/package.json ./apps/email/package.json
COPY apps/storybook/package.json ./apps/storybook/package.json
COPY apps/studio/package.json ./apps/studio/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/email/package.json ./packages/email/package.json
COPY packages/internationalization/package.json ./packages/internationalization/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/seo/package.json ./packages/seo/package.json
COPY packages/storage/package.json ./packages/storage/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

# Install all dependencies (dev + prod)
RUN --mount=type=cache,id=pnpm-dev,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Entrypoint refreshes pnpm workspace symlinks at startup,
# since the volume mount overwrites the build-time file tree
ENTRYPOINT ["/entrypoint.sh"]
