/**
 * The test result verify writes for the summary — `npm run kit:test`: from what a run left (its tests, the plan, the
 * coverage, git) it fills every number, row, TMS line and the next command, and leaves `<…>` only for the agent's parts.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { planOf, renderTestResult } from "../../scripts/agent/test-result.mjs";

const SPEC = "tests/ui/shop/account/addresses/addresses.ui.spec.ts";
const PLAN = {
  plan: "specs/shop/account/addresses/addresses.md",
  app: "shop",
  feature: "Addresses",
  name: "Addresses (shop › Account)",
  text: "### 1. TC-401 · Customer adds an address\n### 2. TC-402 · S1 · a street is required\n## Manual case corrections\n- TC-402 step 3 — expected \"Required\" → \"Street is required\"\n",
  cases: [
    { number: "1", ids: ["401"], title: "TC-401 · Customer adds an address", status: "ready to implement now", level: "UI" },
    { number: "2", ids: ["402"], title: "TC-402 · S1 · a street is required", status: "ready to implement now", level: "UI" },
  ],
  notNow: [{ title: "TC-409 · Another customer cannot edit my address", ids: ["409"], status: "blocked", reason: "step 2: needs a second test account" }],
  otherChecks: { browsers: "none — no date or file controls", phone: "none — no layout change", screenshots: "none — nothing visual" },
};
const tests = [
  { title: "TC-401 · Customer adds an address", file: SPEC, project: "ui:shop", outcome: "passed", verdict: "passed" },
  { title: "TC-402 · S1 · a street is required", file: SPEC, project: "ui:shop", outcome: "passed", verdict: "passed" },
];
const coverage = {
  cases: {
    401: { tests: [{ file: SPEC, title: tests[0].title }], coverage: "automated", layers: ["UI"] },
    402: { tests: [{ file: SPEC, title: tests[1].title }], coverage: "automated", layers: ["UI"] },
    409: { tests: [], coverage: "not automated", layers: [] },
  },
};
const base = {
  verdict: "**Passed** — 2 of 2 tests green, no retry; qa:gate passed.",
  timeLine: "- Time: gate 0:10 · run 0:20 · total 0:30",
  tests,
  canFail: [{ at: `${SPEC}:12`, test: tests[0].title, result: "red at its line" }],
  specs: [SPEC],
  plans: [PLAN],
  coverage,
  red: [],
  changed: [SPEC],
  newTests: [{ file: SPEC, title: tests[0].title }],
  removed: [],
  changedSpecs: [SPEC],
};

test("a spec's plan: a feature folder, an E2E journey", () => {
  assert.equal(planOf(SPEC), "specs/shop/account/addresses/addresses.md");
  assert.equal(planOf("tests/e2e/shop/checkout/order-paid.e2e.spec.ts"), "specs/e2e/shop/checkout/order-paid.md");
});

test("a green run of new tests: the rows, what to mark in the TMS, the corrections, can-fail, /review next", () => {
  const text = renderTestResult(base);
  assert.match(text, /^## Test result — Addresses \(shop › Account\) · UI$/m);
  assert.match(text, /^Plan "Addresses" — 3 cases · automated 2 · not automated 1$/m);
  assert.match(text, /^\| TC-401 \| Customer adds an address \| 1 \| UI \| ✅ \| automated \|$/m);
  assert.match(text, /^\| TC-402 \| a street is required \| 1 \| UI \| ✅ \| automated \|$/m);
  assert.match(text, /^\| TC-409 \| Another customer cannot edit my address \| 1 \| — \| — \| not automated — step 2: needs a second test account \|$/m);
  assert.match(text, /\*\*In the TMS:\*\* mark Automated — TC-401, TC-402 .*· not automated, add the reason — TC-409: step 2: needs a second test account · fix by hand — TC-402 step 3/);
  assert.match(text, /^- Can fail: 1 of 1 red on purpose$/m);
  assert.match(text, /^- Browsers, phone, screenshots: browsers none · phone none · screenshots none · ran: Chromium only$/m);
  assert.match(text, /^- Independent review: full — waiting for \/review/m);
  assert.match(text, /^- \/review specs\/shop\/account\/addresses\/addresses\.md #1 — tests\/ui\/shop\/account\/addresses\/addresses\.ui\.spec\.ts — in a new chat$/m);
});

test("the next command follows the run: heal owed, one or two red, three or more, a ready case left, nothing", () => {
  const red = (n) => Array.from({ length: n }, (_, i) => `${SPEC}:${10 + i}`);
  const failed = { ...base, newTests: [], tests: [{ ...tests[0], outcome: "failed", verdict: "Possible bug — retest by hand", cause: "check did not match" }, tests[1]] };
  const next = (input) => /### Next\n- (.+)/.exec(renderTestResult(input))[1];
  assert.match(next({ ...failed, red: red(1), healOwed: true }), /^the automatic heal, now/);
  assert.equal(next({ ...failed, red: red(2) }), `/heal ${red(2).join(" ")}`);
  assert.equal(next({ ...failed, red: red(3) }), "/triage reports/run-summary.json");
  assert.match(next({ ...failed, red: red(1), fresh: true, attempt: 2 }), /^none — still red after the automatic heal/);
  assert.match(renderTestResult({ ...failed, red: red(1) }), /^- Customer adds an address|^- TC-401 · Customer adds an address — Possible bug — retest by hand · check did not match$/m);
  const leftReady = { ...base, newTests: [], coverage: { cases: { ...coverage.cases, 402: { tests: [], coverage: "not automated", layers: [] } } } };
  assert.equal(next(leftReady), `/implement ${PLAN.plan}`);
  assert.equal(next({ ...base, newTests: [], changedSpecs: [] }), "none");
});
