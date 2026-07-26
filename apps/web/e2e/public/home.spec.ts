import { expect, test } from "@playwright/test";
import { localePath } from "../fixtures/test-config";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Home Page", () => {
  test("Should see the hero section, CTA buttons, pricing, and footer When accessing the home page", async ({
    page,
  }) => {
    await page.goto(localePath("/"));
    await expect(
      page.getByRole("heading", { level: 1, name: /install custom ship/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /clone & ship/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /dashboard/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /your price here/i })
    ).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Should switch between monthly and annual pricing When the billing toggle is clicked", async ({
    page,
  }) => {
    await page.goto(localePath("/"));
    await expect(page.getByText("$19")).toBeVisible();

    await page.getByRole("switch").click();
    await expect(page.getByText("$15.83")).toBeVisible();
    await expect(page.getByText("Save ~17%")).toBeVisible();

    await page.getByRole("switch").click();
    await expect(page.getByText("$19")).toBeVisible();
  });
});
