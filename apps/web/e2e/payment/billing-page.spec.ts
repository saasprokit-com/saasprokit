import { expect, orgPath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Billing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(orgPath("/billing"));
    await expect(page.locator("text=Current Plan").first()).toBeVisible();
  });

  test("Should see the Current Plan and Change Plan sections When accessing the billing page", async ({
    page,
  }) => {
    await expect(page.locator("text=Change Plan").first()).toBeVisible();
  });

  test("Should see Free, Pro, and Enterprise tiers with prices When viewing the plan grid", async ({
    page,
  }) => {
    await expect(
      page.locator("h3", { hasText: /free/i }).first()
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: /pro/i }).first()
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: /enterprise/i }).first()
    ).toBeVisible();
    await expect(page.getByText(/\$\d+\/mo/).first()).toBeVisible();
  });

  test("Should switch the billing period When the monthly/annual toggle is clicked", async ({
    page,
  }) => {
    const billingSwitch = page
      .locator("[role='switch'], [data-slot='switch']")
      .first();
    await billingSwitch.scrollIntoViewIfNeeded();
    const checkedBefore = await billingSwitch.getAttribute("aria-checked");
    await billingSwitch.click();
    const checkedAfter = await billingSwitch.getAttribute("aria-checked");
    expect(checkedAfter).not.toBe(checkedBefore);
  });

  test("Should see the Current Plan button disabled When on the Free plan", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /current plan/i })
    ).toBeDisabled();
  });
});
