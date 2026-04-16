import { test, expect, TEST_CONFIG, orgPath } from "./fixtures/fixtures";

test.describe("20 - Checkout Success", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  // ---------------------------------------------------------------------------
  // UI Tests — Page Display
  // ---------------------------------------------------------------------------
  test.describe("Page Display", () => {
    test("TC-20-01: success card renders with activation title", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(
        page.getByRole("heading", { name: /subscription activated/i })
      ).toBeVisible();
    });

    test("TC-20-02: payment success description text visible", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(
        page
          .getByText(/payment was successful.*subscription is now active/i)
          .first()
      ).toBeVisible();
    });

    test("TC-20-03: subscription benefits list visible", async ({ page }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(
        page.getByText(/access to all premium features/i).first()
      ).toBeVisible();
      await expect(
        page.getByText(/priority support/i).first()
      ).toBeVisible();
      await expect(
        page.getByText(/cancel anytime/i).first()
      ).toBeVisible();
    });

    test("TC-20-04: go to dashboard button visible", async ({ page }) => {
      await page.goto(orgPath("/checkout/success"));
      const dashBtn = page.getByRole("link", { name: /go to dashboard/i });
      await expect(dashBtn).toBeVisible();
    });

    test("TC-20-05: go to dashboard links to org home", async ({ page }) => {
      await page.goto(orgPath("/checkout/success"));
      const dashBtn = page.getByRole("link", { name: /go to dashboard/i });
      await expect(dashBtn).toHaveAttribute(
        "href",
        new RegExp(`/${TEST_CONFIG.locale}/${TEST_CONFIG.org.slug}`)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Session ID
  // ---------------------------------------------------------------------------
  test.describe("Session ID", () => {
    test("TC-20-06: session ID shown when present in URL", async ({
      page,
    }) => {
      await page.goto(
        orgPath("/checkout/success?session_id=cs_test_abc123")
      );
      await expect(page.getByText(/session id/i).first()).toBeVisible();
      await expect(page.getByText("cs_test_abc123")).toBeVisible();
    });

    test("TC-20-07: session ID hidden when absent", async ({ page }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(page.getByText(/session id/i)).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Checkout Success Callback
  // ---------------------------------------------------------------------------
  test.describe("Functional: Success Callback Navigation", () => {
    test("TC-20-10: navigating to success URL renders confirmation page", async ({
      page,
    }) => {
      // Simulate the redirect that Stripe performs after a successful checkout
      const response = await page.goto(orgPath("/checkout/success"));

      // Page should load successfully (not redirect away or 404)
      expect(response?.ok()).toBe(true);

      // The confirmation card should be rendered
      await expect(
        page.getByRole("heading", { name: /subscription activated/i })
      ).toBeVisible();
    });

    test("TC-20-11: success page with session_id query param displays session info", async ({
      page,
    }) => {
      const testSessionId = "cs_test_functional_987xyz";
      await page.goto(
        orgPath(`/checkout/success?session_id=${testSessionId}`)
      );

      // Session ID block should be visible with the correct value
      const sessionBlock = page.locator("code", { hasText: testSessionId });
      await expect(sessionBlock).toBeVisible();
    });

    test("TC-20-12: success page without session_id omits session block", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));

      // No <code> element should be present (session ID is rendered in a <code> tag)
      await expect(page.locator("code")).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Plan Upgrade Confirmation Details
  // ---------------------------------------------------------------------------
  test.describe("Functional: Plan Upgrade Confirmation", () => {
    test("TC-20-13: success page shows confirmation email notice", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(
        page.getByText(/confirmation email/i).first()
      ).toBeVisible();
    });

    test("TC-20-14: subscription benefits list contains all expected items", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));

      // The page should list exactly 3 benefits in the <ul>
      const benefitItems = page.locator("ul > li");
      await expect(benefitItems).toHaveCount(3);

      // Verify each benefit text
      await expect(benefitItems.nth(0)).toContainText(/premium features/i);
      await expect(benefitItems.nth(1)).toContainText(/priority support/i);
      await expect(benefitItems.nth(2)).toContainText(/cancel anytime/i);
    });

    test("TC-20-15: success icon (check circle) is rendered", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));

      // The green circle container should be present
      const iconContainer = page.locator(".bg-green-100");
      await expect(iconContainer).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Navigation from Success Page
  // ---------------------------------------------------------------------------
  test.describe("Functional: Navigation", () => {
    test("TC-20-16: clicking 'Go to Dashboard' navigates to org home", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));

      const dashBtn = page.getByRole("link", { name: /go to dashboard/i });
      await dashBtn.click();

      // Should navigate to the org dashboard
      await page.waitForURL(
        new RegExp(`/${TEST_CONFIG.org.slug}(?:\\?|$|/?)`)
      );

      // We should no longer be on the checkout success page
      await expect(
        page.getByRole("heading", { name: /subscription activated/i })
      ).not.toBeVisible();
    });

    test("TC-20-17: browser back from dashboard returns to success page", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(
        page.getByRole("heading", { name: /subscription activated/i })
      ).toBeVisible();

      // Navigate away via the dashboard link
      const dashBtn = page.getByRole("link", { name: /go to dashboard/i });
      await dashBtn.click();
      await page.waitForURL(
        new RegExp(`/${TEST_CONFIG.org.slug}(?:\\?|$|/?)`)
      );

      // Go back
      await page.goBack();
      await expect(
        page.getByRole("heading", { name: /subscription activated/i })
      ).toBeVisible();
    });

    test("TC-20-18: navigating directly to billing page from success context works", async ({
      page,
    }) => {
      // Start on the success page
      await page.goto(orgPath("/checkout/success"));
      await expect(
        page.getByRole("heading", { name: /subscription activated/i })
      ).toBeVisible();

      // Navigate to the billing page directly
      await page.goto(orgPath("/billing"));

      // Billing page should render (has the "Billing" heading)
      await expect(
        page.getByRole("heading", { name: /billing/i }).first()
      ).toBeVisible();
    });
  });
});
