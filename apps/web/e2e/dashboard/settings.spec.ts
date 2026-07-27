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
    const nameInput = page.getByPlaceholder("Enter organization name");
    const saveBtn = page.getByRole("button", { name: /save changes/i });
    const updatedName = `${TEST_CONFIG.org.name} Updated`;

    await nameInput.clear();
    await nameInput.fill(updatedName);
    await saveBtn.click();
    await expect(
      page.getByText(/organization updated successfully/i).first()
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

    await page.reload();
    await expect(nameInput).toHaveValue(updatedName, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    await nameInput.clear();
    await nameInput.fill(TEST_CONFIG.org.name);
    await saveBtn.click();
    await expect(
      page.getByText(/organization updated successfully/i).first()
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

    await page.reload();
    await expect(nameInput).toHaveValue(TEST_CONFIG.org.name, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
  });
});
