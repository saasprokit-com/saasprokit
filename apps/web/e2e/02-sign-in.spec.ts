import { test, expect } from "@playwright/test";
import { TEST_CONFIG, localePath } from "./fixtures/test-config";
import { ensureVerifiedUser } from "./helpers/test-user";

test.describe("Sign In Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // --- UI Rendering Tests ---

  test("page loads with password, magic link, and email OTP tabs", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-in"));

    await expect(page.getByRole("tab", { name: /Password/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Magic Link/i })
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /Email OTP/i })).toBeVisible();

    // Password tab is active by default
    await expect(page.getByRole("tab", { name: /Password/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("empty form submission shows validation errors", async ({ page }) => {
    await page.goto(localePath("/auth/sign-in"));

    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("invalid email format shows error", async ({ page }) => {
    await page.goto(localePath("/auth/sign-in"));

    await page.getByRole("textbox", { name: "Email" }).fill("a@b");
    await page.locator('input[type="password"]').fill("somepassword");
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await expect(
      page.getByText(/valid email|failed|error/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("links to sign-up and forgot-password are present", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-in"));

    const signUpLink = page.getByRole("link", { name: /Sign up/i }).first();
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", /\/auth\/sign-up/);

    const forgotLink = page.getByRole("link", { name: /Forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", /\/auth\/forgot-password/);
  });

  test("social login buttons for Google and GitHub are present", async ({
    page,
  }) => {
    await page.goto(localePath("/auth/sign-in"));

    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with GitHub/i })
    ).toBeVisible();
  });

  // --- Functional Flow Tests ---

  test("wrong password shows error and does not redirect", async ({
    page,
  }) => {
    // Ensure verified test user exists
    await ensureVerifiedUser(page.request, TEST_CONFIG.user);
    await page.context().clearCookies();

    await page.goto(localePath("/auth/sign-in"));

    await page
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_CONFIG.user.email);
    await page.locator('input[type="password"]').fill("WrongPassword999!");
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    // Should show an error message (invalid credentials)
    await expect(
      page.getByText(/invalid|incorrect|wrong|credentials|failed/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Should still be on sign-in page
    expect(page.url()).toContain("/auth/sign-in");
  });

  test("successful sign-in redirects to org page", async ({ page }) => {
    // Use a unique user for sign-in tests to avoid conflicts with password-reset tests
    const signInUser = {
      name: "E2E SignIn User",
      email: `e2e-signin-${Date.now()}@example.com`,
      password: TEST_CONFIG.user.password,
    };
    await ensureVerifiedUser(page.request, signInUser);
    await page.context().clearCookies();

    await page.goto(localePath("/auth/sign-in"));

    await page
      .getByRole("textbox", { name: "Email" })
      .fill(signInUser.email);
    await page.locator('input[type="password"]').fill(signInUser.password);
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    // Should redirect away from auth pages to /org or /<orgSlug>
    await page.waitForURL(
      (url) => !url.pathname.includes("/auth/"),
      { timeout: TEST_CONFIG.timeouts.navigation }
    );

    // Verify we're on org selection or org dashboard
    expect(page.url()).toMatch(/\/(org|account|[a-z0-9-]+)/);
  });

  test("sign-in then sign-out flow", async ({ page }) => {
    // Use a unique user to avoid conflicts
    const signOutUser = {
      name: "E2E SignOut User",
      email: `e2e-signout-${Date.now()}@example.com`,
      password: TEST_CONFIG.user.password,
    };
    await ensureVerifiedUser(page.request, signOutUser);
    await page.context().clearCookies();

    // Sign in
    await page.goto(localePath("/auth/sign-in"));
    await page
      .getByRole("textbox", { name: "Email" })
      .fill(signOutUser.email);
    await page.locator('input[type="password"]').fill(signOutUser.password);
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await page.waitForURL(
      (url) => !url.pathname.includes("/auth/"),
      { timeout: TEST_CONFIG.timeouts.navigation }
    );

    // Navigate to account page where sign-out button lives
    await page.goto(localePath("/account/profile"));
    await page.waitForLoadState("networkidle");

    // Open user dropdown menu (in sidebar footer)
    const userMenuTrigger = page.locator("[data-sidebar='menu-button']").last();
    await expect(userMenuTrigger).toBeVisible();
    await userMenuTrigger.click();

    // Click "Sign out"
    const signOutButton = page.getByText("Sign out");
    await expect(signOutButton).toBeVisible({ timeout: 3000 });
    await signOutButton.click();

    // Better Auth signOut() clears the session but may not redirect.
    // Verify sign-out by navigating to a protected page and checking
    // that we get redirected to sign-in.
    await page.waitForTimeout(1000);
    await page.goto(localePath("/account/profile"));
    await page.waitForURL(
      (url) => url.pathname.includes("/auth/sign-in"),
      { timeout: TEST_CONFIG.timeouts.navigation }
    );
  });

  test("non-existent user cannot sign in", async ({ page }) => {
    await page.goto(localePath("/auth/sign-in"));

    await page
      .getByRole("textbox", { name: "Email" })
      .fill("nonexistent-user-abc123@example.com");
    await page.locator('input[type="password"]').fill("SomePassword123!");
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    // Should show error
    await expect(
      page.getByText(/invalid|not found|incorrect|credentials|failed/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Should remain on sign-in
    expect(page.url()).toContain("/auth/sign-in");
  });
});
