import { clearInbox, isMaildevAvailable, waitForEmail } from "../helpers/maildev";
import { expect, localePath, test } from "../fixtures/fixtures";
import { fillSignUpForm } from "../helpers/ui";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Sign Up", () => {
  test("Should see the sign-up form When accessing the sign-up page", async ({ page }) => {
    await page.goto(localePath("/auth/sign-up"));

    await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.locator('input[placeholder="Create a strong password"]')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="Confirm your password"]')
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create Account/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });

  test("Should see a validation error When the passwords don't match", async ({ page }) => {
    await page.goto(localePath("/auth/sign-up"));

    await page.getByRole("textbox", { name: "Name" }).fill("E2E Mismatch User");
    await page
      .getByRole("textbox", { name: "Email" })
      .fill(`e2e-mismatch-${Date.now()}@example.com`);
    await page
      .locator('input[placeholder="Create a strong password"]')
      .fill("FirstPassword123!");
    await page
      .locator('input[placeholder="Confirm your password"]')
      .fill("DifferentPassword123!");
    await page.getByRole("button", { name: /Create Account/i }).click();

    // Exact string from the zod .refine() in app/[locale]/auth/schemas.ts
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("Should redirect to verify-email and receive a verification email When sign-up succeeds", async ({
    page,
  }) => {
    const available = await isMaildevAvailable();
    test.skip(!available, "Maildev is not available");
    await clearInbox();

    const email = `e2e-signup-${Date.now()}@example.com`;
    await page.goto(localePath("/auth/sign-up"));
    await fillSignUpForm(page, {
      name: "E2E Signup User",
      email,
      password: "SignUpTest123!",
    });

    await page.waitForURL((url) => url.pathname.includes("/verify-email"), {
      timeout: 15_000,
    });
    expect(page.url()).toContain("/auth/verify-email");

    const verificationEmail = await waitForEmail(email, {
      subjectContains: "verif",
      timeout: 30_000,
    });
    expect(verificationEmail.to[0].address.toLowerCase()).toBe(
      email.toLowerCase()
    );
  });
});
