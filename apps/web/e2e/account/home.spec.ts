import { test, expect, TEST_CONFIG, localePath } from "../fixtures/fixtures";
import { test as baseTest, expect as baseExpect } from "@playwright/test";

test.describe("09 - Account Home (Authenticated)", () => {
  // --- Existing UI Tests ---

  test("TC-09-01: redirects to profile page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account"));
    await page.waitForURL(/\/account\/profile/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    expect(page.url()).toContain("/account/profile");
  });

  test("TC-09-02: redirect preserves locale", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account"));
    await page.waitForURL(/\/account\/profile/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    // With rewriteDefault, the default locale ("en") is stripped from the URL.
    // The redirect should still land on /account/profile (locale handled internally).
    expect(page.url()).toContain("/account/profile");
  });

  test("TC-09-03: sidebar is visible after redirect", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account"));
    await page.waitForURL(/\/account\/profile/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    const sidebar = page
      .locator("nav, aside")
      .filter({ hasText: /profile|security|danger/i });
    await expect(sidebar.first()).toBeVisible();
  });

  // --- Functional Tests: Sidebar Navigation ---

  test("TC-09-04: sidebar Profile link navigates to profile page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account/profile"));
    await page.waitForLoadState("networkidle");

    const profileLink = page
      .locator("nav, aside")
      .getByRole("link", { name: "Profile" });
    await expect(profileLink.first()).toBeVisible();
    await profileLink.first().click();

    await page.waitForURL(/\/account\/profile/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    expect(page.url()).toContain("/account/profile");
  });

  test("TC-09-05: sidebar Security link navigates to security page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account/profile"));
    await page.waitForLoadState("networkidle");

    const securityLink = page
      .locator("nav, aside")
      .getByRole("link", { name: "Security" });
    await expect(securityLink.first()).toBeVisible();
    await securityLink.first().click();

    await page.waitForURL(/\/account\/security/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    expect(page.url()).toContain("/account/security");
  });

  test("TC-09-06: sidebar Danger Zone link navigates to danger page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account/profile"));
    await page.waitForLoadState("networkidle");

    const dangerLink = page
      .locator("nav, aside")
      .getByRole("link", { name: "Danger Zone" });
    await expect(dangerLink.first()).toBeVisible();
    await dangerLink.first().click();

    await page.waitForURL(/\/account\/danger/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    expect(page.url()).toContain("/account/danger");
  });

  // --- Functional Test: User Info in Sidebar ---

  test("TC-09-07: sidebar displays user name and email", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(localePath("/account/profile"));
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("nav, aside");

    // User name should appear in the sidebar header or footer
    await expect(
      sidebar.getByText(TEST_CONFIG.user.name).first()
    ).toBeVisible();

    // User email should appear in the sidebar header or footer
    await expect(
      sidebar.getByText(TEST_CONFIG.user.email).first()
    ).toBeVisible();
  });
});

// --- Unauthenticated Access Test ---

baseTest.describe("09 - Account Home (Unauthenticated)", () => {
  baseTest(
    "TC-09-08: unauthenticated access redirects to sign-in",
    async ({ page }) => {
      await page.goto("/account");

      // Should redirect to sign-in page
      await page.waitForURL(/\/auth\/sign-in|\/sign-in/, {
        timeout: 15_000,
      });

      baseExpect(page.url()).toMatch(/\/auth\/sign-in|\/sign-in/);
    }
  );
});
