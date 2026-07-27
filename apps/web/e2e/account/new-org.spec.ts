import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("New Organization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/new-org"));
  });

  test("Should auto-generate the slug from the name When typing in the workspace name field", async ({
    page,
  }) => {
    const nameInput = page.getByLabel(/workspace name/i);
    const slugInput = page.getByLabel(/workspace url/i);

    await expect(nameInput).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create workspace/i })
    ).toBeVisible();

    const timestamp = Date.now();
    await nameInput.fill(`E2E Org ${timestamp}`);
    await expect(slugInput).toHaveValue(`e2e-org-${timestamp}`, {
      timeout: 3000,
    });
  });

  test("Should see a validation error When the workspace name is too short", async ({
    page,
  }) => {
    const nameInput = page.getByLabel(/workspace name/i);
    await nameInput.fill("A");
    await page.getByRole("button", { name: /create workspace/i }).click();

    // Scope to the name field's FormItem: "A" also generates a 1-char slug whose "Slug must be at least 2" message would match a page-wide search.
    const nameFormItem = page
      .locator('[data-slot="form-item"]')
      .filter({ has: nameInput });
    await expect(
      nameFormItem.locator('[data-slot="form-message"]')
    ).toBeVisible();
  });
});
