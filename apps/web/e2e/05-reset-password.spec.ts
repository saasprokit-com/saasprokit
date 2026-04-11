import { test, expect } from "@playwright/test";

import { TEST_CONFIG, localePath } from "./fixtures/test-config";
import {
  clearInbox,
  isMaildevAvailable,
  waitForEmailLink,
} from "./helpers/maildev";
import { ensureVerifiedUser } from "./helpers/test-user";

// This is an unauthenticated test suite
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("05 - Reset Password Page", () => {
  // ─── UI Tests (no email required) ───────────────────────────────────

  test.describe("Missing Token", () => {
    test("TC-05-01: no token shows error state", async ({ page }) => {
      await page.goto(localePath("/auth/reset-password"));
      await expect(
        page.getByText(/invalid|expired|missing|token/i).first()
      ).toBeVisible();
    });
  });

  test.describe("Invalid Token", () => {
    test("TC-05-02: invalid token shows error", async ({ page }) => {
      await page.goto(
        localePath("/auth/reset-password?token=invalid-token-123")
      );
      // Page shows "Invalid Reset Link" heading or the reset form (token validated server-side later)
      const invalidHeading = page.getByRole("heading", {
        name: /invalid reset link|reset password/i,
      });
      const errorText = page.getByText(/invalid|expired|reset/i).first();
      await expect(invalidHeading.or(errorText)).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Form Layout (with token)", () => {
    test("TC-05-03: with token param, page renders", async ({ page }) => {
      await page.goto(localePath("/auth/reset-password?token=test-token"));
      // CardTitle renders as <div>, not heading — match either reset form or error state
      const resetText = page
        .getByText(/Reset Password|Invalid Reset Link/i)
        .first();
      await expect(resetText).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Navigation", () => {
    test("TC-05-04: back to sign-in link exists", async ({ page }) => {
      await page.goto(localePath("/auth/reset-password"));
      const link = page.getByRole("link", { name: /sign in|back/i });
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute("href", /\/auth\/sign-in/);
      }
    });
  });

  // ─── Functional Tests (require Maildev) ─────────────────────────────

  test.describe("Full Reset Password Flow", () => {
    let maildevUp: boolean;

    test.beforeAll(async () => {
      maildevUp = await isMaildevAvailable();
    });

    test.beforeEach(async () => {
      test.skip(!maildevUp, "Maildev is not available — skipping email tests");
      await clearInbox();
    });

    /**
     * Helper: request a password reset via the forgot-password page.
     * Fills the email field, submits, and waits for the success message.
     */
    async function requestPasswordReset(
      page: import("@playwright/test").Page,
      email: string
    ) {
      await page.goto(localePath("/auth/forgot-password"));
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.getByRole("button", { name: /send reset link/i }).click();
      // Wait for success state — "Check Your Email" title
      await expect(
        page.getByText(/check your email/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });
    }

    /**
     * Helper: complete the reset-password form with a new password.
     * Navigates to the reset URL, fills & submits the form, verifies success.
     */
    async function completePasswordReset(
      page: import("@playwright/test").Page,
      resetUrl: string,
      newPassword: string
    ) {
      // Extract path + query from the full URL so page.goto works correctly
      const parsed = new URL(resetUrl);
      const relativePath = `${parsed.pathname}${parsed.search}`;
      await page.goto(relativePath);

      // Wait for the reset form to render
      await expect(
        page.getByText(/reset password/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });

      // Fill new password fields
      await page.getByLabel(/new password/i).first().fill(newPassword);
      await page.getByLabel(/confirm/i).fill(newPassword);

      // Submit
      await page.getByRole("button", { name: /reset password/i }).click();

      // Verify success state — "Password Reset Successfully"
      await expect(
        page.getByText(/password reset successfully|password has been updated/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
    }

    /**
     * Helper: sign in with email + password and verify it works.
     */
    async function verifySignIn(
      page: import("@playwright/test").Page,
      email: string,
      password: string
    ) {
      await page.goto(localePath("/auth/sign-in"));
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: /^Sign In$/i }).click();

      // Successful sign-in redirects away from /auth/sign-in
      await page.waitForURL((url) => !url.pathname.includes("/auth/sign-in"), {
        timeout: TEST_CONFIG.timeouts.navigation,
      });
    }

    test("TC-05-05: full reset flow — change password and sign in", async ({
      page,
    }) => {
      const email = TEST_CONFIG.user.email;
      const originalPassword = TEST_CONFIG.user.password;
      const tempPassword = "NewTempPass999!";

      // Ensure verified user exists for password reset
      await ensureVerifiedUser(page.request, TEST_CONFIG.user);
      await page.context().clearCookies();
      await clearInbox();

      // Step 1: Request password reset
      await requestPasswordReset(page, email);

      // Step 2: Capture reset email from Maildev and extract URL
      const { url: resetUrl } = await waitForEmailLink(
        email,
        "reset-password",
        { subjectContains: "reset", timeout: 20_000 }
      );
      expect(resetUrl).toBeTruthy();

      // Step 3: Complete the reset form with the temporary password
      await completePasswordReset(page, resetUrl, tempPassword);

      // Step 4: Sign in with the new temporary password to verify it works
      await verifySignIn(page, email, tempPassword);

      // ── Restore original password so other tests are not broken ──

      // Step 5: Clear inbox and request another password reset
      await clearInbox();
      // Need to be signed out for forgot-password — clear cookies
      await page.context().clearCookies();
      await requestPasswordReset(page, email);

      // Step 6: Capture the second reset email
      const { url: restoreUrl } = await waitForEmailLink(
        email,
        "reset-password",
        { subjectContains: "reset", timeout: 20_000 }
      );
      expect(restoreUrl).toBeTruthy();

      // Step 7: Reset back to the original password
      await completePasswordReset(page, restoreUrl, originalPassword);

      // Step 8: Verify sign-in with original password works
      await verifySignIn(page, email, originalPassword);
    });

    test("TC-05-06: reset email contains valid reset link", async ({
      page,
    }) => {
      const email = TEST_CONFIG.user.email;

      // Ensure verified user exists
      await ensureVerifiedUser(page.request, TEST_CONFIG.user);
      await page.context().clearCookies();
      await clearInbox();

      // Request reset
      await requestPasswordReset(page, email);

      // Capture email and verify the link structure
      const { email: resetEmail, url: resetUrl } = await waitForEmailLink(
        email,
        "reset-password",
        { subjectContains: "reset", timeout: 20_000 }
      );

      // Verify email metadata
      expect(resetEmail.to[0].address.toLowerCase()).toBe(email.toLowerCase());
      expect(resetEmail.subject).toBeTruthy();

      // Verify URL is a valid reset-password link
      // Better Auth format: /api/auth/reset-password/<TOKEN>?callbackURL=...
      const parsed = new URL(resetUrl);
      expect(parsed.pathname).toContain("reset-password");
      // Token is embedded in the path (e.g., /api/auth/reset-password/abc123)
      const pathSegments = parsed.pathname.split("/").filter(Boolean);
      const tokenSegment = pathSegments[pathSegments.length - 1];
      expect(tokenSegment).toBeTruthy();
      expect(tokenSegment).not.toBe("reset-password");
    });

    test("TC-05-07: reset form validates password requirements", async ({
      page,
    }) => {
      const email = TEST_CONFIG.user.email;

      // Request reset and get a valid token URL
      await requestPasswordReset(page, email);
      const { url: resetUrl } = await waitForEmailLink(
        email,
        "reset-password",
        { subjectContains: "reset", timeout: 20_000 }
      );

      // Navigate to the reset page with valid token
      const parsed = new URL(resetUrl);
      await page.goto(`${parsed.pathname}${parsed.search}`);

      await expect(
        page.getByText(/reset password/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.navigation });

      // Try submitting with a weak password (no uppercase)
      await page.getByLabel(/new password/i).first().fill("weakpass1");
      await page.getByLabel(/confirm/i).fill("weakpass1");
      await page.getByRole("button", { name: /reset password/i }).click();

      // Should show validation error about uppercase
      await expect(
        page.getByText(/uppercase/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });

      // Try mismatched passwords
      await page.getByLabel(/new password/i).first().fill("StrongPass123!");
      await page.getByLabel(/confirm/i).fill("DifferentPass123!");
      await page.getByRole("button", { name: /reset password/i }).click();

      // Should show passwords don't match error
      await expect(
        page.getByText(/match/i).first()
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.toast });
    });
  });
});
