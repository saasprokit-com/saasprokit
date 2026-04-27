#!/usr/bin/env bash
#
# Local E2E test runner.
#
# Starts a dedicated E2E database (port 5433) + Maildev,
# seeds the database, and runs Playwright tests.
#
# This script temporarily moves .env.local out of the way so
# Next.js reads the E2E environment variables from the shell.
#
# Usage:
#   ./scripts/e2e-local.sh          # Run all E2E tests
#   ./scripts/e2e-local.sh --ui     # Run with Playwright UI
#   ./scripts/e2e-local.sh --headed # Run in headed browser mode
#
# Prerequisites:
#   - Docker running
#   - pnpm install done
#   - Playwright browsers installed (npx playwright install chromium)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.e2e.yml"

E2E_DATABASE_URL="postgresql://e2euser:e2epass@localhost:5433/e2edb"
ENV_LOCAL="$APP_DIR/.env.local"
ENV_LOCAL_BAK="$APP_DIR/.env.local.bak"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }

# Restore .env.local on exit (always)
restore_env() {
  if [ -f "$ENV_LOCAL_BAK" ]; then
    mv "$ENV_LOCAL_BAK" "$ENV_LOCAL"
    info "Restored .env.local"
  fi
}
trap restore_env EXIT

# ─── 1. Start E2E services ─────────────────────────────────────────────

echo "Starting E2E services..."
docker compose -f "$COMPOSE_FILE" up -d --wait

info "E2E Postgres running on port 5433"
info "Maildev running on port 1080 (UI) / 1025 (SMTP)"

# ─── 2. Push schema & seed ─────────────────────────────────────────────

echo "Pushing database schema..."
DATABASE_URL="$E2E_DATABASE_URL" pnpm --filter @repo/database exec prisma db push 2>&1

echo "Seeding database..."
DATABASE_URL="$E2E_DATABASE_URL" pnpm --filter @repo/database exec prisma db seed 2>&1

info "Database seeded"

# ─── 3. Swap .env.local ────────────────────────────────────────────────

if [ -f "$ENV_LOCAL" ]; then
  mv "$ENV_LOCAL" "$ENV_LOCAL_BAK"
  warn "Moved .env.local → .env.local.bak (restored on exit)"
fi

# ─── 4. Kill any existing dev server ───────────────────────────────────

lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# ─── 5. Run Playwright ─────────────────────────────────────────────────

echo "Running E2E tests..."
cd "$APP_DIR"
DATABASE_URL="$E2E_DATABASE_URL" \
BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-e2e-test-secret-at-least-32-chars-long}" \
BETTER_AUTH_URL="http://localhost:3000" \
NEXT_PUBLIC_APP_URL="http://localhost:3000" \
NEXT_PUBLIC_APP_NAME="SaaSProKit" \
EMAIL_FROM="noreply@test.com" \
SMTP_HOST="localhost" \
SMTP_PORT="1025" \
MAILDEV_URL="http://localhost:1080" \
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_stub}" \
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_stub}" \
STORAGE_PROVIDER="local" \
  npx playwright test "$@"

info "E2E tests complete"
