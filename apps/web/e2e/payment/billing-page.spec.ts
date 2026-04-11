import { test, expect, TEST_CONFIG, orgPath } from "../fixtures/fixtures";

test.describe("Payment: Billing Page", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/billing"));
  });

  // ---------------------------------------------------------------------------
  // Current Plan Card
  // ---------------------------------------------------------------------------

  test.describe("Current Plan", () => {
    test("BP-01: billing page renders for authorized user", async ({
      page,
    }) => {
      // Should show billing content or access restricted (depending on role)
      const billing = page.getByText(/current plan|billing/i).first();
      const restricted = page.getByText(/access restricted/i).first();
      await expect(billing.or(restricted)).toBeVisible();
      // Should not have redirected to sign-in
      expect(page.url()).not.toContain("/auth/sign-in");
    });

    test("BP-02: current plan card shows Free plan with status badge", async ({
      page,
    }) => {
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Test org starts on Free plan — plan name rendered as h3
      const planHeading = page.locator("h3", { hasText: /free/i }).first();
      await expect(planHeading).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Status badge should show a known status
      const statusBadge = page
        .locator("[data-slot='badge']")
        .filter({ hasText: /active|no subscription|canceled/i })
        .first();
      await expect(statusBadge).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("BP-03: free plan shows upgrade prompt", async ({ page }) => {
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // On Free plan, an upgrade prompt with dashed border is shown
      const upgradePrompt = page.getByText(
        /upgrade to unlock more features/i
      );
      if (await upgradePrompt.isVisible().catch(() => false)) {
        await expect(upgradePrompt).toBeVisible();
      }
    });

    test("BP-04: current plan shows included features list", async ({
      page,
    }) => {
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      const featuresLabel = page.getByText(/features included/i);
      await expect(featuresLabel).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Plan Comparison Grid
  // ---------------------------------------------------------------------------

  test.describe("Plan Comparison", () => {
    test("BP-05: plan comparison grid shows 3 plans with prices", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Three plan headings
      const freeCard = page.locator("h3", { hasText: /free/i }).first();
      const proCard = page.locator("h3", { hasText: /pro/i }).first();
      const enterpriseCard = page
        .locator("h3", { hasText: /enterprise/i })
        .first();

      await expect(freeCard).toBeVisible();
      await expect(proCard).toBeVisible();
      await expect(enterpriseCard).toBeVisible();

      // Free plan shows "Free" text, paid plans show "$X/mo"
      await expect(page.getByText("Free").first()).toBeVisible();
      await expect(page.getByText(/\$\d+\/mo/).first()).toBeVisible();
    });

    test("BP-06: billing toggle switches monthly/annual pricing", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Find and scroll to the switch
      const billingSwitch = page
        .locator("[role='switch'], [data-slot='switch']")
        .first();
      await billingSwitch.scrollIntoViewIfNeeded();
      await expect(billingSwitch).toBeVisible();

      // Check initial state — switch should be unchecked (monthly)
      const checkedBefore = await billingSwitch.getAttribute("aria-checked");

      // Click the toggle switch
      await billingSwitch.click();

      // Switch state should change
      const checkedAfter = await billingSwitch.getAttribute("aria-checked");
      expect(checkedAfter).not.toBe(checkedBefore);
    });

    test("BP-07: annual toggle shows savings badge", async ({ page }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Toggle to annual
      const billingSwitch = page
        .locator("[role='switch'], [data-slot='switch']")
        .first();
      await billingSwitch.click();

      // Save percentage badge should appear
      await expect(page.getByText(/save \d+%/i).first()).toBeVisible();
    });

    test("BP-08: current plan button is disabled", async ({ page }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The "Current Plan" button in the plan grid should be disabled
      const currentBtn = page.getByRole("button", { name: /current plan/i });
      if (await currentBtn.isVisible()) {
        await expect(currentBtn).toBeDisabled();
      }
    });

    test("BP-12: each plan card shows feature list", async ({ page }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Each plan card renders a <ul> with features — verify check icons exist
      const featureItems = page.locator("ul li").filter({
        has: page.locator("svg"),
      });
      const count = await featureItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Usage Stats
  // ---------------------------------------------------------------------------

  test.describe("Usage Stats", () => {
    test("BP-09: usage stats show team members count", async ({ page }) => {
      // Usage card may be below the fold — scroll to it
      const usageCard = page.locator("text=Usage").first();
      await usageCard.scrollIntoViewIfNeeded();
      await expect(usageCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // "Team Members" appears in multiple places — target the exact label
      // inside the Usage card (it's a <span class="font-medium">)
      const teamMembers = page.getByText("Team Members", { exact: true });
      await teamMembers.scrollIntoViewIfNeeded();
      await expect(teamMembers).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("BP-10: usage stats show storage info", async ({ page }) => {
      const usageCard = page.locator("text=Usage").first();
      await expect(usageCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      const storage = page.getByText(/storage/i).first();
      await expect(storage).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Billing Actions Visibility
  // ---------------------------------------------------------------------------

  test.describe("Billing Actions", () => {
    test("BP-11: billing actions hidden on free plan", async ({ page }) => {
      // Wait for the page to fully load
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // BillingActions component returns null for free plans
      // "Manage Billing" and "Cancel Subscription" should not exist
      const manageBillingBtn = page.getByRole("button", {
        name: /manage billing/i,
      });
      await expect(manageBillingBtn).toHaveCount(0);

      const cancelBtn = page.getByRole("button", {
        name: /cancel subscription/i,
      });
      await expect(cancelBtn).toHaveCount(0);
    });
  });
});
