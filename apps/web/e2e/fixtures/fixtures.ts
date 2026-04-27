import { test as base, expect, type Page } from "@playwright/test";
import { localePath, orgPath, TEST_CONFIG } from "./test-config";

/**
 * Custom test fixtures for E2E tests.
 * - `authenticatedPage`: A page with stored auth state (logged in).
 * - `orgPage`: A page with auth state, navigated to org context.
 */
export const test = base.extend<{
  authenticatedPage: Page;
  orgPage: Page;
}>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  orgPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect, localePath, orgPath, TEST_CONFIG };
