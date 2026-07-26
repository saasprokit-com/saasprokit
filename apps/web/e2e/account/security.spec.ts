import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Account Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/security"));
  });

  test("Should see password fields, the 2FA section, and the sessions list When accessing the security page", async ({
    page,
  }) => {
    await expect(
      page.locator("input[autocomplete='current-password']")
    ).toBeVisible();
    await expect(
      page.locator("input[autocomplete='new-password']").first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /change password/i })
    ).toBeVisible();
    await expect(page.getByText(/active sessions/i).first()).toBeVisible();
  });

  test("Should succeed both times When the password is changed and changed back", async ({
    page,
  }) => {
    const currentPw = page.locator("input[autocomplete='current-password']");
    const newPw = page.locator("input[autocomplete='new-password']").first();
    const confirmPw = page
      .locator("input[autocomplete='new-password']")
      .last();
    const submitBtn = page.getByRole("button", { name: /change password/i });

    const originalPassword = TEST_CONFIG.user.password;
    const temporaryPassword = "TempNewPass456!";

    await currentPw.fill(originalPassword);
    await newPw.fill(temporaryPassword);
    await confirmPw.fill(temporaryPassword);
    await submitBtn.click();
    await expect(
      page.getByText(/password changed successfully/i).first()
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });
    await expect(currentPw).toHaveValue("");

    await currentPw.fill(temporaryPassword);
    await newPw.fill(originalPassword);
    await confirmPw.fill(originalPassword);
    await submitBtn.click();
    await expect(
      page.getByText(/password changed successfully/i).first()
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });
    await expect(currentPw).toHaveValue("");
  });
});
