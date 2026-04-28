import { test, expect, TEST_CONFIG, localePath, orgPath } from "../fixtures/fixtures";

test.describe("14 - Organization Dashboard", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/"));
  });

  // ─── UI Tests ───────────────────────────────────────────────────────────────

  test.describe("Page Display", () => {
    test("TC-14-01: dashboard loads with org name", async ({ page }) => {
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText(/organization dashboard/i).first()).toBeVisible();
    });

    test("TC-14-02: members stat card visible", async ({ page }) => {
      await expect(page.getByText(/members/i).first()).toBeVisible();
    });

    test("TC-14-03: your role card visible", async ({ page }) => {
      await expect(page.getByText(/your role/i).first()).toBeVisible();
    });

    test("TC-14-04: slug card shows org slug", async ({ page }) => {
      await expect(page.getByText(TEST_CONFIG.org.slug, { exact: true })).toBeVisible();
    });

    test("TC-14-05: created card visible", async ({ page }) => {
      await expect(page.getByText(/created/i).first()).toBeVisible();
    });
  });

  test.describe("Info Cards", () => {
    test("TC-14-06: quick actions card renders", async ({ page }) => {
      await expect(page.getByText(/quick actions/i).first()).toBeVisible();
    });

    test("TC-14-07: recent activity card renders", async ({ page }) => {
      await expect(page.getByText(/recent activity/i).first()).toBeVisible();
    });
  });

  test.describe("Layout", () => {
    test("TC-14-08: stat cards in grid on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const cards = page.locator("[data-slot='card'], [class*='card']");
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Functional Tests ──────────────────────────────────────────────────────

  test.describe("Navigation to Dashboard", () => {
    test("TC-14-09: navigating to org dashboard displays org name", async ({ page }) => {
      // The h1 should contain the organization name from the DB
      const heading = page.locator("h1");
      await expect(heading).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
      // Verify the heading is not empty (org name is rendered)
      const headingText = await heading.textContent();
      expect(headingText).toBeTruthy();
      expect(headingText!.trim().length).toBeGreaterThan(0);

      // The subtitle should confirm we're on the org dashboard
      await expect(page.getByText("Organization Dashboard")).toBeVisible();
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("TC-14-10: clicking Members link navigates to members page", async ({ page }) => {
      // Find the Members link in the sidebar and click it
      const sidebar = page.locator("aside, [data-sidebar]").first();
      const membersLink = sidebar.getByRole("link", { name: /members/i });
      await expect(membersLink).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
      await membersLink.click();

      // Verify navigation to members page
      await page.waitForURL(`**/${TEST_CONFIG.org.slug}/members`, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
      await expect(page).toHaveURL(new RegExp(`/${TEST_CONFIG.org.slug}/members`));
    });

    test("TC-14-11: clicking Settings link navigates to settings page", async ({ page }) => {
      const sidebar = page.locator("aside, [data-sidebar]").first();
      const settingsLink = sidebar.getByRole("link", { name: /settings/i });
      await expect(settingsLink).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
      await settingsLink.click();

      await page.waitForURL(`**/${TEST_CONFIG.org.slug}/settings`, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
      await expect(page).toHaveURL(new RegExp(`/${TEST_CONFIG.org.slug}/settings`));
    });

    test("TC-14-12: clicking Billing link navigates to billing page", async ({ page }) => {
      const sidebar = page.locator("aside, [data-sidebar]").first();
      const billingLink = sidebar.getByRole("link", { name: /billing/i });

      // Billing is only visible if user has org update permission (owner/admin)
      // If not visible, skip the test gracefully
      const isVisible = await billingLink.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip(true, "Billing link not visible — user may not have billing permission");
        return;
      }

      await billingLink.click();

      await page.waitForURL(`**/${TEST_CONFIG.org.slug}/billing`, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
      await expect(page).toHaveURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`));
    });

    test("TC-14-13: clicking Dashboard link returns to org dashboard", async ({ page }) => {
      // First navigate away (to settings)
      const sidebar = page.locator("aside, [data-sidebar]").first();
      const settingsLink = sidebar.getByRole("link", { name: /settings/i });
      await settingsLink.click();
      await page.waitForURL(`**/${TEST_CONFIG.org.slug}/settings`, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Now click Dashboard to go back
      const dashboardLink = sidebar.getByRole("link", { name: /dashboard/i });
      await expect(dashboardLink).toBeVisible();
      await dashboardLink.click();

      // Should be back on the org root page
      await expect(page.locator("h1")).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
      await expect(page.getByText("Organization Dashboard")).toBeVisible();
    });
  });
});

// ─── Auth Guard Tests (no storageState) ─────────────────────────────────────

test.describe("14 - Organization Dashboard (Unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-14-14: unauthenticated access redirects to sign-in", async ({ page }) => {
    await page.goto(orgPath("/"));

    // Should redirect to the sign-in page
    await page.waitForURL(/\/auth\/sign-in|\/sign-in/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    await expect(page).toHaveURL(/\/auth\/sign-in|\/sign-in/);
  });
});
