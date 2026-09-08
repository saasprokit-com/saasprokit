import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const CAPTURE_VIEWPORT = { width: 1920, height: 1080 };

// Opt-in only: `playwright test` must never record video in CI or normal e2e runs.
const captureProjects = process.env.CAPTURE
  ? [
      {
        name: "capture",
        testMatch: /capture\/.*\.capture\.ts/,
        timeout: 180_000,
        retries: 0,
        use: {
          ...devices["Desktop Chrome"],
          viewport: CAPTURE_VIEWPORT,
          launchOptions: { slowMo: 120 },
          video: {
            mode: "on" as const,
            size: CAPTURE_VIEWPORT,
          },
        },
      },
    ]
  : [];

export default defineConfig({
  globalSetup: "./e2e/setup/global-setup.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  // CI runs a production build, where Better Auth enforces its rate limits (3
  // sign-ups per minute). Setup and the auth specs wait out a 429 rather than
  // failing, and that wait has to fit inside the test timeout.
  timeout: process.env.CI ? 90_000 : 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    ...captureProjects,
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
    // Authenticated pages: account, admin, dashboard, members, payment
    {
      name: "authenticated",
      testMatch: /(?:account|admin|dashboard|members|payment)\/.*\.spec\.ts/,
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
