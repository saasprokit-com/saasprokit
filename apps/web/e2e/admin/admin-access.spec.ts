import { expect, localePath, test } from "../fixtures/fixtures";

const SEEDED_PASSWORD = "Password@saaspro";
const SEEDED_ADMIN = "admin@example.com";
const SEEDED_MODERATOR = "moderator@example.com";

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
    // requireAdminArea() calls notFound(), but the locale rewrite returns 200 with the not-found UI, so assert denied content, not status.
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

      await page.goto(localePath("/admin/users"));
      await expect(page.getByRole("table")).toHaveCount(0);
    });
  });
});
