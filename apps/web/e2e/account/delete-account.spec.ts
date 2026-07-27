import {
  BASE_URL,
  expect,
  localePath,
  TEST_CONFIG,
  test,
} from "../fixtures/fixtures";
import { ensureVerifiedUser } from "../helpers/test-user";

test("Should delete the account and be unable to sign in again When account deletion is confirmed", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const timestamp = Date.now();
  const throwawayEmail = `e2e-delete-${timestamp}@example.com`;
  const throwawayPassword = "DeleteMe123!";
  const throwawayName = "Delete Me";

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

  const retrySignIn = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: BASE_URL },
    data: { email: throwawayEmail, password: throwawayPassword },
  });
  expect(retrySignIn.ok()).toBe(false);
  expect(retrySignIn.status()).toBe(401);

  await context.close();
});
