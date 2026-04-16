import { test, expect, TEST_CONFIG, localePath, orgPath } from "./fixtures/fixtures";

test.describe("21 - Checkout Canceled", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/checkout/canceled"));
  });

  // ---------------------------------------------------------------------------
  // UI Tests
  // ---------------------------------------------------------------------------

  test.describe("Page Display", () => {
    test("TC-21-01: canceled checkout card renders", async ({ page }) => {
      await expect(page.getByText(/checkout canceled/i).first()).toBeVisible();
    });

    test("TC-21-02: no charges description visible", async ({ page }) => {
      await expect(
        page.getByText(/canceled the checkout|no.*charged|no charges were made/i).first()
      ).toBeVisible();
    });

    test("TC-21-03: try again button visible", async ({ page }) => {
      const tryAgain = page.getByRole("link", { name: /try again/i });
      await expect(tryAgain).toBeVisible();
    });

    test("TC-21-04: try again links to billing page", async ({ page }) => {
      const tryAgain = page.getByRole("link", { name: /try again/i });
      await expect(tryAgain).toHaveAttribute(
        "href",
        new RegExp(`/${TEST_CONFIG.org.slug}/billing`)
      );
    });

    test("TC-21-05: contact support button visible", async ({ page }) => {
      const support = page.getByRole("link", { name: /contact support/i });
      await expect(support).toBeVisible();
      await expect(support).toHaveAttribute("href", /mailto:/);
    });
  });

  test.describe("Layout", () => {
    test("TC-21-06: both buttons displayed", async ({ page }) => {
      await expect(page.getByRole("link", { name: /try again/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /contact support/i })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests
  // ---------------------------------------------------------------------------

  test.describe("Navigation & Retry", () => {
    test("TC-21-07: navigating to checkout canceled URL shows cancellation message", async ({
      page,
    }) => {
      // Page was already navigated in beforeEach; verify the full cancellation
      // message is rendered correctly with all key elements.
      await expect(page.getByText("Checkout Canceled")).toBeVisible();
      await expect(
        page.getByText(/canceled the checkout process.*no charges were made/i)
      ).toBeVisible();
      await expect(
        page.getByText(/issues or have questions.*support team/i)
      ).toBeVisible();
    });

    test("TC-21-08: clicking Try Again navigates to the billing page", async ({
      page,
    }) => {
      const tryAgain = page.getByRole("link", { name: /try again/i });
      await expect(tryAgain).toBeVisible();

      await tryAgain.click();

      // Should navigate to the org billing page
      await page.waitForURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`), {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Verify we landed on the billing page by checking for billing-specific content
      await expect(page).toHaveURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`));
    });

    test("TC-21-09: billing page is accessible after checkout cancellation (retry flow)", async ({
      page,
    }) => {
      // Click Try Again to go to billing
      await page.getByRole("link", { name: /try again/i }).click();

      await page.waitForURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`), {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Verify the billing page loaded with plan or subscription content
      // (indicates the user can retry upgrading)
      const billingContent = page
        .getByText(/plan|subscription|billing|upgrade/i)
        .first();
      await expect(billingContent).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });
    });

    test("TC-21-10: navigating back from billing returns to canceled page", async ({
      page,
    }) => {
      // Go to billing via Try Again
      await page.getByRole("link", { name: /try again/i }).click();
      await page.waitForURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`), {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Navigate back
      await page.goBack();

      // Should return to the checkout canceled page
      await page.waitForURL(/checkout\/canceled/, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
      await expect(page.getByText("Checkout Canceled")).toBeVisible();
    });

    test("TC-21-11: direct URL navigation to checkout canceled works without prior checkout", async ({
      page,
    }) => {
      // Navigate away first, then come back directly to prove the page
      // is independently accessible (not dependent on Stripe redirect state).
      await page.goto(orgPath("/billing"));
      await page.waitForURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`), {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Navigate directly to checkout canceled
      await page.goto(orgPath("/checkout/canceled"));
      await page.waitForURL(/checkout\/canceled/, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      await expect(page.getByText("Checkout Canceled")).toBeVisible();
      await expect(page.getByRole("link", { name: /try again/i })).toBeVisible();
    });
  });
});
