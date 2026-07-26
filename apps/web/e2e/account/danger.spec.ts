import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";
import { ensureVerifiedUser } from "../helpers/test-user";

test("Should delete the account and be unable to sign in again When account deletion is confirmed", async ({
  browser,
}) => {
  // A dedicated throwaway user, never the shared TEST_CONFIG.user — it owns no
  // organization, so the deleteUser.beforeDelete hook won't block deletion.
  const context = await browser.newContext();
  const page = await context.newPage();

  const timestamp = Date.now();
  const throwawayEmail = `e2e-delete-${timestamp}@example.com`;
  const throwawayPassword = "DeleteMe123!";
  const throwawayName = "Delete Me";

  // requireEmailVerification is on: sign-up alone doesn't establish a session,
  // and an unverified sign-in returns 403 EMAIL_NOT_VERIFIED. ensureVerifiedUser
  // verifies via Maildev and leaves page.request signed in with a fresh session.
  const user = {
    name: throwawayName,
    email: throwawayEmail,
    password: throwawayPassword,
  };
  const { verified } = await ensureVerifiedUser(page.request, user);
  expect(verified).toBe(true);

  await page.goto(localePath("/account/danger"));
  await page.getByRole("button", { name: /delete my account/i }).click();
  await expect(
    page.getByText(/permanently delete account/i).first()
  ).toBeVisible();

  await page
    .locator("input[type='checkbox']#acknowledge, [role='checkbox']")
    .first()
    .click();

  const deleteBtn = page.getByRole("button", {
    name: /delete account permanently/i,
  });
  await expect(deleteBtn).toBeEnabled();
  await deleteBtn.click();

  await page.waitForURL(
    (url) =>
      url.pathname === "/" ||
      url.pathname.includes("/auth/sign-in") ||
      url.pathname === `/${TEST_CONFIG.locale}`,
    { timeout: TEST_CONFIG.timeouts.navigation }
  );

  // Send the Origin header so this reaches credential validation: the page
  // context already carries a locale cookie, and Better Auth's CSRF check
  // rejects cookie-bearing POSTs without Origin (403) BEFORE checking
  // credentials — which would make `ok() === false` pass even if the account
  // still existed. With Origin present, a 401 genuinely means "deleted account
  // can no longer sign in".
  const retrySignIn = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: process.env.BASE_URL || "http://localhost:3000" },
    data: { email: throwawayEmail, password: throwawayPassword },
  });
  expect(retrySignIn.ok()).toBe(false);
  expect(retrySignIn.status()).toBe(401);

  await context.close();
});
