/**
 * The data behind a TMS suite's coverage table (the verify skill (Coverage)): for every manual
 * case the tests link — the tests (title, layer, file) and how they ended in the last run; for every
 * case a plan names — its status, the layers it needs and, when it is not automated, the reason and
 * since when; and whether it is automated — whole, on every layer it needs — or not. A case tests
 * link while its plan keeps it in Not now, or covered on fewer layers than it needs, is
 * `inconsistent`: the plan or the tests are to be fixed (the gate fails it too). The suite's own case
 * list is the agent's part (a script cannot call the TMS). Read-only; JSON.
 *
 *   npm run suite:coverage                 every app
 *   npm run suite:coverage -- --app crm    one app — a TMS suite belongs to one app's TMS project
 *
 * Cases are matched by their number: the `{id}` of the app's case link (§Test cases (TMS):
 * `- case link <app>: <URL with {id}>`, one per app — each app has its own TMS project) and the
 * plans' `TMS: TC-123` both become "123".
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { keepsOut, readPlans } from "../gate/plans.mjs";

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
const entry = (key) => (cases[key] ??= { tests: [], lastRun: "not run", plan: null, needs: null, notNow: [] });

// 1. Tests and the cases they link — from Playwright's own list, so every test counts, run or not.
const listed = JSON.parse(execSync("npx playwright test --list --reporter=json", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }));
const walk = (suite) => [
  ...(suite.specs ?? []).flatMap((spec) => spec.tests.map((test) => ({ title: spec.title, file: `tests/${spec.file}`.replace(/\\/g, "/"), annotations: test.annotations ?? [] }))),
  ...(suite.suites ?? []).flatMap(walk),
];
const seen = new Set();
for (const test of listed.suites.flatMap(walk)) {
  const app = test.file.split("/")[2];
  if (onlyApp && app !== onlyApp) continue;
  for (const link of test.annotations.filter((annotation) => annotation.type === "tms" && annotation.description)) {
    const key = keyFromUrl(link.description, app);
    const id = `${key}|${test.file}|${test.title}`;
    if (seen.has(id)) continue; // the same spec in several projects
    seen.add(id);
    const layer = test.file.split("/")[1];
    entry(key).tests.push({ title: test.title, layer: layer?.toUpperCase() ?? "?", app, file: test.file, url: link.description });
  }
}

// 2. How the linked tests ended in the last run — Allure's results of that run (a case is as good as its worst test).
const resultsDir = path.join(ROOT, "reports", "allure", "results");
const rank = { failed: 4, broken: 3, skipped: 2, unknown: 1, passed: 0 };
let lastRunAt = null;
for (const file of fs.existsSync(resultsDir) ? fs.readdirSync(resultsDir).filter((name) => name.endsWith("-result.json")) : []) {
  const result = JSON.parse(read(path.join(resultsDir, file)));
  const app = (result.labels ?? []).find((label) => label.name === "platform")?.value;
  if (onlyApp && app !== onlyApp) continue;
  if (result.start && (!lastRunAt || result.start > lastRunAt)) lastRunAt = result.start;
  for (const link of (result.links ?? []).filter((item) => item.type === "tms" && item.url)) {
    const known = cases[keyFromUrl(link.url, app)];
    if (!known) continue;
    const previous = known.lastRun in rank ? known.lastRun : null;
    if (previous === null || rank[result.status] > rank[previous]) known.lastRun = result.status;
  }
}

// 3. What the plans say about each case: a planned case's status and the layers it needs; a "Not now"
//    line's reason and date (scripts/gate/plans.mjs reads both, as the gate does).
const plans = readPlans(ROOT, onlyApp);
const unreadable = plans.flatMap(({ plan, unreadable: lines }) => lines.map((line) => ({ plan, line })));
for (const { plan, cases: planned, notNow } of plans) {
  for (const { ids, title, status, needs } of planned) {
    for (const id of ids) {
      entry(id).plan ??= { plan, title, status };
      entry(id).needs ??= needs;
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
//    automated     — tests link it on every layer it needs (`needs`, from its plan; any layer when unsaid),
//                    and no Not now line keeps it out ("Covered by …" lines keep nothing out);
//    not automated — no test links it; the plan's Not now line or status says why;
//    inconsistent  — tests link it while its plan keeps it in Not now, or on fewer layers than it
//                    needs (`missing`): the plan or the tests are wrong — the gate fails it too.
const summary = { automated: 0, "not automated": 0, inconsistent: 0 };
for (const known of Object.values(cases)) {
  const layers = [...new Set(known.tests.map((test) => test.layer))];
  known.layers = layers;
  known.missing = known.needs && layers.length ? known.needs.filter((layer) => !layers.includes(layer)) : [];
  known.keptOut = known.notNow.filter(keepsOut).length > 0;
  known.coverage = !layers.length ? "not automated" : known.keptOut || known.missing.length ? "inconsistent" : "automated";
  summary[known.coverage]++;
}

console.log(
  JSON.stringify(
    {
      app: onlyApp ?? null,
      caseLink: caseLinkOf(onlyApp) ?? null,
      caseLinks,
      lastRunAt: lastRunAt ? new Date(lastRunAt).toISOString() : null,
      plans: plans.map(({ plan }) => plan),
      summary,
      cases,
      unreadableNotNowLines: unreadable,
    },
    null,
    2,
  ),
);
