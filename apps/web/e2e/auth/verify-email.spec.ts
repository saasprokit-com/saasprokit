import { postAuth } from "../helpers/auth-api";
import { isMaildevAvailable, waitForEmail } from "../helpers/maildev";
import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test("Should see a resend button When the email query param is present", async ({
  page,
}) => {
  await page.goto(localePath("/auth/verify-email?email=test@example.com"));
  await expect(
    page.getByRole("button", { name: /resend verification email/i })
  ).toBeVisible();
});

test("Should receive a new verification email and see a success toast When resend is clicked", async ({
  page,
}) => {
  const available = await isMaildevAvailable();
  test.skip(!available, "Maildev is not available");

  const uniqueId = `verify-${Date.now()}`;
  const testEmail = `${uniqueId}@test.local`;
  const signUpRes = await postAuth(page.request, "/api/auth/sign-up/email", {
    email: testEmail,
    password: "TestPassword123!",
    name: "Verify E2E User",
  });
  expect(signUpRes.ok()).toBeTruthy();

  await page.goto(
    localePath(`/auth/verify-email?email=${encodeURIComponent(testEmail)}`)
  );

  const resendBtn = page.getByRole("button", {
    name: /resend verification email/i,
  });
  const since = Date.now();
  await resendBtn.click();

  const email = await waitForEmail(testEmail, {
    subjectContains: "verif",
    timeout: 15_000,
    since,
  });
  expect(email.to[0].address.toLowerCase()).toBe(testEmail.toLowerCase());

  await expect(page.getByText(/verification email resent/i)).toBeVisible({
    timeout: 10_000,
  });
});
