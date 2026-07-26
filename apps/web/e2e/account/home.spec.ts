import { expect, localePath, orgPath, test } from "../fixtures/fixtures";
import { expectRedirectToSignIn } from "../helpers/ui";

test.describe("Account Home", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("Should redirect to profile and see the sidebar When accessing /account", async ({ page }) => {
    await page.goto(localePath("/account"));
    await page.waitForURL(/\/account\/profile/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/account\/profile/);

    const sidebar = page.locator("nav, aside").filter({
      hasText: /profile|security|danger/i,
    });
    await expect(sidebar.first()).toBeVisible();
  });
});

test.describe("Protected routes — unauthenticated guard", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Should redirect to sign-in When an unauthenticated user visits any protected area", async ({
    page,
  }) => {
    const protectedPaths = [
      localePath("/account"),
      localePath("/org"),
      orgPath("/"),
    ];

    for (const path of protectedPaths) {
      await expectRedirectToSignIn(page, path);
    }
  });
});
