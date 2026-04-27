import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  globalSetup: "./e2e/setup/global-setup.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
  },
  projects: [
    // Setup: authenticate user
    {
      name: "auth-setup",
      testMatch: /setup\/auth\.setup\.ts/,
    },
    // Setup: verify org (depends on auth)
    {
      name: "org-setup",
      testMatch: /setup\/org\.setup\.ts/,
      dependencies: ["auth-setup"],
      use: {
        storageState: "e2e/.auth/user.json",
      },
    },
    // Public pages & auth pages (no auth needed)
    {
      name: "no-auth",
      testMatch: /(?:public|auth)\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // Authenticated pages: account, dashboard, members, payment
    {
      name: "authenticated",
      testMatch: /(?:account|dashboard|members|payment)\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["auth-setup", "org-setup"],
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "next dev -p 3000",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
