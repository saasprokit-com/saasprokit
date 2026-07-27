import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test("Should resolve to the test organization When visiting /org", async ({ page }) => {
  await page.goto(localePath("/org"));
  await page.waitForURL(
    (url) => url.pathname.includes(`/${TEST_CONFIG.org.slug}`),
    { timeout: TEST_CONFIG.timeouts.navigation }
  );
  await expect(page).toHaveURL(new RegExp(`/${TEST_CONFIG.org.slug}`));
});
