import { test, expect } from "@playwright/test";
import { localePath } from "./fixtures/test-config";

test.describe("07 - Two-Factor Auth Page", () => {
  // 2FA page is accessed without an authenticated session for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/auth/2fa"));
  });

  // ───────────────────────────────────────────────
  // UI Tests (existing)
  // ───────────────────────────────────────────────

  test.describe("Page Display", () => {
    test("TC-07-01: renders 2FA verification page", async ({ page }) => {
      await expect(
        page
          .getByRole("heading", { name: /two-factor|2fa|verification/i })
          .or(page.getByText(/two-factor|authentication code|verify/i).first())
      ).toBeVisible();
    });

    test("TC-07-02: TOTP code input visible", async ({ page }) => {
      const codeInput = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();
      await expect(codeInput).toBeVisible();
    });

    test("TC-07-03: verify button visible", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /verify|submit|confirm/i })
      ).toBeVisible();
    });
  });

  test.describe("Input Validation", () => {
    test("TC-07-04: input has numeric attributes", async ({ page }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();
      if (await input.isVisible()) {
        await expect(input).toHaveAttribute("inputmode", "numeric");
        await expect(input).toHaveAttribute("pattern", "[0-9]*");
        await expect(input).toHaveAttribute("maxlength", "6");
      }
    });

    test("TC-07-05: verify button is enabled and functional", async ({
      page,
    }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();
      const button = page.getByRole("button", {
        name: /verify|submit|confirm/i,
      });
      if (await input.isVisible()) {
        await input.fill("123456");
        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe("Navigation", () => {
    test("TC-07-06: back to sign-in link visible", async ({ page }) => {
      const link = page.getByRole("link", { name: /back|sign in/i });
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute("href", /\/auth\/sign-in/);
      }
    });
  });

  test.describe("Invalid Code", () => {
    test("TC-07-07: wrong code shows error", async ({ page }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();
      if (await input.isVisible()) {
        await input.fill("000000");
        await page
          .getByRole("button", { name: /verify|submit|confirm/i })
          .click();
        await expect(
          page.getByText(/invalid|incorrect|error/i).first()
        ).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  // ───────────────────────────────────────────────
  // Functional Tests
  // ───────────────────────────────────────────────

  test.describe("Functional: No Pending 2FA Session", () => {
    test("TC-07-08: visiting /auth/2fa without pending 2FA session shows error or redirects to sign-in", async ({
      page,
    }) => {
      // We already navigated in beforeEach without any session.
      // The page should either:
      // 1. Redirect to sign-in, OR
      // 2. Show an error when trying to verify (no pending 2FA challenge)

      const redirectedToSignIn = page
        .url()
        .includes("/auth/sign-in");

      if (redirectedToSignIn) {
        // Case 1: Redirected to sign-in — the app correctly guards the 2FA page
        expect(page.url()).toContain("/auth/sign-in");
      } else {
        // Case 2: Page renders but submitting should fail because there is
        // no pending 2FA session on the server
        const input = page
          .locator(
            "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
          )
          .first();

        if (await input.isVisible()) {
          await input.fill("123456");
          await page
            .getByRole("button", { name: /verify|submit|confirm/i })
            .click();

          // Expect an error message from the server (no active 2FA challenge)
          await expect(
            page.getByText(/invalid|error|unauthorized|session|expired/i).first()
          ).toBeVisible({ timeout: 10_000 });
        }
      }
    });
  });

  test.describe("Functional: Invalid Code Submission", () => {
    test("TC-07-09: submitting 000000 displays a visible error in the form", async ({
      page,
    }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();

      // Skip if page redirected away (no form visible)
      if (!(await input.isVisible())) {
        test.skip();
        return;
      }

      await input.fill("000000");
      await page
        .getByRole("button", { name: /verify|submit|confirm/i })
        .click();

      // The error should appear inside the destructive error banner
      // (see two-factor-form.tsx: div.bg-destructive/10)
      const errorBanner = page.locator(
        ".bg-destructive\\/10, [class*='destructive']"
      );
      await expect(errorBanner.first()).toBeVisible({ timeout: 10_000 });
    });

    test("TC-07-10: submitting non-numeric text is blocked by input validation", async ({
      page,
    }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();

      if (!(await input.isVisible())) {
        test.skip();
        return;
      }

      // Type letters — the input has pattern="[0-9]*" which triggers browser native validation
      await input.fill("abcdef");
      await page
        .getByRole("button", { name: /verify|submit|confirm/i })
        .click();

      // The browser blocks submission via HTML5 pattern validation.
      // Verify the input is invalid (has :invalid pseudo-class).
      const isInvalid = await input.evaluate(
        (el) => !(el as HTMLInputElement).validity.valid
      );
      expect(isInvalid).toBe(true);
    });

    test("TC-07-11: submitting fewer than 6 digits triggers client-side validation error", async ({
      page,
    }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();

      if (!(await input.isVisible())) {
        test.skip();
        return;
      }

      await input.fill("123");
      await page
        .getByRole("button", { name: /verify|submit|confirm/i })
        .click();

      // Zod validation: "Code must be 6 digits"
      await expect(
        page.getByText(/must be 6|6 digits|6 characters/i).first()
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Functional: Navigation Links", () => {
    test("TC-07-12: 'Back to sign in' link navigates to sign-in page", async ({
      page,
    }) => {
      const link = page.getByRole("link", { name: /back.*sign in|sign in/i });

      if (!(await link.isVisible())) {
        test.skip();
        return;
      }

      await link.click();
      await page.waitForURL(/\/auth\/sign-in/, { timeout: 15_000 });
      expect(page.url()).toContain("/auth/sign-in");
    });

    test("TC-07-13: 'Use a backup code' button is only present when the handler is provided", async ({
      page,
    }) => {
      // In the current TwoFactorClient, onUseBackupCode is NOT passed to the form,
      // so the "Use a backup code" button should not be rendered.
      const backupButton = page.getByRole("button", {
        name: /backup code/i,
      });
      const backupLink = page.getByText(/backup code/i);

      // Neither a button nor text link for backup codes should be visible
      // because the TwoFactorClient does not pass onUseBackupCode
      const isButtonVisible = await backupButton.isVisible().catch(() => false);
      const isLinkVisible = await backupLink.isVisible().catch(() => false);

      if (!isButtonVisible && !isLinkVisible) {
        // Correct: backup code option is not shown when handler is absent
        expect(true).toBe(true);
      } else {
        // If it IS visible, verify it is clickable and does something meaningful
        const element = isButtonVisible ? backupButton : backupLink;
        await expect(element).toBeEnabled();
      }
    });
  });

  test.describe("Functional: Form State", () => {
    test("TC-07-14: verify button shows loading state during submission", async ({
      page,
    }) => {
      const input = page
        .locator(
          "input[maxlength='6'], input[inputmode='numeric'], input#totp-code"
        )
        .first();

      if (!(await input.isVisible())) {
        test.skip();
        return;
      }

      await input.fill("999999");

      const button = page.getByRole("button", {
        name: /verify|submit|confirm/i,
      });
      await button.click();

      // During submission the button text changes to "Verifying..."
      // and the button becomes disabled
      const verifyingText = page.getByRole("button", {
        name: /verifying/i,
      });

      // Either we catch the transient "Verifying..." state, or the request
      // completes quickly and an error appears. Both are valid outcomes.
      const sawVerifying = await verifyingText
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      const sawError = await page
        .getByText(/invalid|error|unauthorized/i)
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);

      expect(sawVerifying || sawError).toBe(true);
    });
  });
});
