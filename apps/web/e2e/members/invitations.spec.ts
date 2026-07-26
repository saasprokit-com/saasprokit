import { expect, orgPath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Invitations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/members/invitations"));
  });

  test("Should see the invitations table When accessing the invitations page", async ({ page }) => {
    await expect(
      page.getByPlaceholder("Filter invitations...")
    ).toBeVisible();
  });

  test("Should see no results When searching for a non-matching term", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Filter invitations...")
      .fill("no-such-invitation-xyz");
    await page.waitForURL(/q=/);
    await expect(page.getByText("No results.")).toBeVisible();
  });
});
