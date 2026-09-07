#!/bin/sh
set -e

# Refresh pnpm workspace symlinks.
# The volume mount (host source → /app) overwrites the file tree that was
# present at build time, so workspace symlinks in node_modules may be stale.
# Running pnpm install again resolves this efficiently — pnpm detects that
# packages are already in the store and only recreates the symlinks.
echo "[entrypoint] Refreshing workspace symlinks..."
CI=true pnpm install --frozen-lockfile 2>/dev/null || CI=true pnpm install

# Only run migrations + seed for services that need the database (web, studio)
if echo "$@" | grep -qE -- '--filter (web|studio)'; then
  echo "[entrypoint] Generating Prisma client..."
  # NODE_TLS_REJECT_UNAUTHORIZED=0 works around SSL issues in Docker networking
  # when Prisma downloads engine binaries (local dev only)
  NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm --filter database build

  echo "[entrypoint] Waiting for database..."
  # prisma db push will fail if DB isn't ready, so we retry
  until NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm --filter database db:push; do
    echo "[entrypoint] Database not ready, retrying in 2s..."
    sleep 2
  done

  echo "[entrypoint] Running database seed..."
  pnpm --filter database db:seed || echo "[entrypoint] Seed skipped (may already be seeded)"
fi

# Execute the command passed via docker-compose (e.g., pnpm --filter web dev)
exec "$@"
