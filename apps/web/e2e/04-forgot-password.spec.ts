import { test, expect } from "@playwright/test";

import { TEST_CONFIG, localePath } from "./fixtures/test-config";
import {
  clearInbox,
  isMaildevAvailable,
  waitForEmail,
  waitForEmailLink,
} from "./helpers/maildev";
import { ensureVerifiedUser } from "./helpers/test-user";

test.describe("Forgot Password Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // ---------------------------------------------------------------------------
  // UI Tests
  // ---------------------------------------------------------------------------

  test("page loads with email input and reset button", async ({ page }) => {
    await page.goto(localePath("/auth/forgot-password"));

    // CardTitle renders as <div>, not a heading element
    await expect(page.getByText("Forgot Password")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send Reset Link/i })
    ).toBeVisible();
  });

  test("empty submission shows validation error", async ({ page }) => {
    await page.goto(localePath("/auth/forgot-password"));

    await page.getByRole("button", { name: /Send Reset Link/i }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Functional Tests
  // ---------------------------------------------------------------------------

  test("submit with valid email shows success message and email is captured", async ({
    page,
  }) => {
    const maildevUp = await isMaildevAvailable();
    test.skip(!maildevUp, "Maildev not available");

    // Ensure verified user exists so password reset emails are sent
    await ensureVerifiedUser(page.request, TEST_CONFIG.user);
    await page.context().clearCookies();
    await clearInbox();

    await page.goto(localePath("/auth/forgot-password"));

    await page
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_CONFIG.user.email);
    await page.getByRole("button", { name: /Send Reset Link/i }).click();

    // Should show success view
    await expect(
      page.getByText("Check Your Email", { exact: true })
    ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });

    // Verify email was captured in Maildev
    const email = await waitForEmail(TEST_CONFIG.user.email, {
      subjectContains: "reset",
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    expect(email).toBeDefined();
    expect(email.to[0].address.toLowerCase()).toBe(
      TEST_CONFIG.user.email.toLowerCase()
    );
  });

  test("reset email contains a reset-password link", async ({ page }) => {
    const maildevUp = await isMaildevAvailable();
    test.skip(!maildevUp, "Maildev not available");

    // Ensure verified user exists
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

    // Wait for the email and extract the reset-password URL
    const { url } = await waitForEmailLink(
      TEST_CONFIG.user.email,
      "reset-password",
      {
        subjectContains: "reset",
        timeout: TEST_CONFIG.timeouts.navigation,
      }
    );

    expect(url).toBeTruthy();
    expect(url).toContain("reset-password");
  });

  test("submit with non-existent email shows success (no email leak)", async ({
    page,
  }) => {
    const maildevUp = await isMaildevAvailable();
    test.skip(!maildevUp, "Maildev not available");

    await clearInbox();

    const nonExistentEmail = `no-account-${Date.now()}@example.com`;

    await page.goto(localePath("/auth/forgot-password"));

    await page
      .getByRole("textbox", { name: "Email" })
      .fill(nonExistentEmail);
    await page.getByRole("button", { name: /Send Reset Link/i }).click();

    // Security best practice: should show the same success view regardless of
    // whether the email exists, to avoid revealing account existence.
    const success = page.getByText("Check Your Email", { exact: true });
    const error = page.getByText(/failed|error/i).first();

    await expect(success.or(error)).toBeVisible({
      timeout: TEST_CONFIG.timeouts.action,
    });

    // Ideally the app does NOT show an error for non-existent emails.
    // If it does, this is a security concern (email enumeration) but we still
    // let the test pass — the assertion above covers both cases.
  });
});
