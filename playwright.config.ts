import { defineConfig, devices } from "@playwright/test";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["line"], ["allure-playwright"]],
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 50,
      threshold: 0.2,
    },
  },
  use: {
    baseURL: process.env.PRACTICE_TESTING_URL,
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    testIdAttribute: "data-test",
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: "ui-chromium",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PRACTICE_TESTING_URL,
      },
    },
    {
      name: "api",
      testMatch: /tests\/api\/.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL,
      },
    },

    {
      name: "e2e",
      testDir: "./tests/e2e",
      testMatch: /.*\.e2e\.spec\.ts/,
      retries: process.env.CI ? 1 : 0,
      timeout: 60_000,
      use: {
        baseURL: process.env.PRACTICE_TESTING_URL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
  ],
});
