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
  reporter: "html",
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.PRACTICE_SOFTWARE_TESTING_URL,
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
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
    },
  ],
});
