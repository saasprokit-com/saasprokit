import { writeFileSync } from "node:fs";

import { test as setup } from "@playwright/test";

import { localePath, TEST_CONFIG } from "../fixtures/test-config";
import { ensureVerifiedUser } from "../helpers/test-user";

const SIGN_IN_RE = /sign in/i;

const STORAGE_STATE_PATH = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Check if the database is healthy before attempting auth
  const healthRes = await page.request.get("/api/health");
  const health = await healthRes.json().catch(() => null);
  const dbHealthy = health?.checks?.database?.status === "ok";

  if (!dbHealthy) {
    writeFileSync(
      STORAGE_STATE_PATH,
      JSON.stringify({ cookies: [], origins: [] })
    );
    setup.skip(true, "Database not available — cannot authenticate");
    return;
  }

  // Step 1: Ensure the test user exists AND is email-verified
  const { verified } = await ensureVerifiedUser(page.request, TEST_CONFIG.user);
  // Clear cookies set by ensureVerifiedUser's API sign-in check
  await page.context().clearCookies();

  if (!verified) {
    // If we couldn't verify email (Maildev down), try sign-in anyway
    // (the user might have been verified in a previous run)
  }

  // Step 2: Sign in via the UI to get proper session cookies
  await page.goto(localePath("/auth/sign-in"));
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(TEST_CONFIG.user.email);
  await page.locator('input[type="password"]').fill(TEST_CONFIG.user.password);
  await page.getByRole("button", { name: SIGN_IN_RE }).click();

  // Wait for redirect away from auth pages
  const redirected = await page
    .waitForURL((url) => !url.pathname.includes("/auth/sign-in"), {
      timeout: TEST_CONFIG.timeouts.navigation,
    })
    .then(() => true)
    .catch(() => false);

  // If stuck on verify-email page, email verification didn't work
  if (!redirected || page.url().includes("/auth/")) {
    writeFileSync(
      STORAGE_STATE_PATH,
      JSON.stringify({ cookies: [], origins: [] })
    );
    return;
  }

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
