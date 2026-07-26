import { expect, orgPath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

// The checkout-success page verifies the session against Stripe (PR #45 removed
// the old session_id echo). A bogus session_id can't be verified, so it
// deterministically renders the error card ("stripe_error") regardless of Stripe
// config — the only success-page state we can assert without a real paid checkout.
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
