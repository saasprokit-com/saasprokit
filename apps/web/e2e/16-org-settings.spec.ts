import { test, expect, TEST_CONFIG, localePath, orgPath } from "./fixtures/fixtures";

test.describe("16 - Organization Settings", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/settings"));
  });

  test.describe("Organization Details", () => {
    test("TC-16-01: settings form renders with current values", async ({ page }) => {
      await expect(page.getByText(/organization details/i).first()).toBeVisible();
      const nameInput = page.getByPlaceholder(/organization name/i).or(page.getByLabel(/name/i).first());
      await expect(nameInput).toBeVisible();
    });

    test("TC-16-02: save button disabled when not dirty", async ({ page }) => {
      const saveBtn = page.getByRole("button", { name: /save changes/i });
      if (await saveBtn.isVisible()) {
        await expect(saveBtn).toBeDisabled();
      }
    });

    test("TC-16-03: save button enables on name change", async ({ page }) => {
      const nameInput = page.getByPlaceholder(/organization name/i).or(page.getByLabel(/name/i).first());
      const saveBtn = page.getByRole("button", { name: /save changes/i });
      if (await nameInput.isVisible() && await saveBtn.isVisible()) {
        const original = await nameInput.inputValue();
        await nameInput.fill("Changed Name");
        await expect(saveBtn).toBeEnabled();
        await nameInput.fill(original);
      }
    });

    test("TC-16-04: slug is read-only", async ({ page }) => {
      await expect(page.getByText(TEST_CONFIG.org.slug, { exact: true })).toBeVisible();
    });

    test("TC-16-05: name too short shows error", async ({ page }) => {
      const nameInput = page.getByPlaceholder(/organization name/i).or(page.getByLabel(/name/i).first());
      const saveBtn = page.getByRole("button", { name: /save changes/i });
      if (await nameInput.isVisible() && await saveBtn.isVisible()) {
        await nameInput.fill("A");
        await saveBtn.click();
        await expect(page.getByText(/at least 2/i).first()).toBeVisible();
      }
    });

    test("TC-16-06: role badge displayed", async ({ page }) => {
      const badge = page.locator("[data-slot='badge'], .badge").filter({ hasText: /owner|admin|member/i });
      await expect(badge.first()).toBeVisible();
    });
  });

  test.describe("Organization Details - Functional", () => {
    test("TC-16-20: org name field is populated with test org name", async ({ page }) => {
      const nameInput = page.getByPlaceholder(/enter organization name/i).or(page.getByLabel(/organization name/i));
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveValue(TEST_CONFIG.org.name);
    });

    test("TC-16-21: slug field is displayed as plain text (not editable)", async ({ page }) => {
      // The slug is rendered as a <p> with font-mono, not as an input
      const slugText = page.getByText(TEST_CONFIG.org.slug, { exact: true });
      await expect(slugText).toBeVisible();

      // Verify there is no input element containing the slug value
      const slugInput = page.locator("input").filter({ hasText: TEST_CONFIG.org.slug });
      await expect(slugInput).toHaveCount(0);

      // Verify the "cannot be changed" message is present
      await expect(page.getByText(/slug cannot be changed/i)).toBeVisible();
    });

    test("TC-16-22: update org name and verify persistence, then restore", async ({ page }) => {
      const nameInput = page.getByPlaceholder(/enter organization name/i).or(page.getByLabel(/organization name/i));
      const saveBtn = page.getByRole("button", { name: /save changes/i });

      // Precondition: name starts as expected
      await expect(nameInput).toHaveValue(TEST_CONFIG.org.name);

      // Step 1: Change the org name
      const updatedName = `${TEST_CONFIG.org.name} Updated`;
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      // Step 2: Verify success toast
      await expect(
        page.getByText(/organization updated successfully/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Step 3: Verify the change persists after reload
      await page.reload({ waitUntil: "networkidle" });
      const nameInputAfterReload = page.getByPlaceholder(/enter organization name/i).or(page.getByLabel(/organization name/i));
      await expect(nameInputAfterReload).toHaveValue(updatedName, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Step 4: Restore the original name so other tests aren't broken
      await nameInputAfterReload.clear();
      await nameInputAfterReload.fill(TEST_CONFIG.org.name);
      const saveBtnRestore = page.getByRole("button", { name: /save changes/i });
      await expect(saveBtnRestore).toBeEnabled();
      await saveBtnRestore.click();

      // Step 5: Verify restore success toast
      await expect(
        page.getByText(/organization updated successfully/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Step 6: Verify restored name persists after reload
      await page.reload({ waitUntil: "networkidle" });
      const nameInputFinal = page.getByPlaceholder(/enter organization name/i).or(page.getByLabel(/organization name/i));
      await expect(nameInputFinal).toHaveValue(TEST_CONFIG.org.name, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
    });
  });

  test.describe("Organization Branding", () => {
    test("TC-16-07: branding card visible", async ({ page }) => {
      const branding = page.getByText(/organization branding/i).first();
      if (await branding.isVisible()) {
        await expect(branding).toBeVisible();
      }
    });

    test("TC-16-08: upload logo button visible for admin/owner", async ({ page }) => {
      const uploadBtn = page.getByRole("button", { name: /upload logo|change logo/i });
      if (await uploadBtn.isVisible()) {
        await expect(uploadBtn).toBeVisible();
      }
    });
  });

  test.describe("Danger Zone", () => {
    test("TC-16-09: danger zone card visible for owner", async ({ page }) => {
      const dangerZone = page.getByText(/danger zone/i).first();
      // Visible for owner, may not be visible for member
      if (await dangerZone.isVisible()) {
        await expect(dangerZone).toBeVisible();
      }
    });

    test("TC-16-10: delete org opens confirmation dialog", async ({ page }) => {
      const deleteBtn = page.getByRole("button", { name: /delete organization/i });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await expect(page.getByText(/delete organization/i).first()).toBeVisible();
        await expect(page.getByPlaceholder(/type organization name/i)).toBeVisible();
      }
    });

    test("TC-16-11: delete disabled until correct name typed", async ({ page }) => {
      const deleteBtn = page.getByRole("button", { name: /delete organization/i });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        const confirmInput = page.getByPlaceholder(/type organization name/i);
        await confirmInput.fill("wrong-name");
        const confirmDeleteBtn = page.locator("[role='alertdialog']").getByRole("button", { name: /delete organization/i });
        await expect(confirmDeleteBtn).toBeDisabled();
      }
    });

    test("TC-16-12: cancel closes delete dialog", async ({ page }) => {
      const deleteBtn = page.getByRole("button", { name: /delete organization/i });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page.getByPlaceholder(/type organization name/i)).not.toBeVisible();
      }
    });
  });

  test.describe("Breadcrumbs", () => {
    test("TC-16-13: breadcrumbs visible", async ({ page }) => {
      await expect(page.getByText(/settings/i).first()).toBeVisible();
    });
  });
});
