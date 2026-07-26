import { test as setup } from "@playwright/test";

import { TEST_CONFIG } from "../fixtures/test-config";
import { ensureVerifiedUser } from "../helpers/test-user";

const STORAGE_STATE_PATH = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const healthRes = await page.request.get("/api/health");
  const health = await healthRes.json().catch(() => null);
  const dbHealthy = health?.checks?.database?.status === "ok";

  if (!dbHealthy) {
    setup.skip(true, "Database not available — cannot authenticate");
    return;
  }

  const { verified } = await ensureVerifiedUser(page.request, TEST_CONFIG.user);
  if (!verified) {
    throw new Error(
      "Could not verify the E2E test user — is Maildev running? (docker-compose.e2e.yml)"
    );
  }

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
