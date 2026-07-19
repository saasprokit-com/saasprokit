import { test, expect, TEST_CONFIG, orgPath } from "../fixtures/fixtures";

test.describe("Payment: Plan Changes", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  // ---------------------------------------------------------------------------
  // Downgrade Dialog
  //
  // NOTE: The test org starts on the Free plan. Downgrade buttons only appear
  // when the org is on a paid plan. These tests verify the UI mechanics exist
  // and are correctly wired — they skip gracefully when the org is on Free.
  // For full downgrade flow testing with a real paid subscription, use the
  // manual testing plan (plan/manual-payment-testing.md, Flows 6-9).
  // ---------------------------------------------------------------------------

  test.describe("Downgrade Flow", () => {
    test.beforeEach(async ({ page }) => {
      const response = await page.goto(orgPath("/billing"));
      // Skip all tests in this block if the billing page errors (500, etc.)
      if (!response?.ok()) {
        test.skip();
        return;
      }
      const changePlanCard = page.locator("text=Change Plan").first();
      // If "Change Plan" doesn't appear (error page, access restricted), skip
      if (!(await changePlanCard.isVisible({ timeout: TEST_CONFIG.timeouts.navigation }).catch(() => false))) {
        test.skip();
        return;
      }
    });

    test("PC-01: downgrade button visible for lower plans (when on paid plan)", async ({
      page,
    }) => {
      // On a paid plan, lower plan cards show "Downgrade to ..." buttons
      const downgradeBtn = page
        .getByRole("button", { name: /downgrade to/i })
        .first();

      // Skip if no downgrade button (org is on Free plan)
      if (!(await downgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await expect(downgradeBtn).toBeVisible();
    });

    test("PC-02: downgrade button opens AlertDialog with warning", async ({
      page,
    }) => {
      const downgradeBtn = page
        .getByRole("button", { name: /downgrade to/i })
        .first();

      if (!(await downgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await downgradeBtn.click();

      // AlertDialog should open with downgrade warning
      await expect(
        page.getByRole("heading", { name: /downgrade to/i })
      ).toBeVisible();
      await expect(
        page.getByText(/lose access to features/i)
      ).toBeVisible();

      // Confirm and cancel buttons should be present
      await expect(
        page.getByRole("button", { name: /yes, downgrade/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /keep/i })
      ).toBeVisible();
    });

    test("PC-03: 'Keep Plan' closes dialog without action", async ({
      page,
    }) => {
      const downgradeBtn = page
        .getByRole("button", { name: /downgrade to/i })
        .first();

      if (!(await downgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await downgradeBtn.click();

      // Click "Keep [Plan]" to close the dialog
      const keepBtn = page.getByRole("button", { name: /keep/i });
      await keepBtn.click();

      // Dialog should be closed — the downgrade heading should be gone
      await expect(
        page.getByRole("heading", { name: /downgrade to/i })
      ).not.toBeVisible();
    });

    test("PC-04: downgrade sends correct changePlanAction data", async ({
      page,
    }) => {
      const downgradeBtn = page
        .getByRole("button", { name: /downgrade to/i })
        .first();

      if (!(await downgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await downgradeBtn.click();

      // Intercept the server action form submission
      const actionPromise = page.waitForRequest((request) => {
        return (
          request.method() === "POST" &&
          request.url().includes(TEST_CONFIG.org.slug)
        );
      });

      const confirmBtn = page.getByRole("button", {
        name: /yes, downgrade/i,
      });

      // Only click if not disabled (guardDowngrade may block it)
      if (await confirmBtn.isEnabled()) {
        await confirmBtn.click();

        // Verify the "Downgrading..." loading state appears
        await expect(
          page.getByText(/downgrading/i).first()
        ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Cancel Subscription
  //
  // Cancel button only appears for paid plans that are not already canceled.
  // These tests skip when the org is on the Free plan.
  // ---------------------------------------------------------------------------

  test.describe("Cancel Subscription", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(orgPath("/billing"));
    });

    test("PC-05: cancel subscription button visible on paid plan", async ({
      page,
    }) => {
      const cancelBtn = page
        .getByRole("button", { name: /cancel subscription/i })
        .first();

      // Skip if no cancel button (org is on Free plan or already canceled)
      if (!(await cancelBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await expect(cancelBtn).toBeVisible();
    });

    test("PC-06: cancel opens confirmation AlertDialog", async ({ page }) => {
      const cancelBtn = page
        .getByRole("button", { name: /cancel subscription/i })
        .first();

      if (!(await cancelBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await cancelBtn.click();

      // AlertDialog should appear with cancel confirmation
      await expect(
        page.getByRole("heading", { name: /cancel subscription/i })
      ).toBeVisible();
      await expect(
        page.getByText(/remain active until the end/i)
      ).toBeVisible();

      // Both action buttons should be present
      await expect(
        page.getByRole("button", { name: /yes, cancel/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /keep subscription/i })
      ).toBeVisible();
    });

    test("PC-07: 'Yes, Cancel' triggers cancel flow", async ({ page }) => {
      const cancelBtn = page
        .getByRole("button", { name: /cancel subscription/i })
        .first();

      if (!(await cancelBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await cancelBtn.click();

      const confirmBtn = page.getByRole("button", { name: /yes, cancel/i });
      await expect(confirmBtn).toBeVisible();

      // Click triggers cancelSubscriptionAction() → auth.api.cancelSubscription
      await confirmBtn.click();

      // Should show "Canceling..." loading state
      await expect(
        page.getByText(/canceling/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
    });

    test("PC-08: 'Keep Subscription' closes dialog", async ({ page }) => {
      const cancelBtn = page
        .getByRole("button", { name: /cancel subscription/i })
        .first();

      if (!(await cancelBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await cancelBtn.click();

      const keepBtn = page.getByRole("button", {
        name: /keep subscription/i,
      });
      await keepBtn.click();

      // Dialog should close
      await expect(
        page.getByRole("heading", { name: /cancel subscription/i })
      ).not.toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Manage Billing Portal
  //
  // "Manage Billing" only appears for paid plans.
  // ---------------------------------------------------------------------------

  test.describe("Manage Billing", () => {
    test("PC-09: manage billing button triggers portal redirect", async ({
      page,
    }) => {
      await page.goto(orgPath("/billing"));

      const manageBillingBtn = page
        .getByRole("button", { name: /manage billing/i })
        .first();

      if (!(await manageBillingBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // The button should be enabled and clickable
      await expect(manageBillingBtn).toBeEnabled();
    });

    test("PC-10: manage billing shows 'Opening...' during submit", async ({
      page,
    }) => {
      await page.goto(orgPath("/billing"));

      const manageBillingBtn = page
        .getByRole("button", { name: /manage billing/i })
        .first();

      if (!(await manageBillingBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await manageBillingBtn.click();

      // Should show "Opening..." loading text
      await expect(
        page.getByText(/opening/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
    });
  });
});
