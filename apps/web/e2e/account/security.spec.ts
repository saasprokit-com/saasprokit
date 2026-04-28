import { test, expect, TEST_CONFIG, localePath } from "../fixtures/fixtures";

test.describe("11 - Account Security", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/security"));
  });

  test.describe("Change Password Section", () => {
    test("TC-11-01: change password form renders", async ({ page }) => {
      await expect(page.getByText(/change password/i).first()).toBeVisible();
      await expect(page.locator("input[autocomplete='current-password']")).toBeVisible();
      await expect(page.locator("input[autocomplete='new-password']").first()).toBeVisible();
    });

    test("TC-11-02: empty current password shows error", async ({ page }) => {
      const newPw = page.locator("input[autocomplete='new-password']").first();
      const confirmPw = page.locator("input[autocomplete='new-password']").last();
      await newPw.fill("NewPass123!");
      await confirmPw.fill("NewPass123!");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/current password.*required|required/i).first()).toBeVisible();
    });

    test("TC-11-03: new password too short shows error", async ({ page }) => {
      await page.locator("input[autocomplete='current-password']").fill("OldPass123");
      const newPw = page.locator("input[autocomplete='new-password']").first();
      await newPw.fill("Ab1");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/at least 8/i).first()).toBeVisible();
    });

    test("TC-11-04: passwords do not match shows error", async ({ page }) => {
      await page.locator("input[autocomplete='current-password']").fill("OldPass123");
      const newPw = page.locator("input[autocomplete='new-password']").first();
      const confirmPw = page.locator("input[autocomplete='new-password']").last();
      await newPw.fill("ValidPass1");
      await confirmPw.fill("DifferentPass1");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/match/i).first()).toBeVisible();
    });

    test("TC-11-05: new password same as current shows error", async ({ page }) => {
      await page.locator("input[autocomplete='current-password']").fill("SamePass123");
      const newPw = page.locator("input[autocomplete='new-password']").first();
      const confirmPw = page.locator("input[autocomplete='new-password']").last();
      await newPw.fill("SamePass123");
      await confirmPw.fill("SamePass123");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/different|same/i).first()).toBeVisible();
    });

    test("TC-11-06: wrong current password shows error", async ({ page }) => {
      const currentPw = page.locator("input[autocomplete='current-password']");
      const newPw = page.locator("input[autocomplete='new-password']").first();
      const confirmPw = page.locator("input[autocomplete='new-password']").last();

      await currentPw.fill("WrongPassword999!");
      await newPw.fill("BrandNewPass123!");
      await confirmPw.fill("BrandNewPass123!");

      await page.getByRole("button", { name: /change password/i }).click();

      // Should show an error toast or inline error about incorrect current password
      await expect(
        page.getByText(/incorrect|invalid|wrong|current password/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });
    });

    test("TC-11-07: change password successfully and change back", async ({ page }) => {
      const currentPw = page.locator("input[autocomplete='current-password']");
      const newPw = page.locator("input[autocomplete='new-password']").first();
      const confirmPw = page.locator("input[autocomplete='new-password']").last();
      const submitBtn = page.getByRole("button", { name: /change password/i });

      const originalPassword = TEST_CONFIG.user.password;
      const temporaryPassword = "TempNewPass456!";

      // --- Step 1: Change password to temporary password ---
      await currentPw.fill(originalPassword);
      await newPw.fill(temporaryPassword);
      await confirmPw.fill(temporaryPassword);
      await submitBtn.click();

      // Wait for success toast
      await expect(
        page.getByText(/password changed successfully/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Form should be reset after success
      await expect(currentPw).toHaveValue("");

      // --- Step 2: Change password BACK to the original ---
      // Small wait for form to fully reset and any session updates to settle
      await page.waitForTimeout(1000);

      await currentPw.fill(temporaryPassword);
      await newPw.fill(originalPassword);
      await confirmPw.fill(originalPassword);
      await submitBtn.click();

      // Wait for success toast again
      await expect(
        page.getByText(/password changed successfully/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Confirm form is reset again
      await expect(currentPw).toHaveValue("");
    });
  });

  test.describe("Sessions Manager", () => {
    test("TC-11-12: sessions list renders", async ({ page }) => {
      await expect(page.getByText(/active sessions/i).first()).toBeVisible();
    });

    test("TC-11-13: current session has Current badge", async ({ page }) => {
      await expect(page.getByText(/current/i).first()).toBeVisible();
    });

    test("TC-11-14: current session has no logout button", async ({ page }) => {
      const currentSession = page.locator("[class*='session'], tr, li").filter({ hasText: /current/i }).first();
      if (await currentSession.isVisible()) {
        const logoutBtn = currentSession.getByRole("button", { name: /logout/i });
        await expect(logoutBtn).not.toBeVisible();
      }
    });

    test("TC-11-15: at least one session is visible", async ({ page }) => {
      // Wait for sessions to load
      await expect(page.getByText(/active sessions/i).first()).toBeVisible();

      // There should be at least the current session displayed
      // Sessions are typically shown in a list/card with device or browser info
      const sessionItems = page.locator("[class*='session'], tr, li").filter({
        hasText: /current|chrome|firefox|safari|edge|browser|device|mac|windows|linux/i,
      });
      await expect(sessionItems.first()).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
      const count = await sessionItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Two-Factor Authentication", () => {
    test("TC-11-21: 2FA section renders", async ({ page }) => {
      await expect(page.getByText(/two-factor authentication/i).first()).toBeVisible();
    });

    test("TC-11-22: 2FA shows enable or reconfigure button", async ({ page }) => {
      const enableBtn = page.getByRole("button", { name: /enable 2fa/i });
      const reconfigureBtn = page.getByRole("button", { name: /reconfigure 2fa/i });
      const hasBtn = await enableBtn.isVisible() || await reconfigureBtn.isVisible();
      expect(hasBtn).toBeTruthy();
    });

    test("TC-11-23: enable 2FA opens dialog", async ({ page }) => {
      const enableBtn = page.getByRole("button", { name: /enable 2fa/i });
      if (await enableBtn.isVisible()) {
        await enableBtn.click();
        await expect(page.getByText(/enable two-factor/i).first()).toBeVisible();
        // Password input should be shown
        await expect(page.locator("input#enable-password, input[type='password']").first()).toBeVisible();
      }
    });

    test("TC-11-24: enable 2FA - empty password disables continue", async ({ page }) => {
      const enableBtn = page.getByRole("button", { name: /enable 2fa/i });
      if (await enableBtn.isVisible()) {
        await enableBtn.click();
        const continueBtn = page.getByRole("button", { name: /continue/i });
        await expect(continueBtn).toBeDisabled();
      }
    });

    test("TC-11-25: enable 2FA - cancel closes dialog", async ({ page }) => {
      const enableBtn = page.getByRole("button", { name: /enable 2fa/i });
      if (await enableBtn.isVisible()) {
        await enableBtn.click();
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page.locator("[role='dialog']").filter({ hasText: /enable two-factor/i })).not.toBeVisible();
      }
    });
  });

  test.describe("Breadcrumbs", () => {
    test("TC-11-41: breadcrumb shows Account > Security", async ({ page }) => {
      await expect(page.getByText(/security/i).first()).toBeVisible();
    });
  });
});
