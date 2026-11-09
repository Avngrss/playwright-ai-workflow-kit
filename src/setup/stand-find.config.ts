import { defineConfig } from "@playwright/test";
import os from "node:os";
import path from "node:path";
import testHome from "../../playwright.config";

/**
 * The Playwright config `npm run stand:find` runs (scripts/agent/stand-find.mjs): stand-find.ts as its
 * only global setup, no test, no report, no sweep. The test home's config is imported for its .env and
 * its timeouts, never run; the output folder is a temporary one, so the last test run's results stay.
 */
export default defineConfig({
  globalSetup: "./stand-find.ts",
  testDir: __dirname,
  testMatch: /^$/,
  outputDir: path.join(os.tmpdir(), "aqa-stand-find"),
  reporter: "line",
  use: { navigationTimeout: testHome.use?.navigationTimeout },
});
