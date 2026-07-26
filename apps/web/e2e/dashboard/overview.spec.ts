import { expect, orgPath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Organization Dashboard", () => {
  test("Should see the org dashboard heading When accessing the org dashboard", async ({ page }) => {
    await page.goto(orgPath("/"));
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByText(/organization dashboard/i).first()
    ).toBeVisible();
  });

  test("Should navigate to the members page When the sidebar Members link is clicked", async ({
    page,
  }) => {
    await page.goto(orgPath("/"));
    const sidebar = page.locator("aside, [data-sidebar]").first();
    // "Members" is a collapsible group trigger (button), not a direct link;
    // its sub-links (Members/Invitations/Invite Links) unmount while closed.
    const membersTrigger = sidebar.getByRole("button", { name: "Members" });
    await expect(membersTrigger).toBeVisible({
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    await membersTrigger.click();
    const membersLink = sidebar.getByRole("link", {
      exact: true,
      name: "Members",
    });
    await expect(membersLink).toBeVisible({
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    await membersLink.click();
    await page.waitForURL(`**/${TEST_CONFIG.org.slug}/members`, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    await expect(page).toHaveURL(
      new RegExp(`/${TEST_CONFIG.org.slug}/members`)
    );
  });
});
