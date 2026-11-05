/**
 * Runs the tests — every npm test script comes here. Before a run, the last run's Allure results are
 * cleared and the Chromium build this Playwright version runs is installed when missing; after it, the
 * tests it failed for the stand alone run again, one at a time (withStandSecondPass).
 *
 *   npm test                                          api, ui and e2e of every app (each app's smoke first)
 *   npm run test:api | test:ui | test:e2e             one layer of every app
 *   npm run test:smoke                                every app's smoke: the sign-in check and each feature's @smoke test
 *   npm run test:regression | test:flaky              the @regression or the @flaky tests of every app
 *   npm run test:visual | test:cross-browser | test:responsive   the UI tests tagged for them (Firefox and WebKit installed when missing)
 *   npm run test:failed                               only the last run's failures and the tests it left unrun (after their app's smoke)
 *   npm run test:app -- my-app [smoke|api|ui|e2e]     one app: every layer, or one
 *   npm run test:app -- my-app <spec> --with-browsers  and its @cross-browser / @responsive tests in Firefox, WebKit and a phone too
 *   npm run test:ui -- -g "menu"                      Playwright options go last
 *
 *   node scripts/run-tests.mjs --browsers [--check]   only the browser: install it when missing (postinstall), or say what is there
 *
 * `npm run test:ui -- --project=ui:my-app` does not narrow a run (Playwright adds a second --project
 * to the first): use test:app. The apps come from specs/project-map.md.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const ACTIVE_ONLY = ["--grep-invert", "@wip|@flaky"];
const EVERY_LAYER = ["--project=api*", "--project=ui*", "--project=e2e*"];

/** What each npm script runs: its Playwright arguments, and whether it needs a browser. */
const RUNS = {
  all: { args: EVERY_LAYER, browser: true },
  api: { args: ["--project=api*"], browser: false },
  ui: { args: ["--project=ui*"], browser: true },
  e2e: { args: ["--project=e2e*"], browser: true },
  smoke: { args: ["--project=smoke*", ...EVERY_LAYER, "--grep", "@smoke", ...ACTIVE_ONLY], browser: true },
  regression: { args: [...EVERY_LAYER, "--grep", "@regression", ...ACTIVE_ONLY], browser: true },
  flaky: { args: [...EVERY_LAYER, "--grep", "@flaky"], browser: true },
  visual: { args: ["--project=ui*", "--grep", "@visual", ...ACTIVE_ONLY], browser: true },
  "cross-browser": { args: ["--project=ui*", "--project=firefox*", "--project=webkit*", "--grep", "@cross-browser", ...ACTIVE_ONLY], browser: true, otherBrowsers: true },
  responsive: { args: ["--project=mobile*", "--grep", "@responsive", ...ACTIVE_ONLY], browser: true },
  failed: { args: ["--last-failed"], browser: true },
};
const APP_LAYERS = ["smoke", "api", "ui", "e2e"];

/** The apps of specs/project-map.md §Apps and services — the template's `default` row aside. */
export function appsOfMap() {
  const mapFile = path.join(ROOT, "specs", "project-map.md");
  const map = fs.existsSync(mapFile) ? fs.readFileSync(mapFile, "utf8").replace(/\r\n/g, "\n") : "";
  const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(map)?.[1] ?? "";
  const slugs = section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|")[1]?.trim())
    .filter((slug) => slug && slug !== "Platform" && slug !== "default" && !/^-+$/.test(slug));
  return [...new Set(slugs)];
}

// The browser: the exact Chromium build this Playwright version runs (playwright-core's
// browsers.json), not any Chromium — an older build from another project would fail the first run
// with "Executable doesn't exist".

/** Where Playwright keeps its browsers — by its own rule: PLAYWRIGHT_BROWSERS_PATH ("0" = inside node_modules), else the OS cache. */
function browsersDirectory() {
  const set = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (set === "0") return path.join(ROOT, "node_modules", "playwright-core", ".local-browsers");
  if (set) return set;
  if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "ms-playwright");
  if (process.platform === "darwin") return path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  return path.join(process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache"), "ms-playwright");
}

/** The folders of the builds this Playwright runs (`chromium-1248`, `chromium_headless_shell-1248`); undefined when it cannot tell. */
function requiredFolders() {
  try {
    const core = path.dirname(createRequire(path.join(ROOT, "package.json")).resolve("playwright-core/package.json"));
    const { browsers } = JSON.parse(fs.readFileSync(path.join(core, "browsers.json"), "utf8"));
    return browsers
      .filter((browser) => browser.name === "chromium" || browser.name === "chromium-headless-shell")
      .map((browser) => `${browser.name.replace(/-/g, "_")}-${browser.revision}`);
  } catch {
    return undefined;
  }
}

/** What is missing in the browsers directory — empty when this Playwright's Chromium is there. */
function missingChromium() {
  const present = fs.existsSync(browsersDirectory()) ? fs.readdirSync(browsersDirectory()) : [];
  const required = requiredFolders();
  if (required) return required.filter((folder) => !present.includes(folder));
  // Playwright not installed yet (or its list unreadable): any Chromium will do until it is.
  return present.some((entry) => entry.startsWith("chromium-") || entry.startsWith("chromium_headless_shell-")) ? [] : ["chromium"];
}

/** Installs this Playwright's Chromium when it is missing. CI and PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 install browsers their own way. */
export function ensureBrowsers() {
  if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1" || process.env.CI === "true") return;
  const missing = missingChromium();
  if (!missing.length) return;
  const found = fs.existsSync(browsersDirectory()) ? fs.readdirSync(browsersDirectory()).filter((entry) => entry.startsWith("chromium")) : [];
  const others = found.length ? ` (found: ${found.join(", ")} — another Playwright version's builds)` : "";
  console.info(`Playwright needs ${missing.join(", ")} in ${browsersDirectory()}${others}. Installing...`);
  execSync("npx playwright install chromium", { cwd: ROOT, stdio: "inherit" });
  const still = missingChromium();
  if (still.length) {
    console.error(`Playwright Chromium is still missing after install (${still.join(", ")}). Run manually: npm run browsers:install`);
    process.exit(1);
  }
}

/** Firefox and WebKit for the other-browser projects — `playwright install` skips what is there already. */
function ensureOtherBrowsers() {
  if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1" || process.env.CI === "true") return;
  execSync("npx playwright install firefox webkit", { cwd: ROOT, stdio: "inherit" });
}

function clearAllureResults() {
  const results = path.join(ROOT, "reports", "allure", "results");
  const count = fs.existsSync(results) ? fs.readdirSync(results).length : 0;
  fs.rmSync(results, { recursive: true, force: true });
  fs.mkdirSync(results, { recursive: true });
  if (count) console.log(`Cleared the last run's Allure results (${count} item(s))`);
}

/** How many tests the last run failed or left unrun — Playwright's own list, test-results/.last-run.json; 0 without one. */
function lastFailures() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "test-results", ".last-run.json"), "utf8")).failedTests?.length ?? 0;
  } catch {
    return 0;
  }
}

function playwright(args) {
  const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
  const command = ["npx", "playwright", "test", ...args.map(quote), "--pass-with-no-tests"].join(" ");
  return spawnSync(command, { stdio: "inherit", shell: true }).status ?? 1;
}

// The stand's second pass: a test the run failed for the stand alone — no answer, out of time — runs
// again at the end, alone (one worker, no retry, its own output folders, so the first pass's traces and
// report stay), in the project it failed in only (a UI test is not sent to Firefox, WebKit and the phone
// too). Passed now → "the stand was slow" in the run's summary, not red; failed again → red, as the
// first pass said. Never the sign-in smoke: a dead stand stops the run on purpose. The summary says of
// each such test which it was (src/reporting/run-summary.ts RERUN_CAUSES — the same two causes);
// AQA_RUNNER tells its first pass a second one follows.
const STARTED = Date.now();
const SLOW_CAUSES = new Set(["stand unavailable", "out of time"]);
const fromRoot = (file) => path.relative(ROOT, file).split(path.sep).join("/");

/** The run's exit status after the second pass; the first pass's when none was needed or anything else failed too. */
function withStandSecondPass(status) {
  const summaryFile = path.join(ROOT, "reports", "run-summary.json");
  const read = () => {
    try {
      return fs.statSync(summaryFile).mtimeMs >= STARTED ? JSON.parse(fs.readFileSync(summaryFile, "utf8")) : undefined;
    } catch {
      return undefined;
    }
  };
  const first = read();
  const again = (first?.tests ?? []).filter(({ outcome, cause, file }) => outcome === "unexpected" && SLOW_CAUSES.has(cause) && !fromRoot(file).startsWith("tests/smoke/"));
  if (status === 0 || !again.length) return status;

  const copy = path.join(ROOT, "test-results", "run-summary.first-pass.json");
  fs.mkdirSync(path.dirname(copy), { recursive: true });
  fs.writeFileSync(copy, JSON.stringify({ ...first, secondPass: again.map(({ id }) => id) }, null, 2));
  console.log(`\n${again.length} test(s) failed for the stand alone — running them again, one at a time...`);
  Object.assign(process.env, { AQA_SECOND_PASS: copy, PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(ROOT, "playwright-report", "second-pass") });
  const projects = [...new Set(again.flatMap(({ project }) => (project ? [`--project=${project}`] : [])))];
  const locations = [...new Set(again.map(({ file, line }) => `${fromRoot(file)}:${line}`))];
  const secondStatus = playwright([...projects, ...locations, "--workers=1", "--retries=0", "--no-deps", `--output=${path.join(ROOT, "test-results", "second-pass")}`]);
  delete process.env.AQA_SECOND_PASS;
  delete process.env.PLAYWRIGHT_HTML_OUTPUT_DIR;
  fs.rmSync(copy, { force: true });

  const merged = read();
  const slow = (merged?.slow ?? []).map(({ id }) => id);
  dropFromLastRun(slow);
  return secondStatus === 0 && merged?.counts?.needLook === 0 ? 0 : status;
}

/** Tests the second pass passed leave Playwright's list of the last run's failures (npm run test:failed). */
function dropFromLastRun(ids) {
  const file = path.join(ROOT, "test-results", ".last-run.json");
  try {
    const last = JSON.parse(fs.readFileSync(file, "utf8"));
    const failedTests = (last.failedTests ?? []).filter((id) => !ids.includes(id));
    fs.writeFileSync(file, JSON.stringify({ ...last, status: failedTests.length ? last.status : "passed", failedTests }, null, 2));
  } catch {
    // No list kept (another output folder): nothing to keep in step.
  }
}

/** One app's tests: every layer (its smoke first, the layers' dependency), one layer, or its smoke. */
function appRun([app, second, ...rest]) {
  const apps = appsOfMap();
  if (!app || !apps.includes(app)) {
    console.error(`Which app? npm run test:app -- <app> [${APP_LAYERS.join("|")}] — apps in specs/project-map.md: ${apps.join(", ") || "none yet"}`);
    process.exit(1);
  }
  const layer = APP_LAYERS.includes(second) ? second : undefined;
  const given = layer ? rest : [second, ...rest].filter((value) => value !== undefined);
  // Its own layers — and with --with-browsers its other browsers' projects (firefox:, webkit:, mobile:), each of which
  // runs only its tagged tests (@cross-browser, @responsive): one command, so one set of results.
  const otherBrowsers = given.includes("--with-browsers");
  const options = given.filter((value) => value !== "--with-browsers");
  const ofApp = (layers) => layers.map((each) => `--project=${each}:${app}`);
  const scope = layer === "smoke" ? [...ofApp(APP_LAYERS), "--grep", "@smoke", ...ACTIVE_ONLY] : ofApp(layer ? [layer] : APP_LAYERS);
  const browsers = otherBrowsers ? ofApp(["firefox", "webkit", "mobile"]) : [];
  return { args: [...scope, ...browsers, ...options], browser: layer !== "api" || otherBrowsers, otherBrowsers };
}

function main([what, ...rest]) {
  if (what === "--browsers") {
    if (!rest.includes("--check")) return ensureBrowsers();
    const missing = missingChromium();
    console.log(missing.length ? `missing: ${missing.join(", ")}` : `ready: ${(requiredFolders() ?? ["chromium"]).join(", ")}`);
    process.exit(missing.length ? 1 : 0);
  }
  const run = what === "app" ? appRun(rest) : RUNS[what] && { ...RUNS[what], args: [...RUNS[what].args, ...rest] };
  if (!run) {
    console.error(`node scripts/run-tests.mjs <${[...Object.keys(RUNS), "app"].join("|")}> [Playwright options] | --browsers [--check]`);
    process.exit(1);
  }
  // Without a failed test, --last-failed would run every test.
  if (what === "failed" && !lastFailures()) {
    console.log("The last run left no failures — nothing to rerun (test-results/.last-run.json)");
    process.exit(0);
  }
  clearAllureResults();
  if (run.browser) ensureBrowsers();
  if (run.otherBrowsers && !run.args.includes("--list")) ensureOtherBrowsers();
  process.env.AQA_RUNNER = "scripts/run-tests.mjs";
  process.exit(withStandSecondPass(playwright(run.args)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
