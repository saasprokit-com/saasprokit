import { expect, orgPath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

// A bogus session_id fails Stripe verification, so the page renders the error card — the only success-page state assertable without a real paid checkout.
test("Should show the checkout error card When the session cannot be verified", async ({
  page,
}) => {
  await page.goto(orgPath("/checkout/success?session_id=cs_test_invalid_e2e"));

  await expect(
    page.getByText(/checkout could not be confirmed/i).first()
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /back to billing/i })
  ).toBeVisible();
});
