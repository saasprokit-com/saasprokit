import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Account Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/profile"));
    await expect(
      page.getByText("Profile Information", { exact: true })
    ).toBeVisible();
  });

  test("Should see the name populated and email read-only When accessing the profile page", async ({
    page,
  }) => {
    await expect(page.getByLabel(/name/i).first()).toHaveValue(
      TEST_CONFIG.user.name
    );
    await expect(page.locator("input[type='email']")).toHaveCount(0);
    await expect(
      page.locator(".bg-muted").filter({ hasText: "@" })
    ).toBeVisible();
  });

  test("Should see a validation error When the name is too short", async ({ page }) => {
    const nameInput = page.getByLabel(/name/i).first();
    await nameInput.clear();
    await nameInput.fill("A");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/at least 2/i).first()).toBeVisible();
  });

  test("Should persist the updated name When the profile form is saved", async ({
    page,
  }) => {
    const nameInput = page.getByLabel(/name/i).first();
    const saveBtn = page.getByRole("button", { name: /save changes/i });
    const updatedName = `E2E Updated ${Date.now()}`;

    await nameInput.clear();
    await nameInput.fill(updatedName);
    await saveBtn.click();
    await expect(
      page.getByText(/profile updated successfully/i)
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

    await page.reload();
    await expect(nameInput).toHaveValue(updatedName, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    await nameInput.clear();
    await nameInput.fill(TEST_CONFIG.user.name);
    await saveBtn.click();
    await expect(
      page.getByText(/profile updated successfully/i)
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

    await page.reload();
    await expect(nameInput).toHaveValue(TEST_CONFIG.user.name, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
  });
});
