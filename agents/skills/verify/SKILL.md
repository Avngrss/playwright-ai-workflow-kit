---
name: verify
description: Verify, heal, triage, review and coverage — one npm run verify of what was written or healed (gate, can-fail, one run), the Allure report, one automatic heal after a fresh implement, reviews (an independent one via /review in a new chat), a summary led by the verdict; heal one or two red tests; triage a red run (three or more, or CI) with sources quoted; explain a failure; a TMS suite's coverage. Use after the implement skill, when tests fail, when asked to verify, review, heal, triage ("triage the run") or explain, for "coverage of <TMS link>", or when someone asks where a test shows up in the report.
---

# Verify

Rules: each step names the sections it follows — of `02-guardrails.md`, `code.md`, `plans.md`, `live-app.md`,
`api.md` and `01-workflow.md` mostly.

**Which path** — first match wins (`01-workflow.md` §Which path; a run summary's last line names it):
- a product or rule change named (a ticket, a doc, the user's words), red tests or not → a refresh, the plan skill §3;
- `/heal explain`, "what does this failure mean" → §8.1 only;
- one or two red tests (`/heal`, "heal the red tests: <spec>:<line> …") → §8, its short path;
- three or more, a CI run (`/triage`, "triage the run <link>") → §10;
- `/coverage`, "coverage of <TMS link>" → §9 only, read-only;
- after the implement skill, `/verify`, "verify the … tests" → §1–§7; red after a fresh implement → §8 once.

## 1. Must tests run?

Only a plan changed, no test file → `not run`, go to §6 (the plan and any map edits). Tests or support code
written or healed → required.

## 2. One command — `npm run verify`

From the repository root:

```bash
npm run verify -- <app> <spec[:line]…> [--also <spec[:line]…>] [--can-fail <spec>:<line>=<the line as spoiled>…] [--with-browsers]
```

- `<spec…>` — the app's specs this run wrote or changed; `:<line>` (any line inside a test) narrows to that test —
  the whole spec runs when a file it imports under `src/` changed (the block: `whole spec: <file> changed`),
  can-fail still at the named lines; a named spec with no test run fails ("did not run").
- `--also` — other specs (other features' or apps') calling a member this run changed or removed (a method, reader,
  rule, answer path; its name searched in `tests/`), in this same run, never one before; none for an added member or
  a widened type (the type check proves every caller), but for a narrowed type or schema.
- `--with-browsers` — a touched spec holds `@cross-browser` or `@responsive` tests: also Firefox, WebKit and the
  phone, same run (Firefox and WebKit downloaded once when missing: say so).

It runs the gate (`qa:gate`, `tsc` included), can-fail, then **one run** with `--retries=0` (a pass on a retry is
unstable, not green; the stand's second pass and a failed sign-in smoke's rerun included), stops at the first that
fails, its last line saying why; the summary copies its block (`test-results/verify.json`). Then:
- gate findings → fixed as they say (`02-guardrails.md` §Quality gate), the command again: no run spent;
- a red run → by its verdicts, §5; a neighbour (`--also`) red on its own check in code this run did not touch →
  its verdict in the summary, never healed here;
- `!!!` (a spoiled line not proven put back) → restored by hand before anything else; a verify cut off with lines
  spoiled → `npm run verify -- --restore` (the gate fails until they are back).

No other test command in a verification (no layer script, raw `npx playwright test`, `--reporter` — `code.md` §The
Allure report) but §8.6's repeat.

**Can fail** — one `--can-fail` per test whose check this run wrote or changed (when: `02-guardrails.md` §Never
fitted to the product; a locator-only fix needs none — the light review checks its scope). Spoil the expected value
inside the test's own assertion: in UI or E2E the screen's (the data `shown<Block>` is built from —
`shownAddresses({ ...address, city: "Nowhere" })` — the expected text or state), in API the answer's (a `has:`
value, the error code); never the data the test makes or sends nor a helper it calls first; a text → another word,
not the same one recased; a stand-data rule (`check:`) → a copy of the answer one figure off (`totalsAddUp({
...answer, total: answer.total + 1 })`). Passed whole, `--can-fail <spec>:<line>=<the whole line as spoiled>`;
verify puts every line back, each file's hash proven, before the run.

**Reading can-fail** (the block's `Can fail:` line, as that section reads it) — **red elsewhere** (the test does not
reach its check; the error: `test-results/verify.log`) → back to the test's path (its plan's `Route:`), then again;
a stand cause (out of time, stand unavailable, sign-in) → again once the stand answers; still elsewhere → without
it, "not proven — <why>" in the summary · **green — blind** (a reader matching anything, a value compared with
itself, a check caught or optional, a rule restating the answer) → fixed, then again · **not run** → as its reason
says.

**A fix after it** that changes a test (a heal, a review finding) → the command again on the fixed tests
(`<spec>:<line>`), `--also` for callers of a member it changed, `--can-fail` as above; the report then shows that
run only (coverage keeps each test's last result): say so.

**A run the user does not allow** (tests writing to a kept or shared item) is never retried in another form or cut
down: the tests stay written; ask once to allow it or to run it themselves (the exact command), then read its
block. No run → **written — not run**: the review still runs, no case marked in the TMS. A test the user forbids
is left out, listed "not run — <why>".

## 3. A further role's sign-in, exercised once

Saved sessions stay fresh while tests are written, so a test this run wrote or changed under a role other than the
first account (the `role` option, a second account's fixture, a second browser context) signs it in afresh: right
before the command, that role's existing `state/<app>.<role>.<host>.session.json`, `….api.json` (API modes) and
`….refresh.json` (`refresh-token`) move to `<file>.aside`, never deleted, never a `….failed.json` (a refused
sign-in stays paused). Not for a spec only trimmed.

## 4. The report — open it for the user

Whenever tests ran: `npm run allure:open` in the background; its `http://localhost:<port>` is the summary's
`Report:`, never killed or restarted while it serves. No results → `Report: not generated (<reason>)`, not a
verification failure. How it is built, where a test shows up: `code.md` §The Allure report (per app:
`reports/allure/html/awesome-<app>/`). It shows only what ran; a suite's full coverage is §9.

## 5. Classify — and heal once after a fresh implement

The block's first word: `passed` | `failed` | `partly passed` | `not run`. This run just wrote the code (the
implement skill, a refresh's edits) and it is `failed` or `partly passed` → §8 once, the command again (§2 "A fix
after it"; `--can-fail` only for a test not proven yet or whose check the heal changed), then review the retried
result. One automatic attempt; requirement drift (§8.4) → stop, the user decides. Still failing, or a heal or a
verify on its own → report the real state honestly. The block's last line says which: `now the automatic heal:
<spec>:<line> …` — done before anything else, never left for the user — or `still red after the automatic heal`
(`reports/verify-state.json` keeps the attempt).

## 6. Review

Read-only — no edits but to fix an independent review's finding (§6.2).

### 6.1 What the gate cannot check

This run's change set (a plan-only run: the plan and the map edits). What `qa:gate` fails or warns is a finding as
it words it, never re-checked by hand. A finding: `<file> — <issue> — the smallest fix`, rated by `01-workflow.md`
§Severity, with evidence. One line per check:

- **Scope** — only the selected cases and owners; every ready case written or in *Not now* with a reason; no test
  without a plan basis, no P3 while a P1/P2 is missing, no case outside the TMS set (basis `test-cases`), no
  `blocked` case written without new evidence.
- **The plan matches the code** (`plans.md` §Confirm before any code); no password in chat or a plan.
- **Value and routes** — each scenario proven once, by its owner's one test along its route (`plans.md` §Layers,
  §Routes): no UI test re-asserting its API test, no one-page E2E; documented negatives covered or `blocked` with a
  reason, none for undocumented behaviour.
- **Plain happy path vs optional-path positive** — a form or mutation's success never covered only by an optional
  variant (an attachment, a promo code, an avatar, an opt-in) without the plain path of required fields, smoke too.
- **Positive + negative per mutation** — no mutation endpoint with only negatives (no success contract checked),
  nor only positives while a documented negative is ready.
- **Real expected values** (`code.md` §Checks), **messages** (`ui.md` §Who checks what), **API schemas**
  (`api.md` §Response schemas), **the shared account's state** (`data-and-fixtures.md` §Nothing stays on the
  stand; loaded and empty markers for every role and both data states, `ui.md` §Opening a page).
- **Synchronisation and hidden flow** (changed UI and E2E code) — each action followed by its result state, a
  navigation by the destination's ready marker; no click-until loop or `try/catch` as a retry; no journey in a
  fixture, hook or helper (`data-and-fixtures.md` §Never hide the action under test); an E2E ends on a
  user-visible outcome.
- **Abstractions** — the cleanup triggers of `code.md` §When an abstraction earns its cost and `ui.md` §Before
  accepting UI code; the fix is a refactor on request (`ui.md` §Ownership decisions and refactoring).
- **Data** (`data-and-fixtures.md`) — valid builder defaults, explicit negative data, cleanup, no order
  dependency. **Recommendation-first evidence** — an inferred fixture proposed as §Adding a fixture says and
  accepted; fixture layering never changed unasked.
- **Severity and opt-in tags** — each test's severity is its plan case's; `@visual`, `@cross-browser`,
  `@responsive` only with a plan reason; a visual baseline changed only on "Approve baseline: yes".
- **Security of changed code** — by paths and categories, never a value (`02-guardrails.md` §Secrets and settings,
  §Sensitive data in artifacts), what the gate's patterns miss: a login or register response attached or logged, a
  credential the token pattern misses, a guessed sensitive-field list, a `.env`, storage state or saved session as
  a test asset, values unmasked where `@visual` checks exist, a scratch dump left, a secret or `state/*.json` in what
  would be committed.
- **Security of config and CI** — `playwright.config.ts` changed or sign-in / form UI added → screenshot, trace and
  video retention on failure, a sign-in trace only with a plan note, Allure environment info hosts only; CI changed
  → what it uploads (`test-results/`, `playwright-report/`, Allure) and publishes, retention and access.
- **Shared code changed only on request** (`02-guardrails.md` §Shared code) — asked for, minimal, no product
  logic, named in the summary; otherwise Major: put it back or ask.

Nothing found → `Review: none`.

### 6.2 Independent review

When, why and its five kinds: `02-guardrails.md` §Never fitted to the product; the brief:
`agents/commands/review.md`. Once this run's tests passed:

- **Full** (every test this run wrote new) — a **new chat** running `/review` (its line in §7's Next), its report
  brought back here. Declined, or no new chat can run → the brief followed here, reading only what it lists: **not
  independent**.
- **Light** (only existing tests this run changed: a heal, a refresh, a triage fix) — the brief's question and five
  kinds answered here, one line per kind under the summary's review line, `<1–5>: none — <the check holding it,
  file:line>` or the finding; a changed locator adds `scope: <the locator> — one match, inside <its block>,
  file:line` (a match outside the block the case means is a finding).

**Findings** as that section says (fixed → the command again, §2 "A fix after it"; answered → one line, the check
holding it, `file:line`); one round, the rest open in the summary. An `other:` kind a script could find → proposed
as a gate rule (a shared file: only on the user's yes); one only a reader can judge → no proposal. The run never
edits the gate, a rule or a skill for it.

## 7. Summary — the verdict first

Verdict first, then what it covers, then what the user does; never the run's mechanics. Every number and verdict
(the stand-slow ones and time too) is copied from the last verify block or the result files (`02-guardrails.md`
§Never fitted to the product).

```markdown
## Test result — <feature> (<App> › <Area>) · <the owners written: API | UI | E2E, joined with " + ">

**<Passed | Failed | Partly passed | Not run>** — <n> of <m> tests green, no retry; qa:gate <passed | n warnings>.
<a failed or partial run: one line per failing test with its verdict · a test left out: <title> — not run — <why>>

<the suite's coverage, short form — below (basis test-cases); a plan without TMS ids: the block's Coverage line>

**In the TMS:** mark Automated — <automated cases, links: every scenario has its test> · already Automated — nothing to mark — <cases automated before this run> · not automated, add the reason — <TC-…: why — what unblocks it> · fix by hand — <the manual case corrections> (only the parts that apply)

- Report: <http://localhost:<port> | not generated>
- Browsers, phone, screenshots: <#N Firefox ✅ WebKit ✅ · #M phone ✅ · screenshot of <state> proposed — /implement <plan> Layer: visual | none planned> (the plan's decisions and what ran)
- Blockers: <none | list>
- Review: <none | findings, one line each>
- Can fail: <n> of <m> red on purpose · <title>: fixed — <what> | not proven — <why>
- Independent review: <full | full — waiting for /review | light | not independent> — <none | <n> findings — <k> fixed, <a> answered · open: <one line each>> · later refresh: <untouched test — finding> · gate rule proposed: <the kind, what it would catch>
  <light: one line per kind>
- Files changed: <list | none>
- Tests removed: <none | <title> — folded into <title> | gone with its scenario>
- Time: <the verify block's Time line>

### Next
- <one command>
- Look over each case beside its test (the table above, else the plan) and its steps in the report — a new feature's first tests, every one
```

`Can fail`, `Independent review`, `Tests removed`, `Look over`: only the parts that apply, none when this run wrote
or changed no test.

**The suite's coverage, short form** — the case list loaded at planning and `node scripts/agent/suite-coverage.mjs
--app <app>` (after a heal or a refresh: the plan's cases, no TMS load, first line `Plan "<feature>" — …`; a plan
without TMS ids: the verify block's `Coverage` line, `plan "<feature>" — <n> cases · automated <a> · …`, as it is):
the first line, the rows of the cases this run touched (every case when the suite has ≤ ~10), one line for the rest:

```markdown
Suite "<folder>" — <n> cases · automated <a> (<%>) · not automated <z>

| Case | Title | Scenarios | Owners | This run | Status |
|------|-------|:---------:|--------|:--------:|--------|
| TC-408 | Another customer cannot edit my order | 1 | API | — | not automated — step 2: needs a second test account |

Other cases of the suite: automated <x>, not automated <z> — full table on request (`/coverage`).
```

**This run**: ✅ every test of the case passed in this run, ❌ one failed, — not every test of it ran. **Status** as
§9's, the reason in a few words (`inconsistent` never at a run's end: the gate fails it).

- **In the TMS** — basis `test-cases` only: a case is marked Automated (it leaves everyone's manual run) only when
  every test of it passed in this run and every scenario has its test (to rework included). A write: ask "Mark <n>
  cases as Automated in <TMS>? 1. Yes · 2. Not now", only when its MCP or API can; else the line says what to mark
  by hand. **Manual case corrections** (a plan with that section: `<case link> step <n> — <expected now>`) are never
  written to the TMS without the user's yes.
- **What only the engineer can give** — a case blocked on something the tests can neither read nor make but the
  user can give once: one message right under the summary, cheapest first, saying where the tests already looked
  (the *Not now* line's `searched:` tail). Stand data asked for or re-checked (a later pass, a "ready" reply) → `npm
  run stand:find` first, as the tail names it: found → no message, the case is written; still nowhere → its fresh
  `searched:` tail and the message:
  - **a fact from another system** (`data-and-fixtures.md` §Facts only another system knows) — the fact, by case
    and system, to send back here; the answer goes into the plan's `Data:` with source and date, the case is
    written (`expectStandData` checks the app against it);
  - **a stand item to prepare** — what it must be, and that it stays for the tests; named in the plan and the map
    once it exists;
  - **an account** (another role, a user without some right) — its entries prepared by `env:prepare` first, then:
    "**TC-408 needs another account: a user without admin rights.** Fill `<APP>_MEMBER_LOGIN` /
    `<APP>_MEMBER_PASSWORD` in `.env` (prepared empty) and reply ready — an account you have signed in with by
    hand." Then the setup skill §3.9; the case is written with `test.use({ role: "member" })`.
- **One next command:** no plan, an owner choice, a product or rule change → `/plan` (an existing plan: `/plan
  <plan path> — <what changed>`, a refresh) · ready cases left → `/implement` with the plan · a new test's full
  review due → `/review <plan> #<n> … — <spec paths>` in a new chat · one or two red tests, no heal tried yet →
  `/heal <spec>:<line> …`; three or more, or a CI run → `/triage` · still failing after this run's automatic heal →
  say so plainly, heal again only from a genuinely different angle · the stability gate stopped the plan → "none —
  come back when the feature is stable on the stand" · all green → none.

## 8. Heal

Fixes the test, never the intended behaviour: this section orders the work, `code.md` §Healing says what is
allowed. **One or two red tests** (the summary's "heal the red tests: <spec>:<line> …") — read only §8.2, the part
of §8.5 its verdict needs, §8.7, §8.8 and §7. Still red → stop, its verdict in the summary. Three or more → §10.

### 8.1 Explain a failure

Readable failures are built in (`code.md` §Failures explain themselves): never add failure helpers or a reporting
fixture of your own. Read `reports/run-summary.md` first (`.json`: the same in data). Per failure: its verdict and
cause, the check's name with expected vs received, the page and background errors if any, what to check by hand,
and the next step (heal here, a refresh, a retest by hand). Only explaining → stop there.

### 8.2 Evidence and verdict

The command, the error excerpt (no secrets), the spec path — by default the failures in `reports/run-summary.md`;
missing → ask once. A verdict says where to look first, never what it is (its causes and first look: `code.md`
§Failures explain themselves):

| Verdict | Heal |
|---|---|
| Not a bug — the test needs fixing | a locator → §8.5; the smallest fix (§8.7) at that layer; no change-log line |
| Not a bug — the stand or its data | its second pass, read on its summary line, never timed by hand: no test change, say so; failed again for another cause → that cause's row. A lookup changed → `Data:` + a change-log line; a refused account → the team's to unlock, never the assertion |
| Not a bug — the product changed: refresh the plan | no test edit: `/plan <plan path> — <what changed>`, the finding as evidence (API: where it likely moved; screen: the text now shown) |
| Possible bug — retest by hand | the user retests: a bug → §8.3, a changed requirement → §8.4, an element renamed → its Page Object (§8.5), the right answer at another path (same fields) → the client's answer path and the plan's `Route:`, like a locator |
| Known bug looks fixed — retest the ticket | `plans.md` §Known bugs |
| Known bug — waiting for the fix | nothing |
| Unstable — passed on a retry | §8.6 |

### 8.3 A bug confirmed by hand

Only once the user has retested it by hand and a ticket exists — `plans.md` §Known bugs (the expectation and the
test's code stay, the row, the change-log line; a ticket filed only on the user's yes, its text drafted in chat).
Ask first: "Add <test> to specs/known-bugs.md with <ticket>, failing at "<step>"? 1. Yes · 2. No".

### 8.4 Drift guard — requirement or technical?

`plans.md` §When the product changes decides: requirement drift → stop, back to the plan skill (`/plan <plan path>
— <what changed>`); technical → heal here. Never weaken an assertion to match undocumented product drift.

### 8.5 Find the real cause

**UI and E2E** — re-inspect before you patch, as `live-app.md` §Healing a locator drift says: the failure's
artifacts (also `test-results/**/error-context.md`, `npx playwright show-trace <trace.zip>`), then **the
saved-session script first** (outside `tests/`, the role's `state/<app>.<role>.<host>.session.json` as its storage
state, deleted after), the Playwright MCP for what it cannot settle (an element's current role, name and test id, a
changed flow). Gone as the plan documents → §8.4; else the smallest change in the Page Object (or component), an
E2E journey staying visible in its spec.

**API — the real answer** (`api.md` §When the contract drifts):
1. Repeat the failing request once outside the test only when the report shows too little: the app's client, the
   role's headers (`npm run auth:sign-in -- <app> <role>` first when the saved credentials expired); a probe longer
   than one line is a scratch script in a temp folder, removed after; never print a token, a cookie or a password.
2. Status and fields against the plan's case and the contract: both agree, the server differs → **possible bug**
   (§8.3) · the contract changed → **drift** (§8.4) · the test wrong against an unchanged contract (a payload field,
   a path, a header, a stale lookup) → fix it.
3. At the real layer: the request in its client, the payload in its builder, the item or search in the app's finder
   (`Data:` + a change-log line), the role's wiring in its fixture; never a status widened (`[200, 201]`) or a
   field check dropped.
4. Sign-in or access (401 / 403, `invalid_grant`, a refused token) → no test change: the account or the API
   credential source (the setup skill §3.7 failure table); a refused password is never retried.

### 8.6 Unstable — classify the cause before touching anything

`code.md` §Flaky tests, in its order: confirm before the fix with `npm run test:app -- <app> <spec> -g "<title>"
--repeat-each 3 --retries=0` (never for a plainly red test), classify, fix only that cause at its layer (data
collision is the usual one for API), or quarantine exactly as it says, noted in the plan.

### 8.7 The smallest fix

Only what `code.md` §Healing allows, nothing it forbids; never `test.fail` (§8.3 instead).

### 8.8 Finish

1. Remove the scratch made while diagnosing (probe specs, scripts, dumps); say what was removed.
2. A behaviour or data change the fix made → the plan's case and a `## Change log` line.
3. The command again on the healed tests (§2 "A fix after it"), then §6.2 **Light**.

### 8.9 When it keeps coming back — harden

Only as `01-workflow.md` §Hardening rules allows; then:

1. **Trigger** — what recurs (a failure, flaky pattern, review finding, repeated mistake), its impact.
2. **Recurrence** — evidence it comes back; what is missing or unclear (a rule line, skill step, map entry, gate
   check, helper, diagnostic); project-specific or universal.
3. **The smallest hardening** — a line in the owning rule, a skill step, map entry, small helper, clearer
   diagnostic, §6.1 line, project doc, or nothing; a gate check or other shared file (`02-guardrails.md` §Shared
   code) proposed first, changed only on the user's yes.
4. **No duplicates or conflicts** — rules, skills, map, docs, helpers, §6.1 searched first; no broad rewrite or
   refactor for it; behaviour unchanged unless required.
5. **Report** — trigger, evidence, decision, files changed and why they prevent a recurrence, conflicts checked,
   `npm run qa:gate` when code or rules changed.

## 9. Coverage — a TMS suite

**Read-only**: no file changed, no test run, no TMS or tracker write. A case is automated whole or not at all (its
tester would still run a part).

1. **The suite** — the TMS folder link given (a case's link → its folder); else the feature's TMS; else one message:
   "Paste the link to the TMS folder whose coverage you want." Every case (id, title) through the TMS's MCP or API;
   unreachable → ask for the folder's ids and titles. No TMS in the map, or a plan without TMS ids → the plan's own
   coverage from `withoutTms` (counts: `withoutTmsSummary`), one table per plan, `Scenario | Owner | Last run |
   Status`, never a substitute from tickets.
2. **Our side** — `node scripts/agent/suite-coverage.mjs --app <app>` (clean JSON; `npm run suite:coverage` adds
   npm's header) for the app whose `case link <app>` matches the suite. Per case number: `tests`, `lastRun` (the
   worst of each test's last result, kept until a later run holds that test; `not run` while a linked test has
   none, `ran: "<k> of <n>"`), `plan`, `scenarios`, `coverage`, `missing`, `twice`, `rework`, `keptOut` (any *Not
   now* line but `Covered by …`), `notNow` (its `· searched:` tail never in "Why not"); besides, `withoutTms`
   (plans without TMS ids, matched by title) and `unreadableNotNowLines` (off the shape of `plans.md`: "fix these
   plan lines" under the table, never guessed).
3. **Classify every case of the suite** (its number: the id's digits, `TC-408` → `408`; rows: the suite's cases
   only) by the script's `coverage`, a case it does not list → not automated. Its detail:
   - **automated** (every scenario its one test in its owner's folder, no *Not now* line keeping it out) — its
     owners + last run;
   - **automated · to rework** (written before routing: a scenario tested twice by an API and a UI test, or a plan
     with no routes) — `rework`: the scenarios tested twice, or "not routed";
   - **not automated** — a *Not now* `Blocked` / `Cannot be automated` / `Postponed` line: its reason (Blocked: the
     step that stops it and what unblocks it) · `Needs <owner>`: planned, a scenario of that owner not in a run yet
     · `ready to implement now`: planned, not written yet · in no plan: not planned yet;
   - **inconsistent** (tests and a *Not now* line keeping it out, a scenario with no test, or a test outside its
     scenario's owner) — a part of a case written, the plan or the tests wrong (`qa:gate` fails it); fixed before
     anything is marked.

4. **The table**:

   ```markdown
   Suite "<folder title>" (<TMS>) — <n> cases · automated <a> (<%>) · to rework <r> · not automated <z> · inconsistent <i> · last run <date | none>

   | Case | Title | Scenarios | Owners | Last run | Status | Why not |
   |------|-------|:---------:|--------|:--------:|--------|---------|
   | TC-408 | Another customer cannot edit my order | 1 | API | — | not automated | Blocked — step 2: needs a second test account without admin rights (since 2026-10-07) |
   ```

   - Ids as links (the app's `case link <app>`); rows automated → to rework → inconsistent → not automated (by
     reason); **Scenarios** the plan's count (`—` when not planned), **Owners** with counts, **Last run** as §7's
     **This run**.
   - Under it, one line each that applies: the to rework cases ("tested twice — refresh their features to merge
     each pair into one test", their plans named); the inconsistent ones ("a part of these cases is written — fix
     the plan or the tests; `qa:gate` names them"); the cases whose tests failed last run; the unreadable plan lines.
   - Over ~30 rows → automated as counts per owner plus the failed ones; not automated grouped by reason (count +
     ids). An old `Blocked` date is worth a look: the next plan pass re-checks it.
   - At most one next command (e.g. "plan the cases not planned yet: `/plan` with this folder link").
5. **In the TMS** — as §7 says, with their owners.

## 10. Triage the run

Every failure sorted, the tests' mistakes fixed, every changed expectation traced to its source; one message the user
answers yes / no.

1. **The run** — no link → this test home's last run (`reports/run-summary.json`); older than the run meant → say
   so, stop. A CI job link → the agent does not fetch CI runs: one message asks for the job's `reports/` artifact,
   unpacked here. Per failure (`tests`): verdict, cause, step, `plan`, `secondPass`; `stalePlans`; `slow` (passed
   alone) needs nothing. A spec changed since the run (git) → its failure may be gone. Evidence: the Allure result
   (`reports/allure/results/*-result.json`) and its `error-context` attachment. Reruns: `01-workflow.md` §Which path.
2. **Sort every failure by the report's verdict — evidence, never a guess**: the product
   changed (API · screen) → the contract or page it names, the page live: **how**, fixed · possible bug (did not
   match · element not found) → the step by hand on the stand: **how**, **the test's mistake**, or **what** (step
   3) · the test needs fixing → **the test's mistake**, healed (§8.5, §8.7) · the stand or its data, a known bug →
   no test change. ***How*** (a path, a locator, a label's case or spacing, where a field sits) is fixed on
   evidence; ***what*** (a step, a rule, a sum, a value) only with a source (step 3): `02-guardrails.md` §Never
   fitted to the product.
3. **What changed — the source before the verdict.** Every value or behaviour that differs from the plan is traced,
   strongest source first: (1) the feature's tickets in the map's tracker (read-only) changed since the test's last
   green run, and the docs they link; (2) the product's code when its repository is at hand (the function that
   computes or formats the value); (3) its history, `git log -S<value or field>` and the ticket in the commit; (4)
   the stand, which shows what *is*, never that it is right. **A verdict cites its quote**: a ticket's field
   (`SHOP-412` acceptance criterion 3), a doc or product code `file:line`, a commit hash. A source not stating the
   value is none: never a verdict from a guess.
   - a ticket changed it after the test was written → **Product changed — <ticket>**: the plan first (the plan
     skill's refresh, from triage: the step, a `## Change log` line citing the quote, `## Manual case
     corrections`), then the test;
   - the app's rule is older than the test → **Test assumption wrong — app rule since <ticket or commit>**: the test
     and the plan line that stated it, the quote in the change log; a TMS correction when the case says the same;
   - no quote in 1–3 → **Possible bug**: nothing changed; asked in step 5.
4. **Do the work** — on the working branch, nothing committed. *How* and the tests' mistakes: §8.7; *what*: step 3,
   each change in its own hunks so a "no" drops it cleanly. The touched tests: one `npm run verify` (§2); a fix that
   changed a check gets the **Light** review (§6.2).
5. **One message** — every line names its tests, every verdict its quote; empty groups left out. It ends a triage
   run, no §7 summary after it:

   ```markdown
   Run <date · link> — <n> failed: <a> fixed · <b> changed with a source · <c> to answer · <d> stand

   **Fixed** — <a moved path / a reworded label / the test's own mistake> — <tests> — <evidence>

   **Stand** — <tests> — <cause>, <passed on its second pass | failed again on its second pass | no second pass — why>

   **Changed with a source** (plans and tests refreshed; fix these cases in the TMS)
   - Product changed — <ticket>: <before> → <now> — <its field | file:line | commit> — <tests> — <case> step <n>
   - Test assumption wrong — app rule since <ticket>: <rule> — <its field | file:line | commit> — <tests>

   **Is this intended?** (no source — answer "1 yes, 2 no")
   1. <before> → <now> — <tests> — searched: <tickets, code, history>

   Rerun: <n>/<n> green, no retry · gate passed

   Time: <the verify block's Time line>
   ```
6. **The answers** — **yes** → the plan and the test change (the plan skill's refresh, from triage, the answer as its
   source), the change-log line "confirmed by the user <date>"; TMS corrections listed for the user, never written
   there without their yes. **no** → nothing changes, the test stays red; the agent drafts the bug (where, steps,
   expected, seen); with its ticket → `specs/known-bugs.md` (§8.3). **No answer yet** → the questions wait in
   `state/triage-<date>.md`; the next triage starts from them.
