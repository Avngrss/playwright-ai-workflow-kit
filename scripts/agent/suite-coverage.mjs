/**
 * The data behind a TMS suite's coverage table (the verify skill (Coverage)): for every manual
 * case the tests link — the tests (title, owner folder, file, scenario) and how each ended when it last
 * ran (reports/last-results.json keeps each test's last result until a later run holds it; some of them
 * not run → `not run`, with `ran: "<k> of <n>"`); for every case a plan names — its
 * status, its scenarios with their owners and routes and, when it is not automated, the reason and
 * since when; and whether it is automated — whole, every scenario with its test — or not. A scenario
 * two tests prove (written before routing) is `to rework`; a case tests link while its plan keeps it
 * in Not now, or with a scenario no test covers, is `inconsistent`: the plan or the tests are to be
 * fixed (the gate fails it too). A plan with no TMS ids is matched by title (`withoutTms`; its counts,
 * in all and per plan, `withoutTmsSummary` beside `summary`). The
 * suite's own case list is the agent's part (a script cannot call the TMS). Read-only; JSON.
 *
 *   npm run suite:coverage                 every app
 *   npm run suite:coverage -- --app crm    one app — a TMS suite belongs to one app's TMS project
 *   npm run suite:coverage -- --app crm --table [--suite state/sources/suite-<folder>.json | --plan <plan>]
 *                                          the /coverage table instead of JSON — of the TMS folder the agent saved, else
 *                                          of every case the app's tests and plans know, or of one plan (scripts/agent/coverage-table.mjs)
 *
 * Cases are matched by their number: the `{id}` of the app's case link (§Test cases (TMS):
 * `- case link <app>: <URL with {id}>`, one per app — each app has its own TMS project) and the
 * plans' `TMS: TC-123` (or `PROJ-T123`) both become "123".
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { keepsOut, readPlans, scenarioOf } from "../gate/plans.mjs";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const map = fs.existsSync(path.join(ROOT, "specs", "project-map.md")) ? read(path.join(ROOT, "specs", "project-map.md")) : "";
// One template per app (`- case link crm: …`); a line without an app serves every app that has none.
// The value on the same line only: an empty `- case link crm:` must not take the next line.
const caseLinks = Object.fromEntries([...map.matchAll(/^- case link(?: ([a-z0-9-]+))?:[ \t]*(\S+)/gm)].map((match) => [match[1] ?? "", match[2]]));
const onlyApp = process.argv.includes("--app") ? process.argv[process.argv.indexOf("--app") + 1] : undefined;
const caseLinkOf = (app) => caseLinks[app ?? ""] ?? caseLinks[""];

/** "TC-123" → "123", "…/cases/123" → "123"; a value without digits stays as it is. */
const caseKey = (value) => /(\d+)\D*$/.exec(value)?.[1] ?? value.trim();

/** The `{id}` part of a case URL by its app's template; without a template, the URL's last segment. */
function keyFromUrl(url, app) {
  const caseLink = caseLinkOf(app);
  if (caseLink?.includes("{id}")) {
    const pattern = caseLink
      .replace(/[.*+?^$()|[\]\\]/g, "\\$&")
      .replace("{folder}", "[^/?#]+")
      .replace("{id}", "([^/?#]+)");
    const id = new RegExp(`^${pattern}`).exec(url)?.[1];
    if (id) return caseKey(id);
  }
  return caseKey(url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? url);
}

const cases = {};
const entry = (key) => (cases[key] ??= { tests: [], lastRun: "not run", plan: null, needs: null, scenarios: [], notNow: [] });

// 1. Tests and the cases they link — from Playwright's own list, so every test counts, run or not.
const listed = JSON.parse(execSync("npx playwright test --list --reporter=json", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }));
const walk = (suite) => [
  ...(suite.specs ?? []).flatMap((spec) => spec.tests.map((test) => ({ title: spec.title, file: `tests/${spec.file}`.replace(/\\/g, "/"), annotations: test.annotations ?? [] }))),
  ...(suite.suites ?? []).flatMap(walk),
];
const seen = new Set();
// Every test once, linked or not — a plan written from requirements (no TMS ids) is matched by title (§5).
const everyTest = new Map();
for (const test of listed.suites.flatMap(walk)) {
  const app = test.file.split("/")[2];
  if (onlyApp && app !== onlyApp) continue;
  everyTest.set(`${app}|${test.file}|${test.title}`, { app, title: test.title, file: test.file, layer: test.file.split("/")[1]?.toUpperCase() ?? "?" });
  for (const link of test.annotations.filter((annotation) => annotation.type === "tms" && annotation.description)) {
    const key = keyFromUrl(link.description, app);
    const id = `${key}|${test.file}|${test.title}`;
    if (seen.has(id)) continue; // the same spec in several projects
    seen.add(id);
    const layer = test.file.split("/")[1];
    entry(key).tests.push({ title: test.title, layer: layer?.toUpperCase() ?? "?", scenario: scenarioOf(test.title), app, file: test.file, url: link.description });
  }
}

// 2. How each test ended when it last ran — reports/last-results.json, which every run merges (a test's
//    result stays until a later run holds that test, so one app's run never blanks another's); before
//    any run wrote it, the last run's Allure results. In each project it ran in, the worst counts.
const rank = { failed: 4, broken: 3, skipped: 2, unknown: 1, passed: 0 };
const worse = (a, b) => (a === undefined || rank[b] > rank[a] ? b : a);
let lastRunAt = null;
// app|file|title → { status, at }; the Allure fallback knows no file: app|title.
const lastOf = new Map();
const byFile = (() => {
  try {
    return JSON.parse(read(path.join(ROOT, "reports", "last-results.json"))).tests ?? [];
  } catch {
    return undefined;
  }
})();
const note = (key, status, at) => {
  lastOf.set(key, { status: worse(lastOf.get(key)?.status, status), at: Math.max(lastOf.get(key)?.at ?? 0, at || 0) || null });
  if (at && (!lastRunAt || at > lastRunAt)) lastRunAt = at;
};
if (byFile) {
  for (const result of byFile) if (everyTest.has(`${result.app}|${result.file}|${result.title}`)) note(`${result.app}|${result.file}|${result.title}`, result.status, Date.parse(result.at));
} else {
  const resultsDir = path.join(ROOT, "reports", "allure", "results");
  for (const file of fs.existsSync(resultsDir) ? fs.readdirSync(resultsDir).filter((name) => name.endsWith("-result.json")) : []) {
    const result = JSON.parse(read(path.join(resultsDir, file)));
    const app = (result.labels ?? []).find((label) => label.name === "platform")?.value;
    if (!onlyApp || app === onlyApp) note(`${app}|${result.name}`, result.status, result.start);
  }
}
/** A test's last result — its status and when — or undefined: not run since the results began. */
const lastRunOf = ({ app, file, title }) => {
  const found = lastOf.get(byFile ? `${app}|${file}|${title}` : `${app}|${title}`);
  return found && { status: found.status, at: found.at ? new Date(found.at).toISOString() : null };
};

// A case is as good as its worst test — and a test that did not run proves nothing: when only some of
// a case's tests ran, a case none of them failed reads "not run", never "passed".
for (const known of Object.values(cases)) {
  for (const test of known.tests) Object.assign(test, { lastRun: lastRunOf(test)?.status ?? "not run", lastRunAt: lastRunOf(test)?.at ?? null });
  const ran = known.tests.filter((test) => lastRunOf(test));
  for (const test of ran) known.lastRun = known.lastRun in rank ? worse(known.lastRun, test.lastRun) : test.lastRun;
  if (ran.length && ran.length < known.tests.length) {
    known.ran = `${ran.length} of ${known.tests.length}`;
    if (known.lastRun !== "failed" && known.lastRun !== "broken") known.lastRun = "not run";
  }
}

// 3. What the plans say about each case: a planned case's status and the layers it needs; a "Not now"
//    line's reason and date (scripts/gate/plans.mjs reads both, as the gate does) — the reason without
//    its "· searched:" tail, which stays in the plan (`searched` in `notNow`).
const plans = readPlans(ROOT, onlyApp);
const unreadable = plans.flatMap(({ plan, unreadable: lines }) => lines.map((line) => ({ plan, line })));
for (const { plan, cases: planned, notNow } of plans) {
  // A plan written before routing has no `Route:` lines: no routes, the scenario from its title.
  for (const { ids, title, scenario = scenarioOf(title), level, status, needs, routes = [] } of planned) {
    for (const id of ids) {
      entry(id).plan ??= { plan, title, status };
      entry(id).planned = true;
      entry(id).needs ??= needs;
      if (routes.length) entry(id).scenarios.push({ scenario, title, owner: level, status, route: routes.map(({ line }) => line).join(" | ") });
    }
  }
  for (const line of notNow) {
    for (const id of line.ids) {
      entry(id).plan = { plan, title: line.title, status: line.status, since: line.since, reason: line.reason };
      entry(id).notNow.push({ plan, ...line });
    }
  }
}

// 4. Whether each case is automated — whole, never in part:
//    automated     — every scenario of it has one test, in its owner's folder (a plan written before
//                    routing: tests on every layer its `needs` names), and no Not now line keeps it out
//                    ("Covered by …" lines keep nothing out);
//    to rework     — automated, but written before routing: a scenario has two tests (an API and a UI
//                    one — `twice`), or its plan has no routes yet; the feature's first refresh routes
//                    it and reworks its tests (`rework` says which);
//    not automated — no test links it; the plan's Not now line or status says why;
//    inconsistent  — tests link it while its plan keeps it in Not now, a scenario has no test, or a
//                    test sits outside its scenario's owner (`missing`): the gate fails it too.
const summary = { automated: 0, "to rework": 0, "not automated": 0, inconsistent: 0 };
for (const known of Object.values(cases)) {
  const layers = [...new Set(known.tests.map((test) => test.layer))];
  known.layers = layers;
  const perScenario = new Map();
  for (const test of known.tests) perScenario.set(test.scenario, [...(perScenario.get(test.scenario) ?? []), test]);
  const ready = known.scenarios.filter(({ status }) => /^ready/i.test(status ?? ""));
  if (ready.length) {
    known.missing = ready.filter(({ scenario }) => !perScenario.has(scenario)).map(({ scenario, title }) => scenario || title);
    known.wrongOwner = ready.flatMap(({ scenario, owner }) => (perScenario.get(scenario) ?? []).filter((test) => owner && test.layer !== owner).map((test) => test.title));
  } else {
    known.missing = known.needs && layers.length ? known.needs.filter((layer) => !layers.includes(layer)) : [];
    known.wrongOwner = [];
  }
  known.twice = [...perScenario].filter(([, tests]) => tests.length > 1).map(([scenario]) => scenario || "the case");
  known.keptOut = known.notNow.filter(keepsOut).length > 0;
  // A planned case whose plan has no routes yet was written before routing — whatever Not now line
  // (a "Covered by …") the same id also has.
  const unrouted = !known.scenarios.length && known.planned === true;
  delete known.planned;
  known.rework = [...(known.twice.length ? [`tested twice: ${known.twice.join(", ")}`] : []), ...(unrouted ? ["not routed"] : [])];
  known.coverage = !layers.length
    ? "not automated"
    : known.keptOut || (layers.length && known.missing.length) || known.wrongOwner.length
      ? "inconsistent"
      : known.rework.length
        ? "to rework"
        : "automated";
  summary[known.coverage]++;
}

// 5. Plans written from requirements (no TMS ids): each ready scenario matched to its test by title,
//    as the gate matches them — the coverage of a feature no TMS holds; as for a case, a scenario two
//    tests prove or a plan with no routes yet is `to rework`, a test outside its owner's folder `inconsistent`.
const withoutTms = [];
for (const { plan, app, cases: planned, notNow } of plans) {
  for (const entry of planned.filter(({ ids }) => ids.length === 0)) {
    const tests = [...everyTest.values()].filter((test) => test.app === app && test.title === entry.title);
    const ran = tests.map((test) => lastRunOf(test)?.status ?? "not run");
    const rework = [...(tests.length > 1 ? ["tested twice"] : []), ...(tests.length && !entry.routes.length ? ["not routed"] : [])];
    withoutTms.push({
      plan,
      title: entry.title,
      owner: entry.level,
      status: entry.status,
      tests: tests.map((test) => ({ title: test.title, layer: test.layer, file: test.file, lastRun: lastRunOf(test)?.status ?? "not run", lastRunAt: lastRunOf(test)?.at ?? null })),
      lastRun: ran.find((status) => status === "failed" || status === "broken") ?? (ran.length && ran.every((status) => status === "passed") ? "passed" : "not run"),
      rework: rework.length ? rework : undefined,
      coverage: !tests.length ? "not automated" : entry.level && tests.some((test) => test.layer !== entry.level) ? "inconsistent" : rework.length ? "to rework" : "automated",
    });
  }
  for (const line of notNow.filter(({ ids }) => ids.length === 0)) {
    withoutTms.push({ plan, title: line.title, status: line.status, since: line.since, reason: line.reason, tests: [], lastRun: "not run", coverage: "not automated" });
  }
}

// The same counts as `summary`, for the plans with no TMS ids — in all and per plan (verify's Coverage line).
const counts = () => ({ cases: 0, automated: 0, "to rework": 0, "not automated": 0, inconsistent: 0 });
const byPlan = {};
for (const { plan, coverage } of withoutTms) {
  byPlan[plan] ??= counts();
  byPlan[plan].cases += 1;
  byPlan[plan][coverage] += 1;
}
const withoutTmsSummary = { plans: Object.keys(byPlan).length, ...counts(), byPlan };
for (const one of Object.values(byPlan)) for (const key of Object.keys(counts())) withoutTmsSummary[key] += one[key];

const result = {
  app: onlyApp ?? null,
  caseLink: caseLinkOf(onlyApp) ?? null,
  caseLinks,
  lastRunAt: lastRunAt ? new Date(lastRunAt).toISOString() : null,
  plans: plans.map(({ plan }) => plan),
  summary,
  withoutTmsSummary,
  cases,
  withoutTms,
  unreadableNotNowLines: unreadable,
};

// --table: the /coverage table itself (scripts/agent/coverage-table.mjs) — of the suite saved with --suite, else of
// every case the app's tests and plans know.
if (process.argv.includes("--table")) {
  const suiteFile = process.argv.includes("--suite") ? process.argv[process.argv.indexOf("--suite") + 1] : undefined;
  let suite;
  if (suiteFile) {
    try {
      suite = JSON.parse(read(path.resolve(ROOT, suiteFile)));
    } catch (error) {
      console.log(`✗ --suite ${suiteFile}: ${error.message} — a JSON file { "title": "<folder title>", "cases": [{ "id": "TC-408", "title": "…" }] }`);
      process.exit(1);
    }
  }
  const tms = /^- tms:\s*([^<\n][^\n]*)$/m.exec(map)?.[1]?.trim();
  const plan = process.argv.includes("--plan") ? process.argv[process.argv.indexOf("--plan") + 1]?.replace(/\\/g, "/") : undefined;
  const { renderCoverage } = await import("./coverage-table.mjs");
  console.log(renderCoverage(result, { suite, tms, plan }).trimEnd());
} else console.log(JSON.stringify(result, null, 2));
