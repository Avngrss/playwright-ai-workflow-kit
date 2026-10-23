import { request, type APIRequestContext } from "@playwright/test";
import { expect, test as reportingTest } from "./reporting.fixture";
import { defaultPlatform, missingUrl, urlOf } from "../setup/platforms";

/**
 * API layer. `platform` is the app a test belongs to — set by its Playwright project
 * (playwright.config.ts builds one set of projects per app of specs/project-map.md); a one-app test
 * home never needs it. `apiRequestContext` targets that app's API (its address from .env, by the
 * name in the map — specs never read process.env) whatever project runs, so UI specs that need API
 * preconditions hit the API, not the UI app. Paths are relative to it (`items/42`, no leading
 * slash). Bound clients built on it (`.cursor/rules/api.mdc`) go to the app's own
 * src/fixtures/<app>/data.fixture.ts, never here; the signed-in role's headers come from
 * auth.fixture.ts (`authHeaders`).
 */
export const test = reportingTest.extend<{ platform: string; apiRequestContext: APIRequestContext }>({
  platform: [defaultPlatform(), { option: true }],
  apiRequestContext: async ({ platform }, use) => {
    const baseURL = urlOf(platform, "api");
    if (!baseURL) throw new Error(missingUrl(platform, "api"));
    const context = await request.newContext({ baseURL: `${baseURL.replace(/\/+$/, "")}/`, ignoreHTTPSErrors: true });
    await use(context);
    await context.dispose();
  },
});

export { expect };
