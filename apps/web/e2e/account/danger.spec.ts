import { test, expect, TEST_CONFIG, localePath } from "./fixtures/fixtures";

test.describe("12 - Account Danger Zone", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto(localePath("/account/danger"));
  });

  test.describe("Page Display", () => {
    test("TC-12-01: renders danger zone with warning content", async ({ page }) => {
      await expect(page.getByText(/delete account/i).first()).toBeVisible();
      await expect(page.getByText(/irreversible|permanent/i).first()).toBeVisible();
    });

    test("TC-12-02: delete button is visible", async ({ page }) => {
      await expect(page.getByRole("button", { name: /delete my account/i })).toBeVisible();
    });

    test("TC-12-03: consequences list is visible", async ({ page }) => {
      await expect(page.getByText(/personal data/i).first()).toBeVisible();
    });
  });

  test.describe("Confirmation Dialog", () => {
    test("TC-12-04: opens delete confirmation dialog", async ({ page }) => {
      await page.getByRole("button", { name: /delete my account/i }).click();
      await expect(page.getByText(/permanently delete account/i).first()).toBeVisible();
    });

    test("TC-12-05: delete button disabled until checkbox checked", async ({ page }) => {
      await page.getByRole("button", { name: /delete my account/i }).click();
      const deleteBtn = page.getByRole("button", { name: /delete account permanently/i });
      await expect(deleteBtn).toBeDisabled();
    });

    test("TC-12-06: checking checkbox enables delete button", async ({ page }) => {
      await page.getByRole("button", { name: /delete my account/i }).click();
      const checkbox = page.locator("input[type='checkbox']#acknowledge, [role='checkbox']");
      await checkbox.first().click();
      const deleteBtn = page.getByRole("button", { name: /delete account permanently/i });
      await expect(deleteBtn).toBeEnabled();
    });

    test("TC-12-07: cancel closes dialog", async ({ page }) => {
      await page.getByRole("button", { name: /delete my account/i }).click();
      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByText(/permanently delete account/i).first()).not.toBeVisible();
    });

    test("TC-12-08: escape closes dialog", async ({ page }) => {
      await page.getByRole("button", { name: /delete my account/i }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByText(/permanently delete account/i).first()).not.toBeVisible();
    });
  });

  test.describe("Breadcrumbs", () => {
    test("TC-12-09: breadcrumb shows Account > Danger Zone", async ({ page }) => {
      await expect(page.getByText(/danger zone/i).first()).toBeVisible();
    });
  });
});

test.describe("12 - Account Deletion (Functional)", () => {
  // These tests use a throwaway user — NOT the main test user.
  // Each test creates its own browser context with no shared auth state.

  test("TC-12-11: full delete account flow with throwaway user", async ({ browser }) => {
    // 1. Create a fresh browser context (no shared auth state)
    const context = await browser.newContext();
    const page = await context.newPage();

    const timestamp = Date.now();
    const throwawayEmail = `e2e-delete-${timestamp}@example.com`;
    const throwawayPassword = "DeleteMe123!";
    const throwawayName = "Delete Me";

    // 2. Create a new user via API
    const signUpResponse = await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: throwawayName,
        email: throwawayEmail,
        password: throwawayPassword,
      },
    });
    expect(signUpResponse.ok()).toBe(true);

    // 3. Sign in as that user via API (sets session cookies on the context)
    const signInResponse = await page.request.post("/api/auth/sign-in/email", {
      data: {
        email: throwawayEmail,
        password: throwawayPassword,
      },
    });
    expect(signInResponse.ok()).toBe(true);

    // 4. Navigate to the danger zone page
    await page.goto(localePath("/account/danger"));
    await expect(page.getByRole("button", { name: /delete my account/i })).toBeVisible({
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    // 5. Click delete button to open confirmation dialog
    await page.getByRole("button", { name: /delete my account/i }).click();
    await expect(page.getByText(/permanently delete account/i).first()).toBeVisible();

    // 6. Check the acknowledgment checkbox
    const checkbox = page.locator("input[type='checkbox']#acknowledge, [role='checkbox']");
    await checkbox.first().click();

    // 7. Click the final delete button
    const deleteBtn = page.getByRole("button", { name: /delete account permanently/i });
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    // 8. Verify redirect to home or sign-in page after deletion
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        return path === "/" || path.includes("/auth/sign-in") || path === `/${TEST_CONFIG.locale}`;
      },
      { timeout: TEST_CONFIG.timeouts.navigation }
    );

    await context.close();
  });

  test("TC-12-12: deleted user can no longer sign in", async ({ browser }) => {
    // 1. Create a fresh browser context
    const context = await browser.newContext();
    const page = await context.newPage();

    const timestamp = Date.now();
    const throwawayEmail = `e2e-delete-verify-${timestamp}@example.com`;
    const throwawayPassword = "DeleteMe123!";
    const throwawayName = "Delete Verify";

    // 2. Create and sign in as a throwaway user
    const signUpResponse = await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: throwawayName,
        email: throwawayEmail,
        password: throwawayPassword,
      },
    });
    expect(signUpResponse.ok()).toBe(true);

    const signInResponse = await page.request.post("/api/auth/sign-in/email", {
      data: {
        email: throwawayEmail,
        password: throwawayPassword,
      },
    });
    expect(signInResponse.ok()).toBe(true);

    // 3. Navigate to danger zone and delete the account
    await page.goto(localePath("/account/danger"));
    await expect(page.getByRole("button", { name: /delete my account/i })).toBeVisible({
      timeout: TEST_CONFIG.timeouts.navigation,
    });

    await page.getByRole("button", { name: /delete my account/i }).click();
    await expect(page.getByText(/permanently delete account/i).first()).toBeVisible();

    const checkbox = page.locator("input[type='checkbox']#acknowledge, [role='checkbox']");
    await checkbox.first().click();

    const deleteBtn = page.getByRole("button", { name: /delete account permanently/i });
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    // 4. Wait for redirect confirming deletion completed
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        return path === "/" || path.includes("/auth/sign-in") || path === `/${TEST_CONFIG.locale}`;
      },
      { timeout: TEST_CONFIG.timeouts.navigation }
    );

    await context.close();

    // 5. Attempt to sign in with the deleted user's credentials in a new context
    const verifyContext = await browser.newContext();
    const verifyPage = await verifyContext.newPage();

    const retrySignIn = await verifyPage.request.post("/api/auth/sign-in/email", {
      data: {
        email: throwawayEmail,
        password: throwawayPassword,
      },
    });

    // The sign-in should fail — either a non-200 status or an error in the response body
    const retryBody = await retrySignIn.json().catch(() => null);
    const signInFailed =
      !retrySignIn.ok() ||
      (retryBody && (retryBody.error || retryBody.code === "INVALID_CREDENTIALS"));

    expect(signInFailed).toBe(true);

    await verifyContext.close();
  });
});
