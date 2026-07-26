import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

// /auth/2fa/page.tsx has no server-side guard: it unconditionally renders
// TwoFactorForm regardless of session state. The pending-2FA-session check
// only happens when the form is submitted (verifyTwoFactorAction ->
// auth.api.verifyTOTP), not on page load, and there is no middleware guard
// on this route either (proxy.ts has no /auth/2fa handling). So a fresh
// unauthenticated context visiting /auth/2fa deterministically renders the
// form — it never redirects.
test("Should render the 2FA verification form When visiting /auth/2fa without a pending session", async ({
  page,
}) => {
  await page.goto(localePath("/auth/2fa"));

  await expect(
    page.getByText(/two-factor authentication/i).first()
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/2fa/);
});
