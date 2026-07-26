import type { Page } from "@playwright/test";
import { expect, orgPath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

/**
 * Opens the Invite Member dialog, retrying the click.
 *
 * The members table has a client/server date-format hydration mismatch (the
 * "Joined" column), which makes React discard and re-render the whole
 * <MembersTable> subtree — including the toolbar's Invite Member button —
 * shortly after load. A click that lands mid-repair can be silently dropped.
 * Retrying the click until the dialog is actually visible rides out that
 * window deterministically, without a fixed sleep.
 */
async function openInviteDialog(page: Page) {
  const dialog = page.getByRole("dialog", { name: /invite member/i });
  await expect(async () => {
    await page.getByRole("button", { name: /invite member/i }).click();
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: TEST_CONFIG.timeouts.action });
  return dialog;
}

test.describe("Members List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/members"));
    await expect(page.locator("tbody")).toBeVisible();
  });

  test("Should see the current user's row with the You badge When accessing the members list", async ({
    page,
  }) => {
    const userRow = page
      .locator("tbody tr")
      .filter({ hasText: TEST_CONFIG.user.email });
    await expect(userRow.first()).toBeVisible();
    await expect(userRow.first().getByText("You")).toBeVisible();
  });

  test("Should navigate between Members, Invitations, and Invite Links When the sidebar links are clicked", async ({
    page,
  }) => {
    const sidebar = page.locator("[data-sidebar='content']");
    await sidebar.getByRole("link", { name: /invitations/i }).click();
    await page.waitForURL(/\/members\/invitations/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    await sidebar.getByRole("link", { name: /invite links/i }).click();
    await page.waitForURL(/\/members\/invite-links/, {
      timeout: TEST_CONFIG.timeouts.navigation,
    });
  });

  test("Should see a validation error When an invalid email is submitted in the invite dialog", async ({
    page,
  }) => {
    const dialog = await openInviteDialog(page);
    // The input is type="email", so a syntactically bare string like
    // "not-an-email" trips the browser's native constraint validation and
    // blocks the submit event before React ever sees it — zodResolver's
    // "Invalid email address" message would never render. "invalid@localhost"
    // has a valid local@domain shape (passes native validation, matching
    // WHATWG's html5Email pattern) but no dot+TLD, so it still fails zod's
    // stricter z.email() regex and reaches the form's own validation error.
    await dialog.getByLabel(/email address/i).fill("invalid@localhost");
    await dialog.getByRole("button", { name: /send invitation/i }).click();
    await expect(
      page.getByText(/invalid email address/i).first()
    ).toBeVisible();
  });

  test("Should show a member-limit error When inviting to a full Free-plan org", async ({
    page,
  }) => {
    // The shared test org is on the Free plan (maxMembers=1) and its owner
    // already fills that seat, so the app's canOrgAddMember seat cap rejects the
    // invite before any invitation is created — no cleanup needed. This exercises
    // our seat-cap glue, the deterministic behavior on the Free-plan test org.
    const dialog = await openInviteDialog(page);
    await dialog
      .getByLabel(/email address/i)
      .fill(`invite-test-e2e-${Date.now()}@example.com`);
    await dialog.getByRole("button", { name: /send invitation/i }).click();

    await expect(
      page.getByText(/reached its member limit/i).first()
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
