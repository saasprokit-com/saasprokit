import { test, expect } from "@playwright/test";
import { TEST_CONFIG, localePath } from "./fixtures/test-config";
import {
  clearInbox,
  isMaildevAvailable,
  waitForEmailLink,
} from "./helpers/maildev";

// All magic-link tests run unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("08 - Magic Link Page", () => {
  // ─── UI Tests (existing) ─────────────────────────────────────────────

  test.describe("Success State (No Error)", () => {
    test("TC-08-01: default state shows Check Your Email", async ({
      page,
    }) => {
      await page.goto(localePath("/auth/magic-link"));
      await expect(
        page.getByRole("heading", { name: /check your email/i })
      ).toBeVisible();
    });

    test("TC-08-02: success info shows link sent message", async ({
      page,
    }) => {
      await page.goto(localePath("/auth/magic-link"));
      await expect(
        page.getByText(/link sent successfully|sent/i).first()
      ).toBeVisible();
      await expect(
        page.getByText(/expire.*10 minutes|10 minutes/i).first()
      ).toBeVisible();
    });

    test("TC-08-03: try again link navigates to sign-in", async ({ page }) => {
      await page.goto(localePath("/auth/magic-link"));
      const link = page.getByRole("link", { name: /try again/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", /\/auth\/sign-in/);
    });
  });

  test.describe("Error State - Expired", () => {
    test("TC-08-04: expired error shows failure UI", async ({ page }) => {
      await page.goto(localePath("/auth/magic-link?error=expired"));
      await expect(
        page.getByRole("heading", { name: /magic link failed/i })
      ).toBeVisible();
      await expect(page.getByText(/expired/i).first()).toBeVisible();
    });

    test("TC-08-05: back to sign in button on expired", async ({ page }) => {
      await page.goto(localePath("/auth/magic-link?error=expired"));
      const link = page.getByRole("link", { name: /back to sign in/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", /\/auth\/sign-in/);
    });
  });

  test.describe("Error State - Invalid", () => {
    test("TC-08-06: invalid error shows failure UI", async ({ page }) => {
      await page.goto(localePath("/auth/magic-link?error=invalid"));
      await expect(
        page.getByRole("heading", { name: /magic link failed/i })
      ).toBeVisible();
      await expect(page.getByText(/invalid/i).first()).toBeVisible();
    });
  });

  test.describe("Error State - Unknown", () => {
    test("TC-08-07: unknown error shows generic message", async ({ page }) => {
      await page.goto(localePath("/auth/magic-link?error=something_else"));
      await expect(
        page.getByRole("heading", { name: /magic link failed/i })
      ).toBeVisible();
      await expect(
        page.getByText(/error occurred|try again/i).first()
      ).toBeVisible();
    });
  });

  test.describe("Layout", () => {
    test("TC-08-08: page card is visible", async ({ page }) => {
      await page.goto(localePath("/auth/magic-link"));
      const card = page
        .locator("[class*='card'], [data-slot='card']")
        .first();
      await expect(card).toBeVisible();
    });
  });

  // ─── Functional Tests ────────────────────────────────────────────────

  test.describe("Functional - Real Magic Link Flow", () => {
    test.beforeEach(async () => {
      const available = await isMaildevAvailable();
      test.skip(!available, "Maildev is not available — skipping email tests");
      await clearInbox();
    });

    test("TC-08-09: request magic link, receive email, click link, and sign in", async ({
      page,
    }) => {
      // 1. Navigate to the sign-in page
      await page.goto(localePath("/auth/sign-in"));

      // 2. Switch to the Magic Link tab
      const magicLinkTab = page.getByRole("tab", { name: /magic link/i });
      await expect(magicLinkTab).toBeVisible();
      await magicLinkTab.click();

      // 3. Fill in the test user email and submit
      const emailInput = page.getByRole("textbox", { name: /email/i });
      await expect(emailInput).toBeVisible();
      await emailInput.fill(TEST_CONFIG.user.email);

      const sendButton = page.getByRole("button", {
        name: /send magic link/i,
      });
      await sendButton.click();

      // 4. Wait for the success message to appear on the sign-in page
      await expect(
        page.getByText(/check your email for the magic link/i)
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });

      // 5. Wait for the magic link email to arrive in Maildev
      const { email, url: magicLinkUrl } = await waitForEmailLink(
        TEST_CONFIG.user.email,
        "magic-link",
        {
          subjectContains: "sign in",
          timeout: TEST_CONFIG.timeouts.navigation,
        }
      );

      // 6. Verify the email was sent to the correct recipient
      expect(
        email.to.some(
          (t) =>
            t.address.toLowerCase() === TEST_CONFIG.user.email.toLowerCase()
        )
      ).toBe(true);

      // 7. Verify the magic link URL is present and well-formed
      expect(magicLinkUrl).toBeTruthy();
      expect(magicLinkUrl).toContain("magic-link");

      // 8. Navigate to the magic link URL to complete sign-in
      await page.goto(magicLinkUrl);

      // 9. Verify the user is signed in — should be redirected away from auth pages
      await page.waitForURL(
        (url) => !url.pathname.includes("/auth/"),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );

      // Confirm we are no longer on an auth page
      expect(page.url()).not.toContain("/auth/sign-in");
      expect(page.url()).not.toContain("/auth/magic-link?error");
    });

    test("TC-08-10: magic link email is captured in Maildev", async ({
      page,
    }) => {
      // Request a magic link
      await page.goto(localePath("/auth/sign-in"));

      const magicLinkTab = page.getByRole("tab", { name: /magic link/i });
      await magicLinkTab.click();

      const emailInput = page.getByRole("textbox", { name: /email/i });
      await emailInput.fill(TEST_CONFIG.user.email);

      const sendButton = page.getByRole("button", {
        name: /send magic link/i,
      });
      await sendButton.click();

      // Wait for success confirmation
      await expect(
        page.getByText(/check your email for the magic link/i)
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });

      // Verify email arrived in Maildev with a valid link
      const { email, url } = await waitForEmailLink(
        TEST_CONFIG.user.email,
        "magic-link",
        {
          subjectContains: "sign in",
          timeout: TEST_CONFIG.timeouts.navigation,
        }
      );

      expect(email.subject).toBeTruthy();
      expect(url).toContain("magic-link");
      expect(
        email.to.some(
          (t) =>
            t.address.toLowerCase() === TEST_CONFIG.user.email.toLowerCase()
        )
      ).toBe(true);
    });
  });
});
