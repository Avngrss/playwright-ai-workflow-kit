import type { APIRequestContext } from "@playwright/test";
import { test as baseTest, expect } from "./base.fixture";

type ApiFixtures = {
  apiSetupRequest: APIRequestContext;
};

export const test = baseTest.extend<ApiFixtures>({
  apiSetupRequest: async ({ playwright }, use) => {
    const apiBaseUrl = (
      globalThis as {
        process?: { env?: Record<string, string | undefined> };
      }
    ).process?.env?.API_BASE_URL?.trim();

    if (!apiBaseUrl) {
      throw new Error(
        "API_BASE_URL is required for UI API precondition setup. Set it in local .env or CI variables.",
      );
    }

    const apiSetupRequest = await playwright.request.newContext({
      baseURL: apiBaseUrl,
    });
    await use(apiSetupRequest);
    await apiSetupRequest.dispose();
  },
});

export { expect };
