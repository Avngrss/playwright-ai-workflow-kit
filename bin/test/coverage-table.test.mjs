/**
 * The /coverage table from suite-coverage's data — `npm run kit:test`: a TMS suite's rows in order with their why
 * not, the lines under it and the next command; a plan's own scenarios without a TMS; one plan's cases; over 30 rows
 * grouped.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderCoverage } from "../../scripts/agent/coverage-table.mjs";

const PLAN = "specs/shop/account/addresses/addresses.md";
const ui = (title, lastRun = "passed") => ({ title, layer: "UI", file: "tests/ui/shop/account/addresses/addresses.ui.spec.ts", lastRun, url: `https://tms.example.test/case/${/\d+/.exec(title)[0]}` });
const data = {
  app: "shop",
  lastRunAt: "2026-11-10T09:00:00.000Z",
  cases: {
    401: { tests: [ui("TC-401 · Customer adds an address")], lastRun: "passed", coverage: "automated", scenarios: [{}], plan: { plan: PLAN, title: "TC-401 · Customer adds an address", status: "ready to implement now" }, notNow: [] },
    402: { tests: [ui("TC-402 · S1 · a street is required", "failed"), { ...ui("TC-402 · S1 · a street is required"), layer: "API" }], lastRun: "failed", coverage: "to rework", rework: ["tested twice: S1"], scenarios: [{}], plan: { plan: PLAN, title: "TC-402 · S1 · a street is required" }, notNow: [] },
    409: { tests: [], lastRun: "not run", coverage: "not automated", scenarios: [], plan: { plan: PLAN, title: "TC-409 · Another customer cannot edit my address", status: "blocked" }, notNow: [{ status: "blocked", reason: "step 2: needs a second test account", since: "2026-10-07" }] },
    410: { tests: [], lastRun: "not run", coverage: "not automated", scenarios: [{}], plan: { plan: "specs/shop/account/orders/orders.md", title: "TC-410 · Orders list", status: "ready to implement now" }, notNow: [] },
  },
  withoutTms: [],
  unreadableNotNowLines: [],
};
const suite = {
  title: "Account › Addresses",
  cases: [
    { id: "TC-409", title: "Another customer cannot edit my address" },
    { id: "TC-401", title: "Customer adds an address" },
    { id: "TC-402", title: "A street is required" },
    { id: "TC-411", title: "Customer deletes an address" },
  ],
};

test("a TMS suite: its cases only, automated → to rework → not automated, why not, the lines under it", () => {
  const shown = renderCoverage(data, { suite, tms: "Testiny" });
  assert.match(shown, /^Suite "Account › Addresses" \(Testiny\) — 4 cases · automated 1 \(25%\) · to rework 1 · not automated 2 · last run 2026-11-10$/m);
  const rows = shown.split("\n").filter((line) => /^\| \[?TC-/.test(line));
  assert.deepEqual(rows.map((row) => /TC-\d+/.exec(row)[0]), ["TC-401", "TC-402", "TC-409", "TC-411"]);
  assert.match(rows[0], /^\| \[TC-401\]\(https:\/\/tms\.example\.test\/case\/401\) \| Customer adds an address \| 1 \| UI 1 \| ✅ \| automated \| {2}\|$/);
  assert.match(rows[1], /\| UI 1 \+ API 1 \| ❌ \| to rework \| tested twice: S1 \|$/);
  assert.match(rows[2], /\| — \| — \| not automated \| Blocked — step 2: needs a second test account \(since 2026-10-07\) \|$/);
  assert.match(rows[3], /^\| TC-411 \| Customer deletes an address \| — \| — \| — \| not automated \| not planned yet \|$/);
  assert.doesNotMatch(shown, /TC-410/, "a case of another folder is not a row");
  assert.match(shown, /^- To rework \(TC-402\): .*specs\/shop\/account\/addresses\/addresses\.md$/m);
  assert.match(shown, /^- Failed when last run: TC-402$/m);
  assert.match(shown, /^Next: \/heal /m);
});

test("one plan's cases (a later pass), and a case planned but not written", () => {
  const shown = renderCoverage(data, { plan: "specs/shop/account/orders/orders.md" });
  assert.match(shown, /^Plan `specs\/shop\/account\/orders\/orders\.md` — 1 case · automated 0 \(0%\) · not automated 1/m);
  assert.match(shown, /\| not automated \| planned — not written yet \|$/m);
});

test("no TMS: each plan's own scenarios", () => {
  const plain = { app: "todo", lastRunAt: null, cases: {}, unreadableNotNowLines: [], withoutTms: [
    { plan: "specs/todo/todos/list/list.md", title: "A typed todo appears", owner: "UI", status: "ready to implement now", tests: [{ title: "A typed todo appears" }], lastRun: "passed", coverage: "automated" },
    { plan: "specs/todo/todos/list/list.md", title: "The list survives a reload", status: "postponed", reason: "P3, low risk", tests: [], lastRun: "not run", coverage: "not automated" },
  ] };
  const shown = renderCoverage(plain);
  assert.match(shown, /^Plan `specs\/todo\/todos\/list\/list\.md` — 2 cases · automated 1 \(50%\) · not automated 1 · last run none$/m);
  assert.match(shown, /^\| A typed todo appears \| UI \| ✅ \| automated \|$/m);
  assert.match(shown, /^\| The list survives a reload \| — \| — \| not automated — Postponed — P3, low risk \|$/m);
});

test("over 30 rows: automated as counts per owner, the rest grouped by reason", () => {
  const many = { ...data, cases: {} };
  const cases = [];
  for (let n = 500; n < 532; n += 1) {
    many.cases[n] = n < 520 ? { tests: [ui(`TC-${n} · case`)], lastRun: "passed", coverage: "automated", scenarios: [{}], plan: { plan: PLAN, title: `TC-${n} · case` }, notNow: [] } : { tests: [], lastRun: "not run", coverage: "not automated", scenarios: [], plan: { plan: PLAN, title: `TC-${n} · case`, status: "postponed" }, notNow: [{ status: "postponed", reason: "P3, low risk" }] };
    cases.push({ id: `TC-${n}`, title: "case" });
  }
  const shown = renderCoverage(many, { suite: { title: "Big", cases } });
  assert.match(shown, /^Automated 20: UI 1 — 20$/m);
  assert.match(shown, /^\| not automated — Postponed — P3, low risk \(12\) \| TC-520, .*TC-531 \|$/m);
  assert.doesNotMatch(shown, /^\| Case \|/m);
});
