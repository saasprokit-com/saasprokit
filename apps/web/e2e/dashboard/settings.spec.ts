import { expect, orgPath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Organization Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/settings"));
    await expect(
      page.getByPlaceholder("Enter organization name")
    ).toBeVisible();
  });

  test("Should see the org name populated and slug read-only When accessing org settings", async ({
    page,
  }) => {
    const nameInput = page.getByPlaceholder("Enter organization name");
    await expect(nameInput).toHaveValue(TEST_CONFIG.org.name);
    await expect(
      page.getByText(TEST_CONFIG.org.slug, { exact: true })
    ).toBeVisible();
    await expect(page.getByText(/slug cannot be changed/i)).toBeVisible();
  });

  test("Should persist the updated org name When settings are saved", async ({
    page,
  }) => {
    const updatedName = `${TEST_CONFIG.org.name} Updated`;

    await page.getByPlaceholder("Enter organization name").clear();
    await page.getByPlaceholder("Enter organization name").fill(updatedName);
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(
      page.getByText(/organization updated successfully/i).first()
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

    await page.reload();
    await expect(
      page.getByPlaceholder("Enter organization name")
    ).toHaveValue(updatedName, { timeout: TEST_CONFIG.timeouts.navigation });

    await page.getByPlaceholder("Enter organization name").clear();
    await page
      .getByPlaceholder("Enter organization name")
      .fill(TEST_CONFIG.org.name);
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(
      page.getByText(/organization updated successfully/i).first()
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

    await page.reload();
    await expect(
      page.getByPlaceholder("Enter organization name")
    ).toHaveValue(TEST_CONFIG.org.name, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
  });
});
