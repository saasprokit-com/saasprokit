import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";
import { fillSignInForm } from "../helpers/ui";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Sign In", () => {
  test("Should see the sign-in form When accessing the sign-in page", async ({ page }) => {
    await page.goto(localePath("/auth/sign-in"));

    await expect(page.getByRole("tab", { name: /Password/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Magic Link/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Email OTP/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Sign In$/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Forgot password/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign up/i }).first()
    ).toBeVisible();
  });

  test("Should redirect to the org dashboard When sign-in succeeds", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-in"));
    await fillSignInForm(page, TEST_CONFIG.user.email, TEST_CONFIG.user.password);

    await page.waitForURL((url) => !url.pathname.includes("/auth/"), {
      timeout: 30_000,
    });
    expect(page.url()).toMatch(/\/(org|account|[a-z0-9-]+)/);
  });

  test("Should return to the sign-in page When the user signs out", async ({ page }) => {
    await page.goto(localePath("/auth/sign-in"));
    await fillSignInForm(page, TEST_CONFIG.user.email, TEST_CONFIG.user.password);
    await page.waitForURL((url) => !url.pathname.includes("/auth/"), {
      timeout: 30_000,
    });

    await page.goto(localePath("/account/profile"));
    await page.locator("[data-sidebar='menu-button']").last().click();
    await page.getByText("Sign out").click();

    await page.waitForURL((url) => !url.pathname.includes("/account"), {
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    await page.goto(localePath("/account/profile"));
    await page.waitForURL((url) => url.pathname.includes("/auth/sign-in"), {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
