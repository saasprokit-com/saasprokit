import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("New Organization", () => {
  // Real org creation is already proven end-to-end by e2e/setup/org.setup.ts on
  // every run; submitting a second org here would duplicate that coverage and
  // risks the account's organizationLimit on a persistent dev database.
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

    // Scoped to the name field's own FormItem: a name of "A" also
    // auto-generates a 1-char slug, so a page-wide text search for
    // "at least 2" ambiguously matches the slug field's own "Slug must be
    // at least 2 characters" message instead of the name field's error.
    const nameFormItem = page
      .locator('[data-slot="form-item"]')
      .filter({ has: nameInput });
    await expect(
      nameFormItem.locator('[data-slot="form-message"]')
    ).toBeVisible();
  });
});
