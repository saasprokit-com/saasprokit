import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test("Should render the 2FA verification form When visiting /auth/2fa without a pending session", async ({
  page,
}) => {
  await page.goto(localePath("/auth/2fa"));

  await expect(
    page.getByText(/two-factor authentication/i).first()
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/2fa/);
});
