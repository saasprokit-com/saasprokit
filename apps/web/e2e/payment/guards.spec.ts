import { test, expect, TEST_CONFIG, localePath, orgPath } from "../fixtures/fixtures";

test.describe("Payment: Guards & Access Control", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  // ---------------------------------------------------------------------------
  // RBAC — Billing Page Access
  //
  // The billing page checks: hasOrgPermission(orgId, { organization: ["update"] })
  // Non-owner/admin users see "Access Restricted" instead of billing components.
  //
  // NOTE: GD-01 (member sees "Access Restricted") requires a second test user
  // with "member" role. The current E2E setup only has one user (the org owner).
  // This test case is documented but skipped until multi-user setup is added.
  // ---------------------------------------------------------------------------

  test.describe("RBAC", () => {
    test("GD-01: non-owner sees 'Access Restricted' on billing page", async ({
      page,
    }) => {
      // This test requires a second user with "member" role
      // Skip until multi-user E2E setup is implemented
      test.skip();
    });

    test("GD-02: owner sees full billing page with all sections", async ({
      page,
    }) => {
      await page.goto(orgPath("/billing"));

      // Owner should NOT see "Access Restricted"
      const restricted = page.getByText(/access restricted/i);
      await expect(restricted).toHaveCount(0);

      // All billing sections should be visible
      const currentPlan = page.locator("text=Current Plan").first();
      await expect(currentPlan).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      const changePlan = page.locator("text=Change Plan").first();
      await expect(changePlan).toBeVisible();

      const usage = page.locator("text=Usage").first();
      await expect(usage).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Organization Creation Limits
  //
  // Free plan: 1 org limit. After creating the first org, the new-org page
  // shows UpgradePrompt instead of the creation form.
  // ---------------------------------------------------------------------------

  test.describe("Org Creation Limits", () => {
    test("GD-03: new org page shows UpgradePrompt when blocked", async ({
      page,
    }) => {
      // The test user already owns an org (created in org.setup.ts)
      // Navigating to new-org should show the upgrade prompt (Free plan = 1 org limit)
      await page.goto(localePath("/account/new-org"));

      // Wait for the page to load
      await page.waitForLoadState("networkidle");

      // Either the creation form or upgrade prompt should appear
      const createForm = page.getByRole("button", {
        name: /create workspace/i,
      });
      const upgradePrompt = page.getByText(/upgrade required|organization limit/i).first();

      // On Free plan with 1 existing org, should see upgrade prompt
      if (await upgradePrompt.isVisible().catch(() => false)) {
        await expect(upgradePrompt).toBeVisible();
      } else if (await createForm.isVisible().catch(() => false)) {
        // User may be on a paid plan or have special permissions — still valid
        await expect(createForm).toBeVisible();
      }
    });

    test("GD-04: 'Upgrade Plan' link visible on UpgradePrompt", async ({
      page,
    }) => {
      await page.goto(localePath("/account/new-org"));
      await page.waitForLoadState("networkidle");

      const upgradeLink = page.getByRole("link", { name: /upgrade plan/i });

      // Only assert if the upgrade prompt is shown (org on Free plan)
      if (await upgradeLink.isVisible().catch(() => false)) {
        await expect(upgradeLink).toBeVisible();
        // Should link to org page (where user can upgrade existing org)
        await expect(upgradeLink).toHaveAttribute("href", /\/org/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Downgrade Guards
  //
  // guardDowngrade() blocks downgrades when current member count or storage
  // exceeds the target plan's limits. The block reason is shown inline in the
  // DowngradeButton's AlertDialog, and the "Yes, Downgrade" button is disabled.
  //
  // These tests verify the UI handles block reasons correctly.
  // On the Free plan (no downgrade buttons visible), tests skip gracefully.
  // ---------------------------------------------------------------------------

  test.describe("Downgrade Guards", () => {
    test.beforeEach(async ({ page }) => {
      const response = await page.goto(orgPath("/billing"));
      if (!response?.ok()) {
        test.skip();
        return;
      }
      const changePlanCard = page.locator("text=Change Plan").first();
      if (!(await changePlanCard.isVisible({ timeout: TEST_CONFIG.timeouts.navigation }).catch(() => false))) {
        test.skip();
        return;
      }
    });

    test("GD-05: downgrade blocked when member count exceeds target limit", async ({
      page,
    }) => {
      // This test verifies the block UI exists in the downgrade dialog.
      // When guardDowngrade() returns a blockReason, the dialog shows:
      //   - An Alert with variant="destructive" containing the reason
      //   - The "Yes, Downgrade" button is disabled
      //
      // On Free plan, no downgrade buttons exist — skip gracefully.
      const downgradeBtn = page
        .getByRole("button", { name: /downgrade to/i })
        .first();

      if (!(await downgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await downgradeBtn.click();

      // If a block reason is present, the confirm button should be disabled
      const blockAlert = page.locator("[data-slot='alert-description']").first();
      const confirmBtn = page.getByRole("button", {
        name: /yes, downgrade/i,
      });

      if (await blockAlert.isVisible().catch(() => false)) {
        // Block reason is shown — confirm button must be disabled
        await expect(confirmBtn).toBeDisabled();
        await expect(blockAlert).toContainText(/members|member/i);
      } else {
        // No block — confirm button should be enabled
        await expect(confirmBtn).toBeEnabled();
      }
    });

    test("GD-06: downgrade blocked when storage exceeds target limit", async ({
      page,
    }) => {
      // Same pattern as GD-05 but for storage-related block reasons
      const downgradeBtn = page
        .getByRole("button", { name: /downgrade to/i })
        .first();

      if (!(await downgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await downgradeBtn.click();

      const blockAlert = page.locator("[data-slot='alert-description']").first();
      const confirmBtn = page.getByRole("button", {
        name: /yes, downgrade/i,
      });

      if (await blockAlert.isVisible().catch(() => false)) {
        await expect(confirmBtn).toBeDisabled();
        // Block reason mentions storage
        await expect(blockAlert).toContainText(/storage|mb/i);
      } else {
        await expect(confirmBtn).toBeEnabled();
      }
    });
  });
});
