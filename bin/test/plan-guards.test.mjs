/**
 * The plan guards of `qa:gate` (scripts/gate/cases.mjs) and what `plan:block --case` writes for them — `npm run
 * kit:test`. Each test builds a small project in a temp folder (git, the map, one plan) and runs the kit's gate
 * there; only the lines a guard writes are read — an empty project has other findings of its own.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PLAN = "specs/shop/orders/orders/orders.md";

/** A project with the map (app "shop", UI and API) and git on main; `write`, `commit`, `git`, `gate`, `run` in it. */
function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-plan-guards-"));
  const git = (...args) => execFileSync("git", ["-c", "user.email=kit@example.com", "-c", "user.name=kit", ...args], { cwd: dir, stdio: "pipe", encoding: "utf8" });
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  git("init", "-q", "-b", "main");
  write(
    "specs/project-map.md",
    fs
      .readFileSync(path.join(KIT, "specs", "project-map.md"), "utf8")
      .replace("| default | default-ui | UI |", "| shop | shop-web | UI |")
      .replace("| default | default-api | API |", "| shop | shop-api | API |"),
  );
  const node = (script, args = []) => {
    const done = spawnSync(process.execPath, [path.join(KIT, script), ...args], { cwd: dir, encoding: "utf8" });
    return { code: done.status, out: `${done.stdout}${done.stderr}` };
  };
  return {
    dir,
    write,
    git,
    commit: (...files) => {
      git("add", "-f", ...files);
      git("commit", "-q", "-m", "base");
    },
    gate: () => node("scripts/gate/check.mjs"),
    run: (script, args) => node(script, args),
    read: (file) => fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n"),
  };
}

/** A case block in the plan template's shape; `extra` lines go after Data. */
const block = (n, id, { title = "Customer sees an order", level = "UI — the order on its page", route = "intercept GET /api/orders/{id} → id, total · screen order=value", priority = "P1", data = "stand — any order", extra = [], steps = ["Open the order"], drafted = true } = {}) =>
  [
    `### ${n}. ${id} · ${title}`,
    `- Level: ${level} · Tag: @regression · Role: customer · TMS: ${id}`,
    ...(Array.isArray(route) ? route : [`- Route: ${route}`]),
    `- Value: Core · Severity: Major · Priority: ${priority}`,
    `- Why: case ${id}`,
    "- Status: ready to implement now",
    `- Data: ${data}`,
    ...extra,
    "- Preconditions: none",
    "- Steps:",
    ...steps.flatMap((step, index) => [`  ${index + 1}. ${step}`, "     - expect: the order is shown"]),
    "- Cleanup: none",
    ...(drafted ? [`- Drafted from: state/sources/${id}.json`] : []),
  ].join("\n");

/** A whole plan: its header (with `- Cases:` unless `cases` is false), the blocks, Not now, corrections, change log, API brief. */
const planOf = (blocks, { cases = true, review = "", notNow = "", corrections = "", changed = "2026-11-20", brief = "- GET /api/orders/{id} → 200" } = {}) =>
  [
    "# Orders — Order page",
    "- Ticket: none",
    ...(cases ? ['- Cases: TMS folder "Orders" (TC-301..320)'] : []),
    ...(review ? [review] : []),
    "",
    "## Owners",
    "- this run: auto",
    "- found: UI 1 · API 0 · E2E 0 — none · other inputs: one order, no other values · access: one role and no ids · contract: the page shows the whole answer",
    "",
    "## Test cases",
    blocks.join("\n\n"),
    "",
    "## Browsers, phone, screenshots",
    "- browsers: none — text fields only",
    "- phone: none — the page keeps its layout at 393 px",
    "- screenshots: none — nothing whose look matters",
    "",
    "## Not now",
    notNow,
    "## Manual case corrections",
    corrections,
    "## Change log",
    `- ${changed} — new plan — cases affected: none, new plan`,
    "",
    "## API brief",
    brief,
    "",
  ].join("\n");

const lines = (out, words) => out.split("\n").filter((line) => line.includes(words));

test("API brief: a call no route sends and no Not now line names fails; a Gap line or a setup mark is accepted", () => {
  const home = project();
  const brief = "- GET /api/orders/{id} → 200\n- DELETE /api/orders/{orderId} → 204";
  home.write(PLAN, planOf([block(1, "TC-301")], { brief }));
  const loose = home.gate();
  home.write(PLAN, planOf([block(1, "TC-301")], { brief: `${brief} — cleanup` }));
  const marked = home.gate();
  home.write(PLAN, planOf([block(1, "TC-301")], { brief, notNow: "- Customer deletes an order · TMS: — · Gap since 2026-11-20 — DELETE /api/orders/{id}: no case covers it\n" }));
  const parked = home.gate();
  assert.equal(lines(loose.out, "## API brief").length, 1, loose.out);
  assert.match(loose.out, /^✗ .*"## API brief" names DELETE \/api\/orders\/\{\}, which no route sends/m);
  assert.doesNotMatch(loose.out, /names GET/);
  assert.deepEqual(lines(marked.out, "## API brief"), [], marked.out);
  assert.deepEqual(lines(parked.out, "## API brief"), [], parked.out);
});

test("a later screen-only step showing a value after an intercept fails in a plan being written, warns in one the branch left alone", () => {
  const home = project();
  const twoSteps = (second) =>
    block(1, "TC-309", { title: "Customer sees an order's total", route: ["- Route (step 1): intercept GET /api/orders/{id} → id, total · screen order=value", `- Route (step 2): ${second}`], steps: ["Open the order", "Look at its total"] });
  home.write(PLAN, planOf([twoSteps("screen-only · screen total=value")]));
  const borrowed = home.gate();
  home.write(PLAN, planOf([twoSteps("no-request · screen total=value")]));
  const owned = home.gate();
  home.write(PLAN, planOf([twoSteps("screen-only · screen note=text")]));
  const message = home.gate();
  home.write(PLAN, planOf([twoSteps("screen-only · screen total=value")]));
  home.commit(PLAN);
  home.git("checkout", "-q", "-b", "feature/next");
  const old = home.gate();
  const finding = 'Route (step 2) "screen-only · screen total=value": a value shown after the answer of step 1';
  assert.match(borrowed.out, new RegExp(`^✗ .*${finding.replace(/[()]/g, "\\$&")}`, "m"), borrowed.out);
  assert.deepEqual(lines(owned.out, "a value shown after the answer"), [], owned.out);
  assert.deepEqual(lines(message.out, "a value shown after the answer"), [], message.out);
  assert.match(old.out, new RegExp(`^! .*${finding.replace(/[()]/g, "\\$&")}`, "m"), old.out);
});

test("a plan built from TMS cases: a typed case block fails; plan:block --tms refuses a case there; --case writes its source line", () => {
  const home = project();
  home.write(PLAN, planOf([block(1, "TC-302", { drafted: false })]));
  const typed = home.gate();
  const refused = home.run("scripts/agent/plan-block.mjs", [PLAN, "--title", "Customer sees an order", "--tms", "TC-303"]);
  home.write("state/sources/TC-304.json", JSON.stringify({ id: "TC-304", title: "Customer sees an order", steps: "1. Open the order" }));
  const drafted = home.run("scripts/agent/plan-block.mjs", [PLAN, "--case", "state/sources/TC-304.json"]);
  assert.match(typed.out, /^✗ .*block\(s\) of TMS cases were not drafted from their source \("TC-302"\)/m, typed.out);
  assert.equal(refused.code, 1, refused.out);
  assert.match(refused.out, /is built from TMS cases — a case's block comes from its saved source/);
  assert.equal(drafted.code, 0, drafted.out);
  assert.match(home.read(PLAN), /^- Cleanup: <what is removed and how \| none>\n- Drafted from: state\/sources\/TC-304\.json$/m);
});

test("an answer step: plan:block --case marks it; the gate wants its owner — API needs an API scenario, a UI check an intercept", () => {
  const home = project();
  home.write(PLAN, planOf([]));
  home.write("state/sources/TC-305.json", JSON.stringify({ id: "TC-305", title: "An order's answer carries no card number", steps: '1. Open the order\n2. In DevTools open its "Response"', expected: "1. The order is shown\n2. No field holds the card number" }));
  const drafted = home.run("scripts/agent/plan-block.mjs", [PLAN, "--case", "state/sources/TC-305.json"]);
  const marked = home.read(PLAN);
  const owned = (decision, route) => planOf([block(1, "TC-305", { route, extra: [`- Answer steps: 2 — ${decision}`], steps: ["Open the order", "Look at the order"] })]);
  home.write(PLAN, planOf([block(1, "TC-305", { steps: ["Open the order", "Read the response body"] })]));
  const unowned = home.gate();
  home.write(PLAN, owned("API: the answer's own fields — S2"));
  const noApi = home.gate();
  home.write(PLAN, owned("UI check: the answer against the screen", "no-request · screen order=visible"));
  const deaf = home.gate();
  home.write(PLAN, owned("UI check: the answer against the screen"));
  const listening = home.gate();
  assert.equal(drafted.code, 0, drafted.out);
  assert.match(marked, /^- Answer steps: 2 — <API: the answer's own fields/m);
  assert.match(drafted.out, /read the server's answer itself/);
  assert.match(unowned.out, /^✗ .*"TC-305 · Customer sees an order" — step\(s\) 2 read the server's answer itself \("response body"\): say who proves them/m, unowned.out);
  assert.match(noApi.out, /^✗ .*gives them to API, and no API scenario of the case is in the plan/m, noApi.out);
  assert.match(deaf.out, /^✗ .*says "UI check", and no route of the block listens to the answer/m, deaf.out);
  assert.deepEqual(lines(listening.out, "read the server's answer"), [], listening.out);
});

test("an example tested by its criterion needs its case in Manual case corrections — a dashless id (C306) too", () => {
  const home = project();
  const example = (corrections) => planOf([block(1, "C306", { data: 'stand — case says "Blue mug" → any product with a price' })], { corrections });
  home.write(PLAN, example(""));
  const missing = home.gate();
  home.write(PLAN, example('- C306 step 1 — data "Blue mug" → "any product with a price"\n'));
  const listed = home.gate();
  assert.match(missing.out, /^✗ .*"## Manual case corrections" does not name their case \(C306\)/m, missing.out);
  assert.deepEqual(lines(listed.out, "Manual case corrections"), [], listed.out);
  assert.deepEqual(lines(listed.out, "not drafted"), [], listed.out);
});

test("more than 8 ready scenarios: an independent review no older than the last change; a ready P3 case warns", () => {
  const home = project();
  const blocks = Array.from({ length: 9 }, (_, i) => block(i + 1, `TC-3${10 + i}`, { title: `Customer sees order ${i + 1}`, priority: i === 8 ? "P3" : "P1" }));
  const review = "- Review: independent 2026-11-20 — 4 findings, each fixed or answered";
  home.write(PLAN, planOf(blocks));
  const unreviewed = home.gate();
  home.write(PLAN, planOf(blocks, { review }));
  const reviewed = home.gate();
  home.write(PLAN, planOf(blocks, { review, changed: "2026-11-21" }));
  const stale = home.gate();
  assert.match(unreviewed.out, /^✗ .*9 ready scenarios and no independent review — run \/review/m, unreviewed.out);
  assert.deepEqual(lines(reviewed.out, "independent review"), [], reviewed.out);
  assert.match(reviewed.out, /^! .*1 P3 case\(s\) ready \(TC-318\)/m, reviewed.out);
  assert.match(stale.out, /^✗ .*changed on 2026-11-21, after its independent review of 2026-11-20/m, stale.out);
});

test("a block where the branch began is left alone — moved down a number, or its plan renamed with git mv", () => {
  const home = project();
  const old = planOf([block(1, "TC-307", { drafted: false, steps: ["Open the order; check it in DevTools"] })]);
  home.write(PLAN, old);
  home.commit(PLAN);
  home.git("checkout", "-q", "-b", "feature/next");
  home.write("state/sources/TC-308.json", JSON.stringify({ id: "TC-308", title: "Customer sees an order", steps: "1. Open the order" }));
  home.write(PLAN, old.replace("## Test cases\n### 1.", `## Test cases\n${block(1, "TC-308")}\n\n### 2.`));
  const moved = home.gate();
  const renamed = "specs/shop/orders/order-page/order-page.md";
  home.write(PLAN, old);
  fs.mkdirSync(path.join(home.dir, path.dirname(renamed)), { recursive: true });
  home.git("mv", PLAN, renamed);
  home.write(renamed, old.replace("cases affected: none, new plan", "cases affected: none, new plan\n- 2026-11-21 — renamed — cases affected: none"));
  const kept = home.gate();
  assert.deepEqual(lines(moved.out, "TC-307"), [], moved.out);
  assert.deepEqual(lines(kept.out, "TC-307"), [], kept.out);
});

test("plan:block --case --take: a scenario keeps the case's step numbers", () => {
  const home = project();
  home.write(PLAN, planOf([]));
  home.write("state/sources/TC-312.json", JSON.stringify({ id: "TC-312", title: "Customer edits an order", steps: "1. Open the order\n2. Change the address\n3. Save it" }));
  const part = home.run("scripts/agent/plan-block.mjs", [PLAN, "--case", "state/sources/TC-312.json", "--scenario", "S2", "--title", "The new address is saved", "--take", "2-3"]);
  const text = home.read(PLAN);
  assert.equal(part.code, 0, part.out);
  assert.match(text, /^ {2}2\. Change the address$/m);
  assert.match(text, /^ {2}3\. Save it$/m);
  assert.doesNotMatch(text, /^ {2}1\. /m);
  assert.match(text, /^- Route \(step 2\): /m);
  assert.match(text, /^- Route \(step 3\): /m);
});

test("API brief reading: a method in prose is no call, bold and table calls are read, a setup mark covers only its own call", () => {
  const home = project();
  const brief = (text) => planOf([block(1, "TC-301")], { brief: text });
  home.write(PLAN, brief("- GET /api/orders/{id} → 200; a second GET with a wrong id → 404 — POST of the form is not sent"));
  const prose = home.gate();
  home.write(PLAN, brief("| Method | Path |\n|---|---|\n| GET | /api/orders/{id} |\n| **DELETE** | /api/orders/{id} |"));
  const table = home.gate();
  home.write(PLAN, brief("- POST /api/orders → 201 — setup; PATCH /api/orders/{id} → 200"));
  const marked = home.gate();
  assert.deepEqual(lines(prose.out, "## API brief"), [], prose.out);
  assert.match(table.out, /names DELETE \/api\/orders\/\{\}, which no route sends/, table.out);
  assert.match(marked.out, /names PATCH \/api\/orders\/\{\}, which/, marked.out);
  assert.doesNotMatch(marked.out, /names POST/);
});

test("API brief: a family of calls (`<section>`) is covered by any one of its members a route sends, and missed when none is", () => {
  const home = project();
  home.write(PLAN, planOf([block(1, "TC-301")], { brief: "- The order's parts, each a GET of /api/orders/{id}/<part> → 200\n- GET /api/<resource>/{id} → 200" }));
  const covered = home.gate();
  home.write(PLAN, planOf([block(1, "TC-301")], { brief: "- GET /api/reports/<section> → 200" }));
  const missed = home.gate();
  assert.deepEqual(lines(covered.out, "## API brief"), [], covered.out);
  assert.match(missed.out, /^✗ .*"## API brief" names GET \/api\/reports\/<…>, which no route sends/m, missed.out);
});

test("a plan the branch only renamed, or touched in its change log, keeps its old findings as warnings", () => {
  const home = project();
  const old = planOf([block(1, "TC-309", { route: ["- Route (step 1): intercept GET /api/orders/{id} → id, total · screen order=value", "- Route (step 2): screen-only · screen total=value"], steps: ["Open the order", "Look at its total"] })], {
    brief: "- GET /api/orders/{id} → 200\n- DELETE /api/orders/{id} → 204",
  });
  home.write(PLAN, old);
  home.commit(PLAN);
  home.git("checkout", "-q", "-b", "feature/next");
  home.write(PLAN, old.replace("cases affected: none, new plan", "cases affected: none, new plan\n- 2026-11-21 — a heal — cases affected: none"));
  const logged = home.gate();
  const renamed = "specs/shop/orders/order-page/order-page.md";
  fs.mkdirSync(path.join(home.dir, path.dirname(renamed)), { recursive: true });
  home.write(PLAN, old);
  home.git("mv", PLAN, renamed);
  const moved = home.gate();
  for (const run of [logged, moved]) {
    assert.match(run.out, /^! .*a value shown after the answer of step 1/m, run.out);
    assert.match(run.out, /^! .*"## API brief" names DELETE/m, run.out);
    assert.doesNotMatch(run.out, /^✗ .*(a value shown after|## API brief)/m, run.out);
  }
});

test("answer steps: a word alone is none, `none: <why>` is an answer, an intercept with a read listens", () => {
  const home = project();
  const withSteps = (steps, extra = [], route) => planOf([block(1, "TC-305", { steps, extra, route })]);
  home.write(PLAN, withSteps(["The payload limit message is shown", 'Click "Response" in the menu']));
  const words = home.gate();
  home.write(PLAN, withSteps(["Open the order", "Read the response body"], ["- Answer steps: 2 — none: the body is shown on the page itself"]));
  const none = home.gate();
  home.write(PLAN, withSteps(["Open the order", "Read the response body"], ["- Answer steps: 2 — UI check: the answer against the screen"], "intercept PUT /api/profile → sent: card.number · empty · read GET /api/profile → name · screen card=state"));
  const read = home.gate();
  for (const run of [words, none, read]) assert.deepEqual(lines(run.out, "read the server's answer"), [], run.out);
  assert.deepEqual(lines(none.out, "Answer steps"), [], none.out);
});

test("a plan under a folder named in another alphabet keeps its old blocks", () => {
  const home = project();
  const plan = "specs/shop/заказы/orders/orders.md";
  const old = planOf([block(1, "TC-307", { drafted: false })]);
  home.write(plan, old);
  home.commit(plan);
  home.git("checkout", "-q", "-b", "feature/next");
  home.write("state/sources/TC-308.json", JSON.stringify({ id: "TC-308", title: "Customer sees an order", steps: "1. Open the order" }));
  home.write(plan, old.replace("## Test cases\n### 1.", `## Test cases\n${block(1, "TC-308")}\n\n### 2.`));
  const run = home.gate();
  assert.deepEqual(lines(run.out, "TC-307"), [], run.out);
});

test("a case's source: its JSON's id counts, whatever the file is called; two blocks of one case stay apart", () => {
  const home = project();
  home.write(PLAN, planOf([]));
  home.write("state/sources/order-page.json", JSON.stringify({ id: "TC-304", title: "Customer sees an order", steps: "1. Open the order" }));
  const drafted = home.run("scripts/agent/plan-block.mjs", [PLAN, "--case", "state/sources/order-page.json"]);
  const named = home.gate();
  const twice = planOf([block(1, "TC-401", { data: 'stand — case says "Blue mug" → any product' }), block(2, "TC-401", { title: "Customer sees an order again" })], { corrections: "- TC-401 step 1 — data \"Blue mug\" → \"any product\"\n" });
  home.write(PLAN, twice);
  home.commit(PLAN);
  home.git("checkout", "-q", "-b", "feature/next");
  home.write("state/sources/TC-402.json", JSON.stringify({ id: "TC-402", title: "Customer pays", steps: "1. Pay" }));
  home.write(PLAN, twice.replace("\n## Browsers", `\n\n${block(3, "TC-402", { title: "Customer pays" })}\n\n## Browsers`).replace(/^- TC-401 step 1 .*\n/m, ""));
  const apart = home.gate();
  assert.equal(drafted.code, 0, drafted.out);
  assert.deepEqual(lines(named.out, "another case's source"), [], named.out);
  assert.doesNotMatch(apart.out, /^✗ .*TC-401/m, apart.out);
});

test("- Cases: the template's own <…> names no cases; a new plan of TMS cases without the line fails", () => {
  const home = project();
  home.write(PLAN, planOf([block(1, "TC-301", { drafted: false })], { cases: false }).replace("- Ticket: none", "- Ticket: none\n- Cases: <TMS> <the folder's or the cases' links> | none"));
  const typedHere = home.run("scripts/agent/plan-block.mjs", [PLAN, "--title", "Customer sees an order", "--tms", "TC-303"]);
  home.write(PLAN, planOf([block(1, "TC-301", { drafted: false })], { cases: false }));
  const unsaid = home.gate();
  home.write(PLAN, planOf([block(1, "TC-301", { drafted: false })], { cases: false }).replace("- Ticket: none", "- Ticket: none\n- Cases: none"));
  const linkedOnly = home.gate();
  assert.equal(typedHere.code, 0, typedHere.out);
  assert.match(unsaid.out, /^✗ .*are TMS cases \(TC-301\), and the header does not say where they come from/m, unsaid.out);
  assert.deepEqual(lines(linkedOnly.out, "TMS cases"), [], linkedOnly.out);
});

test("GitLab CI's gate job has the default branch to compare with — else the block guards would have no base", () => {
  const ci = fs.readFileSync(path.join(KIT, "ci", "gitlab", "gitlab-ci.yml"), "utf8");
  const baseline = /^baseline:\n((?:[ ].*\n|\n)*)/m.exec(ci.replace(/\r\n/g, "\n"))?.[1] ?? "";
  assert.match(baseline, /GIT_DEPTH: "0"/);
  assert.match(baseline, /AQA_BASE_BRANCH: origin\/\$CI_DEFAULT_BRANCH/);
  assert.match(baseline, /git fetch --quiet origin "\+refs\/heads\/\$CI_DEFAULT_BRANCH:refs\/remotes\/origin\/\$CI_DEFAULT_BRANCH"/);
});
