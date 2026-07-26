import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

// The security page's change-password form is our glue; the actual password
// mutation is Better Auth's `changePassword` (its own guarantee, and its
// endpoint is rate-limited 3/60s per-IP, which makes a functional UI test
// retry-fragile). So this asserts our page renders its parts, not that BA
// changes the password.
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
