import { test, expect } from "@playwright/test";
import { localePath } from "./fixtures/test-config";
import { clearInbox, isMaildevAvailable, waitForEmail } from "./helpers/maildev";

// Unauthenticated tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("06 - Verify Email Page", () => {
  // ─── UI Tests (existing) ───────────────────────────────────────────

  test.describe("Page Display", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(localePath("/auth/verify-email"));
    });

    test("TC-06-01: renders verify email page", async ({ page }) => {
      await expect(
        page
          .getByRole("heading", { name: /verify|email|check/i })
          .or(page.getByText(/check your email/i))
      ).toBeVisible();
    });

    test("TC-06-02: resend button is visible when email param present", async ({
      page,
    }) => {
      await page.goto(localePath("/auth/verify-email?email=test@example.com"));
      const resend = page.getByRole("button", { name: /resend/i });
      await expect(resend).toBeVisible();
    });

    test("TC-06-03: resend button is hidden when no email param", async ({
      page,
    }) => {
      const resend = page.getByRole("button", { name: /resend/i });
      await expect(resend).not.toBeVisible();
    });

    test("TC-06-04: displays the email address from query param", async ({
      page,
    }) => {
      const testEmail = "display-test@example.com";
      await page.goto(
        localePath(`/auth/verify-email?email=${encodeURIComponent(testEmail)}`)
      );
      await expect(page.getByText(testEmail)).toBeVisible();
    });

    test("TC-06-05: alternative sign-in methods shown", async ({ page }) => {
      const magicLink = page.getByRole("link", { name: /magic link/i });
      const emailOtp = page.getByRole("link", { name: /email.*otp|otp/i });
      await expect(magicLink).toBeVisible();
      await expect(emailOtp).toBeVisible();
    });

    test("TC-06-06: back to sign in link is visible", async ({ page }) => {
      const backLink = page.getByRole("link", { name: /back to sign in/i });
      await expect(backLink).toBeVisible();
    });
  });

  // ─── Functional Tests (new) ────────────────────────────────────────

  test.describe("Resend Verification Email (functional)", () => {
    let maildevUp: boolean;

    test.beforeAll(async () => {
      maildevUp = await isMaildevAvailable();
    });

    test("TC-06-10: resend verification email is captured in Maildev", async ({
      page,
    }) => {
      test.skip(!maildevUp, "Maildev is not available — skipping");

      // 1. Create a unique test user via sign-up API
      const uniqueId = `verify-${Date.now()}`;
      const testEmail = `${uniqueId}@test.local`;
      const signUpRes = await page.request.post("/api/auth/sign-up/email", {
        data: {
          email: testEmail,
          password: "TestPassword123!",
          name: "Verify E2E User",
        },
      });
      expect(signUpRes.ok()).toBeTruthy();

      // 2. Clear inbox so we only see the resend email
      await clearInbox();

      // 3. Navigate to verify-email page with the email param
      await page.goto(
        localePath(
          `/auth/verify-email?email=${encodeURIComponent(testEmail)}`
        )
      );

      // 4. Click the resend verification email button
      const resendBtn = page.getByRole("button", {
        name: /resend verification email/i,
      });
      await expect(resendBtn).toBeVisible();
      await expect(resendBtn).toBeEnabled();
      await resendBtn.click();

      // 5. Verify the email arrives in Maildev
      const email = await waitForEmail(testEmail, {
        subjectContains: "verif",
        timeout: 15_000,
      });
      expect(email).toBeDefined();
      expect(email.to[0].address.toLowerCase()).toBe(testEmail.toLowerCase());
      expect(email.subject.toLowerCase()).toContain("verif");
    });

    test("TC-06-11: cooldown timer prevents immediate re-send", async ({
      page,
    }) => {
      test.skip(!maildevUp, "Maildev is not available — skipping");

      // 1. Create a unique test user via sign-up API
      const uniqueId = `cooldown-${Date.now()}`;
      const testEmail = `${uniqueId}@test.local`;
      const signUpRes = await page.request.post("/api/auth/sign-up/email", {
        data: {
          email: testEmail,
          password: "TestPassword123!",
          name: "Cooldown E2E User",
        },
      });
      expect(signUpRes.ok()).toBeTruthy();

      // 2. Navigate to verify-email page
      await page.goto(
        localePath(
          `/auth/verify-email?email=${encodeURIComponent(testEmail)}`
        )
      );

      // 3. Click resend — should trigger cooldown
      const resendBtn = page.getByRole("button", {
        name: /resend/i,
      });
      await expect(resendBtn).toBeEnabled();
      await resendBtn.click();

      // 4. Button should become disabled (cooldown active)
      await expect(resendBtn).toBeDisabled({ timeout: 5_000 });

      // 5. Button text should show countdown timer (e.g. "Resend in 59s")
      await expect(resendBtn).toContainText(/resend in \d+s/i, {
        timeout: 5_000,
      });
    });

    test("TC-06-12: success message appears after resend", async ({
      page,
    }) => {
      test.skip(!maildevUp, "Maildev is not available — skipping");

      // 1. Create a unique test user via sign-up API
      const uniqueId = `success-${Date.now()}`;
      const testEmail = `${uniqueId}@test.local`;
      const signUpRes = await page.request.post("/api/auth/sign-up/email", {
        data: {
          email: testEmail,
          password: "TestPassword123!",
          name: "Success E2E User",
        },
      });
      expect(signUpRes.ok()).toBeTruthy();

      // 2. Navigate and click resend
      await page.goto(
        localePath(
          `/auth/verify-email?email=${encodeURIComponent(testEmail)}`
        )
      );

      const resendBtn = page.getByRole("button", {
        name: /resend verification email/i,
      });
      await resendBtn.click();

      // 3. Success message should appear
      await expect(page.getByText(/verification email resent/i)).toBeVisible({
        timeout: 10_000,
      });
    });
  });
});
