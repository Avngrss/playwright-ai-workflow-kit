import { read } from "./context.mjs";

/**
 * The simple rules — one line each: a group of files must not contain (`forbid`) or must contain
 * (`require`) a pattern. `except` leaves out the files that are the rule's one allowed home; `when`
 * applies the rule only to files that contain that pattern; `warn` makes it a warning. Groups:
 * collectFiles() in context.mjs.
 */
const PATTERN_RULES = [
  // Specs read as what a person does and checks; everything else comes through fixtures.
  { in: ["specs"], forbid: /waitForTimeout\s*\(/, says: "waits a fixed time (waitForTimeout) — wait for a state: a locator, a response, a URL" },
  { in: ["specs"], require: /\bexpect\w*\s*\(/, says: "checks nothing — add expect(…) or an assertion helper (expectJson, expectSignedIn, …)" },
  { in: ["ui", "e2e", "smoke"], require: /\btest\.step\(/, says: "has no test.step() — the report shows a browser test as the steps a person takes" },
  { in: ["specs"], forbid: /import\s*{[^}]*\btest\b[^}]*}\s*from\s*["']@playwright\/test["']/, says: 'imports test from @playwright/test — import { test, expect } from "src/fixtures/<app>/test" (the app of its folder)' },
  // E2E may: a second role's browser context has its own page (.cursor/rules/specs.mdc).
  { in: ["ui", "smoke"], forbid: /new\s+\w+Page\s*\(/, says: "creates a Page Object itself — take it from its app's fixtures (src/fixtures/<app>/pages.fixture.ts)" },
  { in: ["specs"], forbid: /process\.env/, says: "reads process.env — settings come through fixtures and the config" },
  { in: ["specs"], forbid: /["'][^"']*\.env["']/, says: "names the .env file — secrets and settings are never test assets" },
  { in: ["specs"], forbid: /Bearer\s+eyJ[A-Za-z0-9\-._~+/]+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, says: "contains a token — credentials come from the auth fixtures" },
  { in: ["specs"], forbid: /\btest\(\s*(?:\r?\n\s*)?["'`][a-z]/, says: "a test title starts with a lowercase letter — titles read as sentences" },
  { in: ["specs"], forbid: /\btest\.step\(\s*(?:\r?\n\s*)?["'`][a-z]/, says: "a step name starts with a lowercase letter — step names read as sentences" },
  { in: ["specs"], forbid: /\btest\.step\(\s*(?:\r?\n\s*)?["'`][^"'`]*\b(API|fixture|locator|payload|request|response)\b/, says: "a step name uses implementation words (API, fixture, locator, payload, request, response) — say what the person does" },
  // A test switched off says why; a known bug is marked with its ticket, so the report links it and says when it looks fixed.
  { in: ["specs"], forbid: /\btest\.fail\(/, says: 'marks a known bug in the test\'s code (test.fail) — list it in specs/known-bugs.md: the run marks the test itself, grey while it fails at its step (the verify skill (Heal), "A bug confirmed by hand")' },
  { in: ["specs"], forbid: /\btest\.(skip|fixme)\(\s*(true\s*)?\)/, says: 'switches a test off without a reason — test.skip(condition, "<why>"); a known bug is a row of specs/known-bugs.md, an unstable test @flaky' },
  // An app under a path (https://host/shop) keeps it only with a relative address (src/setup/platforms.ts urlOf).
  { in: ["specs", "uiModels"], forbid: /\.goto\(\s*["'`]\//, says: 'opens an address from the host\'s root (goto("/…")) — an app under a path loses it: goto("./"), goto("orders/42")' },

  // Page Objects and components find and act; API clients build requests. Checks and steps are the spec's.
  { in: ["uiModels", "clients"], forbid: /\bexpect\s*\(|import\s*{[^}]*\bexpect\b[^}]*}\s*from\s*["']@playwright\/test["']/, says: "checks something (expect) — it returns what it found; the spec decides what that means" },
  { in: ["uiModels", "clients"], forbid: /\btest\.step\s*\(/, says: "uses test.step() — steps belong in specs" },
  { in: ["uiModels", "clients"], forbid: /process\.env/, says: "reads process.env — addresses and credentials come from fixtures" },
  { in: ["uiModels"], forbid: /waitForTimeout\s*\(/, says: "waits a fixed time (waitForTimeout) — wait for a state" },
  { in: ["uiModels"], warn: true, forbid: /\.waitForURL\s*\(/, says: "waits for the address — a client-side route changes it before the screen: wait for what the screen shows (the selected tab, the new heading)" },
  { in: ["uiModels"], forbid: /Date\.now\s*\(|Math\.random\s*\(/, says: "makes test data (Date.now, Math.random) — data comes from generators" },
  { in: ["uiModels"], forbid: /toHaveScreenshot\s*\(/, says: "compares screenshots — a visual check belongs in a spec" },
  // They hold locators, actions and readers of what is shown — nothing else (.cursor/rules/ui.mdc).
  {
    in: ["uiModels"],
    forbid: /\.(?:waitForResponse|waitForRequest)\s*\(|\.(?:on|waitForEvent)\(\s*["'](?:request|response|requestfinished|requestfailed)["']|\bcaptureRequests\s*\(/,
    says: "listens to the network — data the screen gives no sign of: whenAnswered(this.page, paths, action) (src/setup/request-capture.ts); a test checking requests or answers captures them itself",
  },
  {
    in: ["uiModels"],
    forbid: /\baddInitScript\s*\(|\b(?:localStorage|sessionStorage)\b|\.addCookies\s*\(|\bpage(?:\(\))?\.evaluate\w*\s*\(/,
    says: "prepares or probes the browser (init script, storage, cookies, page.evaluate) — that is setup: src/setup/<app>/, which an open…(…) may call",
  },
  {
    in: ["uiModels"],
    warn: true,
    forbid: /\.padStart\s*\(|\bIntl\.|\.toLocale\w*String\s*\(/,
    says: "formats a value — a reader returns the text as shown; the expected text comes from the app's display helper (src/assertions/<app>/display.ts)",
  },
  {
    in: ["uiModels"],
    forbid: /^export\s+(?:async\s+)?function\b|^export\s+(?:const|let|var)\b/m,
    says: "exports a function or a value — a Page Object or component file exports its class and the types its methods take; how a value is shown → src/assertions/<app>/display.ts, request patterns and browser preparation → src/setup/<app>/",
  },

  // One home for each concern across all test code.
  { in: ["testCode"], except: /[\\/]src[\\/]reporting[\\/]/, forbid: /from\s*["']allure-(?:js-commons|playwright)["']|\ballure\./, says: "calls Allure directly — links come from annotations (tms, issue), extra text from testInfo.attach (.cursor/rules/code.mdc)" },
  { in: ["testCode"], except: /[\\/]src[\\/](logging|security)[\\/]/, forbid: /console\.(log|debug|info)\s*\(/, says: "writes to the console — use safeLogger (src/logging/safe-logger.helper.ts), never with secrets" },
  { in: ["testCode"], except: /[\\/]src[\\/]setup[\\/]app-wide\.ts$/, forbid: /addLocatorHandler\s*\(/, says: "closes an overlay itself — add it to the app-wide block of specs/project-map.md (dismiss: …)" },
  { in: ["testCode"], when: /(?:allure\.attachment|testInfo\.attach)\s*\(/, require: /maskSecrets|sanitize|redact/, says: "attaches text without masking it — pass it through maskSecrets (src/reporting/readable-error.ts)" },
  // A warning: missing stand data reported in the helper's words sorts under "stand data" and says where a person looks.
  {
    in: ["testCode"],
    except: /[\\/]src[\\/](reporting[\\/]|assertions[\\/]shared[\\/]stand-data\.ts$)/,
    warn: true,
    forbid: /stand data, see the plan|expect\([^;]*["'`][^"'`]*\bstand data\b/i,
    says: "reports missing stand data with a plain error or expect — use standDataMissing(…) / expectStandData(…) (src/assertions/shared/stand-data.ts): the item, what is wrong, why the test needs it, where a person looks",
  },
  // A warning: the locale's own short month ("Sept" in en-GB) is seldom what the page shows.
  { in: ["testCode"], warn: true, forbid: /toLocale(?:Date)?String\(\s*[^,)]*["']en-GB["'][^)]*month\s*:\s*["']short/, says: 'formats a short month the en-GB way ("Sept") — expected texts come from the app\'s display helper (src/assertions/<app>/), matched to what the page shows' },
];

export function checkPatterns(files, report) {
  for (const rule of PATTERN_RULES) {
    const targets = new Set(rule.in.flatMap((group) => files[group]));
    for (const file of targets) {
      if (rule.except?.test(file)) continue;
      const content = read(file);
      if (rule.when && !rule.when.test(content)) continue;
      const broken = rule.forbid ? rule.forbid.test(content) : !rule.require.test(content);
      if (broken) (rule.warn ? report.warn : report.fail)(file, rule.says);
    }
  }
}
