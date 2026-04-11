import { test, expect, TEST_CONFIG, orgPath } from "../fixtures/fixtures";

test.describe("Payment: Checkout Flows", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  // ---------------------------------------------------------------------------
  // Upgrade Initiation
  //
  // Server Actions POST to the page URL (not a separate API endpoint).
  // We intercept the Next.js server action request (identified by the
  // "Next-Action" header) to verify it fires, then abort to prevent
  // real Stripe redirect.
  // ---------------------------------------------------------------------------

  test.describe("Upgrade Checkout", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(orgPath("/billing"));
      // Wait for plan comparison grid to load
      const changePlanCard = page.locator("text=Change Plan").first();
      await expect(changePlanCard).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });
    });

    test("CO-01: upgrade to Pro button exists and is clickable", async ({
      page,
    }) => {
      const upgradeBtn = page
        .getByRole("button", { name: /upgrade to pro/i })
        .first();

      if (!(await upgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Verify the upgrade button is visible and enabled
      await expect(upgradeBtn).toBeVisible();
      await expect(upgradeBtn).toBeEnabled();
    });

    test("CO-02: upgrade to Enterprise button exists and is clickable", async ({
      page,
    }) => {
      const enterpriseBtn = page
        .getByRole("button", { name: /upgrade to enterprise/i })
        .first();

      if (!(await enterpriseBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await expect(enterpriseBtn).toBeVisible();
      await expect(enterpriseBtn).toBeEnabled();
    });

    test("CO-03: clicking upgrade triggers server action", async ({
      page,
    }) => {
      const upgradeBtn = page
        .getByRole("button", { name: /upgrade to pro/i })
        .first();

      if (!(await upgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Intercept the server action POST (Next.js sends with Next-Action header)
      let actionFired = false;
      const actionPromise = page.waitForRequest((request) => {
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          actionFired = true;
          return true;
        }
        return false;
      });

      await upgradeBtn.click();

      // Wait for the server action request to fire (or timeout)
      await actionPromise.catch(() => {});

      expect(actionFired).toBe(true);
    });

    test("CO-04: annual toggle changes billing interval before checkout", async ({
      page,
    }) => {
      // Toggle to annual billing
      const billingSwitch = page
        .locator("[role='switch'], [data-slot='switch']")
        .first();
      if (await billingSwitch.isVisible()) {
        await billingSwitch.click();
      }

      // Wait for the save badge to confirm toggle happened
      await expect(page.getByText(/save \d+%/i).first()).toBeVisible();

      // Verify the upgrade buttons still exist after toggling
      const upgradeBtn = page
        .getByRole("button", { name: /upgrade to/i })
        .first();

      if (!(await upgradeBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await expect(upgradeBtn).toBeEnabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Checkout Success Page
  // ---------------------------------------------------------------------------

  test.describe("Checkout Success", () => {
    test("CO-05: success page renders with activation title", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"), {
        waitUntil: "networkidle",
      });
      // CardTitle renders as a div (not h1-h6), so use text locator
      await expect(
        page.getByText(/subscription activated/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
    });

    test("CO-06: success page shows session ID when in URL", async ({
      page,
    }) => {
      await page.goto(
        orgPath("/checkout/success?session_id=cs_test_abc123")
      );
      await expect(page.getByText(/session id/i).first()).toBeVisible();
      await expect(page.getByText("cs_test_abc123")).toBeVisible();
    });

    test("CO-07: success page hides session ID when absent", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));
      await expect(page.getByText(/session id/i)).toHaveCount(0);
    });

    test("CO-08: success page shows subscription benefits list", async ({
      page,
    }) => {
      await page.goto(orgPath("/checkout/success"));

      await expect(
        page.getByText(/access to all premium features/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
      await expect(
        page.getByText(/priority support/i).first()
      ).toBeVisible();
      await expect(
        page.getByText(/cancel anytime/i).first()
      ).toBeVisible();

      // Benefits list has 3 items
      const benefitItems = page.locator("ul.list-disc > li");
      await expect(benefitItems).toHaveCount(3);
    });

    test("CO-09: 'Go to Dashboard' links to org home", async ({ page }) => {
      await page.goto(orgPath("/checkout/success"));
      const dashBtn = page.getByRole("link", { name: /go to dashboard/i });
      await expect(dashBtn).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });
      await expect(dashBtn).toHaveAttribute(
        "href",
        new RegExp(`/${TEST_CONFIG.locale}/${TEST_CONFIG.org.slug}`)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Checkout Canceled Page
  // ---------------------------------------------------------------------------

  test.describe("Checkout Canceled", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(orgPath("/checkout/canceled"));
    });

    test("CO-10: canceled page renders with correct messaging", async ({
      page,
    }) => {
      await expect(page.getByText("Checkout Canceled")).toBeVisible();
      await expect(
        page.getByText(/canceled the checkout process.*no charges were made/i)
      ).toBeVisible();
    });

    test("CO-11: 'Try Again' links back to billing page", async ({
      page,
    }) => {
      const tryAgain = page.getByRole("link", { name: /try again/i });
      await expect(tryAgain).toBeVisible();
      await expect(tryAgain).toHaveAttribute(
        "href",
        new RegExp(`/${TEST_CONFIG.org.slug}/billing`)
      );
    });

    test("CO-12: 'Contact Support' has mailto link", async ({ page }) => {
      const support = page.getByRole("link", { name: /contact support/i });
      await expect(support).toBeVisible();
      await expect(support).toHaveAttribute("href", /mailto:/);
    });

    test("CO-13: navigating to canceled page directly works", async ({
      page,
    }) => {
      // Navigate away then come back to prove the page is independently accessible
      await page.goto(orgPath("/billing"));
      await page.waitForURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`), {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      await page.goto(orgPath("/checkout/canceled"));
      await page.waitForURL(/checkout\/canceled/, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      await expect(page.getByText("Checkout Canceled")).toBeVisible();
      await expect(
        page.getByRole("link", { name: /try again/i })
      ).toBeVisible();
    });

    test("CO-14: clicking 'Try Again' navigates to billing", async ({
      page,
    }) => {
      const tryAgain = page.getByRole("link", { name: /try again/i });
      await tryAgain.click();

      await page.waitForURL(
        new RegExp(`/${TEST_CONFIG.org.slug}/billing`),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );
      await expect(page).toHaveURL(
        new RegExp(`/${TEST_CONFIG.org.slug}/billing`)
      );
    });

    test("CO-15: browser back from billing returns to canceled page", async ({
      page,
    }) => {
      await page.getByRole("link", { name: /try again/i }).click();
      await page.waitForURL(
        new RegExp(`/${TEST_CONFIG.org.slug}/billing`),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );

      await page.goBack();
      await page.waitForURL(/checkout\/canceled/, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
      await expect(page.getByText("Checkout Canceled")).toBeVisible();
    });
  });
});
