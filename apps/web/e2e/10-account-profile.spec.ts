import { test, expect, TEST_CONFIG, localePath } from "./fixtures/fixtures";

test.describe("10 - Account Profile", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/profile"));
    // Wait for the profile form to be ready
    await expect(page.getByText("Profile Information")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // UI Tests (existing coverage)
  // ---------------------------------------------------------------------------

  test.describe("Page Display", () => {
    test("TC-10-01: renders profile form with name field", async ({ page }) => {
      await expect(page.getByLabel(/name/i).first()).toBeVisible();
    });

    test("TC-10-02: email is displayed as read-only text (not an input)", async ({ page }) => {
      // The email is rendered as a styled <div>, not an <input>.
      // Verify the user's email is visible on the page.
      const emailDisplay = page.locator(".bg-muted").filter({ hasText: "@" });
      await expect(emailDisplay).toBeVisible();

      // Confirm there is no editable email input field
      const emailInput = page.locator("input[type='email']");
      await expect(emailInput).toHaveCount(0);
    });

    test("TC-10-03: save button is present", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /save changes/i })
      ).toBeVisible();
    });
  });

  test.describe("Form Interactions", () => {
    test("TC-10-04: save button disabled when form not dirty", async ({ page }) => {
      const saveBtn = page.getByRole("button", { name: /save changes/i });
      await expect(saveBtn).toBeDisabled();
    });

    test("TC-10-05: save button enables when name changed", async ({ page }) => {
      const nameInput = page.getByLabel(/name/i).first();
      await nameInput.fill("Changed Name");
      const saveBtn = page.getByRole("button", { name: /save changes/i });
      await expect(saveBtn).toBeEnabled();
    });

    test("TC-10-06: name too short shows validation error", async ({ page }) => {
      const nameInput = page.getByLabel(/name/i).first();
      await nameInput.fill("A");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(
        page.getByText(/at least 2/i).first()
      ).toBeVisible();
    });

    test("TC-10-07: name too long shows validation error", async ({ page }) => {
      const nameInput = page.getByLabel(/name/i).first();
      await nameInput.fill("A".repeat(101));
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(
        page.getByText(/less than 100/i).first()
      ).toBeVisible();
    });
  });

  test.describe("Breadcrumbs", () => {
    test("TC-10-08: breadcrumb shows Account > Profile", async ({ page }) => {
      await expect(page.getByText(/account/i).first()).toBeVisible();
      await expect(page.getByText(/profile/i).first()).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests (real profile updates)
  // ---------------------------------------------------------------------------

  test.describe("Profile Update", () => {
    const UPDATED_NAME = `E2E Updated ${Date.now()}`;

    test("TC-10-09: update name, verify success, and confirm persistence after reload", async ({
      page,
    }) => {
      const nameInput = page.getByLabel(/name/i).first();
      const saveBtn = page.getByRole("button", { name: /save changes/i });

      // Step 1 — Change the name to a unique value
      await nameInput.clear();
      await nameInput.fill(UPDATED_NAME);
      await expect(saveBtn).toBeEnabled();

      // Step 2 — Submit and wait for success toast
      await saveBtn.click();
      await expect(
        page.getByText(/profile updated successfully/i)
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Step 3 — Save button should be disabled again (form reset to clean)
      // After a successful server action + revalidation the form re-renders
      // with the new value as the default, so isDirty becomes false.
      await expect(saveBtn).toBeDisabled({ timeout: TEST_CONFIG.timeouts.action });

      // Step 4 — Hard reload and verify the name persisted
      await page.reload();
      await expect(page.getByText("Profile Information")).toBeVisible();
      const reloadedValue = await page.getByLabel(/name/i).first().inputValue();
      expect(reloadedValue).toBe(UPDATED_NAME);
    });

    test("TC-10-10: restore original name after update", async ({ page }) => {
      const nameInput = page.getByLabel(/name/i).first();
      const saveBtn = page.getByRole("button", { name: /save changes/i });

      // Restore the canonical test user name so subsequent tests are unaffected
      await nameInput.clear();
      await nameInput.fill(TEST_CONFIG.user.name);
      await expect(saveBtn).toBeEnabled();

      await saveBtn.click();
      await expect(
        page.getByText(/profile updated successfully/i)
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Confirm persistence
      await page.reload();
      await expect(page.getByText("Profile Information")).toBeVisible();
      const restoredValue = await page.getByLabel(/name/i).first().inputValue();
      expect(restoredValue).toBe(TEST_CONFIG.user.name);
    });

    test("TC-10-11: email field cannot be edited", async ({ page }) => {
      // The email is rendered as plain text inside a div, not as an input.
      // Verify the email text is present and that no email input exists.
      const emailText = page.locator(".bg-muted").filter({ hasText: "@" });
      await expect(emailText).toBeVisible();
      const emailContent = await emailText.textContent();
      expect(emailContent?.trim()).toBeTruthy();

      // Double-check: no <input> element with type="email" exists in the form
      const emailInputs = page.locator("input[type='email']");
      await expect(emailInputs).toHaveCount(0);
    });
  });
});
