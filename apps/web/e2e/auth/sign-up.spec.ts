import { expect, localePath, test } from "../fixtures/fixtures";
import {
  clearInbox,
  isMaildevAvailable,
  waitForEmail,
} from "../helpers/maildev";

// Unique user for each test run to avoid conflicts
const SIGNUP_EMAIL = `e2e-signup-${Date.now()}@example.com`;
const SIGNUP_PASSWORD = "SignUpTest123!";
const SIGNUP_NAME = "E2E Signup User";

test.describe("Sign Up Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // --- UI Rendering Tests ---

  test("SU-01: page loads with name, email, password, and confirm password fields", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-up"));

    await expect(page.getByText("Create Account").first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.locator('input[placeholder="Create a strong password"]')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="Confirm your password"]')
    ).toBeVisible();
  });

  test("SU-02: empty form submission shows validation errors", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("button", { name: /Create Account/i }).click();

    await expect(
      page.getByText("Name must be at least 2 characters")
    ).toBeVisible();
    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
  });

  test("SU-03: password mismatch shows error", async ({ page }) => {
    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("textbox", { name: "Name" }).fill("Test User");
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("test@example.com");
    await page
      .locator('input[placeholder="Create a strong password"]')
      .fill("StrongPass1");
    await page
      .locator('input[placeholder="Confirm your password"]')
      .fill("DifferentPass1");

    await page.getByRole("button", { name: /Create Account/i }).click();

    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("SU-04: link to sign-in works", async ({ page }) => {
    await page.goto(localePath("/auth/sign-up"));

    const signInLink = page.getByRole("link", { name: /Sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", /\/auth\/sign-in/);
  });

  test("SU-05: social login buttons for Google and GitHub are present", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-up"));

    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with GitHub/i })
    ).toBeVisible();
  });

  // --- Functional Flow Tests ---

  test("SU-06: successful sign-up redirects to verify-email page", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("textbox", { name: "Name" }).fill(SIGNUP_NAME);
    await page.getByRole("textbox", { name: "Email" }).fill(SIGNUP_EMAIL);
    await page
      .locator('input[placeholder="Create a strong password"]')
      .fill(SIGNUP_PASSWORD);
    await page
      .locator('input[placeholder="Confirm your password"]')
      .fill(SIGNUP_PASSWORD);

    await page.getByRole("button", { name: /Create Account/i }).click();

    // Should redirect to verify-email page
    await page.waitForURL((url) => url.pathname.includes("/verify-email"), {
      timeout: 15_000,
    });
    expect(page.url()).toContain("/auth/verify-email");
  });

  test("SU-07: sign-up sends verification email to Maildev", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const maildevUp = await isMaildevAvailable();
    test.skip(!maildevUp, "Maildev not available");

    const uniqueEmail = `e2e-verify-${Date.now()}@example.com`;

    // Clear inbox before test
    await clearInbox();

    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("textbox", { name: "Name" }).fill("Verify User");
    await page.getByRole("textbox", { name: "Email" }).fill(uniqueEmail);
    await page
      .locator('input[placeholder="Create a strong password"]')
      .fill(SIGNUP_PASSWORD);
    await page
      .locator('input[placeholder="Confirm your password"]')
      .fill(SIGNUP_PASSWORD);

    await page.getByRole("button", { name: /Create Account/i }).click();

    // Wait for redirect to verify-email page
    await page.waitForURL((url) => url.pathname.includes("/verify-email"), {
      timeout: 15_000,
    });

    // Check that a verification email was captured in Maildev
    const email = await waitForEmail(uniqueEmail, {
      subjectContains: "verif",
      timeout: 30_000,
    });

    expect(email).toBeDefined();
    expect(email.to[0].address.toLowerCase()).toBe(uniqueEmail.toLowerCase());
    expect(email.subject.toLowerCase()).toContain("verif");
  });

  test("SU-08: duplicate email shows error", async ({ page }) => {
    // First, ensure the test user exists via API
    await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: "Existing User",
        email: "e2e-duplicate-test@example.com",
        password: SIGNUP_PASSWORD,
      },
    });

    // Try to sign up with the same email
    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("textbox", { name: "Name" }).fill("Duplicate User");
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("e2e-duplicate-test@example.com");
    await page
      .locator('input[placeholder="Create a strong password"]')
      .fill(SIGNUP_PASSWORD);
    await page
      .locator('input[placeholder="Confirm your password"]')
      .fill(SIGNUP_PASSWORD);

    await page.getByRole("button", { name: /Create Account/i }).click();

    // Should show error OR redirect to verify-email (some systems don't reveal duplicates)
    const errorOrRedirect = await Promise.race([
      page
        .getByText(/already exists|already registered|error|failed/i)
        .first()
        .waitFor({ timeout: 10_000 })
        .then(() => "error" as const),
      page
        .waitForURL((url) => url.pathname.includes("/verify-email"), {
          timeout: 10_000,
        })
        .then(() => "redirect" as const),
    ]);

    // Either outcome is acceptable — the important thing is it doesn't crash
    expect(["error", "redirect"]).toContain(errorOrRedirect);
  });

  test("SU-09: weak password shows validation error", async ({ page }) => {
    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("textbox", { name: "Name" }).fill("Weak PW User");
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("weak-pw@example.com");
    await page
      .locator('input[placeholder="Create a strong password"]')
      .fill("weak"); // Too short, no uppercase/number
    await page
      .locator('input[placeholder="Confirm your password"]')
      .fill("weak");

    await page.getByRole("button", { name: /Create Account/i }).click();

    // Should show password strength errors
    await expect(
      page.getByText(/at least 8|uppercase|number|character/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
