/**
 * Playwright global setup — runs once before all tests.
 *
 * - Checks database health
 * - Checks Maildev availability
 * - Clears Maildev inbox for a clean test run
 */

import { clearInbox, isMaildevAvailable } from "../helpers/maildev";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function globalSetup() {
  // 1. Check database health
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const health = await res.json();
    if (health?.checks?.database?.status === "ok") {
      console.log("✓ Database is healthy");
    } else {
      console.warn("⚠️  Database is not healthy — some tests may fail");
    }
  } catch {
    console.warn("⚠️  Could not reach /api/health — is the dev server running?");
  }

  // 2. Check Maildev and clear inbox
  const maildevUp = await isMaildevAvailable();
  if (maildevUp) {
    await clearInbox();
    console.log("✓ Maildev is running — inbox cleared");
  } else {
    console.warn(
      "⚠️  Maildev not available at http://localhost:1080 — email-dependent tests will fail.\n" +
        "   Start it with: docker compose up maildev -d"
    );
  }
}

export default globalSetup;
