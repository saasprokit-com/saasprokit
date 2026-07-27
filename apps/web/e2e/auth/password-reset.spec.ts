import {
  clearInbox,
  isMaildevAvailable,
  waitForEmail,
  waitForEmailLink,
} from "../helpers/maildev";
import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";
import { ensureVerifiedUser } from "../helpers/test-user";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Password Reset", () => {
  let maildevUp: boolean;

  test.beforeAll(async () => {
    maildevUp = await isMaildevAvailable();
  });

  test("Should see the forgot-password form When accessing the forgot-password page", async ({ page }) => {
    await page.goto(localePath("/auth/forgot-password"));
    await expect(page.getByText("Forgot Password")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send Reset Link/i })
    ).toBeVisible();
  });

  test("Should see the confirmation and receive a reset email When a password reset is requested", async ({
    page,
  }) => {
    test.skip(!maildevUp, "Maildev is not available");
    await ensureVerifiedUser(page.request, TEST_CONFIG.user);
    await page.context().clearCookies();
    await clearInbox();

    await page.goto(localePath("/auth/forgot-password"));
    await page
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_CONFIG.user.email);
    await page.getByRole("button", { name: /Send Reset Link/i }).click();

    await expect(
      page.getByText("Check Your Email", { exact: true })
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });

    const email = await waitForEmail(TEST_CONFIG.user.email, {
      subjectContains: "reset",
      timeout: TEST_CONFIG.timeouts.navigation,
    });
    expect(email.to[0].address.toLowerCase()).toBe(
      TEST_CONFIG.user.email.toLowerCase()
    );
  });

  test("Should sign in with the restored password When the full reset-and-restore flow completes", async ({
    page,
  }) => {
    test.skip(!maildevUp, "Maildev is not available");

    const resetUser = {
      name: "E2E Reset User",
      email: `e2e-reset-${Date.now()}@example.com`,
      password: "OriginalPass123!",
    };
    const tempPassword = "NewTempPass999!";

    const { verified } = await ensureVerifiedUser(page.request, resetUser);
    expect(verified).toBe(true);
    await page.context().clearCookies();
    await clearInbox();

    async function requestReset(email: string) {
      await page.goto(localePath("/auth/forgot-password"));
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.getByRole("button", { name: /send reset link/i }).click();
      await expect(
        page.getByText(/check your email/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
    }

    async function completeReset(resetUrl: string, newPassword: string) {
      const parsed = new URL(resetUrl);
      await page.goto(`${parsed.pathname}${parsed.search}`);
      await expect(
        page.getByText(/reset password/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
      await page.getByLabel(/new password/i).first().fill(newPassword);
      await page.getByLabel(/confirm/i).fill(newPassword);
      await page.getByRole("button", { name: /reset password/i }).click();
      await expect(
        page
          .getByText(/password reset successfully|password has been updated/i)
          .first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
    }

    async function verifySignIn(email: string, password: string) {
      await page.goto(localePath("/auth/sign-in"));
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: /^Sign In$/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/auth/"), {
        timeout: 30_000,
      });
    }

    await requestReset(resetUser.email);
    const { url: resetUrl } = await waitForEmailLink(
      resetUser.email,
      "reset-password",
      { subjectContains: "reset", timeout: 20_000 }
    );
    await completeReset(resetUrl, tempPassword);
    await verifySignIn(resetUser.email, tempPassword);

    await page.context().clearCookies();
    await clearInbox();
    await requestReset(resetUser.email);
    const { url: restoreUrl } = await waitForEmailLink(
      resetUser.email,
      "reset-password",
      { subjectContains: "reset", timeout: 20_000 }
    );
    await completeReset(restoreUrl, resetUser.password);
    await verifySignIn(resetUser.email, resetUser.password);
  });
});
