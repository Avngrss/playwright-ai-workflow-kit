---
name: verify
description: Verify, heal, review and show coverage. Verify what was just written or healed — one targeted run with --retries=0 (twice green), a further role's sign-in exercised once, the quality gate, the Allure report opened, one automatic heal after a fresh implement, a review of only what the gate cannot check (scope, value, plain happy path, positive + negative per mutation, security of changed code, config and CI, shared code changed only on request), then a summary led by the verdict with the suite's coverage (short form), what only the engineer can give and one next command. Heal a failing UI, E2E or API test from its verdict in reports/run-summary.md — the smallest fix at the real layer, requirement drift sent back to the plan, a hand-confirmed bug recorded in specs/known-bugs.md on the user's yes, a flaky test classified and quarantined with @flaky, the rules hardened when a failure keeps coming back. Explain a failure (verdict, cause, expected vs received, what to check by hand). Coverage of a TMS suite (npm run suite:coverage — every case automated, not automated and why, or inconsistent). Also how the Allure report works. Use after the implement skill, when a test fails or passes only on a retry, when asked to verify, review, heal or explain, for "coverage of <TMS link>", or when someone asks where a test shows up in the report.
---

# Verify

Rules: `02-guardrails.mdc` (the quality gate, secrets, shared code, never retry a refused sign-in), `code.mdc`
(§Failures explain themselves, §The Allure report, §Flaky tests, §Healing), `plans.mdc` (§When the product
changes, §Known bugs), `live-app.mdc` (§Healing a locator drift), `api.mdc` (§When the contract drifts),
`01-workflow.mdc` (the severity scale, §Hardening rules).

| Asked | This run |
|---|---|
| after the implement skill, `/verify`, "verify the … tests" | §1–§7; red after a fresh implement → §8 once |
| `/heal`, a failing test named, "fix the failures" | §8, then §2–§7 on the healed spec |
| `/heal explain`, "what does this failure mean" | §8.1 only |
| `/coverage`, "coverage of <TMS link>" | §9 only — read-only |

## 1. Must tests run?

- Only a plan changed, no test file → `not run`; go to §6 (review the plan and any map edits).
- Tests or support code written or healed → required.

## 2. One targeted run

- One command for everything this run touched, all layers of the app at once:
  `npm run test:app -- <app> <spec paths…> --retries=0` (one layer: `npm run test:app -- <app> ui <spec> --retries=0`;
  one test: add `-g "<title>"`). A touched spec holds `@cross-browser` or `@responsive` tests → add `--with-browsers`
  to the same command: they also run in Firefox, WebKit and the phone (Firefox and WebKit are downloaded once when
  missing — say so).
- Through the npm scripts, from the repository root; Playwright options go after the script's own.
  `npm run test:ui -- --project=ui:<app>` does not narrow a run — use `test:app`.
- **Two traps** (`code.mdc` §The Allure report): never `--reporter=…` on the command line (Allure results silently
  stop), and never layer scripts one after another (each clears the last results) — one command per verification.
- **`--retries=0`**: a pass on the config's retry is reported unstable, not green (`code.mdc` §Flaky tests) — a test
  written or healed now must pass without it.
- **Twice.** Green → the same command once more: a test is done when it passed twice in a row
  (`docs/test-strategy.md` §8).
- A red run is read from its summary first — at the end of the run and in `reports/run-summary.md`: every
  failure under its verdict, possible bugs first.

## 3. A further role's sign-in, exercised once

Saved sessions stay fresh while tests are written, so a test using a role other than the first account (the
`role` option, a fixture signing in a second account, a second browser context) runs once more with that role's
saved credentials removed — delete `state/<app>.<role>.*.session.json` and `.api.json` (caches, the sign-in writes them again), never
a `*.failed.json` — so the sign-in inside the run is really exercised.

## 4. The gate and the report

**The gate** — `npm run qa:gate`. Keep its original messages; findings are treated as `02-guardrails.mdc` says.

**The report — open it for the user** whenever tests ran: `npm run allure:open` in the background (generates
from `reports/allure/results`, serves on a local port, opens the browser) and give its `http://localhost:<port>`
as `Report:`. Do not kill or restart it while it serves. It fails (no results) → `Report: not generated
(<reason>)`, not a verification failure.

How it is built — nothing to wire, everything from the spec's path, tags and annotations — and where a test shows
up in it: `code.mdc` §The Allure report. Several apps in the run → one report per app beside the all-apps one
(`reports/allure/html/awesome-<app>/`). The report shows only what ran; a TMS suite's full coverage is §9.

## 5. Classify — and heal once after a fresh implement

`passed` | `failed` | `partly passed` | `not run`.

This run just wrote the code (after the implement skill) and it is `failed` or `partly passed` → §8 once on the
failure, then §2–§4 again on the same target, then review the retried result. One automatic attempt only. §8
sends it back to the plan (requirement drift) → stop there; the user decides. Still failing, or this run is a
heal or a verify on its own → report the real state honestly.

## 6. Review — only what the gate cannot check

Read-only, no edits: the change set of this run (a plan-only run: the plan and the map edits). What `qa:gate`
fails or warns is a finding as the gate words it, never re-checked by hand. A finding is `<file> — <issue> — the
smallest fix`, rated on the scale of `01-workflow.mdc` §Severity, with evidence, never speculation. One line per
check:

- **Scope** — only the selected cases, layers not mixed when one was asked; every ready case written or moved to
  *Not now* with a reason; no test without a plan basis, no P3 while a P1/P2 is missing, no case outside the TMS set
  (basis `test-cases`), no `blocked` case written without new evidence.
- **The plan matches the code** — a `## Change log` line for each difference; no password in chat or a plan.
- **Value** — each UI test proves a user-facing risk of its own, never an API case again or a backend predicate; no
  E2E that is a one-page check; documented negatives covered or `blocked` with a reason, none for undocumented
  behaviour (`plans.mdc` §Layers).
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
- **API schemas** — shape, not behaviour; optional, nullable and `.strict()` as the contract says; a schema
  contradicting an assertion is Critical (`api.mdc` §Response schemas).
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

## 7. Summary — the verdict first

```markdown
## Test result — <feature> (<App> › <Area>) · <API | UI | API + UI | E2E>

**<Passed | Failed | Partly passed | Not run>** — <n> of <m> tests green twice with --retries=0; qa:gate <passed | n warnings>.
<a failed or partial run: one line per failing test with its verdict>

<the suite's coverage, short form — below (basis test-cases only)>

**In the TMS:** mark Automated — <automated cases, links, each with its layers> · not automated, add the reason — <TC-…: why — what unblocks it> · fix by hand — <the manual case corrections> (only the parts that apply)

- Report: <http://localhost:<port> | not generated>
- Browsers, phone, screenshots: <#N Firefox ✅ WebKit ✅ · #M phone ✅ · screenshot of <state> proposed — /implement <plan> Layer: visual | none planned> (the plan's decisions and what ran)
- Blockers: <none | list>
- Review: <none | findings, one line each>
- Files changed: <list | none>

### Next
- <one command>
```

**The suite's coverage, short form** — from the case list loaded at planning and `npm run suite:coverage -- --app
<app>`: the first line and the rows of the cases this run touched (every case when the suite has ≤ ~10), then one
line for the rest:

```markdown
Suite "<folder>" — <n> cases · automated <a> (<%>) · not automated <z>

| Case | Title | Needs | API | UI | Status |
|------|-------|-------|:---:|:--:|--------|
| TC-401 | Customer places an order and sees it in the list | API+UI | ✅ | ✅ | automated |
| TC-408 | Another customer cannot edit my order | API | — | — | not automated — step 2: needs a second test account |

Other cases of the suite: automated <x>, not automated <z> — full table on request (`/coverage`).
```

Layer cells: ✅ passed in this run · ❌ failed · — no test of that layer. `inconsistent` never stays so at the end
of a run (the gate fails it).

- **In the TMS** — only for basis `test-cases`, only cases whose tests passed in this run, automated whole on
  every layer they need: marking a case Automated takes it out of everyone's manual run. A case not automated
  stays manual with its reason. Marking is a write: ask "Mark <n> cases as Automated in <TMS>? 1. Yes · 2. Not
  now" — and only when its MCP or API can do it; otherwise the line tells the user what to mark by hand.
- **Manual case corrections** (a plan with that section) — "fix these <n> cases in the TMS: <case link> step <n>
  — <expected now>"; never written to the TMS without the user's yes.
- **What only the engineer can give** — a case blocked on something the tests can neither read nor make, but the
  user can give once, gets one message right under the summary, cheapest first:
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
  - no plan / coverage choice / product drift → `/plan` (an existing plan: `/plan <plan path> — <what changed>`);
  - ready cases left on a layer → `/implement` with the plan;
  - a technical failure with no heal tried yet → `/heal`;
  - still failing after this run's automatic heal → say so plainly; heal again only from a genuinely different angle;
  - the stability gate stopped the plan → "none — come back when the feature is stable on the stand";
  - all green → none.

## 8. Heal

Fixes the test, never the intended behaviour; this section is the order of work, the rules above say what is
allowed.

### 8.1 Explain a failure

Readable failures are built in — never add failure helpers or a reporting fixture of your own. How a failure reads
(the verdict and cause, the body, background errors, the colours, the Categories tab, the run summary):
`code.mdc` §Failures explain themselves.

1. Read the run's summary first — `reports/run-summary.md` (`reports/run-summary.json`, the same in data): every
   failure under its verdict, possible bugs first, each with what to check by hand; tests whose cleanup failed;
   tests that passed only on a retry.
2. Per failure, report: its verdict and cause, the check's name with expected vs received, the page and background
   errors when there are any, what to check by hand — and the next step (heal it here, or a retest by hand). A
   verdict is a hint for the first look, never the answer: a bug is decided by a retest by hand.

Only explaining → stop there.

### 8.2 Evidence and verdict

The command, the error excerpt (no secrets) and the spec path — by default the failures in
`reports/run-summary.md`; missing → ask once. Start from the verdict and its first look (`code.mdc` §Failures
explain themselves), then:

- **Possible bug — retest by hand** → the user retests the step against the case: as the run saw it → a bug (§8.3)
  or a changed requirement (§8.4); as the case expects → the test or its data; the element under another name →
  its Page Object (§8.5).
- **Not a bug — the stand or its data** → restore the data or change the lookup (the plan's `Data:` and a change-log
  line); rerun once the stand is up; a refused account is the team's to unlock — never the assertion, never a
  retried password.
- **Not a bug — the test needs fixing** → fix the test at that layer (§8.5). An element not found in a spec not
  committed yet reads so too: a new or changed test's locator is the first suspect — check it live.
- **Known bug looks fixed** → the user retests the ticket (`plans.mdc` §Known bugs). **Known bug — waiting** → nothing.
- Passed only on the retry → unstable (§8.6).

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
2. Walk to the failing point in the MCP browser with the test's role, snapshot there, find the element's current
   role, name and test id.
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

### 8.6 Flaky — classify the cause before touching anything

`code.mdc` §Flaky tests: confirm it (`--repeat-each 5`; one timeout → `--repeat-each 3` first), classify it (timing
or locator · data collision — the usual one for API · the stand) and fix only that cause, at its layer. Cannot be
fixed now → quarantine exactly as that section says (`@flaky` instead of `@regression`, the `// flaky:` reason line,
`npm run test:flaky`, the exit after five green runs, noted in the plan).

### 8.7 The smallest fix

Only what `code.mdc` §Healing allows; nothing it forbids — no fixed wait, no timeout or retry as the only change, no
softened check, no `try/catch` around a check, no `test.fail` (§8.3 instead), no new coverage, no guessed status or
text, no tidying of files the failure does not touch.

### 8.8 Finish

1. Remove scratch made while diagnosing (probe specs, dumps); say what was removed.
2. A behaviour or data change the fix made → the plan's case and a `## Change log` line.
3. §2–§7 on the healed spec — it must pass with `--retries=0` (after §5's automatic heal: that one rerun).

### 8.9 When it keeps coming back — harden

Whether to harden at all: `01-workflow.mdc` §Hardening rules (a recurring lesson nothing covers clearly — never a
one-off, a typo or what belongs only in code). Then:

1. **Trigger** — the failure, flaky pattern, review finding or repeated mistake, and its impact.
2. **Recurrence** — the evidence it comes back; what is missing or unclear: a rule line, a skill step, a map entry, a
   gate check, a helper, a diagnostic; project-specific or universal.
3. **The smallest hardening** — one line in the rule that owns the topic, a skill step, a map entry, a small helper,
   a clearer diagnostic, a line in §6, a project doc, or nothing. A gate check or any other shared file
   (`02-guardrails.mdc` §Shared code) is proposed first and changed only on the user's yes.
4. **No duplicates or conflicts** — search the rules, skills, map, docs, helpers and the §6 list first; never a broad
   rewrite or a refactor justified by it; implementation behaviour unchanged unless required.
5. **Report** — trigger, recurrence evidence, the decision, the files changed and why it prevents a recurrence,
   consistency and conflicts checked, `npm run qa:gate` when code or rules changed.

## 9. Coverage — a TMS suite

**Read-only**: no file changed, no test run, no TMS or tracker write. A case is never "partly" automated — its
tester would still run it. The Allure report shows only what ran; this table shows the whole suite (the short form
at the end of a run is §7's).

1. **The suite** — the TMS folder link the user gave (a link to one case → its folder); else the TMS of the feature
   being worked on; else one message: "Paste the link to the TMS folder whose coverage you want." Load every case
   (id, title) through the TMS's MCP or API; unreachable → ask for the folder's case list (ids and titles). The map
   names no TMS and there is no case list → "The coverage table is built from a TMS suite — none is set up here."
   Stop; never a substitute from tickets or plans.
2. **Our side** — `node scripts/agent/suite-coverage.mjs --app <app>` (clean JSON; `npm run suite:coverage -- --app
   <app>` adds npm's header lines) for the app whose `case link <app>` matches the suite. Per case number: `tests`
   (title, layer, file, from Playwright's own list), `layers`; `lastRun` (the worst result of those tests, `not run`
   when none ran); `plan` (the status, and for a *Not now* line its reason and `since`); `needs`; `coverage`
   (`automated`, `not automated`, `inconsistent`); `missing` (needed layers no test covers); `keptOut` (a *Not now*
   line keeps the case out; `Covered by …` keeps nothing out); `unreadableNotNowLines` (plan lines not in the shape
   of `plans.mdc` — listed under the table as "fix these plan lines", never guessed).
3. **Classify every case of the suite** — a case's number is its id's digits (`TC-408` → `408`); rows are the
   suite's cases only:

   | The case has | Status | Detail |
   |---|---|---|
   | tests on every layer it needs, no *Not now* line keeping it out | **automated** | its layers + last run |
   | a *Not now* `Blocked` / `Cannot be automated` / `Postponed` line, no test | **not automated** | the reason — Blocked: the step that stops it and what unblocks it |
   | a *Not now* `Needs <layers>` line, no test | **not automated** | planned — needs <layers>, not in a run yet |
   | a plan case `ready to implement now`, no test | **not automated** | planned, not written yet |
   | nothing in any plan | **not automated** | not planned yet |
   | tests, and a *Not now* line keeping it out — or fewer layers than it needs | **inconsistent** | a part of a case written: the plan or the tests are wrong — `qa:gate` fails it; fix before anything is marked |

4. **The table**:

   ```markdown
   Suite "<folder title>" (<TMS>) — <n> cases · automated <a> (<%>) · not automated <z> · inconsistent <i> · last run <date | none>

   | Case | Title | Needs | API | UI | Status | Why not |
   |------|-------|-------|:---:|:--:|--------|---------|
   | TC-401 | Customer places an order and sees it in the list | API+UI | ✅ | ✅ | automated | — |
   | TC-408 | Another customer cannot edit my order | API | — | — | not automated | Blocked — step 2: needs a second test account without admin rights (since 2026-10-07) |
   | TC-417 | Repeat an order | — | — | — | not automated | not planned yet |
   ```

   - Ids as links (the app's `case link <app>`). Rows: automated → inconsistent → not automated (by reason).
   - One column per layer the tests use (`E2E` too when there are journeys): ✅ passed in the last run · ❌ failed ·
     — no test of that layer.
   - Under the table, one line each when they apply: the inconsistent cases ("a part of these cases is written —
     fix the plan or the tests; `qa:gate` names them"); the cases whose tests failed last run; the unreadable plan lines.
   - More than ~30 rows → automated as counts per layer plus the failed ones; not automated grouped by reason
     (count + ids). An old `Blocked` date is worth a look — the next plan pass re-checks it.
   - At most one next command (e.g. "plan the cases not planned yet: `/plan` with this folder link").
5. **In the TMS** only automated cases are marked Automated, with their layers, and only on the user's explicit yes.
