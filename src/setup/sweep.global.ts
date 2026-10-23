import path from "node:path";
import { safeLogger } from "../logging/safe-logger.helper";
import { scrubFolders } from "../reporting/secret-scrub.reporter";
import { sweepTestData } from "./sweep";

/**
 * Removes AQA leftovers at the start and at the end of every run (globalSetup / globalTeardown in
 * playwright.config.ts), so a run cut short — a crash, a stand timeout in a teardown — never leaves
 * the shared account full of test data. `npm run data:sweep` is a run that matches no test, so only
 * this runs. A failed sweep is reported, not fatal: smoke decides whether the stand is alive.
 * It also takes .env's secrets out of every trace and report file left on disk (secret-scrub).
 */
export default async function sweepAround(): Promise<void> {
  scrubFolders(path.resolve(__dirname, "..", ".."), ["test-results", "playwright-report", "reports/allure/results"]);
  try {
    await sweepTestData();
  } catch (error) {
    safeLogger.info(`[sweep] test data could not be cleaned — ${(error as Error).message.split("\n")[0]}; the run goes on`);
  }
}
