import { test, expect, TEST_CONFIG, localePath } from "./fixtures/fixtures";

test.describe("13 - Account New Organization", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/new-org"));
  });

  // ---------------------------------------------------------------------------
  // UI Tests (existing)
  // ---------------------------------------------------------------------------

  test.describe("Form Display", () => {
    test("TC-13-01: renders new workspace page", async ({ page }) => {
      // May show form or upgrade prompt
      const form = page.getByText(/new workspace|create workspace/i).first();
      const upgrade = page
        .getByText(/upgrade required|organization limit/i)
        .first();
      await expect(form.or(upgrade)).toBeVisible();
    });

    test("TC-13-02: auto-generates slug from name", async ({ page }) => {
      const nameInput = page.getByLabel(/workspace name/i);
      const slugInput = page.getByLabel(/workspace url/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("My Test Org");
        // Wait for React to re-render after slug auto-generation
        await expect(slugInput).toHaveValue("my-test-org", { timeout: 3000 });
      }
    });

    test("TC-13-03: slug stops auto-generating after manual edit", async ({
      page,
    }) => {
      const nameInput = page.getByLabel(/workspace name/i);
      const slugInput = page.getByLabel(/workspace url/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("First Name");
        // Wait for auto-slug to populate
        await expect(slugInput).toHaveValue("first-name", { timeout: 3000 });
        // Manual edit sets slugTouched = true
        await slugInput.fill("custom-slug");
        await nameInput.fill("Second Name");
        // Slug should stay as manually entered value
        await expect(slugInput).toHaveValue("custom-slug");
      }
    });

    test("TC-13-04: reset button clears form", async ({ page }) => {
      const nameInput = page.getByLabel(/workspace name/i);
      const resetBtn = page.getByRole("button", { name: /reset/i });
      if ((await nameInput.isVisible()) && (await resetBtn.isVisible())) {
        await nameInput.fill("Test");
        await resetBtn.click();
        await expect(nameInput).toHaveValue("");
      }
    });
  });

  test.describe("Validation", () => {
    test("TC-13-05: name too short shows error", async ({ page }) => {
      const nameInput = page.getByLabel(/workspace name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("A");
        await page.getByRole("button", { name: /create workspace/i }).click();
        await expect(
          page.getByText(/at least 2|too short/i).first()
        ).toBeVisible();
      }
    });

    test("TC-13-06: empty slug shows error", async ({ page }) => {
      const nameInput = page.getByLabel(/workspace name/i);
      const slugInput = page.getByLabel(/workspace url/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("Valid Name");
        await slugInput.clear();
        await page.getByRole("button", { name: /create workspace/i }).click();
        await expect(
          page.getByText(/slug|required/i).first()
        ).toBeVisible();
      }
    });
  });

  test.describe("Upgrade Prompt", () => {
    test("TC-13-07: shows upgrade or form based on eligibility", async ({
      page,
    }) => {
      const form = page.getByRole("button", { name: /create workspace/i });
      const upgradeCard = page
        .getByText(/upgrade required|organization limit/i)
        .first();
      const hasContent =
        (await form.isVisible()) || (await upgradeCard.isVisible());
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("Breadcrumbs", () => {
    test("TC-13-08: breadcrumb visible", async ({ page }) => {
      await expect(page.getByText(/new workspace/i).first()).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests
  // ---------------------------------------------------------------------------

  test.describe("Create Organization Flow", () => {
    let createdOrgName: string;
    let createdOrgSlug: string;

    test("TC-13-09: creates a new organization and redirects to its dashboard", async ({
      page,
    }) => {
      const nameInput = page.getByLabel(/workspace name/i);

      // Skip if form is not available (upgrade required)
      if (!(await nameInput.isVisible())) {
        test.skip();
        return;
      }

      const slugInput = page.getByLabel(/workspace url/i);
      const timestamp = Date.now();
      createdOrgName = `E2E Org ${timestamp}`;

      // Fill the organization name
      await nameInput.fill(createdOrgName);

      // Verify slug auto-generates from the name
      createdOrgSlug = `e2e-org-${timestamp}`;
      await expect(slugInput).toHaveValue(createdOrgSlug, { timeout: 3000 });

      // Verify the slug preview shows the expected slug
      await expect(
        page.getByText(`/${createdOrgSlug}`, { exact: false })
      ).toBeVisible();

      // Submit the form
      await page.getByRole("button", { name: /create workspace/i }).click();

      // Wait for redirect to the new org dashboard
      await page.waitForURL(`**/${createdOrgSlug}`, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Verify we landed on the org dashboard
      await expect(
        page.getByRole("heading", { name: createdOrgName })
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });

      // Verify dashboard content shows correct slug
      await expect(page.getByText(createdOrgSlug)).toBeVisible();

      // Verify "Organization Dashboard" subtitle is present
      await expect(page.getByText("Organization Dashboard")).toBeVisible();
    });

    test("TC-13-10: newly created organization dashboard shows owner role", async ({
      page,
    }) => {
      const nameInput = page.getByLabel(/workspace name/i);

      if (!(await nameInput.isVisible())) {
        test.skip();
        return;
      }

      const slugInput = page.getByLabel(/workspace url/i);
      const timestamp = Date.now();
      const orgName = `E2E Owner ${timestamp}`;

      await nameInput.fill(orgName);

      // Wait for slug to auto-generate
      await expect(slugInput).not.toHaveValue("", { timeout: 3000 });

      // Submit and wait for redirect
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.waitForURL(/\/e2e-owner-/, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Creator should be assigned the "owner" role
      await expect(page.getByText("Owner").first()).toBeVisible({
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Member count should be 1 (just the creator)
      await expect(page.getByText("1").first()).toBeVisible();
    });

    test("TC-13-11: success toast appears after creating organization", async ({
      page,
    }) => {
      const nameInput = page.getByLabel(/workspace name/i);

      if (!(await nameInput.isVisible())) {
        test.skip();
        return;
      }

      const timestamp = Date.now();
      const orgName = `E2E Toast ${timestamp}`;

      await nameInput.fill(orgName);

      // Wait for slug to auto-generate
      const slugInput = page.getByLabel(/workspace url/i);
      await expect(slugInput).not.toHaveValue("", { timeout: 3000 });

      // Submit
      await page.getByRole("button", { name: /create workspace/i }).click();

      // Verify success toast
      await expect(
        page.getByText(/workspace created successfully/i)
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });
    });

    test("TC-13-12: can navigate to newly created org via direct URL", async ({
      page,
    }) => {
      const nameInput = page.getByLabel(/workspace name/i);

      if (!(await nameInput.isVisible())) {
        test.skip();
        return;
      }

      const timestamp = Date.now();
      const orgName = `E2E Nav ${timestamp}`;
      const expectedSlug = `e2e-nav-${timestamp}`;

      await nameInput.fill(orgName);

      const slugInput = page.getByLabel(/workspace url/i);
      await expect(slugInput).toHaveValue(expectedSlug, { timeout: 3000 });

      // Create the org
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.waitForURL(`**/${expectedSlug}`, {
        timeout: TEST_CONFIG.timeouts.navigation,
      });

      // Navigate away to account page
      await page.goto(localePath("/account"));
      await page.waitForLoadState("networkidle");

      // Navigate back to the org via direct URL
      await page.goto(localePath(`/${expectedSlug}`));

      // Verify the org dashboard loads correctly
      await expect(
        page.getByRole("heading", { name: orgName })
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
    });

    test("TC-13-13: duplicate slug shows field error", async ({ page }) => {
      const nameInput = page.getByLabel(/workspace name/i);

      if (!(await nameInput.isVisible())) {
        test.skip();
        return;
      }

      const slugInput = page.getByLabel(/workspace url/i);

      // Use the existing test org slug which should already exist
      await nameInput.fill("Duplicate Org Test");
      await slugInput.fill(TEST_CONFIG.org.slug);

      await page.getByRole("button", { name: /create workspace/i }).click();

      // Should show a slug conflict error (field-level or toast)
      const fieldError = page.getByText(/already|taken|exists|slug/i).first();
      await expect(fieldError).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });
  });
});
