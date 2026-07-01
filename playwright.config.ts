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
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 50,
      threshold: 0.2,
    },
  },
  use: {
    baseURL: process.env.UI_BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
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
        baseURL: process.env.UI_BASE_URL,
      },
    },
    {
      name: "ui-firefox",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
        baseURL: process.env.UI_BASE_URL,
      },
    },
    {
      name: "ui-webkit",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
        baseURL: process.env.UI_BASE_URL,
      },
    },
    {
      name: "ui-mobile-chromium",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        baseURL: process.env.UI_BASE_URL,
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
        baseURL: process.env.UI_BASE_URL,
      },
    },
  ],
});
