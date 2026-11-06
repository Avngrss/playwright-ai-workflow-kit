---
name: verify
description: Verify, heal, triage, review and show coverage. Verify what was just written or healed with one npm run verify (the gate, each new or changed check proven able to fail, one run with --retries=0, one block from the result files), the Allure report opened, one automatic heal after a fresh implement, a review of what the gate cannot check and an independent review (light for an edited test, full for a new one — /review in a new chat), then a summary led by the verdict and one next command. Heal one or two red tests by their verdict in reports/run-summary.md (the locator recipe, the stand's second pass, a product change sent to the plan's refresh, a hand-confirmed bug in specs/known-bugs.md, an unstable test quarantined with @flaky). Triage a red run — three or more red tests or a CI run — every failure sorted with its source quoted, one message to answer. Explain a failure. Coverage of a TMS suite (npm run suite:coverage). Use after the implement skill, when tests fail, when asked to verify, review, heal, triage ("triage the run") or explain, for "coverage of <TMS link>", or when someone asks where a test shows up in the report.
---

# Verify

Rules: `02-guardrails.mdc` (the quality gate, secrets, shared code, never retry a refused sign-in), `code.mdc`
(§Failures explain themselves, §The Allure report, §Flaky tests, §Healing), `plans.mdc` (§When the product
changes, §Known bugs), `live-app.mdc` (§Healing a locator drift), `api.mdc` (§When the contract drifts),
`01-workflow.mdc` (§Severity, §Hardening rules).

**Which path** — first match wins; a run's summary ends with the line naming it (`Next — tell the agent in this
test home: heal the red tests: <spec>:<line> …` or `… triage the run <link>`), its `Plans to refresh:` line
names the plans a changed product made stale:
1. a product or rule change named (a ticket, a doc, the user's words) → a refresh — the plan skill §3, even with
   red tests at hand: they are its evidence;
2. one or two red tests → §8, its short path;
3. three or more, "triage the run …" or a CI run → §10.

| Asked | This run |
|---|---|
| after the implement skill, `/verify`, "verify the … tests" | §1–§7; red after a fresh implement → §8 once |
| `/heal`, "heal the red tests: <spec>:<line> …" | §8, its short path |
| `/heal explain`, "what does this failure mean" | §8.1 only |
| `/triage`, "triage the run <link>" | §10 |
| `/coverage`, "coverage of <TMS link>" | §9 only — read-only |

## 1. Must tests run?

- Only a plan changed, no test file → `not run`; go to §6 (review the plan and any map edits).
- Tests or support code written or healed → required.

## 2. One command — `npm run verify`

From the repository root:

```bash
npm run verify -- <app> <spec[:line]…> [--also <spec[:line]…>] [--can-fail <spec>:<line>=<the line as spoiled>…] [--with-browsers]
```

- `<spec…>` — the app's specs this run wrote or changed; `<spec>:<line>` (any line inside a test) narrows to
  that test. A named spec none of whose tests ran fails the command ("did not run"), whatever else passed.
- `--also` — other features' specs (other apps' too) calling a member this run changed or removed (a method,
  a reader, a rule, an answer path), found by its name in `tests/` — in the same one run, never a run before
  it. Only adding a member or widening a type (a field made optional) needs none: the type check proves every
  caller; a narrowed type or schema does.
- `--can-fail` — one per test whose check this run wrote or changed (below).
- `--with-browsers` — a touched spec holds `@cross-browser` or `@responsive` tests: they also run in Firefox,
  WebKit and the phone in the same run (Firefox and WebKit are downloaded once when missing — say so).

It runs the gate (`npm run qa:gate`, `tsc` included), then can-fail, then **one run** of the specs and
`--also` — `--retries=0` (a pass on a retry is unstable, not green), the stand's second pass and a failed
sign-in smoke's rerun included — and stops at the first that fails; its last line says why. Its block and JSON
line (kept in `test-results/verify.json`) are what the summary copies. What it prints is what to do:
- gate findings → fixed the way they say (`02-guardrails.mdc` §Quality gate), the command again — a gate fix
  never costs a run;
- a spoiled check not `red at its line` → "Reading can-fail" below;
- a red run → by its verdicts (§8); a neighbour (`--also`) red on a check of its own, in code this run did not
  touch → its verdict in the summary, never healed here;
- `!!!` (a spoiled line not proven put back) → that line restored by hand before anything else; a verify cut
  off with lines spoiled → `npm run verify -- --restore` (the gate fails until they are back).

No other test command in a verification — no layer script, raw `npx playwright test` or `--reporter` (it
silently stops the Allure results) — but §8.6's repeat of an unstable test.

**Can fail** — a test still green with a wrong expectation checks nothing. A changed expected value or a new
or changed assertion → `--can-fail`; a locator-only fix or a renamed or moved step → none (the light review
checks the locator's scope instead, §6.2). One per such test: **the expected value of a check this run wrote
or changed** — in a new test its main check: the screen's in a UI or E2E test (the data `shown<Block>` is
built from, the expected text or state), the answer's in an API test (a `has:` value, the error code) —
spoiled inside the test's own assertion (`shownAddresses({ ...address, city: "Nowhere" })`), never the data
the test makes or sends, nor a helper it calls first. A state or a text → its opposite (`toBeDisabled` →
`toBeEnabled`; another word, not the same one recased). A stand-data rule (`check:`) has no known value → a
spoiled copy of the answer, one figure off by one (`check: (answer) => totalsAddUp({ ...answer, total:
answer.total + 1 })`). Passed whole: `--can-fail <spec>:<line>=<the whole line as spoiled>`. verify swaps the
lines, runs exactly those tests once, puts every line back and proves each file's hash — before the run.

**Reading can-fail** (the block's `Can fail:` line) — **red at its line** → it can fail · **red elsewhere** →
the test does not reach its check by the route its plan names: back to its path (the plan's `Route:`), then its
`--can-fail` again; a stand cause (out of time, stand unavailable, sign-in) → again once the stand answers;
still elsewhere → the command without that `--can-fail`, the summary saying "not proven — <why>" · **green —
blind** → the check holds whatever the app does (a reader matching anything, a value compared with itself, a
check caught or optional, a rule restating the answer): fixed, then again · **not run** → as its reason says.

**A fix after it** that changes a test (a heal, a review finding) → the command again, narrowed to the fixed
tests (`<spec>:<line>`) and the callers of a member the fix changed (`--also`), `--can-fail` as above; the
report and the coverage then show that run only — say so.

**A run the user does not allow** (tests writing to a kept or shared item) is never retried in another form or
cut down to what is allowed: the tests stay written; ask once to allow it or to run it themselves — the exact
command — and read its block. Without a run the result is **written — not run**: the review still runs, no case
is marked in the TMS. A test the user forbids to run is left out of the command and listed "not run — <why>".

## 3. A further role's sign-in, exercised once

Saved sessions stay fresh while tests are written, so a test this run wrote or changed that uses a role other
than the first account (the `role` option, a fixture signing in a second account, a second browser context)
signs that role in afresh: right before the command, each of the role's `state/<app>.<role>.<host>.session.json`,
`….api.json` (API modes) and `….refresh.json` (`refresh-token`) that exists is moved aside to `<the file>.aside`
— never deleted, never a `….failed.json` (a refused sign-in stays paused). A spec only trimmed needs none.

## 4. The report — open it for the user

Whenever tests ran: `npm run allure:open` in the background (generates from `reports/allure/results`, serves on
a local port, opens the browser) and give its `http://localhost:<port>` as `Report:`. Do not kill or restart it
while it serves. It fails (no results) → `Report: not generated (<reason>)`, not a verification failure.

How it is built — nothing to wire, everything from the spec's path, tags and annotations — and where a test shows
up in it: `code.mdc` §The Allure report. Several apps in the run → one report per app beside the all-apps one
(`reports/allure/html/awesome-<app>/`). The report shows only what ran; a TMS suite's full coverage is §9.

## 5. Classify — and heal once after a fresh implement

`passed` | `failed` | `partly passed` | `not run` — the block's first word.

This run just wrote the code (the implement skill, or a refresh's edits) and it is `failed` or `partly passed`
→ §8 once on the failure, then the command again as §2 "A fix after it" says (`--can-fail` only for a test not
proven yet or whose check the heal changed), then review the retried result. One automatic attempt only. §8
sends it back to the plan (requirement drift) → stop there; the user decides. Still failing, or this run is a
heal or a verify on its own → report the real state honestly.

## 6. Review

Read-only — no edits but to fix an independent review's finding (§6.2).

### 6.1 What the gate cannot check

The change set of this run (a plan-only run: the plan and the map edits). What `qa:gate` fails or warns is a
finding as the gate words it, never re-checked by hand. A finding is `<file> — <issue> — the smallest fix`,
rated on the scale of `01-workflow.mdc` §Severity, with evidence, never speculation. One line per check:

- **Scope** — only the selected cases and owners; every ready case written or moved to *Not now* with a reason;
  no test without a plan basis, no P3 while a P1/P2 is missing, no case outside the TMS set (basis
  `test-cases`), no `blocked` case written without new evidence.
- **The plan matches the code** — a `## Change log` line for each difference; no password in chat or a plan.
- **Value and routes** — each scenario proven once, by its owner's one test (`docs/Layer Routing Algorithm.md`
  §6): never a UI test re-asserting what its API test proves; each test follows its route (an `intercept`
  answer checked through `answerTo`, a `no-request` scenario listening to nothing, the screen compared with the
  answer only where the case did not know the values); no E2E that is a one-page check; documented negatives
  covered or `blocked` with a reason, none for undocumented behaviour.
- **Plain happy path vs optional-path positive** — a form or mutation's success is never covered only by an
  optional variant (an attachment, a promo code, an avatar, an opt-in) while the plain path with required fields
  only is missing — in smoke too.
- **Positive + negative per mutation** — no mutation endpoint with only negatives (no success contract checked),
  nor only positives while a documented negative is ready.
- **Real expected values** — no guessed status or message, no re-implemented product calculation, no defensive
  branch, no proof by a shared list compared before and after (`code.mdc` §Checks).
- **Messages** — an action the app answers with a message is checked with that exact text and its lasting outcome,
  never the message alone (`ui.mdc` §Who checks what).
- **The shared account's state** — no empty state or absolute count without `mocked` data; loaded and empty
  markers hold for every role and both data states.
- **Synchronisation and hidden flow** (changed UI and E2E code) — each action followed by its result state, a
  navigation by the destination's ready marker; no click-until loop or `try/catch` as a retry; no journey hidden
  in a fixture, hook or helper; an E2E ending on a user-visible outcome.
- **Abstractions** — the cleanup triggers of `code.mdc` §When an abstraction earns its cost and `ui.mdc` §Before
  accepting UI code; the fix is a refactor on request (`ui.mdc` §Ownership decisions and refactoring).
- **Data** — builder defaults valid, negative data explicit, created data cleaned up, no order dependency
  (`data-and-fixtures.mdc`).
- **Recommendation-first evidence** — an inferred fixture was proposed with the recommendation block of
  `data-and-fixtures.mdc` §Adding a fixture and the user said yes (or asked for it); fixture layering never
  changed unasked.
- **API schemas** — shape, not behaviour, in the client beside its call; optional, nullable and `.strict()` as
  the contract says; a schema contradicting an assertion is Critical (`api.mdc` §Response schemas).
- **Severity and opt-in tags** — each test's severity is its plan case's; `@visual`, `@cross-browser`,
  `@responsive` only with a plan reason; a visual baseline changed only with "Approve baseline: yes".
- **Security of changed code** — paths and categories, never a value: what the gate's patterns miss (a login or
  register response attached or logged, a credential the token pattern misses, guessed sensitive-field lists, a
  `.env`, storage state or saved session used as a test asset); generated or sensitive values behind
  `visualMaskTargets` where `@visual` checks exist; no scratch dump left; no `.env` value, token or `state/*.json`
  in what would be committed.
- **Security of config and CI** — `playwright.config.ts` changed or sign-in / form UI added → screenshot, trace
  and video retention on failure, a sign-in trace only with a plan note, Allure environment info hosts only; CI
  changed → what it uploads (`test-results/`, `playwright-report/`, Allure) and publishes, with retention and
  access.
- **Shared code changed only on request** — every change to the template's own files (`02-guardrails.mdc` §Shared
  code) was asked for by the user, is minimal, holds no product logic and is named in the summary; otherwise Major —
  put it back or ask. The tests' own code in `src/setup/<app>/`, `src/assertions/…` is not this.

Nothing found → `Review: none`.

### 6.2 Independent review

The writer reviewing its own tests sees what it meant, not what they check. Once this run's tests passed:

- **Full** — for every test this run wrote new (a case or scenario newly automated): a reviewer that did not
  write them — a **new chat** running `/review` (`.cursor/commands/review.md`) with only the cases, the test code
  and the run's report, asked where each test would pass although its case is broken. The summary's Next gives
  the line to paste there (`/review <plan> #<n> … — <spec paths>`); its report comes back into this chat. The
  user declines, or no new chat can run → the brief followed here, reading only what it lists; the summary says
  **not independent**.
- **Light** — only when this run just changed existing tests (a heal, a refresh, a triage fix): the brief's
  question and its five kinds (`.cursor/commands/review.md`) answered here for the changed tests — one line per
  kind under the summary's review line, `<1–5>: none — <the check holding it, file:line>` or the finding. A
  changed locator adds one line, its scope: `scope: <the locator> — one match, inside <its block>, file:line` (a
  match outside the block the case means is a finding).

**Every finding**: on a test this run wrote or changed — fixed, then the command again (§2 "A fix after it"), or
answered in one line (the check that holds it, `file:line`); on a test this run left untouched (an automated
one is never rewritten outside a refresh) — listed for a later refresh, not fixed. One round; a finding neither
fixed nor answered is open in the summary. A kind the brief does not name (`other:`) that a script could find in
the code → proposed as a gate rule (a shared file: only on the user's yes); one only a reader can judge → no
proposal. The run never edits the gate, a rule or a skill for it.

## 7. Summary — the verdict first

Verdict first, then what it covers, then what the user does; never the run's mechanics. **Its numbers and
verdicts** — tests green, can fail, each test's verdict, the stand-slow ones, coverage, time — are copied from
the last verify block (`test-results/verify.json`) or the result files (`reports/run-summary.json`,
`suite:coverage`), never written from memory.

```markdown
## Test result — <feature> (<App> › <Area>) · <the owners written: API | UI | E2E, joined with " + ">

**<Passed | Failed | Partly passed | Not run>** — <n> of <m> tests green, no retry; qa:gate <passed | n warnings>.
<a failed or partial run: one line per failing test with its verdict · a test left out: <title> — not run — <why>>

<the suite's coverage, short form — below (basis test-cases only)>

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

`Can fail`, `Independent review`, `Tests removed` and `Look over` keep only the parts that apply, and are left
out when this run wrote or changed no test.

**The suite's coverage, short form** — from the case list loaded at planning and `node
scripts/agent/suite-coverage.mjs --app <app>` (after a heal or a refresh: the plan's cases, no TMS load, the
first line `Plan "<feature>" — …`): the first line and the rows of the cases this run touched (every case when
the suite has ≤ ~10), then one line for the rest:

```markdown
Suite "<folder>" — <n> cases · automated <a> (<%>) · not automated <z>

| Case | Title | Scenarios | Owners | This run | Status |
|------|-------|:---------:|--------|:--------:|--------|
| TC-401 | Customer places an order and sees it in the list | 1 | UI | ✅ | automated |
| TC-408 | Another customer cannot edit my order | 1 | API | — | not automated — step 2: needs a second test account |

Other cases of the suite: automated <x>, not automated <z> — full table on request (`/coverage`).
```

**This run**: ✅ every test of the case passed in this run · ❌ one failed · — not every test of it ran.
`Status`: `automated` · `automated · to rework` · `not automated — <reason in a few words>` · `inconsistent`
(never at the end of a run: the gate fails it).

- **In the TMS** — only for basis `test-cases`, only cases whose every test passed in this run and every
  scenario has its test (to rework included): marking a case Automated takes it out of everyone's manual run. A
  case automated before this run (a heal, a refresh) → "already Automated — nothing to mark". A case not
  automated stays manual with its reason. Marking is a write: ask "Mark <n> cases as Automated in <TMS>? 1. Yes ·
  2. Not now" — and only when its MCP or API can do it; otherwise the line tells the user what to mark by hand.
- **Manual case corrections** (a plan with that section) — "fix these <n> cases in the TMS: <case link> step <n>
  — <expected now>"; never written to the TMS without the user's yes.
- **What only the engineer can give** — a case blocked on something the tests can neither read nor make, but the
  user can give once, gets one message right under the summary, cheapest first, saying where the tests already
  looked (the *Not now* line's `searched:` tail). Stand data asked for or re-checked (a later pass, a "ready"
  reply) → the same `npm run stand:find` first, as the tail names it: found → no message, the case is written;
  still nowhere → its fresh `searched:` tail and the message:
  - **a fact from another system** — "**TC-412 needs one fact from the CRM:** a customer and their account
    manager. Send both names here." The answer goes into the plan's `Data:` with source and date and the case is
    written (it checks the app against it with `expectStandData`);
  - **a stand item to prepare** — what it must be, and that it stays for the tests; named in the plan and the map
    once it exists;
  - **an account** (another role, a user without some right) — prepare the entries with `env:prepare` first,
    then: "**TC-408 needs another account: a user without admin rights.** Fill `<APP>_MEMBER_LOGIN` /
    `<APP>_MEMBER_PASSWORD` in `.env` (prepared empty) and reply ready — an account you have signed in with by
    hand." Then the setup skill §3.9, and the case is written with `test.use({ role: "member" })`.
- **One next command:**
  - no plan / an owner choice / a product or rule change → `/plan` (an existing plan: `/plan <plan path> — <what
    changed>`, a refresh);
  - ready cases left → `/implement` with the plan;
  - a new test whose full review is due → `/review <plan> #<n> … — <spec paths>` in a new chat;
  - one or two red tests, no heal tried yet → `/heal <spec>:<line> …`; three or more, or a CI run → `/triage`;
  - still failing after this run's automatic heal → say so plainly; heal again only from a genuinely different angle;
  - the stability gate stopped the plan → "none — come back when the feature is stable on the stand";
  - all green → none.

## 8. Heal

Fixes the test, never the intended behaviour; this section is the order of work, the rules above say what is
allowed. **One or two red tests** (the summary's "heal the red tests: <spec>:<line> …") — read only: §8.2, the
part of §8.5 its verdict needs, §8.7, §8.8, then §2 (`npm run verify -- <app> <spec>:<line>` per healed test,
`--also` for the callers of a member the fix changed, `--can-fail` only for a changed expected value or
assertion), §6.2 **Light** and §7. Still red → stop, its verdict in the summary. Three or more → §10.

### 8.1 Explain a failure

Readable failures are built in — never add failure helpers or a reporting fixture of your own. How a failure reads
(the verdict and cause, the body, background errors, the colours, the Categories tab, the run summary):
`code.mdc` §Failures explain themselves.

1. Read the run's summary first — `reports/run-summary.md` (`reports/run-summary.json`, the same in data): every
   failure under its verdict, possible bugs first, each with what to check by hand; tests whose cleanup failed;
   tests that passed only on a retry; tests the stand failed with their second pass.
2. Per failure, report: its verdict and cause, the check's name with expected vs received, the page and background
   errors when there are any, what to check by hand — and the next step (heal it here, a refresh, or a retest by
   hand). A verdict is a hint for the first look, never the answer: a bug is decided by a retest by hand.

Only explaining → stop there.

### 8.2 Evidence and verdict

The command, the error excerpt (no secrets) and the spec path — by default the failures in
`reports/run-summary.md`; missing → ask once. The verdict says where to look first, never what it is:

| Verdict | First look | Heal |
|---|---|---|
| Not a bug — the test needs fixing | the test's own frame; a locator → §8.5 | the smallest fix (§8.7) at that layer; no `## Change log` line — the plan did not change |
| Not a bug — the stand or its data | its line's second pass; stand data: the item the message names | failed again on its second pass → the stand: no test change, the summary says so; passed on it (*Stand was slow*) → nothing to do; stand data → restore it or change the lookup (the plan's `Data:` + a change-log line); a refused account → the team's to unlock — never the assertion, never a retried password |
| Not a bug — the product changed: refresh the plan | the finding (API changed: where it likely moved; screen changed: the text now shown) and the summary's `Plans to refresh:` | no test edit here — the plan skill's refresh: `/plan <plan path> — <what changed>` |
| Possible bug — retest by hand | the step by hand against the case (the user retests); request or answer did not match: the browser's Network tab on the action's answer | as the run saw → a bug (§8.3) or a changed requirement (§8.4); as the case expects → the test or its data; an element under another name → its Page Object (§8.5); the right answer under another path (same fields) → the client's answer path and the plan's `Route:`, like a locator |
| Known bug looks fixed — retest the ticket | the ticket, by hand | fixed → the user closes it, its row leaves `specs/known-bugs.md` (a change-log line); not fixed → the test no longer catches the bug: fix the test |
| Known bug — waiting for the fix | — | nothing |
| Unstable — passed on a retry | — | §8.6 |

A test the stand failed reads its second pass on its summary line, never timed by hand; failed again for another
cause → that cause's row. An element not found in a spec not committed yet reads "the test needs fixing": a new
or changed test's locator is the first suspect.

### 8.3 A bug confirmed by hand

Only once the user has retested it by hand and a ticket exists (`plans.mdc` §Known bugs: the expectation stays, the
test's code is not touched, the row's shape). Ask before writing: "Add <test> to specs/known-bugs.md with <ticket>,
failing at "<step>"? 1. Yes · 2. No". On yes, the row and a line in the plan's change log. A ticket is filed in the
tracker only on the user's explicit yes (its text may be drafted in chat).

### 8.4 Drift guard — requirement or technical?

`plans.mdc` §When the product changes decides: requirement drift → stop, back to the plan skill (a refresh:
`/plan <plan path> — <what changed>`); technical → heal here. Never weaken an assertion to match undocumented
product drift.

### 8.5 Find the real cause

**UI and E2E — re-inspect before you patch** (`live-app.mdc` §Healing a locator drift):
1. The failure's artifacts first — the screenshot, the page snapshot Playwright writes on failure
   (`test-results/**/error-context.md`), the trace (`npx playwright show-trace <trace.zip>`), the `Page:` line.
2. **The saved-session script first** — a one-off Playwright script outside `tests/` with the role's
   `state/<app>.<role>.<host>.session.json` as its storage state (`live-app.mdc`): the page opened as the test
   opens it, walked by the case's gesture to the failing step, printing what the locator should find — the
   candidates' texts and roles, the app's test id attribute, how many match, the block they sit in. The corrected
   locator, scoped to its block, is proven by the script printing `1`; the script is deleted after. The Playwright
   MCP explores what the script cannot settle (the element's current role, name and test id, a changed flow).
3. The element or flow no longer exists as the plan documents → §8.4. Otherwise the corrected locator goes into the
   Page Object (or component) — the smallest change; an E2E journey stays visible in its spec.

**API — the real answer.**
1. Repeat the failing request once outside the test only when the report does not show enough: through the app's
   client with the role's headers (`npm run auth:sign-in -- <app> <role>` first when the saved credentials
   expired). A probe longer than one line is a scratch script in a temp folder, removed after; never print a token,
   a cookie or a password.
2. Compare the status and the fields with the plan's case and the contract: the contract and the plan agree, the
   server differs → **possible bug** (the user retests by hand; §8.3); the contract changed → **drift** (§8.4,
   `api.mdc` §When the contract drifts); the test is wrong against an unchanged contract (a payload field, a path,
   a header, a stale lookup) → fix it.
3. Fix at the real layer — the request in its client, the payload in its builder, the item or search in the app's
   finder (the plan's `Data:` and a change-log line), the role's wiring in its fixture. Never a status widened
   (`[200, 201]`) or a field check dropped.
4. Sign-in or access (401 / 403, `invalid_grant`, a refused token) → not a test change: the account or the API
   credential source (the setup skill §3.7 failure table); a refused password is never retried.

### 8.6 Unstable — classify the cause before touching anything

`code.mdc` §Flaky tests. `--repeat-each 3` only confirms, before its fix, a test that passed on a retry or fails
now and then — a plainly red test never gets it: `npm run test:app -- <app> <spec> -g "<title>" --repeat-each 3
--retries=0`. Classify it (timing or locator · data collision — the usual one for API · the stand) and fix only
that cause, at its layer. Cannot be fixed now → quarantine exactly as that section says (`@flaky` instead of
`@regression`, the `// flaky:` reason line, `npm run test:flaky`, the exit after five green runs, noted in the plan).

### 8.7 The smallest fix

Only what `code.mdc` §Healing allows; nothing it forbids — no fixed wait, no timeout or retry as the only change, no
softened check, no `try/catch` around a check, no `test.fail` (§8.3 instead), no new coverage, no guessed status or
text, no tidying of files the failure does not touch.

### 8.8 Finish

1. Remove scratch made while diagnosing (probe specs, scripts, dumps); say what was removed.
2. A behaviour or data change the fix made → the plan's case and a `## Change log` line.
3. The command again on the healed tests (§2 "A fix after it"), then §6.2 **Light**.

### 8.9 When it keeps coming back — harden

Whether to harden at all: `01-workflow.mdc` §Hardening rules (a recurring lesson nothing covers clearly — never a
one-off, a typo or what belongs only in code). Then:

1. **Trigger** — the failure, flaky pattern, review finding or repeated mistake, and its impact.
2. **Recurrence** — the evidence it comes back; what is missing or unclear: a rule line, a skill step, a map entry, a
   gate check, a helper, a diagnostic; project-specific or universal.
3. **The smallest hardening** — one line in the rule that owns the topic, a skill step, a map entry, a small helper,
   a clearer diagnostic, a line in §6.1, a project doc, or nothing. A gate check or any other shared file
   (`02-guardrails.mdc` §Shared code) is proposed first and changed only on the user's yes.
4. **No duplicates or conflicts** — search the rules, skills, map, docs, helpers and the §6.1 list first; never a
   broad rewrite or a refactor justified by it; implementation behaviour unchanged unless required.
5. **Report** — trigger, recurrence evidence, the decision, the files changed and why it prevents a recurrence,
   consistency and conflicts checked, `npm run qa:gate` when code or rules changed.

## 9. Coverage — a TMS suite

**Read-only**: no file changed, no test run, no TMS or tracker write. A case is automated whole — every scenario
with its one test — or not at all; its tester would still run a part. The Allure report shows only what ran; this
table shows the whole suite (the short form at the end of a run is §7's).

1. **The suite** — the TMS folder link the user gave (a link to one case → its folder); else the TMS of the feature
   being worked on; else one message: "Paste the link to the TMS folder whose coverage you want." Load every case
   (id, title) through the TMS's MCP or API; unreachable → ask for the folder's case list (ids and titles). The map
   names no TMS, or the plan has no TMS ids → the plan's own coverage from `withoutTms` (step 2): one table per plan,
   `Scenario | Owner | Last run | Status`, never a substitute from tickets.
2. **Our side** — `node scripts/agent/suite-coverage.mjs --app <app>` (clean JSON; `npm run suite:coverage --
   --app <app>` adds npm's header lines) for the app whose `case link <app>` matches the suite. Per case number:
   `tests` (title, owner folder, file, scenario), `lastRun` (the worst result; `not run` unless every linked test
   ran in the last run — `ran: "<k> of <n>"`; a later run of another feature clears it), `plan`, `scenarios`,
   `coverage`, `missing`, `twice`, `rework`, `keptOut` (any *Not now* line but `Covered by …`), `notNow` (its
   reason without the `· searched:` tail — `searched` apart, never in "Why not"). Besides: `withoutTms` (plans
   with no TMS ids, matched by title) and `unreadableNotNowLines` (plan lines not in the shape of `plans.mdc` —
   listed under the table as "fix these plan lines", never guessed).
3. **Classify every case of the suite** — a case's number is its id's digits (`TC-408` → `408`); rows are the
   suite's cases only:

   | The case has | Status | Detail |
   |---|---|---|
   | one test for every scenario, each in its owner's folder, no *Not now* line keeping it out | **automated** | its owners + last run |
   | tests written before routing: a scenario tested twice (an API and a UI test of one result), or a plan with no routes | **automated · to rework** | `rework`: the scenarios tested twice, or "not routed" |
   | a *Not now* `Blocked` / `Cannot be automated` / `Postponed` line, no test | **not automated** | the reason — Blocked: the step that stops it and what unblocks it |
   | a *Not now* `Needs <owner>` line, no test | **not automated** | planned — a scenario of that owner, not in a run yet |
   | a plan case `ready to implement now`, no test | **not automated** | planned, not written yet |
   | nothing in any plan | **not automated** | not planned yet |
   | tests, and a *Not now* line keeping it out — or a scenario with no test, or a test outside its scenario's owner | **inconsistent** | a part of a case written: the plan or the tests are wrong — `qa:gate` fails it; fix before anything is marked |

4. **The table**:

   ```markdown
   Suite "<folder title>" (<TMS>) — <n> cases · automated <a> (<%>) · to rework <r> · not automated <z> · inconsistent <i> · last run <date | none>

   | Case | Title | Scenarios | Owners | Last run | Status | Why not |
   |------|-------|:---------:|--------|:--------:|--------|---------|
   | TC-401 | Customer places an order and sees it in the list | 1 | UI | ✅ | automated | — |
   | TC-405 | The order list filters by status | 1 | UI | ✅ | automated · to rework | S1 tested twice (API + UI) |
   | TC-408 | Another customer cannot edit my order | 1 | API | — | not automated | Blocked — step 2: needs a second test account without admin rights (since 2026-10-07) |
   | TC-417 | Repeat an order | — | — | — | not automated | not planned yet |
   ```

   - Ids as links (the app's `case link <app>`). Rows: automated → to rework → inconsistent → not automated (by
     reason). **Scenarios** — the plan's count (`—` when not planned); **Owners** — with counts; **Last run** — ✅
     every test passed · ❌ one failed · — not every test ran.
   - Under the table, one line each when they apply: the to rework cases ("tested twice — refresh their features to
     merge each pair into one test", their plans named); the inconsistent cases ("a part of these cases is written —
     fix the plan or the tests; `qa:gate` names them"); the cases whose tests failed last run; the unreadable plan lines.
   - More than ~30 rows → automated as counts per owner plus the failed ones; not automated grouped by reason
     (count + ids). An old `Blocked` date is worth a look — the next plan pass re-checks it.
   - At most one next command (e.g. "plan the cases not planned yet: `/plan` with this folder link").
5. **In the TMS** only automated cases (to rework included) whose every test passed are marked Automated, with
   their owners, and only on the user's explicit yes.

## 10. Triage the run

Three or more red tests, "triage the run <CI job link | reports/run-summary.json>" or a CI run: every failure
sorted, what the tests got wrong fixed, every changed expectation traced to its source — ending with one message
the user answers yes / no. A product or rule change named instead → the plan skill's refresh; one or two red tests
→ §8.

1. **The run** — no link → this test home's last run (`reports/run-summary.json`); older than the run meant → say
   so, stop. A CI job link → the agent does not fetch CI runs: one message asks for the job's `reports/` artifact,
   unpacked into this test home. Per failure (`tests`): verdict, cause, step, `plan`, `secondPass`; `stalePlans`;
   `slow` (passed alone) needs nothing. A spec changed since the run (git) → its failure may be gone. Evidence:
   the Allure result (`reports/allure/results/*-result.json`) and its `error-context` attachment.
   `npm run test:failed` only to reproduce before any change; every rerun after a change is `npm run verify` of
   the touched tests (step 4).
2. **Sort every failure — evidence, never a guess:**

   | The report says | First evidence | Outcome |
   |---|---|---|
   | the product changed (API · screen) | the contract or page the message names; the page live | **how** — fix |
   | possible bug (did not match · element not found) | the step by hand on the stand | **how**, **the test's mistake**, or **what** (step 3) |
   | the test needs fixing | the test's own frame | **the test's mistake** — heal (§8.5, §8.7) |
   | the stand or its data · a known bug | §8.2 | no test change |

   ***How*** a test reaches the product — a path, a locator, a label's case or spacing, where a field sits — is
   fixed on evidence. ***What*** it expects — a step, a rule, a sum, a value — changes only with a source (step
   3); otherwise the tests copy whatever the product does and stop catching regressions.
3. **What changed — the source before the verdict.** Every value or behaviour the run saw differ from the plan
   is traced, strongest source first: (1) the feature's tickets in the map's tracker (read-only), changed since the
   test's last green run, and the docs they link; (2) the product's code, when its repository is at hand — the
   function that computes or formats the value; (3) its history — `git log -S<value or field>`, the ticket in the
   commit; (4) the stand — it shows what *is*, never that it is right. **A verdict cites its quote**: the ticket
   and its field (`SHOP-412` acceptance criterion 3), a doc `file:line`, the product code `file:line`, a commit
   hash. A source that does not state the value is none — never a verdict from a guess.

   | Found | Verdict | Do |
   |---|---|---|
   | a ticket changed it after the test was written | **Product changed — <ticket>** | the plan first (the plan skill's refresh, from triage): the step, a `## Change log` line citing the quote, `## Manual case corrections`; then the test |
   | the app's rule is older than the test | **Test assumption wrong — app rule since <ticket or commit>** | the test and the plan line that stated it, the quote in the change log; a TMS correction when the case says the same |
   | no quote in 1–3 | **Possible bug** | nothing changed; asked in step 5 |
4. **Do the work** — on the working branch, nothing committed. *How* and the tests' mistakes: §8.7; *what*: step
   3, each change in its own hunks so a "no" drops it cleanly. The touched tests go through one `npm run verify`
   (§2); a fix that changed a check gets the **Light** review (§6.2).
5. **One message** — every line names its tests, every verdict its quote; empty groups left out. It ends a triage
   run — no §7 summary after it:

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
6. **The answers** — **yes** → the plan and the test change (the plan skill's refresh, from triage, the answer as
   its source), its change-log line "confirmed by the user <date>"; TMS corrections listed for the user, never
   written there without their yes. **no** → nothing changes, the test stays red; the agent drafts the bug (where,
   steps, expected, seen); with its ticket → `specs/known-bugs.md` (§8.3). **No answer yet** → the questions wait
   in `state/triage-<date>.md`; the next triage starts from them.
