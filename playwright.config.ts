import { defineConfig, devices } from "@playwright/test";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

function readEnvUrl(envName: string): string | undefined {
  const value = process.env[envName]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function ensureHttpUrl(envName: string, value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return value;
    }

    throw new Error();
  } catch {
    throw new Error(
      `Invalid ${envName}: "${value}". Use an absolute http(s) URL.`,
    );
  }
}

const isPlaywrightTestRun = process.argv.includes("test");
const requestedProjects = new Set<string>();
for (let index = 0; index < process.argv.length; index += 1) {
  const arg = process.argv[index];

  if (arg === "--project" && process.argv[index + 1]) {
    requestedProjects.add(process.argv[index + 1].toLowerCase());
    index += 1;
    continue;
  }

  if (arg.startsWith("--project=")) {
    requestedProjects.add(arg.slice("--project=".length).toLowerCase());
  }
}

const requiresUiBaseUrl =
  requestedProjects.size === 0 ||
  Array.from(requestedProjects).some(
    (projectName) => projectName.startsWith("ui") || projectName === "e2e",
  );
const requiresApiBaseUrl =
  requestedProjects.size === 0 || requestedProjects.has("api");

const uiBaseUrlValue = readEnvUrl("UI_BASE_URL");
const apiBaseUrlValue = readEnvUrl("API_BASE_URL");
const uiBaseUrl = uiBaseUrlValue
  ? ensureHttpUrl("UI_BASE_URL", uiBaseUrlValue)
  : undefined;
const apiBaseUrl = apiBaseUrlValue
  ? ensureHttpUrl("API_BASE_URL", apiBaseUrlValue)
  : undefined;

if (isPlaywrightTestRun) {
  if (requiresUiBaseUrl && !uiBaseUrl) {
    throw new Error(
      "UI_BASE_URL is required. Set it in local .env (from .env.example) or CI variables.",
    );
  }

  if (requiresApiBaseUrl && !apiBaseUrl) {
    throw new Error(
      "API_BASE_URL is required. Set it in local .env (from .env.example) or CI variables.",
    );
  }
}

function targetHost(value: string | undefined): string {
  try {
    if (!value) {
      return "not configured";
    }
    return new URL(value).host;
  } catch {
    return "invalid url";
  }
}

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    [
      "allure-playwright",
      {
        resultsDir: "reports/allure/results",
        detail: false,
        suiteTitle: false,
        environmentInfo: {
          ui_host: targetHost(uiBaseUrl),
          api_host: targetHost(apiBaseUrl),
          node: process.version,
        },
      },
    ],
  ],
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 50,
      threshold: 0.2,
    },
  },
  use: {
    baseURL: uiBaseUrl,
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    testIdAttribute: "data-test",
    actionTimeout: 10000,
    navigationTimeout: 15000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "ui-chromium",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: uiBaseUrl,
      },
    },
    {
      name: "ui-firefox",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
        baseURL: uiBaseUrl,
      },
    },
    {
      name: "ui-webkit",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
        baseURL: uiBaseUrl,
      },
    },
    {
      name: "ui-mobile-chromium",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        baseURL: uiBaseUrl,
      },
    },
    {
      name: "api",
      testMatch: /tests\/api\/.*\.api\.spec\.ts/,
      use: {
        baseURL: apiBaseUrl,
      },
    },
    {
      name: "e2e",
      testDir: "./tests/e2e",
      testMatch: /.*\.e2e\.spec\.ts/,
      retries: process.env.CI ? 1 : 0,
      timeout: 60_000,
      use: {
        baseURL: uiBaseUrl,
        navigationTimeout: 30_000,
        actionTimeout: 15_000,
      },
    },
  ],
});
