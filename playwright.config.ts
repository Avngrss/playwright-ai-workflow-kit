import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

import dotenv from "dotenv";
import path from "node:path";
import { testIdOf } from "./src/setup/app-wide";
import { skipIpv6LookupWhenAsked } from "./src/setup/network";
import { isRegistered, platforms, urlOf, type Platform } from "./src/setup/platforms";

dotenv.config({ path: path.resolve(__dirname, ".env"), quiet: true });
skipIpv6LookupWhenAsked();

type Options = { platform: string };
type Projects = NonNullable<PlaywrightTestConfig<Options>["projects"]>;
const SEP = "[\\\\/]";

/**
 * One set of projects per app of specs/project-map.md §Apps and services — `smoke:<app>`,
 * `api:<app>`, `ui:<app>`, `e2e:<app>` from the first app on, so a second app adds projects and
 * renames none. Each takes only its app's folders (tests/<layer>/<app>/…), opens and signs in to its
 * own app (its addresses and ```auth block), and waits only for its own smoke — a dead stand of one
 * app stops only that app's tests. The sign-in smoke runs once per app. Run one app:
 * --project="*:<app>"; one layer of every app: --project="ui*". The app is each test's `platform`
 * option and its report label and tag. Before the first app is set up: plain smoke, api, ui, e2e.
 */
function projectsOf(app: Platform, all: Platform[]): Projects {
  const perApp = isRegistered();
  const name = (layer: string) => (perApp ? `${layer}:${app.slug}` : layer);
  const specs = (layer: string) => new RegExp(`tests${SEP}${layer}${SEP}${perApp ? `${app.slug}${SEP}` : ""}.*\\.${layer}\\.spec\\.ts$`);
  const others = all.filter((other) => other.slug !== app.slug).map((other) => other.slug);
  // The app's web address and the attribute its elements carry for tests (the map's ```app-wide `test id:`).
  const web = { platform: app.slug, baseURL: urlOf(app.slug, "ui"), testIdAttribute: testIdOf(app.slug) };
  const browser = { ...devices["Desktop Chrome"], ...web };
  const common = { metadata: { platform: app.slug }, dependencies: [name("smoke")] };
  return [
    // Smoke: "is the stand alive?" — the template's sign-in check, the first account only, seconds.
    // The app's other projects depend on it, so a dead stand stops the run instead of failing
    // hundreds of tests. Each feature joins `npm run test:smoke` with one test of its own tagged @smoke
    // (specs/project-map.md §Smoke) — it runs in its layer and never stops the others. Run only
    // regression with --no-deps when the stand is known to be up.
    {
      name: name("smoke"),
      testDir: "./tests/smoke",
      testMatch: /sign-in\.smoke\.spec\.ts$/,
      // The sign-in smoke declares every app's checks, each tagged with its app; this app runs its own.
      grepInvert: others.length ? new RegExp(`@(${others.join("|")})(\\s|$)`) : undefined,
      retries: 0,
      metadata: common.metadata,
      use: browser,
    },
    { name: name("api"), testMatch: specs("api"), ...common, use: { platform: app.slug, baseURL: urlOf(app.slug, "api") } },
    { name: name("ui"), testMatch: specs("ui"), ...common, use: browser },
    {
      name: name("e2e"),
      testMatch: specs("e2e"),
      ...common,
      retries: 1,
      timeout: 60_000,
      use: { ...browser, navigationTimeout: 30_000, actionTimeout: 15_000 },
    },
    // Other browsers and a phone: only UI tests tagged for them (specs/project-map.md §Allowed tags) —
    // `npm run test:cross-browser`, `npm run test:responsive`. Names do not start with `ui`, so the
    // regular runs (`--project=ui*`) never pick them up. Their browsers: `npm run browsers:install:all`.
    { name: name("firefox"), testMatch: specs("ui"), grep: /@cross-browser/, ...common, use: { ...devices["Desktop Firefox"], ...web } },
    { name: name("webkit"), testMatch: specs("ui"), grep: /@cross-browser/, ...common, use: { ...devices["Desktop Safari"], ...web } },
    { name: name("mobile"), testMatch: specs("ui"), grep: /@responsive/, ...common, use: { ...devices["Pixel 5"], ...web } },
  ];
}

export default defineConfig<Options>({
  // AQA leftovers are swept before and after every run, however it was started (sweep.global.ts).
  globalSetup: "./src/setup/sweep.global.ts",
  globalTeardown: "./src/setup/sweep.global.ts",
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A test that fails once and passes on the retry is reported unstable (flaky), not red; smoke never retries.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    // First: takes .env's secrets out of traces and attachments before any report copies them.
    ["./src/reporting/secret-scrub.reporter.ts"],
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    [
      "./src/reporting/readable-allure.reporter.ts",
      {
        resultsDir: path.join(__dirname, "reports", "allure", "results"),
        detail: false,
        suiteTitle: false,
      },
    ],
  ],
  expect: {
    timeout: 10000,
  },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 15000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: platforms().flatMap((app, _, all) => projectsOf(app, all)),
});
