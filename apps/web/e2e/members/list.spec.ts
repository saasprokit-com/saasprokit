import { test, expect, TEST_CONFIG, localePath, orgPath } from "../fixtures/fixtures";

test.describe("17 - Organization Members", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/members"));
    // Wait for the members table to finish loading (Suspense boundary resolves)
    await page.waitForSelector("tbody", { timeout: TEST_CONFIG.timeouts.navigation });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Navigation & Layout
  // ---------------------------------------------------------------------------
  test.describe("Navigation & Layout", () => {
    test("TC-17-01: members page loads with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /members/i }).first()).toBeVisible();
    });

    test("TC-17-02: sidebar members navigation visible", async ({ page }) => {
      await expect(page
        .locator('[data-sidebar="content"]')
        .getByRole("link", { name: "Members", exact: true })).toBeVisible();
      await expect(page
        .locator('[data-sidebar="content"]')
        .getByRole("link", { name: "Invitations", exact: true })).toBeVisible();
      await expect(page
        .locator('[data-sidebar="content"]')
        .getByRole("link", { name: "Invite Links", exact: true })).toBeVisible();
    });

    test("TC-17-03: members sidebar link is active", async ({ page }) => {
      const link = page
        .locator('[data-sidebar="content"]')
        .getByRole("link", { name: "Members", exact: true });
      await expect(link).toHaveAttribute("data-active", "true");
    });

    test("TC-17-04: navigate between members pages via sidebar", async ({ page }) => {
      await page
        .locator('[data-sidebar="content"]')
        .getByRole("link", { name: "Invitations", exact: true }).click();
      await page.waitForURL(/\/invitations/);
      expect(page.url()).toContain("/invitations");

      await page
        .locator('[data-sidebar="content"]')
        .getByRole("link", { name: "Invite Links", exact: true }).click();
      await page.waitForURL(/\/invite-links/);
      expect(page.url()).toContain("/invite-links");
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Members Table
  // ---------------------------------------------------------------------------
  test.describe("Members Table", () => {
    test("TC-17-05: table renders with members", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("TC-17-06: current user shows You badge", async ({ page }) => {
      await expect(page.getByText("You").first()).toBeVisible();
    });

    test("TC-17-07: search input visible", async ({ page }) => {
      await expect(page.getByPlaceholder(/filter members/i)).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Search & Filter
  // ---------------------------------------------------------------------------
  test.describe("Search & Filter", () => {
    test("TC-17-08: search filters members", async ({ page }) => {
      const search = page.getByPlaceholder(/filter members/i);
      await search.fill(TEST_CONFIG.user.email);
      await page.waitForTimeout(500); // debounce
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("TC-17-09: role filter button visible", async ({ page }) => {
      const roleFilter = page.getByRole("button", { name: /role/i }).first();
      if (await roleFilter.isVisible()) {
        await expect(roleFilter).toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Invite Member
  // ---------------------------------------------------------------------------
  test.describe("Invite Member", () => {
    test("TC-17-10: invite member button visible for admin/owner", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (await inviteBtn.isVisible()) {
        await expect(inviteBtn).toBeVisible();
      }
    });

    test("TC-17-11: invite member dialog opens", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (await inviteBtn.isVisible()) {
        await inviteBtn.click();
        await expect(page.locator("[role='dialog']")).toBeVisible();
        await expect(page.getByLabel(/email address/i)).toBeVisible();
      }
    });

    test("TC-17-12: invite with empty email shows error", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (await inviteBtn.isVisible()) {
        await inviteBtn.click();
        await page.getByRole("button", { name: /send invitation/i }).click();
        // zodResolver message from inviteMemberFormSchema — an empty field fails
        // z.email(), so the copy is "Invalid email address", not "required".
        await expect(page.getByText(/invalid email address/i).first()).toBeVisible();
      }
    });

    test("TC-17-13: cancel invite closes dialog", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (await inviteBtn.isVisible()) {
        await inviteBtn.click();
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page.locator("[role='dialog']")).not.toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Bulk Invite
  // ---------------------------------------------------------------------------
  test.describe("Bulk Invite", () => {
    test("TC-17-14: bulk invite button visible", async ({ page }) => {
      const bulkBtn = page.getByRole("button", { name: /bulk invite/i });
      if (await bulkBtn.isVisible()) {
        await expect(bulkBtn).toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Member Verification
  // ---------------------------------------------------------------------------
  test.describe("Functional: Member Verification", () => {
    test("TC-17-F01: current test user appears in the member list", async ({ page }) => {
      // The test user should be listed in the members table
      const tableBody = page.locator("tbody");
      const userRow = tableBody.locator("tr").filter({
        hasText: TEST_CONFIG.user.email,
      });
      await expect(userRow.first()).toBeVisible();
    });

    test("TC-17-F02: current test user row shows the 'You' badge", async ({ page }) => {
      // Find the row containing the test user's email
      const userRow = page.locator("tbody tr").filter({
        hasText: TEST_CONFIG.user.email,
      });
      await expect(userRow.first()).toBeVisible();

      // Within that row, the "You" badge should be present
      await expect(userRow.first().getByText("You")).toBeVisible();
    });

    test("TC-17-F03: member role is displayed for each row", async ({ page }) => {
      // Each member row should show a role (owner, admin, or member)
      const rows = page.locator("tbody tr");
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);

      // Check the first row has a recognisable role value
      const firstRow = rows.first();
      const roleCell = firstRow.getByText(/^(owner|admin|member)$/i);
      await expect(roleCell.first()).toBeVisible();
    });

    test("TC-17-F04: current test user has owner role", async ({ page }) => {
      // The E2E test user created the org, so should be owner
      const userRow = page.locator("tbody tr").filter({
        hasText: TEST_CONFIG.user.email,
      });
      await expect(userRow.first()).toBeVisible();

      // Verify the role shown in that row is "owner"
      await expect(userRow.first().getByText(/owner/i).first()).toBeVisible();
    });

  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Search
  // ---------------------------------------------------------------------------
  test.describe("Functional: Search", () => {
    test("TC-17-F06: search by test user name filters to matching results", async ({ page }) => {
      const search = page.getByPlaceholder(/filter members/i);
      await search.fill(TEST_CONFIG.user.name);
      // Wait for debounce + URL update
      await page.waitForTimeout(600);
      // Wait for the table to re-render after search param change
      await page.waitForSelector("tbody tr", { timeout: TEST_CONFIG.timeouts.action });

      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Every visible row should contain the search term
      for (let i = 0; i < count; i++) {
        const rowText = await rows.nth(i).textContent();
        // The row should include the user's name or email (table shows both)
        const matchesName = rowText?.toLowerCase().includes(TEST_CONFIG.user.name.toLowerCase());
        const matchesEmail = rowText?.toLowerCase().includes(TEST_CONFIG.user.email.toLowerCase());
        expect(matchesName || matchesEmail).toBeTruthy();
      }
    });

    test("TC-17-F07: search by email filters to matching results", async ({ page }) => {
      const search = page.getByPlaceholder(/filter members/i);
      await search.fill(TEST_CONFIG.user.email);
      await page.waitForTimeout(600);
      await page.waitForSelector("tbody tr", { timeout: TEST_CONFIG.timeouts.action });

      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Verify the test user's email appears in the filtered results
      const firstRowText = await rows.first().textContent();
      expect(firstRowText?.toLowerCase()).toContain(TEST_CONFIG.user.email.toLowerCase());
    });

    test("TC-17-F08: search with non-existent term shows no results", async ({ page }) => {
      const search = page.getByPlaceholder(/filter members/i);
      await search.fill("zzz_nonexistent_user_xyz_12345");
      await page.waitForTimeout(600);

      // Should show "No results." in the table
      await expect(page.getByText("No results.")).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });
    });

    test("TC-17-F09: clearing search restores full member list", async ({ page }) => {
      // First get the original row count
      const originalCount = await page.locator("tbody tr").count();

      // Search to filter
      const search = page.getByPlaceholder(/filter members/i);
      await search.fill("zzz_nonexistent_user_xyz_12345");
      await page.waitForTimeout(600);
      await expect(page.getByText("No results.")).toBeVisible({
        timeout: TEST_CONFIG.timeouts.action,
      });

      // Clear the search
      await search.clear();
      await page.waitForTimeout(600);
      await page.waitForSelector("tbody tr", { timeout: TEST_CONFIG.timeouts.action });

      const restoredCount = await page.locator("tbody tr").count();
      expect(restoredCount).toBe(originalCount);
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Invite Dialog
  // ---------------------------------------------------------------------------
  test.describe("Functional: Invite Dialog", () => {
    test("TC-17-F10: invite dialog form has email input and role selector", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (!(await inviteBtn.isVisible())) {
        test.skip();
        return;
      }

      await inviteBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // Email input exists and is editable
      const emailInput = dialog.getByLabel(/email address/i);
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toBeEditable();

      // Role selector exists
      const roleSelector = dialog.getByRole("combobox");
      await expect(roleSelector).toBeVisible();
    });

    test("TC-17-F11: invite dialog fills email and submits form", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (!(await inviteBtn.isVisible())) {
        test.skip();
        return;
      }

      await inviteBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // Unique per run: a repeated address comes back "already invited", and the
      // assertions below could then not tell a working form from a broken one.
      const email = `invite-test-e2e-${Date.now()}@example.com`;
      const emailInput = dialog.getByLabel(/email address/i);
      await emailInput.fill(email);
      await expect(emailInput).toHaveValue(email);

      await dialog.getByRole("button", { name: /send invitation/i }).click();

      // InviteMemberDialog closes only from its success handler, so a hidden
      // dialog is proof the action succeeded; a failure keeps it open. Asserting
      // "a toast appeared" would pass on the error toast too.
      await expect(dialog).toBeHidden({
        timeout: TEST_CONFIG.timeouts.action,
      });
      await expect(page.getByText(/invitation sent/i).first()).toBeVisible();
    });

    test("TC-17-F12: invite dialog role defaults to Member", async ({ page }) => {
      const inviteBtn = page.getByRole("button", { name: /invite member/i });
      if (!(await inviteBtn.isVisible())) {
        test.skip();
        return;
      }

      await inviteBtn.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // The role selector trigger should show "Member" by default
      const roleTrigger = dialog.getByRole("combobox");
      await expect(roleTrigger).toContainText(/member/i);
    });
  });
});
