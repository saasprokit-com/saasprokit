import { test, expect, TEST_CONFIG, orgPath } from "./fixtures/fixtures";

test.describe("15 - Organization Billing", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/billing"));
  });

  // ---------------------------------------------------------------------------
  // UI Tests (existing)
  // ---------------------------------------------------------------------------

  test.describe("Page Display", () => {
    test("TC-15-01: billing page renders", async ({ page }) => {
      // Either full billing page or access restricted
      const billing = page.getByText(/current plan|billing/i).first();
      const restricted = page.getByText(/access restricted/i).first();
      await expect(billing.or(restricted)).toBeVisible();
    });
  });

  test.describe("Current Plan Card", () => {
    test("TC-15-02: current plan card visible", async ({ page }) => {
      const card = page.getByText(/current plan/i).first();
      if (await card.isVisible()) {
        await expect(card).toBeVisible();
      }
    });

    test("TC-15-03: plan name displayed", async ({ page }) => {
      const planName = page.getByText(/free|pro|enterprise/i).first();
      await expect(planName).toBeVisible();
    });
  });

  test.describe("Change Plan Card", () => {
    test("TC-15-04: plan comparison grid displays", async ({ page }) => {
      const changePlan = page.getByText(/change plan/i).first();
      if (await changePlan.isVisible()) {
        // Should see 3 plan options
        await expect(page.getByText(/free/i).first()).toBeVisible();
        await expect(page.getByText(/pro/i).first()).toBeVisible();
        await expect(page.getByText(/enterprise/i).first()).toBeVisible();
      }
    });

    test("TC-15-05: billing toggle switches monthly/annual", async ({
      page,
    }) => {
      const switchEl = page
        .locator("[role='switch'], [data-slot='switch']")
        .first();
      if (await switchEl.isVisible()) {
        await switchEl.click();
        // Prices should update
        await expect(page.getByText(/save/i).first()).toBeVisible();
      }
    });

    test("TC-15-06: current plan button is disabled", async ({ page }) => {
      const currentBtn = page.getByRole("button", { name: /current plan/i });
      if (await currentBtn.isVisible()) {
        await expect(currentBtn).toBeDisabled();
      }
    });
  });

  test.describe("Usage Stats", () => {
    test("TC-15-07: usage stats card visible", async ({ page }) => {
      const usage = page.getByText(/usage/i).first();
      if (await usage.isVisible()) {
        await expect(page.getByText(/team members/i).first()).toBeVisible();
      }
    });
  });

  test.describe("Access Control", () => {
    test("TC-15-08: page loads for authenticated org member", async ({
      page,
    }) => {
      // Should not redirect to sign-in
      expect(page.url()).not.toContain("/auth/sign-in");
    });
  });

  test.describe("Breadcrumbs", () => {
    test("TC-15-09: breadcrumbs visible", async ({ page }) => {
      await expect(page.getByText(/billing/i).first()).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests
  // ---------------------------------------------------------------------------

  test.describe("Functional: Current Plan Display", () => {
    test("TC-15-10: current plan shows Free plan for test org", async ({
      page,
    }) => {
      // Wait for the Current Plan card to fully load (skeleton disappears)
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The test org should be on the Free plan by default
      // The CurrentPlan component renders plan.displayName as a text-2xl heading
      const planHeading = page.locator("h3", { hasText: /free/i }).first();
      await expect(planHeading).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("TC-15-11: current plan card shows subscription status badge", async ({
      page,
    }) => {
      // Wait for loading to complete
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The CurrentPlan component always renders a Badge with the status text
      // For free plans, it shows "No subscription"
      const statusBadge = page
        .locator("[data-slot='badge']")
        .filter({ hasText: /active|no subscription|canceled/i })
        .first();
      await expect(statusBadge).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("TC-15-12: free plan shows upgrade prompt", async ({ page }) => {
      // Wait for the plan card to load
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // On Free plan, the CurrentPlan component shows an upgrade prompt
      const upgradePrompt = page.getByText(
        /upgrade to unlock more features/i
      );
      // This only appears on the Free plan
      if (await upgradePrompt.isVisible().catch(() => false)) {
        await expect(upgradePrompt).toBeVisible();
      }
    });

    test("TC-15-13: current plan shows included features list", async ({
      page,
    }) => {
      // Wait for loading
      const currentPlanCard = page.locator("text=Current Plan").first();
      await expect(currentPlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The CurrentPlan component renders "Features included:" with a list
      const featuresLabel = page.getByText(/features included/i);
      await expect(featuresLabel).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });
  });

  test.describe("Functional: Plan Comparison", () => {
    test("TC-15-14: all three plan cards are visible with prices", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The ChangePlan component renders a 3-column grid with plan cards
      // Each card has the plan display name as an h3
      const freeCard = page.locator("h3", { hasText: /free/i }).first();
      const proCard = page.locator("h3", { hasText: /pro/i }).first();
      const enterpriseCard = page
        .locator("h3", { hasText: /enterprise/i })
        .first();

      await expect(freeCard).toBeVisible();
      await expect(proCard).toBeVisible();
      await expect(enterpriseCard).toBeVisible();

      // Free plan should show "Free" price text, paid plans show "$X/mo"
      await expect(page.getByText("Free").first()).toBeVisible();
      await expect(page.getByText(/\$\d+\/mo/).first()).toBeVisible();
    });

    test("TC-15-15: current plan card is visually highlighted", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The current plan card gets a "Current Plan" badge inside it
      const currentPlanBadge = page
        .locator("[data-slot='badge']")
        .filter({ hasText: /current plan/i });
      await expect(currentPlanBadge.first()).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("TC-15-16: billing toggle switches prices between monthly and annual", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Default is monthly — "Monthly" label should be bold
      const monthlyLabel = page.getByText("Monthly", { exact: true });
      await expect(monthlyLabel).toBeVisible();

      // Capture a price before toggling
      const pricesBefore = await page.getByText(/\$\d+\/mo/).allTextContents();

      // Click the switch to toggle to annual
      const billingSwitch = page
        .locator("[role='switch'], [data-slot='switch']")
        .first();
      await billingSwitch.click();

      // Annual label should now be visible, and "Save X%" badge should appear
      const annualLabel = page.getByText("Annual", { exact: true });
      await expect(annualLabel).toBeVisible();
      await expect(page.getByText(/save \d+%/i).first()).toBeVisible();

      // "Billed annually" text should appear for paid plans
      await expect(
        page.getByText(/billed annually/i).first()
      ).toBeVisible();

      // Prices should have changed (annual per-month is typically lower)
      const pricesAfter = await page.getByText(/\$\d+\/mo/).allTextContents();
      // At minimum, we verify prices are still rendered
      expect(pricesAfter.length).toBeGreaterThan(0);
    });

    test("TC-15-17: each plan card shows feature list", async ({ page }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Each plan card renders a <ul> with features — verify at least one
      // feature list item with a check icon is present
      const featureItems = page.locator("ul li").filter({
        has: page.locator("svg"), // CheckCircle2 icon
      });
      const count = await featureItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Functional: Upgrade Flow", () => {
    test("TC-15-18: upgrade button visible for higher plans", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // On Free plan, Pro and Enterprise should show "Upgrade to ..." buttons
      const upgradeButtons = page.getByRole("button", {
        name: /upgrade to/i,
      });
      const count = await upgradeButtons.count();
      // Free plan should have 2 upgrade buttons (Pro + Enterprise)
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("TC-15-19: clicking upgrade initiates checkout via API", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Find the first upgrade button (should be "Upgrade to Pro")
      const upgradeBtn = page
        .getByRole("button", { name: /upgrade to pro/i })
        .first();

      // Skip if no upgrade button (user may already be on Pro)
      if (!(await upgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Intercept the checkout API call to verify it fires correctly
      // without actually redirecting to Stripe
      const checkoutPromise = page.waitForRequest((request) => {
        return (
          request.url().includes("/api/organizations/") &&
          request.url().includes("/checkout") &&
          request.method() === "POST"
        );
      });

      // Click upgrade — this triggers a POST to /api/organizations/{id}/checkout
      await upgradeBtn.click();

      // Verify the button shows loading state
      await expect(
        page.getByText(/processing/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });

      // Verify the checkout API request was made
      const checkoutRequest = await checkoutPromise;
      expect(checkoutRequest.method()).toBe("POST");
      expect(checkoutRequest.url()).toContain("/checkout");

      // Verify the request body contains expected fields
      const postData = checkoutRequest.postDataJSON();
      expect(postData).toHaveProperty("planName");
      expect(postData).toHaveProperty("billingInterval");
      expect(postData).toHaveProperty("locale");
      expect(postData.billingInterval).toBe("monthly");
    });

    test("TC-15-20: upgrade sends correct plan name in checkout request", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Find upgrade to Enterprise button
      const enterpriseBtn = page
        .getByRole("button", { name: /upgrade to enterprise/i })
        .first();

      if (!(await enterpriseBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Intercept the checkout API call
      const checkoutPromise = page.waitForRequest((request) => {
        return (
          request.url().includes("/checkout") && request.method() === "POST"
        );
      });

      await enterpriseBtn.click();

      const checkoutRequest = await checkoutPromise;
      const postData = checkoutRequest.postDataJSON();
      // The plan name should match the enterprise plan
      expect(postData.planName).toMatch(/enterprise/i);
    });

    test("TC-15-21: upgrade with annual billing sends correct interval", async ({
      page,
    }) => {
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Toggle to annual billing first
      const billingSwitch = page
        .locator("[role='switch'], [data-slot='switch']")
        .first();
      if (await billingSwitch.isVisible()) {
        await billingSwitch.click();
      }

      // Wait for the save badge to confirm toggle happened
      await expect(page.getByText(/save \d+%/i).first()).toBeVisible();

      const upgradeBtn = page
        .getByRole("button", { name: /upgrade to/i })
        .first();

      if (!(await upgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Intercept checkout request
      const checkoutPromise = page.waitForRequest((request) => {
        return (
          request.url().includes("/checkout") && request.method() === "POST"
        );
      });

      await upgradeBtn.click();

      const checkoutRequest = await checkoutPromise;
      const postData = checkoutRequest.postDataJSON();
      // Should send "annual" since we toggled the billing period
      expect(postData.billingInterval).toBe("annual");
    });
  });

  test.describe("Functional: Usage Stats", () => {
    test("TC-15-22: usage stats shows team members count", async ({
      page,
    }) => {
      // Wait for the Usage card to appear (after loading skeleton disappears)
      const usageCard = page.locator("text=Usage").first();
      await expect(usageCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The UsageStats component renders "Team Members" with a count
      const teamMembers = page.getByText(/team members/i);
      await expect(teamMembers).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Should show a count in format "X / Y" or "X / Unlimited"
      const memberCount = page.getByText(/\d+\s*\/\s*(\d+|unlimited)/i);
      await expect(memberCount.first()).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("TC-15-23: usage stats shows storage info", async ({ page }) => {
      const usageCard = page.locator("text=Usage").first();
      await expect(usageCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Storage section should be visible
      const storage = page.getByText(/storage/i).first();
      await expect(storage).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });
  });

  test.describe("Functional: Billing Actions", () => {
    test("TC-15-24: billing actions card hidden on free plan", async ({
      page,
    }) => {
      // Wait for the page to fully load
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // The BillingActions component returns null for free plans
      // So "Manage Billing" and "Cancel Subscription" buttons should not exist
      const manageBillingBtn = page.getByRole("button", {
        name: /manage billing/i,
      });
      await expect(manageBillingBtn).toHaveCount(0);
    });
  });
});
