import { writeFileSync } from "node:fs";

import { test as setup } from "@playwright/test";

import { localePath, TEST_CONFIG } from "../fixtures/test-config";

const ORG_SLUG_PATH = "e2e/.auth/org-slug.txt";
const NEW_ORG_RE = /\/new-org/;
const ORG_SLUG_RE = /^\/([a-z0-9-]+)\/?$/;
const ORG_SLUG_LOCALE_RE = /\/en\/([a-z0-9-]+)/;
const CREATE_RE = /create/i;

setup("create organization", async ({ page }) => {
  // Check if the database is healthy before attempting org setup
  const healthRes = await page.request.get("/api/health");
  const health = await healthRes.json().catch(() => null);
  const dbHealthy = health?.checks?.database?.status === "ok";

  if (!dbHealthy) {
    setup.skip(true, "Database not available — cannot create organization");
    return;
  }

  // Navigate to org selection — will redirect to default org or new-org page
  await page.goto(localePath("/org"));

  // Wait for any navigation to complete (org dashboard, new-org page, or auth redirect)
  await page.waitForLoadState("networkidle");

  const currentPath = new URL(page.url()).pathname;

  // If we're on an auth page, auth setup didn't work — skip
  if (currentPath.includes("/auth/")) {
    setup.skip(true, "Not authenticated — cannot create organization");
    return;
  }

  // If we're on the new-org page, create the org
  if (currentPath.includes("/account/new-org")) {
    await page.locator("input").first().fill(TEST_CONFIG.org.name);
    await page.getByRole("button", { name: CREATE_RE }).click();
    await page.waitForURL((url) => !NEW_ORG_RE.test(url.pathname), {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
  }

  // Extract the org slug from the final URL.
  // With rewriteDefault, URLs are /<orgSlug> or /en/<orgSlug> (non-default locale).
  const finalPath = new URL(page.url()).pathname;
  // Try without locale prefix first, then with
  const slugMatch =
    finalPath.match(ORG_SLUG_RE) || finalPath.match(ORG_SLUG_LOCALE_RE);
  const orgSlug = slugMatch?.[1];
  const reserved = new Set(["account", "org", "auth", "api", "en"]);

  if (orgSlug && !reserved.has(orgSlug)) {
    writeFileSync(ORG_SLUG_PATH, orgSlug);
  }
});
