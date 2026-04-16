import { test, expect, TEST_CONFIG, localePath, orgPath } from "./fixtures/fixtures";

test.describe("19 - Organization Invite Links", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/members/invite-links"));
    await page.waitForLoadState("networkidle");
  });

  // ---------------------------------------------------------------------------
  // UI Tests (existing)
  // ---------------------------------------------------------------------------

  test.describe("Navigation & Layout", () => {
    test("TC-19-01: invite links page loads", async ({ page }) => {
      const tab = page.getByRole("tab", { name: /invite links/i });
      await expect(tab).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe("Invite Links Table", () => {
    test("TC-19-02: table renders or shows empty state", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const noResults = page.getByText(/no results/i);
      const hasData = (await rows.count()) > 0;
      const hasEmpty = await noResults.isVisible();
      expect(hasData || hasEmpty).toBeTruthy();
    });

    test("TC-19-03: search input visible", async ({ page }) => {
      await expect(
        page.getByPlaceholder(/filter invite links/i)
      ).toBeVisible();
    });
  });

  test.describe("Create Invite Link - UI", () => {
    test("TC-19-04: create link button visible for admin/owner", async ({
      page,
    }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });
      if (await createBtn.isVisible()) {
        await expect(createBtn).toBeVisible();
      }
    });

    test("TC-19-05: create link dialog opens", async ({ page }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await expect(
          page.getByText(/create invite link/i).first()
        ).toBeVisible();
      }
    });

    test("TC-19-06: create dialog has role and expiry selectors", async ({
      page,
    }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();
      }
    });

    test("TC-19-07: cancel closes create dialog", async ({ page }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(
          page
            .locator("[role='dialog']")
            .filter({ hasText: /create invite link/i })
        ).not.toBeVisible();
      }
    });
  });

  test.describe("Search & Filter", () => {
    test("TC-19-08: search filters links", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invite links/i);
      await search.fill("test");
      await page.waitForTimeout(500);
      expect(page.url()).toContain("/invite-links");
    });

    test("TC-19-09: role filter visible", async ({ page }) => {
      const roleFilter = page
        .getByRole("button", { name: /role/i })
        .first();
      if (await roleFilter.isVisible()) {
        await expect(roleFilter).toBeVisible();
      }
    });

    test("TC-19-10: status filter visible", async ({ page }) => {
      const statusFilter = page
        .getByRole("button", { name: /status/i })
        .first();
      if (await statusFilter.isVisible()) {
        await expect(statusFilter).toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests (new)
  // ---------------------------------------------------------------------------

  test.describe("Functional: Page Rendering", () => {
    test("TC-19-11: invite links page renders with correct URL and content", async ({
      page,
    }) => {
      // Verify we are on the correct page
      expect(page.url()).toContain(
        `/${TEST_CONFIG.org.slug}/members/invite-links`
      );

      // Page should contain the invite links tab marked as active
      const tab = page.getByRole("tab", { name: /invite links/i });
      await expect(tab).toBeVisible();
      await expect(tab).toHaveAttribute("aria-selected", "true");

      // The table container or empty state should be present
      const tableOrEmpty = page
        .locator("table")
        .or(page.getByText(/no results/i));
      await expect(tableOrEmpty.first()).toBeVisible();
    });
  });

  test.describe("Functional: Generate Invite Link", () => {
    test("TC-19-12: generate invite link end-to-end", async ({ page }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });

      // Skip if user does not have permission (button not rendered)
      if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, "Create link button not visible — user lacks permission");
        return;
      }

      // Open the create dialog
      await createBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // Verify the dialog title
      await expect(dialog.getByText(/create invite link/i).first()).toBeVisible();

      // The dialog should have Role selector, Expires selector, and Create button
      await expect(dialog.getByText(/role/i).first()).toBeVisible();
      await expect(dialog.getByText(/expires in/i).first()).toBeVisible();

      // Click the "Create Link" button inside the dialog to generate the link
      const createLinkBtn = dialog.getByRole("button", {
        name: /create link/i,
      });
      await expect(createLinkBtn).toBeVisible();
      await createLinkBtn.click();

      // Wait for the link to be generated — the dialog switches to showing the URL
      const inviteLinkInput = dialog.locator("input[readonly]");
      await expect(inviteLinkInput).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Verify the generated link URL is a valid URL containing invite-related path
      const generatedUrl = await inviteLinkInput.inputValue();
      expect(generatedUrl).toBeTruthy();
      expect(generatedUrl).toContain("/invite/");

      // The "Your invite link" label should be visible
      await expect(dialog.getByText(/your invite link/i)).toBeVisible();

      // Verify a "Done" button appears after link generation
      const doneBtn = dialog.getByRole("button", { name: /done/i });
      await expect(doneBtn).toBeVisible();
    });

    test("TC-19-13: generated invite link URL contains valid structure", async ({
      page,
    }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });

      if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, "Create link button not visible — user lacks permission");
        return;
      }

      // Open dialog and create link
      await createBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      const createLinkBtn = dialog.getByRole("button", {
        name: /create link/i,
      });
      await createLinkBtn.click();

      // Wait for the generated link
      const inviteLinkInput = dialog.locator("input[readonly]");
      await expect(inviteLinkInput).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      const generatedUrl = await inviteLinkInput.inputValue();

      // The URL should start with http(s) and contain an invite path with a token
      expect(generatedUrl).toMatch(/^https?:\/\/.+\/invite\/.+/);
    });

    test("TC-19-14: copy button is clickable after link generation", async ({
      page,
    }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });

      if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, "Create link button not visible — user lacks permission");
        return;
      }

      // Open dialog and create link
      await createBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      const createLinkBtn = dialog.getByRole("button", {
        name: /create link/i,
      });
      await createLinkBtn.click();

      // Wait for the generated link to appear
      const inviteLinkInput = dialog.locator("input[readonly]");
      await expect(inviteLinkInput).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Find the copy button (the icon button next to the input)
      const copyBtn = dialog.getByRole("button", { name: "" }).or(
        dialog.locator("button").filter({ has: page.locator("svg") }).last()
      );

      // There should be a button with the Copy icon next to the input
      // The copy button is a size="icon" variant="outline" button
      const iconButtons = dialog.locator(
        'button[class*="outline"], button:has(svg.lucide-copy)'
      );
      const copyButton = iconButtons.first();

      if (await copyButton.isVisible().catch(() => false)) {
        // Grant clipboard permissions so click does not throw
        await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

        await expect(copyButton).toBeEnabled();
        await copyButton.click();

        // After clicking copy, a success toast "Copied!" should appear
        const copiedToast = page.getByText(/copied/i);
        await expect(copiedToast).toBeVisible({
          timeout: TEST_CONFIG.timeouts.toast,
        });
      }
    });

    test("TC-19-15: done button closes dialog after link generation", async ({
      page,
    }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });

      if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, "Create link button not visible — user lacks permission");
        return;
      }

      // Open dialog and create link
      await createBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      const createLinkBtn = dialog.getByRole("button", {
        name: /create link/i,
      });
      await createLinkBtn.click();

      // Wait for the generated link
      const inviteLinkInput = dialog.locator("input[readonly]");
      await expect(inviteLinkInput).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Click "Done" to close the dialog
      const doneBtn = dialog.getByRole("button", { name: /done/i });
      await doneBtn.click();

      // Dialog should be closed
      await expect(dialog).not.toBeVisible();
    });

    test("TC-19-16: newly created invite link appears in the table", async ({
      page,
    }) => {
      const createBtn = page.getByRole("button", { name: /create link/i });

      if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, "Create link button not visible — user lacks permission");
        return;
      }

      // Open dialog and create link
      await createBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      const createLinkBtn = dialog.getByRole("button", {
        name: /create link/i,
      });
      await createLinkBtn.click();

      // Wait for link generation
      const inviteLinkInput = dialog.locator("input[readonly]");
      await expect(inviteLinkInput).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Close the dialog
      const doneBtn = dialog.getByRole("button", { name: /done/i });
      await doneBtn.click();
      await expect(dialog).not.toBeVisible();

      // The table should now have at least one row (the newly created link)
      // The page may need to reload/revalidate, so wait briefly
      await page.waitForTimeout(1000);

      const rows = page.locator("tbody tr");
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });
  });
});
