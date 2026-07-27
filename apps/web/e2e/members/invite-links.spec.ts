import { expect, orgPath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Invite Links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/members/invite-links"));
  });

  test("Should open the create dialog and close it When cancel is clicked", async ({ page }) => {
    await page.getByRole("button", { name: /create link/i }).click();
    const dialog = page.locator("[role='dialog']");
    await expect(
      dialog.getByText(/create invite link/i).first()
    ).toBeVisible();
    await expect(dialog.getByText(/role/i).first()).toBeVisible();
    await expect(dialog.getByText(/expires in/i).first()).toBeVisible();

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("Should see the generated URL, copy it, and see it appear in the table When a link is generated", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /create link/i }).click();
    const dialog = page.locator("[role='dialog']");
    await dialog.getByRole("button", { name: /create link/i }).click();

    const inviteLinkInput = dialog.locator("input[readonly]");
    await expect(inviteLinkInput).toBeVisible({
      timeout: TEST_CONFIG.timeouts.action,
    });
    const generatedUrl = await inviteLinkInput.inputValue();
    expect(generatedUrl).toContain("/invite/");

    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const copyButton = dialog
      .locator('button[class*="outline"], button:has(svg.lucide-copy)')
      .first();
    await copyButton.click();
    await expect(page.getByText(/copied/i)).toBeVisible({
      timeout: TEST_CONFIG.timeouts.toast,
    });

    await dialog.getByRole("button", { name: /done/i }).click();
    await expect(dialog).not.toBeVisible();

    await page.reload();
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: TEST_CONFIG.timeouts.navigation,
    });
  });
});
