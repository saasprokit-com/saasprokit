import { clearInbox, isMaildevAvailable } from "../helpers/maildev";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function globalSetup() {
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

  const maildevUp = await isMaildevAvailable();
  if (maildevUp) {
    await clearInbox();
    console.log("✓ Maildev is running — inbox cleared");
  } else if (process.env.CI) {
    // Locally a missing Maildev only skips the email specs, which is a fair
    // trade. In CI that silence is the bug: the specs skip, auth setup fails
    // for an unrelated-looking reason, and the run still reports "5 skipped".
    throw new Error(
      `Maildev is not reachable at ${process.env.MAILDEV_URL || "http://localhost:1080"}/api/email. ` +
        "Email-dependent specs would skip silently and auth setup would fail. " +
        "Check the Maildev image version — the REST API moved to /api/email in v3."
    );
  } else {
    console.warn(
      "⚠️  Maildev not available at http://localhost:1080 — email-dependent tests will fail.\n" +
        "   Start it with: docker compose up maildev -d"
    );
  }
}

export default globalSetup;
