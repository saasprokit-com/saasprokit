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
    // Note: requireAdminArea() calls notFound() for non-staff, but through the
    // locale rewrite the HTTP status comes back 200 with the not-found UI, so
    // these assert on DENIED CONTENT (admin dashboard / users table never
    // render) rather than the status code — the security-relevant behavior.
    test("TC-31-01: a regular user cannot see the admin dashboard", async ({
      page,
    }) => {
      await page.goto(localePath("/admin"));
      await expect(page.getByText(/admin dashboard/i)).toHaveCount(0);
    });

    test("TC-31-02: a regular user cannot see the admin users table", async ({
      page,
    }) => {
      await page.goto(localePath("/admin/users"));
      await expect(page.getByRole("table")).toHaveCount(0);
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

    test("TC-31-04: a moderator sees the dashboard but not the users table", async ({
      page,
    }) => {
      test.skip(
        !(await signInAs(page, SEEDED_MODERATOR)),
        `Seeded ${SEEDED_MODERATOR} not present — run: pnpm --filter @repo/database db:seed`
      );

      await page.goto(localePath("/admin"));
      await expect(page.getByText(/admin dashboard/i)).toBeVisible();

      // Moderators are denied /admin/users (notFound → not-found UI, status 200
      // via the locale rewrite), so assert the users table never renders.
      await page.goto(localePath("/admin/users"));
      await expect(page.getByRole("table")).toHaveCount(0);
    });
  });
});
