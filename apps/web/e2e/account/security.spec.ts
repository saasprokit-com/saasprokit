import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test("Should see the change-password form, 2FA section, and sessions list When accessing the security page", async ({
  page,
}) => {
  await page.goto(localePath("/account/security"));

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
