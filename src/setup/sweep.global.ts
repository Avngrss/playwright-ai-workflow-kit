import path from "node:path";
import { safeLogger } from "../logging/safe-logger.helper";
import { scrubFolders } from "../reporting/secret-scrub.reporter";
import { releaseLeftLocks } from "./auth/state";
import { sweepTestData } from "./sweep";

/**
 * Removes AQA leftovers at the start and at the end of every run (globalSetup / globalTeardown in
 * playwright.config.ts), so a run cut short — a crash, a stand timeout in a teardown — never leaves
 * the shared account full of test data. `npm run data:sweep` is a run that matches no test, so only
 * this runs. Only the apps the run covers are swept, and an entity a parallel run may still be using
 * is kept (sweep.ts). A failed sweep is reported, not fatal: smoke decides whether the stand is alive.
 * It also takes .env's secrets out of every trace and report file left on disk (secret-scrub), and
 * releases a sign-in lock whose worker died while signing in, naming the test that held it (auth/state.ts).
 */
/**
 * The apps this run covers, from its `--project` options (`ui:crm`, `*:crm` — what test:app passes);
 * undefined (every app) when none is named or one leaves its app open (`ui*`).
 */
function appsOfRun(argv: readonly string[] = process.argv): string[] | undefined {
  const projects = argv.flatMap((arg, index) =>
    arg.startsWith("--project=") ? [arg.slice("--project=".length)] : arg === "--project" && argv[index + 1] ? [argv[index + 1]] : [],
  );
  if (projects.length === 0) return undefined;
  const apps = projects.map((project) => project.split(":")[1]);
  return apps.some((app) => !app || /[*?]/.test(app)) ? undefined : [...new Set(apps)];
}

export default async function sweepAround(): Promise<void> {
  scrubFolders(path.resolve(__dirname, "..", ".."), ["test-results", "playwright-report", "reports/allure/results"]);
  for (const lock of releaseLeftLocks()) safeLogger.info(`[locks] released ${lock} — its worker ended while signing in (killed or out of time)`);
  try {
    await sweepTestData(appsOfRun());
  } catch (error) {
    safeLogger.info(`[sweep] test data could not be cleaned — ${(error as Error).message.split("\n")[0]}; the run goes on`);
  }
}
