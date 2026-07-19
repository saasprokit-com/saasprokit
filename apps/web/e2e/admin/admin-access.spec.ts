import { expect, localePath, test } from "../fixtures/fixtures";

const SEEDED_PASSWORD = "Password@saaspro";
const SEEDED_ADMIN = "admin@example.com";
const SEEDED_MODERATOR = "moderator@example.com";

/**
 * Sign the browser context in as a seeded staff account via the auth API, returning
 * whether it succeeded. Seeded users only exist after `pnpm --filter @repo/database
 * db:seed` (CI runs it); locally the caller test.skips with an explicit message when
 * this returns false — no silent fallback to a different user.
 */
async function signInAs(
  page: import("@playwright/test").Page,
  email: string
): Promise<boolean> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: SEEDED_PASSWORD },
    failOnStatusCode: false,
  });
  return response.ok();
}

test.describe("31 - Admin area access control", () => {
  test.describe("non-staff", () => {
    // Inherits the authenticated project's storageState — the regular E2E user (role "user").
    test("TC-31-01: a regular user gets 404 at /admin", async ({ page }) => {
      const response = await page.goto(localePath("/admin"));
      expect(response?.status()).toBe(404);
      await expect(page.getByText(/admin dashboard/i)).toHaveCount(0);
    });

    test("TC-31-02: a regular user gets 404 at /admin/users", async ({
      page,
    }) => {
      const response = await page.goto(localePath("/admin/users"));
      expect(response?.status()).toBe(404);
    });
  });

  test.describe("staff", () => {
    // Start from a clean context so the API sign-in below is the only session.
    test.use({ storageState: { cookies: [], origins: [] } });

    test("TC-31-03: an admin sees the dashboard and the users table", async ({
      page,
    }) => {
      test.skip(
        !(await signInAs(page, SEEDED_ADMIN)),
        `Seeded ${SEEDED_ADMIN} not present — run: pnpm --filter @repo/database db:seed`
      );

      await page.goto(localePath("/admin"));
      await expect(page.getByText(/admin dashboard/i)).toBeVisible();

      await page.goto(localePath("/admin/users"));
      await expect(page.getByRole("table")).toBeVisible();
    });

    test("TC-31-04: a moderator sees the dashboard but is 404'd from users", async ({
      page,
    }) => {
      test.skip(
        !(await signInAs(page, SEEDED_MODERATOR)),
        `Seeded ${SEEDED_MODERATOR} not present — run: pnpm --filter @repo/database db:seed`
      );

      await page.goto(localePath("/admin"));
      await expect(page.getByText(/admin dashboard/i)).toBeVisible();

      const usersResponse = await page.goto(localePath("/admin/users"));
      expect(usersResponse?.status()).toBe(404);
    });
  });
});
