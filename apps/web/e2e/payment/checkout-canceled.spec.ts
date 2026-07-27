import { expect, orgPath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Checkout Canceled", () => {
  test("Should see the canceled page When checkout is canceled", async ({ page }) => {
    await page.goto(orgPath("/checkout/canceled"));
    await expect(
      page.getByRole("link", { name: /try again/i })
    ).toBeVisible();
  });

  test("Should navigate to the billing page When Try Again is clicked", async ({ page }) => {
    await page.goto(orgPath("/checkout/canceled"));
    const tryAgain = page.getByRole("link", { name: /try again/i });
    await tryAgain.click();
    await page.waitForURL(new RegExp(`/${TEST_CONFIG.org.slug}/billing`), {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    await expect(page).toHaveURL(
      new RegExp(`/${TEST_CONFIG.org.slug}/billing`)
    );
  });
});
