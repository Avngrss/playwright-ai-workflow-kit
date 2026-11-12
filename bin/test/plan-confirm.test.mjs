/**
 * The confirm a plan ends with, printed from the plan — `npm run kit:test`: routes in plain words, only the ready cases
 * without a test to write, the lines and the options that apply.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { checksOf, renderConfirm } from "../../scripts/agent/plan-confirm.mjs";

const block = (number, title, { level = "UI — the list on this screen", tag = "@regression", route, why = "main scenario: keep my addresses", status = "ready to implement now", data = "API setup — an address made by the client" } = {}) =>
  [`### ${number}. ${title}`, `- Level: ${level} · Tag: ${tag} · Role: customer · TMS: —`, route && `- Route: ${route}`, "- Value: Core · Severity: Critical · Priority: P1", `- Why: ${why}`, `- Status: ${status}`, `- Data: ${data}`].filter(Boolean).join("\n");

const text = [
  "# Account — Addresses",
  "- Ticket: none",
  "## Owners",
  "- this run: ui",
  "## Auth (from map)",
  "- auth as: precondition · role: customer",
  "## Test cases",
  block(1, "Customer adds a delivery address", { tag: "@regression @smoke", route: "intercept POST /api/addresses → 201 · street, city · screen list=value, toast=text" }),
  block(2, "Save stays disabled without a street", { route: "no-request · screen Save=state", why: "risk: half an address saved", data: "none — the form only" }),
  block(3, "Customer edits an address", { route: "intercept PUT /api/addresses/{id} → 204 · empty · read GET /api/addresses → street · screen list=value" }),
  "## Browsers, phone, screenshots",
  "- browsers: none — no date or file controls; the form has text fields only",
  "- phone: none — at 393 px the form keeps its fields",
  "- screenshots: none — nothing whose look matters",
].join("\n");
const plan = {
  plan: "specs/shop/account/addresses/addresses.md",
  notNow: [
    { title: "Another customer cannot read the addresses", ids: [], status: "needs api", reason: "the refusal shows on no screen" },
    { title: "200-character limit on Street", ids: [], status: "postponed", reason: "P3, low risk" },
  ],
  otherChecks: { browsers: "none — no date or file controls; the form has text fields only", phone: "none — at 393 px the form keeps its fields", screenshots: "none — nothing whose look matters" },
};

test("a route in plain words: the answer, a read after it, the screen with its kinds", () => {
  assert.equal(checksOf("intercept POST /api/addresses → 201 · street, city · screen list=value, toast=text"), "answer: 201, street, city · screen: list, toast (text)");
  assert.equal(checksOf("intercept PUT /api/addresses/{id} → 204 · empty · read GET /api/addresses → street · screen list=value"), "answer: empty · then read: street · screen: list");
  assert.equal(checksOf("no-request · screen Save=state"), "no request · screen: Save (state)");
  assert.equal(checksOf("api GET /api/reports → check: totalsAddUp"), "answer: totalsAddUp (stand data)");
});

test("the confirm: ready cases without a test, the lines, Not now, the owner limit's option", () => {
  const existing = [{ file: "tests/ui/shop/account/addresses/addresses.ui.spec.ts", title: "Customer edits an address" }];
  const shown = renderConfirm({ plan, text, existing, lastResults: [{ title: "Customer edits an address", status: "passed" }] });
  assert.match(shown, /^Plan: `specs\/shop\/account\/addresses\/addresses\.md` · basis: value-and-risk · role: customer$/m);
  assert.match(shown, /^\*\*Will be written \(2\)\*\*$/m);
  assert.match(shown, /^\| 1 \| Customer adds a delivery address \| UI \| the list on this screen \| answer: 201, street, city · screen: list, toast \(text\) \| Regression \+ Smoke \| P1 · Critical \| main scenario: keep my addresses \|$/m);
  assert.match(shown, /^\| 2 \| Save stays disabled without a street \| UI \|/m);
  assert.doesNotMatch(shown, /^\| 3 \|/m, "a case with its test is not written again");
  assert.match(shown, /^Test data: #1 API setup · #2 none — </m);
  assert.match(shown, /^Smoke: #1 — Customer adds a delivery address — say "no smoke"/m);
  assert.match(shown, /^Browsers, phone, screenshots: browsers none — no date or file controls · phone none — at 393 px the form keeps its fields · screenshots none — nothing whose look matters — say "no" to any of them\.$/m);
  assert.match(shown, /^Already automated \(1\): #3 — addresses\.ui\.spec\.ts — last run passed\.$/m);
  assert.match(shown, /^\| Another customer cannot read the addresses \| Needs api — the refusal shows on no screen \|$/m);
  assert.match(shown, /^\| 200-character limit on Street \| P3, low risk \|$/m);
  assert.match(shown, /^Write these 2 now\?\n1\. \*\*Yes, write them\*\* — 2 to write \(UI 2\) · 2 not now: needs api 1, postponed 1\n2\. \*\*Drop the limit and write 1 more\*\*/m);
  assert.match(shown, /^3\. \*\*Let me adjust the plan first\*\*$/m);
});

test("nothing ready without its test: no table, no question", () => {
  const existing = ["Customer adds a delivery address", "Save stays disabled without a street", "Customer edits an address"].map((title) => ({ file: "x.ui.spec.ts", title }));
  const shown = renderConfirm({ plan, text, existing });
  assert.match(shown, /^Nothing to write — every ready case has its test \(#1, #2, #3\)\.$/m);
  assert.doesNotMatch(shown, /Write these/);
});
