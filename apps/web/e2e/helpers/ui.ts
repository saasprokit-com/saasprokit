import { expect, type Page } from "@playwright/test";

const SIGN_IN_RE = /^Sign In$/i;
const CREATE_ACCOUNT_RE = /Create Account/i;
const SIGN_IN_PATH_RE = /\/auth\/sign-in/;

export async function fillSignInForm(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: SIGN_IN_RE }).click();
}

export async function fillSignUpForm(
  page: Page,
  params: { name: string; email: string; password: string }
): Promise<void> {
  await page.getByRole("textbox", { name: "Name" }).fill(params.name);
  await page.getByRole("textbox", { name: "Email" }).fill(params.email);
  await page
    .locator('input[placeholder="Create a strong password"]')
    .fill(params.password);
  await page
    .locator('input[placeholder="Confirm your password"]')
    .fill(params.password);
  await page.getByRole("button", { name: CREATE_ACCOUNT_RE }).click();
}

export async function expectRedirectToSignIn(
  page: Page,
  path: string
): Promise<void> {
  await page.goto(path);
  await page.waitForURL(SIGN_IN_PATH_RE, { timeout: 15_000 });
  await expect(page).toHaveURL(SIGN_IN_PATH_RE);
}
