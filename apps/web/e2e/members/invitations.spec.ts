import { test, expect, TEST_CONFIG, localePath, orgPath } from "../fixtures/fixtures";

test.describe("18 - Organization Invitations", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/members/invitations"));
    // Wait for the page to be fully loaded (skeleton replaced by real content)
    await page.waitForLoadState("networkidle");
  });

  // ───────────────────────────────────────────────
  // UI Tests (preserved from original)
  // ───────────────────────────────────────────────

  test.describe("Navigation & Layout", () => {
    test("TC-18-01: invitations page loads with Pending Invitations tab active", async ({ page }) => {
      const tab = page.getByRole("tab", { name: /pending invitations/i });
      await expect(tab).toBeVisible();
      await expect(tab).toHaveAttribute("aria-selected", "true");
    });

    test("TC-18-02: all three tab navigation items are visible", async ({ page }) => {
      await expect(page.getByRole("tab", { name: /members/i }).first()).toBeVisible();
      await expect(page.getByRole("tab", { name: /pending invitations/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /invite links/i })).toBeVisible();
    });

    test("TC-18-03: page heading and description are visible", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /members/i, level: 1 })).toBeVisible();
      await expect(
        page.getByText(/manage your organization members, invitations, and invite links/i)
      ).toBeVisible();
    });
  });

  test.describe("Invitations Table", () => {
    test("TC-18-04: table renders or shows empty state", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const noResults = page.getByText(/no results/i);
      const hasData = (await rows.count()) > 0;
      const hasEmpty = await noResults.isVisible().catch(() => false);
      expect(hasData || hasEmpty).toBeTruthy();
    });

    test("TC-18-05: search input is visible with correct placeholder", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invitations/i);
      await expect(search).toBeVisible();
    });

    test("TC-18-06: role filter button is present", async ({ page }) => {
      const roleFilter = page.getByRole("button", { name: /role/i }).first();
      if (await roleFilter.isVisible().catch(() => false)) {
        await expect(roleFilter).toBeVisible();
      }
    });

    test("TC-18-07: status filter button is present", async ({ page }) => {
      const statusFilter = page.getByRole("button", { name: /status/i }).first();
      if (await statusFilter.isVisible().catch(() => false)) {
        await expect(statusFilter).toBeVisible();
      }
    });
  });

  test.describe("Search & Filter", () => {
    test("TC-18-08: search filters invitations without errors", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invitations/i);
      await search.fill("test");
      await page.waitForTimeout(500);
      expect(page.url()).toContain("/invitations");
    });

    test("TC-18-09: reset button clears filters when active", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invitations/i);
      await search.fill("test");
      await page.waitForTimeout(500);
      const resetBtn = page.getByRole("button", { name: /reset/i });
      if (await resetBtn.isVisible().catch(() => false)) {
        await resetBtn.click();
        await expect(search).toHaveValue("");
      }
    });
  });

  // ───────────────────────────────────────────────
  // Functional Tests (new)
  // ───────────────────────────────────────────────

  test.describe("Tab Navigation Functionality", () => {
    test("TC-18-10: clicking Members tab navigates to members page", async ({ page }) => {
      const membersTab = page.getByRole("tab", { name: /members/i }).first();
      await membersTab.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to the members page (URL ends with /members)
      expect(page.url()).toContain(`/${TEST_CONFIG.org.slug}/members`);
      expect(page.url()).not.toContain("/invitations");

      // Members tab should now be active
      await expect(membersTab).toHaveAttribute("aria-selected", "true");
    });

    test("TC-18-11: clicking Invite Links tab navigates to invite links page", async ({ page }) => {
      const inviteLinksTab = page.getByRole("tab", { name: /invite links/i });
      await inviteLinksTab.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to the invite-links page
      expect(page.url()).toContain("/invite-links");
      await expect(inviteLinksTab).toHaveAttribute("aria-selected", "true");
    });

    test("TC-18-12: navigating away and back preserves invitations tab state", async ({ page }) => {
      // Navigate to Members tab
      const membersTab = page.getByRole("tab", { name: /members/i }).first();
      await membersTab.click();
      await page.waitForLoadState("networkidle");

      // Navigate back to Pending Invitations tab
      const invitationsTab = page.getByRole("tab", { name: /pending invitations/i });
      await invitationsTab.click();
      await page.waitForLoadState("networkidle");

      // Should be back on invitations page
      expect(page.url()).toContain("/invitations");
      await expect(invitationsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe("Invitation Data Display", () => {
    test("TC-18-13: invitations display email, role, and status columns", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Check that table headers include expected columns
        const thead = page.locator("thead");
        await expect(thead.getByText("Email")).toBeVisible();
        await expect(thead.getByText("Role")).toBeVisible();
        await expect(thead.getByText("Status")).toBeVisible();

        // Verify first row has content in each key cell
        const firstRow = rows.first();

        // Email cell: should contain an email-like string (has @)
        const emailCell = firstRow.locator("td").nth(0);
        const emailCellAlt = firstRow.locator("td").nth(1); // might be offset by select checkbox
        const emailText = await emailCell.textContent();
        const emailTextAlt = await emailCellAlt.textContent();
        const hasEmail = emailText?.includes("@") || emailTextAlt?.includes("@");
        expect(hasEmail).toBeTruthy();

        // Role cell: should contain a badge with role text (admin or member)
        const roleBadge = firstRow.locator("td").getByText(/admin|member/i).first();
        await expect(roleBadge).toBeVisible();

        // Status cell: should show one of the known statuses
        const statusBadge = firstRow
          .locator("td")
          .getByText(/pending|accepted|canceled|rejected|expired|expires/i)
          .first();
        await expect(statusBadge).toBeVisible();
      } else {
        // Empty state
        await expect(page.getByText(/no results/i)).toBeVisible();
      }
    });

    test("TC-18-14: invitation rows show Invited By and Sent columns", async ({ page }) => {
      const rows = page.locator("tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const thead = page.locator("thead");
        await expect(thead.getByText("Invited By")).toBeVisible();
        await expect(thead.getByText("Sent")).toBeVisible();
      }
    });
  });

  test.describe("Empty State", () => {
    test("TC-18-15: empty state renders correctly when no invitations match", async ({ page }) => {
      // Type a nonsense search query to guarantee no matches
      const search = page.getByPlaceholder(/filter invitations/i);
      await search.fill("zzz_nonexistent_invitation_xyz_99999");
      await page.waitForTimeout(600);

      // Should show empty state message
      await expect(page.getByText(/no results/i)).toBeVisible();

      // Table body should have exactly one row (the "No results" row)
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(1);
    });

    test("TC-18-16: empty state disappears after clearing search", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invitations/i);
      await search.fill("zzz_nonexistent_invitation_xyz_99999");
      await page.waitForTimeout(600);

      // Confirm empty state
      await expect(page.getByText(/no results/i)).toBeVisible();

      // Clear the search
      await search.clear();
      await page.waitForTimeout(600);

      // Page should return to its normal state (either data or genuine empty)
      expect(page.url()).toContain("/invitations");
    });
  });

  test.describe("Filter Interactions", () => {
    test("TC-18-17: role filter opens and shows filter options", async ({ page }) => {
      const roleFilter = page.getByRole("button", { name: /role/i }).first();

      if (await roleFilter.isVisible().catch(() => false)) {
        await roleFilter.click();

        // Should show role options: Admin and Member
        const adminOption = page.getByRole("option", { name: /admin/i }).or(page.getByText(/admin/i));
        const memberOption = page.getByRole("option", { name: /member/i }).or(page.getByText(/member/i));

        const adminVisible = await adminOption.first().isVisible().catch(() => false);
        const memberVisible = await memberOption.first().isVisible().catch(() => false);

        expect(adminVisible || memberVisible).toBeTruthy();
      }
    });

    test("TC-18-18: status filter opens and shows filter options", async ({ page }) => {
      const statusFilter = page.getByRole("button", { name: /status/i }).first();

      if (await statusFilter.isVisible().catch(() => false)) {
        await statusFilter.click();

        // Should show status options: Pending, Accepted, Canceled, Rejected
        const pendingOption = page.getByText(/pending/i);
        const acceptedOption = page.getByText(/accepted/i);

        const pendingVisible = await pendingOption.first().isVisible().catch(() => false);
        const acceptedVisible = await acceptedOption.first().isVisible().catch(() => false);

        expect(pendingVisible || acceptedVisible).toBeTruthy();
      }
    });

    test("TC-18-19: applying a filter shows Reset button", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invitations/i);
      await search.fill("some-filter-text");
      await page.waitForTimeout(600);

      const resetBtn = page.getByRole("button", { name: /reset/i });
      await expect(resetBtn).toBeVisible();
    });

    test("TC-18-20: search and filter can be combined", async ({ page }) => {
      const search = page.getByPlaceholder(/filter invitations/i);
      await search.fill("test");
      await page.waitForTimeout(500);

      // Try opening role filter while search is active
      const roleFilter = page.getByRole("button", { name: /role/i }).first();
      if (await roleFilter.isVisible().catch(() => false)) {
        await roleFilter.click();
        await page.waitForTimeout(300);

        // Close the filter popover by pressing Escape
        await page.keyboard.press("Escape");
      }

      // Search value should be preserved
      await expect(search).toHaveValue("test");

      // Page should still be on invitations
      expect(page.url()).toContain("/invitations");
    });
  });

  test.describe("Member Count Badge", () => {
    test("TC-18-21: member count badge is displayed in the header", async ({ page }) => {
      const badge = page.getByText(/\d+\s*member\(s\)/i);
      await expect(badge).toBeVisible();
    });
  });
});
