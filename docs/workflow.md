# Workflow

How to work with the kit once the app is added and signs in ([Getting started](getting-started.md)):
the eight slash commands, the everyday path, which command after a run, the other paths, where
reviews, audits and refactors live, what you will see in the chat, and example prompts.

## 1. Commands

Eight slash commands live in `agents/commands/`. Seven open the four skills in `agents/skills/`
(setup, plan, implement, verify); `/review` is the brief of an independent review, run in a new chat.
In Cursor's chat, type `/<command>` and then what it needs: a link, a plan path or a few words. If you
leave something out, the skill asks.

| Command | Skill | When to use | Fields |
|---|---|---|---|
| `/setup` | setup | Register an app (its map rows, `.env` address, fixtures, sign-in, first smoke), set up how tests sign in, or add another account or role | **What:** `app` \| `sign-in` \| `another account or role` · the app's URL or slug · details: a name, "sign-in broken", "change how tests sign in", the role |
| `/plan` | plan | A new feature plan or an E2E journey plan. On an existing plan: a later pass, one or two cases, an alignment with the TMS or a refresh, started by itself | what to cover: a TMS folder or case link, a ticket, a confirmed bug, a requirements doc, an API collection path, your own words, `E2E: <who does what, to what they see>`, or a plan path · the app and an owner limit (default: every owner the live check finds) · what changed |
| `/implement` | implement | Write a plan's ready cases: every scenario its one test in its owner's folder, each started by `npm run spec:draft`; a journey plan gets its E2E spec; `Layer: visual` adds or checks a screenshot test | the plan path · cases (default: every ready case not automated yet) · **Layer:** `visual` or `API only` — otherwise each case on the owners its blocks name, whole · **Approve baseline:** `yes` \| `no` (visual only, default no) |
| `/verify` | verify | Check what was just written or healed: one `npm run verify`, the report, one automatic heal after a fresh implement, the reviews, a summary | the target (default: what this session wrote or healed) |
| `/heal` | verify, §8 Heal | One or two red tests, each from its verdict, or only explain the failures | the failing tests `<spec>:<line> …` (default: the "heal the red tests" line of `reports/run-summary.md`) · mode `heal` or `explain` |
| `/triage` | verify, §10 Triage the run | Three or more red tests, or a CI run: every failure sorted by its verdict, every changed expectation traced to a source | the run (default: `reports/run-summary.json`) · later, your answers: `1 yes, 2 no` |
| `/coverage` | verify, §9 Coverage | A TMS suite case by case: automated, to rework, not automated or inconsistent. Read-only | the TMS folder link |
| `/review` | — (in a new chat) | An independent review of new tests against their cases | the plan and its blocks, the spec paths — the verify summary gives the whole line |

Without a command of its own — ask in words, or reference `@agents/skills/<name>/SKILL.md`:

- **A change to the project map** (an external system, a TMS case link, the tracker queue, a tag, a
  lock, an app's `tenants:` line): the setup skill §5.
- **A Page Object, an API client, a fixture, a builder, generator or dataset**, and the decision
  whether a UI block becomes a component: the implement skill §7. `/implement` makes them as its
  cases need them.
- **Allure metadata** (severity, a `tms(<id>)` case link): `/implement` writes it from the plan.
  Readable failures and the report tree are built in; there is nothing to configure.
- **A refactor of passing tests** ("split OrdersPage into components"): on request only — §4.
- **Turning a project back into the reusable kit**: `01-workflow.md` §Starter conversion.

## 2. The everyday path

One feature:

```text
/plan → "Yes, write them" → implement (each test from spec:draft) → verify (one npm run verify, one automatic heal on red)
     → /review in a new chat (new tests)
later: /implement (the rest of a plan) · /verify (a rerun) · /heal (one or two red) · /triage (three or more, or CI) · /coverage (a TMS folder)
```

### Which command after a run

The first that matches:

1. **A product or rule change you can name** (a ticket, a doc, your words) → `/plan <plan path> — <what
   changed>`, a refresh — even with red tests at hand: they are its evidence.
2. **One or two red tests** → `/heal <spec>:<line> …`.
3. **Three or more red tests, or a CI run** → `/triage`.
4. **New tests** → `/plan`, confirm, and the same run implements and verifies.

The run summary's last line names the one it needs: `Next — tell the agent in this test home: heal the
red tests: <spec>:<line> …` or `… triage the run <link>`. `npm run test:failed` only reproduces a failure
before a change; every rerun after one is `npm run verify` of the touched tests.

### Plan: `/plan`

Tell the agent what to cover: a TMS folder or case link, a ticket, a confirmed bug, a requirements doc,
an API collection, or the feature in your own words. Owners are not asked: every owner the stand shows is
planned. A limit in your words ("only API tests for …") keeps that owner's scenarios; the cases that need
another wait as `Needs <owner>`, and the confirm offers to drop the limit. The agent then:

- checks every candidate case on the live stand, noting the requests each action sends;
- splits each case into **scenarios** — one obligation that fails on its own — and gives each scenario
  **one owner** (API, UI or E2E: where its failure would point) and a **route**: how its test proves the
  result (the answer the action got and the screen, a reload, the screen alone);
- tries the setup of each case now (data, accounts), instead of promising it for later;
- before it calls a case blocked, searches three ways: the rule (the run's sources, the API docs, this
  repository's docs, the feature's tickets), the data (every account and tenant, `npm run stand:find`) and
  a way to make it. A `Blocked` line ends with where it searched (`· searched: …`);
- writes each case block with `npm run plan:block` — empty, or drafted from a saved TMS case or confirmed
  bug — and fills it from the live check;
- gives each case a status (`ready to implement now`, `blocked`, `postponed`, `cannot be automated`) and a
  reason;
- proposes at most one case as the feature's `@smoke` test, and decides browsers, phone and screenshots
  from the live screens.

**Where it lands:** `specs/<app>/<area>/<feature>/<feature>.md`. No test code is written in this step.

The plan ends with a confirm in the chat: **Will be written** (each test with its owner, why that owner
and what it checks), **Will be changed or removed** (on a refresh) and **Not now**, with the reason for
each case (§5). Then it asks "Write these <n> now?": **Yes, write them** · **Drop the limit and write
<k> more** · **Add them to <feature> instead** · **Let me adjust the plan first** (the middle two appear
only when they apply). Nothing is written before you answer.

### Implement: `/implement`

After **Yes, write them**, the same run goes on by itself: the tests, then verification. Use
`/implement <plan>` to implement an existing plan later, for example in a new chat.

- **Every test starts as `npm run spec:draft -- <plan> <#>`**: its title, tags, case link and role, and
  one step per plan step holding the step's route and expectation as comments. The agent replaces the
  comments with code; the gate fails a test that still holds them.
- **API:** `tests/api/<app>/<area>/<feature>/<feature>.api.spec.ts` — only what no screen shows. Bound
  clients go in `src/api/clients/<app>/`; with a contract, the answer types come from `npm run api:types`
  and each client's schema holds the fields its tests read. Created data is `AQA`-marked and removed by the
  test.
- **UI:** `tests/ui/<app>/<area>/<feature>/<feature>.ui.spec.ts`. Page Objects built from the live
  app go in `src/pages/<app>/` and are wired in `src/fixtures/<app>/pages.fixture.ts`. A UI test
  reads as its case: steps in plain words, named checks, the toast the app shows after the action, and
  the answer its own action got from the server (`answerTo`) — so no API test checks it again.

Only `ready to implement now` cases are written; scenarios already automated are skipped; each case is
written whole — every scenario its one test in its owner's folder. The batch ends with `npm run
qa:gate`, and its findings are fixed the way they say.

### Verify: `/verify`

Implement hands over to the verify skill by itself; `/verify [target]` runs it yourself. One command
checks the tests. The proof is one green run without a retry, and each new check seen red once with its
expected value spoiled; no second green run is asked for:

```bash
npm run verify -- <app> <spec[:line]…> [--also <spec…>] [--can-fail <spec>:<line>=<the line spoiled>…] [--with-browsers]
```

1. **The gate** — `qa:gate` with `tsc`. While it fails, nothing runs; its findings are fixed and the
   command runs again.
2. **Can fail** — for each test whose check the run wrote or changed, the expected value in that check is
   spoiled and the test runs once: it must go red at that line. Every line is put back and each file's
   hash proven. Green means the check is blind: it is fixed and proven again.
3. **One run** with `--retries=0`: the specs (one narrowed to a line runs whole when a file it imports
   changed), the neighbours that call what the run changed (`--also`), and with `--with-browsers` the
   tagged tests in Firefox, WebKit and a phone. A pass on a retry is unstable, not green. A test that
   failed because the stand was slow or down gets one second pass.
4. **One block** of results, copied from the result files (`test-results/verify.json`). A verify cut off
   with lines spoiled: `npm run verify -- --restore` puts them back (the gate fails until it does).

Around it, the verify skill:

- moves a further role's saved sign-in aside before a test written under that role runs, so its sign-in
  is exercised once afresh (the files are moved, never deleted);
- opens the Allure report (`npm run allure:open`) and gives you its local address;
- after a fresh implement, heals a failure automatically once and runs the command again;
- reviews only what the gate cannot check, with findings rated Critical, Major or Minor;
- asks for the **independent review**: full for every new test (`/review` in a new chat), light for a test
  it only edited (the same five questions answered in the same chat).

**What you get:** a summary that leads with the verdict (Passed / Failed / Partly passed / Not run) and
takes every number from the verify block, then the TMS suite's coverage in short form, what to mark
Automated in the TMS (written there only on your yes), the manual case corrections, what only you can
give (an account, a fact from another system), and one next command (§5).

### Review: `/review`

Run it in a **new chat**, so the reviewer has not seen how the tests were written. The verify summary
gives the line: `/review <plan path> #<n> … — <spec paths>`. The reviewer reads only the cases as their
source states them, each block's `Data:` and `Rules:` lines, the tests and the files they import, and
`reports/run-summary.md` — and edits nothing. Per test it asks one question: where would it pass although
its case is broken? Five kinds of finding: an unasserted step, a check that cannot fail, assumed data, a
fact re-proved by another layer, a mock where the case is about the real server.

You get one line per finding (or "none"); paste the report into the chat that wrote the tests. There each
finding is fixed and the command run again, or answered with the check that holds it.

### Heal: `/heal`

The verify skill's Heal section, for one or two red tests. With no arguments, `/heal` takes the "heal
the red tests" line of `reports/run-summary.md`, UI, E2E and API alike, and starts from each failure's
verdict ([Failure reporting](failure-reporting.md)). `/heal explain` only explains them: verdict, cause,
expected and received, what to check by hand, the next step.

- **The test needs fixing** — the smallest fix at the layer where the problem is: a locator re-checked on
  the live app (a short script with the role's saved session first, the Playwright MCP to explore), a
  readiness wait, data, a fixture or a client. A heal never softens an assertion, adds a fixed wait or
  uses `test.fail`.
- **The stand or its data** — the stand's second pass decides: passed → the stand was slow, nothing to
  do; failed again → no test change, rerun once the stand is up. A changed lookup goes into the plan's
  `Data:` line.
- **The product changed** — no test edit. The next step is `/plan <plan path> — <what changed>`, with the
  finding as its evidence.
- **Possible bug** — you retest the step by hand. **A bug you confirmed**, once a ticket exists, gets a row
  in `specs/known-bugs.md` on your yes. The test keeps its code and turns grey at its step. A ticket is
  filed only on your yes.
- **Unstable** (passed on a retry) — confirmed with `--repeat-each 3`, then classified by cause. If the
  cause cannot be fixed now, the test is quarantined with `@flaky` and a `// flaky: <cause> — <ticket>`
  line, and runs only in `npm run test:flaky`.
- **The same failure again and again** → the agent proposes the smallest change to a rule, a skill,
  the gate or the docs (`01-workflow.md` §Hardening rules); shared code changes only on your yes.

After a fix, each healed test runs once more through `npm run verify -- <app> <spec>:<line>` and gets the
light review.

### Triage: `/triage`

The verify skill's Triage section, for three or more red tests or a CI run. Default: this test home's
last run (`reports/run-summary.json`). With a CI job link, the agent does not fetch the run: it asks you
for the job's `reports/` folder, unpacked here. (The kit's CI jobs upload the Allure results and the
Playwright reports; the run summary itself is printed in the job's log.)

- Every failure is sorted by its verdict, on evidence: a moved path or a reworded label (**how** the test
  reaches the product) is fixed on evidence; a step, a rule or a value (**what** it expects) changes only
  with a source.
- **The source before the verdict** — strongest first: the feature's tickets changed since the test's
  last green run, the product's code when its repository is at hand, its history (`git log -S`), and only
  then the stand, which shows what is, never that it is right. Every verdict quotes its source: a ticket's
  field, a `file:line`, a commit.
- A ticket changed it → **Product changed**: the plan is refreshed first, then the test. The app's rule is
  older than the test → **Test assumption wrong**: the test and its plan line. No source → **Is this
  intended?** — a question for you; nothing changes until you answer.
- The touched tests get one `npm run verify`. Nothing is committed, and nothing is written to the TMS or
  the tracker without your yes.

You get one message (§5). Answer each question with its number: **yes** → the plan and the test change,
the change log citing your answer; **no** → the test stays red and the agent drafts the bug. Unanswered
questions wait in `state/triage-<date>.md` for the next triage.

### Coverage: `/coverage`

Give the TMS folder link. You get every case of the suite with one of four statuses (§5):

- **automated** — every scenario has its one test in its owner's folder, with the last run's result;
- **to rework** — automated, but written before routing: a scenario tested twice (an API and a UI test)
  or a plan with no routes. A refresh of its feature merges each pair into the owner's one test;
- **not automated** — why, since when, and what unblocks it;
- **inconsistent** — part of a case is written, or a test sits outside its scenario's owner; `qa:gate`
  fails it, and it is fixed before anything is marked.

The table is built from the TMS, `npm run suite:coverage -- --app <app>`, the plans and each test's last
result, kept until a later run holds that test. It is read-only. Without a TMS, or for a plan without TMS
ids, you get the plan's own scenarios and counts.

### Before a commit

Commit when `npm run qa:gate` passes and the last `npm run verify` of the touched tests is green: every
new or changed check red on purpose at its line, every test green in one run without a retry.
`.env`, `state/` and the run's outputs (`reports/run-summary.*`, Allure results, `test-results/`) are
git-ignored and never committed. Definition of done: [docs/test-strategy.md](test-strategy.md) §8.

## 3. Other paths

Needed less often. Most of them end by going back to the everyday path to implement and verify.

### An existing plan: a later pass, the TMS, one or two cases, a refresh

`/plan <plan path>` (or the same feature, link or words again). There is no separate command: the
plan file exists, so the plan skill starts a later pass by itself.

- **Every pass** starts with "Already automated: <n> of <m>" and its table (§5), re-checks the
  `Blocked` lines — stand data with the `npm run stand:find` their `searched:` tail names ("Unblocked: …
  · still blocked: …") — and stops with one next step when nothing is left to write.
- **With a TMS folder link** — an alignment: every case of the folder is mapped to its plan blocks or
  one *Not now* line, case drift gets the one question below, and a plan case with no TMS case is
  kept and listed as "not in the TMS". One `## Change log` line.
- **One or two cases** — adding, unblocking or reworking them reads only what those cases need.
- **With what changed** (`— Street is now required`) — a refresh: only the changed part is checked
  again; the affected cases and their tests are updated, a test whose scenario was folded into another
  is removed, and the confirm lists them under **Will be changed or removed**. A `## Change log` line
  names the change. A locator-only breakage is a heal, not a plan change.
- **A feature written before routing** (`to rework` in the coverage) is reworked only in a refresh you ask
  for, then whole: every case routed, each pair merged into the owner's one test.

### From a TMS folder

`/plan <TMS folder or case link>` when the feature has no plan yet. The TMS's cases are the plan's
set. The agent:

- reads them through the TMS's MCP or API, or works from the text you paste;
- checks each case live and skips the ones already automated (`npm run suite:coverage`);
- saves each case as the TMS returned it (`state/sources/<id>.json`, git-ignored) and drafts its block in
  the case's own words with `npm run plan:block -- <plan> --case state/sources/<id>.json`; a case holding
  several obligations becomes scenarios `S1`, `S2` …, a block each (`--scenario`, `--take`);
- maps every case to a plan case or a *Not now* line: `Blocked`, `Postponed`, `Cannot be automated`,
  `Needs <owner>`, `Covered by #N`, `Covered by <spec>`, or `Gap`.

When the stand contradicts the cases, you get one question per plan, each drift with its source:

- **The stand is right:** the agent tests what the stand does and lists each fix under
  `## Manual case corrections`, for you to make in the TMS.
- **The case is right:** the case stays `blocked`.
- **The value is an example:** the test checks the criterion behind it, not the example value.

The first case link of an app fills the map's `case link <app>` line. Tests link their case through
`tms(<id>)`, and the report shows the link. The TMS is read-only: nothing is created, edited or marked
Automated there without your explicit yes. The project map names the TMS (§Test cases (TMS)); any TMS
works.

### From a confirmed bug

`/plan <bug id or link>` — the feature the bug breaks gets a block proving the result the bug says it
should have: `npm run plan:block -- <plan> --bug state/sources/<id>.json`, the bug's steps and its
expected result as the last step's expectation. What the app does now is the block's `Seen:` line,
never a check. While the bug is open the test fails on it; once you have retested it by hand, it
becomes a row of `specs/known-bugs.md` on your yes, and the run shows it grey at its step.

### An E2E journey

A journey crosses a real boundary: pages, roles or services, with persisted state, ending in an
outcome only the journey produces. A page render or one form's validation is a UI test.

```text
/plan E2E: a customer places an order, a manager approves it, the customer sees "Approved"
→ specs/e2e/<app>/<area>/<journey>.md (with an E2E brief) → "Write this journey now?" → Yes
→ tests/e2e/<app>/<area>/<journey>.e2e.spec.ts → verified in the same run
(later, in a new chat: /implement specs/e2e/<app>/<area>/<journey>.md)
```

- Which role acts at which step comes from your description. Each role must be set up in the map's
  ```auth block and in `.env`. If one is missing, the whole journey is `blocked`.
- The journey is visible step by step in the spec. API calls only prepare data and clean up.
- A step a feature's test already proves stays there; the journey checks the hand-over.
- A journey is never `@smoke`.
- One journey covers one app. A journey across two apps in one test is not supported yet.
- The `e2e:<app>` project allows 60 s per test and one retry; `npm run verify` still runs it once,
  without a retry.

### API collection

Team Bruno collections go in `collections/bruno/<service-or-domain>/`
([collections/bruno/README.md](../collections/bruno/README.md)). They are request examples. The
OpenAPI/Swagger contract stays the source of truth.

1. `/plan <collection path>` — the plan skill inventories the collection first (endpoints,
   variables, auth hints, destructive requests, drift against OpenAPI; read-only, no request runs),
   compares it with the other plans and `tests/api/**`, then groups its requests into business
   capabilities and rates them. Planning only.
2. `/implement <plan>` — as in the everyday path.

### Visual, cross-browser, responsive

Properties of focused UI tests, never the whole suite in every browser. **You do not have to ask for them:**
every `/plan` with UI cases checks each screen on the stand — controls browsers treat differently (a date,
file or range input, an editable or draggable area), the screen at phone width, stable states whose look
matters — and writes its decisions into the plan's `## Browsers, phone, screenshots` (the gate fails a plan
with UI cases without them). The confirm shows them in one line; say "no" to any:

```text
Browsers, phone, screenshots: #9 @cross-browser — the date of birth field is an input type=date · phone: none — at 393 px the form keeps its fields · screenshot of the empty form after the tests (Layer: visual, your approval) — say "no" to any of them.
```

| Tag | Runs in | After "Yes, write them" | On its own |
|---|---|---|---|
| `@cross-browser` | also `firefox:<app>`, `webkit:<app>` | verify runs it in Firefox and WebKit in the same command (`--with-browsers`; they are downloaded once) | `npm run test:cross-browser` |
| `@responsive` | also `mobile:<app>` (Pixel 5) | verify runs it on the phone in the same command | `npm run test:responsive` |
| `@visual` | `ui:<app>` | proposed, not written: `/implement <plan> Layer: visual · Approve baseline: no`, then `yes` once you have looked at the image | `npm run test:visual` |

When implementing, the agent checks the screens again; something the plan missed (the screen changed) is
never tagged on its own — it is a line in the summary for you to decide. A `@visual` check is a test of its
own in the feature's `<feature>-visual.ui.spec.ts`, never a second test of a scenario: it reaches the state
through the Page Objects and checks it is ready first; dynamic and sensitive parts are masked; a baseline is
created or updated only when you answer `Approve baseline: yes`. A baseline belongs to the OS it was made on
(`…-win32.png` on Windows, `…-linux.png` in CI). CI runs these as separate jobs.

### A second app

```text
/setup app https://qa.backoffice.example.com
```

The first app stays as it is: nothing is renamed or moved. The new app gets:

- its own rows in the map, with `.env` names `<APP>_UI_URL` and `<APP>_API_URL`;
- its own fixtures (`src/fixtures/<app>/`);
- its own folders, created as its tests are written;
- its own Playwright projects (`smoke:<app>`, `api:<app>`, `ui:<app>` …);
- its own ```auth block.

If the new app uses the very same sign-in service (the same sign-in page host), its block says
`sign-in like: <app>`. It then tries the first app's account once. If the account is refused, you
add an account of its own. See [Auth strategy](auth-strategy.md).

To run one app: `npm run test:app -- <app> [layer]`; several: `npm run test:app -- shop,backoffice`.
With several apps in one run, each app gets its own report in `reports/allure/html/awesome-<app>/`, next
to the all-apps report. One app's broken sign-in stops only that app's tests.

### Upkeep

- `npm run test:flaky` runs the quarantined tests. Five green runs bring a test back
  ([docs/test-strategy.md](test-strategy.md) §8a).
- `npm run data:sweep` removes `AQA`-marked leftovers from the stand. The same sweep also runs before
  and after every test run.
- `npm run api:types` again when the API changed; `npm run typecheck` then names every client and test
  to update.
- Shared code (`src/setup/`, `src/reporting/`, `src/fixtures/*.ts`, `src/assertions/shared/`,
  `scripts/`) is changed only when you ask for it, and the summary names every such change
  (`02-guardrails.md` §Shared code).

## 4. Where reviews, audits and refactors live

There is no separate audit or refactor command; the independent review has its own (`/review`). Each
concern is covered here:

| Concern | Where it is covered |
|---|---|
| Review of what a batch wrote or changed | `npm run qa:gate` for everything it can check; can-fail for every new or changed check (`npm run verify`); then `/verify` §6.1 for only what the gate cannot: scope, the plan matching the code, value and routes (no UI test re-asserting its API test), plain happy path vs an optional-path positive, positive + negative per mutation, real expected values, synchronisation, data, the security of changed code, config and CI, shared code changed only on request |
| Independent review of new tests | `/review` in a new chat (verify §6.2, Full): only the cases, the plan's `Data:` and `Rules:` lines, the tests and the run's report; an edited test gets the light review in the same chat |
| A red run | one or two red tests → `/heal` (verify §8); three or more, or a CI run → `/triage` (verify §10) |
| Coverage of a TMS suite | `/coverage` (verify §9); its short form closes every `/verify` summary |
| Stability: flaky patterns, weak waits, hidden flows | the gate (fixed waits, a test without a check, misused `beforeAll` or serial mode, UI login in `beforeEach`, quarantine without a reason); `npm run verify` runs once with `--retries=0` — a pass on a retry is unstable, not green; the stand's second pass tells a slow stand from a broken test; `/heal` classifies a flaky test and quarantines it with `@flaky`; the review's synchronisation line |
| Test data: shared data, cleanup, isolation | the plan proves every case's `Data:` and setup on the stand before you confirm, and searches every account and tenant (`npm run stand:find`) before a case is blocked; the gate (a `disposable…` fixture without its sweep, a UI/E2E spec shaping data, copied setup); `npm run data:sweep`; the review's data line |
| Security: secrets and sensitive data | the gate (tokens, `process.env`, raw `console.*`, unmasked attachments); the CI secret scan (gitleaks) over the whole repository; the review's two security lines for changed code, config and CI ([Security and data](security-data-handling.md)) |
| An API collection: inventory and coverage | `/plan <collection path>` (plan §4.4) |
| Refactor: an over-abstraction, a Page Object grown too large, siblings repeating their base | on request only, usually after a gate warning: a behaviour-preserving refactor, then `npm run verify` of the impacted specs; a component split only for one of the three reasons (`ui.md` §Ownership decisions and refactoring) |
| Hardening after a recurring failure or agent mistake | `/heal` (verify §8.9, `01-workflow.md` §Hardening rules) |
| Turning a project back into the reusable kit | ask in words (`01-workflow.md` §Starter conversion) |

## 5. What you will see

The shapes below are fixed; the rows are examples (a shop: addresses, orders).

### The plan's confirm

```markdown
Plan: `specs/shop/account/addresses/addresses.md` · basis: test-cases · role: customer

**Will be written (4)**

| # | Test | Owner | Why this owner | Checks | Suite | Priority | Why it is needed |
|---|------|-------|----------------|--------|-------|----------|------------------|
| 1 | TC-401 · Customer adds a delivery address | UI | the result on the same screen: the list | answer: street, city · screen: the list, the toast | Regression + Smoke | P1 · Critical | case TC-401 |
| 2 | TC-402 · Another customer cannot read the addresses | API | no screen: a direct request is refused | answer: 403 · error code | Regression | P1 · Critical | case TC-402 |
| 3 | TC-403 · An address without a street is refused | UI | the form refuses before any request | no request · screen: Save disabled, "Street is required" | Regression | P2 · Major | case TC-403 |
| 4 | TC-404 · Customer edits a delivery address | UI | the result on the same screen: the list | answer: street · screen: the list, the toast | Regression | P2 · Major | case TC-404 |

Test data: the tests create their own addresses and remove them (create and delete tried today).
Priority: P1 is looked at first when it fails · Critical / Major / Minor — how bad a breakage is.
Smoke: #1 — the feature's main scenario, under the first account — say "no smoke" to keep it regression only.
Browsers, phone, screenshots: browsers: none — no control engines treat differently · phone: none — at 393 px the form keeps its fields · screenshot of the empty list (your approval) — say "no" to any of them.

**Not now (2)**

| Test | Why not now |
|------|-------------|
| TC-409 · Another customer cannot edit my address | Blocked — step 2: needs a second test account |
| TC-410 · 200-character limit on Street | Postponed — P3, low risk |
```

Then: "Write these 4 now?" 1. **Yes, write them** — "4 to write (API 1, UI 3) · 2 not now: blocked,
P3" · 2. **Let me adjust the plan first**. A refresh adds **Will be changed or removed** — `Test | Spec |
Change | Why`, e.g. `removed — folded into #1`.

### A later pass

```markdown
Already automated: 4 of 6

| Case | Owners | Coverage | Last run |
|------|--------|----------|----------|
| TC-401 · Customer adds a delivery address | UI | automated | passed |
| TC-402 · Another customer cannot read the addresses | API | automated | passed |
| TC-403 · An address without a street is refused | UI | automated | failed |
| TC-404 · Customer edits a delivery address | UI | automated | passed |
| TC-409 · Another customer cannot edit my address | — | not automated — Blocked since 2026-10-07: step 2 needs a second test account | — |
| TC-410 · 200-character limit on Street | — | not automated — Postponed since 2026-10-07: P3 | — |

Unblocked: none · still blocked: TC-409 — the map still has one account.
```

### The verify block

What `npm run verify` prints and keeps in `test-results/verify.json`; the summary copies its numbers.

```markdown
## Verify — shop · 2026-10-21 14:05
**Passed** — 4 of 4 tests green, no retry; qa:gate passed.
- Can fail: 4 of 4 red on purpose · TC-401 · Customer adds a delivery address (tests/ui/shop/account/addresses/addresses.ui.spec.ts:24): red at its line · …
- Put back: tests/ui/shop/account/addresses/addresses.ui.spec.ts, tests/api/shop/account/addresses/addresses.api.spec.ts — each file's hash as before (sha256)
- Run: 5 tests: 5 passed — reports/run-summary.json (the sign-in smoke included: 1)
  `npm run test:app -- shop tests/ui/shop/account/addresses/addresses.ui.spec.ts tests/api/shop/account/addresses/addresses.api.spec.ts --retries=0`
  - TC-401 · Customer adds a delivery address — passed
  - …
- Stand was slow: none
- Coverage (shop): TC-401 automated, last run passed · TC-402 automated, last run passed · …
- Time: gate 0:38 · can fail 0:51 · run 1:24 · coverage 0:02 · total 2:55
```

### The verify summary

```markdown
## Test result — Addresses (Shop › Account) · API + UI

**Passed** — 4 of 4 tests green, no retry; qa:gate passed.

Suite "Account › Addresses" — 12 cases · automated 6 (50%) · not automated 6

| Case | Title | Scenarios | Owners | This run | Status |
|------|-------|:---------:|--------|:--------:|--------|
| TC-401 | Customer adds a delivery address | 1 | UI | ✅ | automated |
| TC-402 | Another customer cannot read the addresses | 1 | API | ✅ | automated |
| TC-403 | An address without a street is refused | 1 | UI | ✅ | automated |
| TC-404 | Customer edits a delivery address | 1 | UI | ✅ | automated |
| TC-409 | Another customer cannot edit my address | 1 | API | — | not automated — step 2: needs a second test account |

Other cases of the suite: automated 2, not automated 5 — full table on request (`/coverage`).

**In the TMS:** mark Automated — TC-401, TC-402, TC-403, TC-404 · not automated, add the reason — TC-409: needs a second test account — a member account in `.env` · fix by hand — TC-403 step 3 — expected now "Street is required"

- Report: http://localhost:5252
- Browsers, phone, screenshots: screenshot of the empty list proposed — /implement specs/shop/account/addresses/addresses.md Layer: visual
- Blockers: TC-409 — a second test account
- Review: Minor — src/pages/shop/addresses.page.ts — `street` and `streetInput` name one field; keep one
- Can fail: 4 of 4 red on purpose
- Independent review: full — waiting for /review
- Files changed: tests/api/shop/account/addresses/addresses.api.spec.ts, tests/ui/shop/account/addresses/addresses.ui.spec.ts, src/pages/shop/addresses.page.ts, src/api/clients/shop/addresses.client.ts, specs/shop/account/addresses/addresses.md
- Time: gate 0:38 · can fail 0:51 · run 1:24 · coverage 0:02 · total 2:55

### Next
- In a new chat: `/review specs/shop/account/addresses/addresses.md #1 #2 #3 #4 — tests/ui/shop/account/addresses/addresses.ui.spec.ts tests/api/shop/account/addresses/addresses.api.spec.ts`
- Look over each case beside its test (the table above) and its steps in the report — a new feature's first tests, every one
```

**This run**: ✅ every test of the case passed in this run, ❌ one failed, — not every test of it ran. A
case is marked Automated in the TMS only when every test of it passed in this run.

Right under it, when a case waits on something only you can give:

> **TC-409 needs another account: a user without admin rights.** Fill `SHOP_MEMBER_LOGIN` /
> `SHOP_MEMBER_PASSWORD` in `.env` (prepared empty) and reply ready — an account you have signed in
> with by hand.

### The independent review's report

```text
TC-404 · Customer edits a delivery address · 2 · tests/ui/shop/account/addresses/addresses.ui.spec.ts:41 · the list reader matches any row, so a wrong street still passes · read the edited row by its street
Paste this report into the chat that wrote the tests.
```

The fields: the test · the kind (1 unasserted step, 2 cannot fail, 3 assumed data, 4 re-proved, 5 mock,
or `other: <kind>`) · where · how the case breaks while the test stays green · the fix.

### The triage message

```markdown
Run 2026-10-21 · reports/run-summary.json — 4 failed: 1 fixed · 1 changed with a source · 1 to answer · 1 stand

**Fixed** — a moved path: /api/addresses → /api/v2/addresses, the same fields — TC-402 — the contract lists /api/v2/addresses

**Stand** — TC-501 · Customer places an order and sees it in the list — out of time, failed again on its second pass

**Changed with a source** (plans and tests refreshed; fix these cases in the TMS)
- Product changed — SHOP-412: delivery fee 5.00 → 4.50 — acceptance criterion 3 — TC-505 — TC-505 step 4

**Is this intended?** (no source — answer "1 yes, 2 no")
1. toast "Saved" → "Address saved" — TC-401 — searched: SHOP-398, SHOP-412, git log -S"Address saved"

Rerun: 2/2 green, no retry · gate passed

Time: gate 0:35 · can fail 0:40 · run 1:10 · coverage 0:02 · total 2:27
```

### The coverage table

```markdown
Suite "Orders" (TMS) — 4 cases · automated 1 (25%) · to rework 1 · not automated 2 · inconsistent 0 · last run 2026-10-21

| Case | Title | Scenarios | Owners | Last run | Status | Why not |
|------|-------|:---------:|--------|:--------:|--------|---------|
| TC-501 | Customer places an order and sees it in the list | 1 | UI | ✅ | automated | — |
| TC-503 | Customer cancels an order | 1 | API 1 · UI 1 | ✅ | to rework | — |
| TC-508 | Another customer cannot edit my order | 1 | API | — | not automated | Blocked — step 2: needs a second test account without admin rights (since 2026-10-07) |
| TC-517 | Repeat an order | — | — | — | not automated | not planned yet |
```

Under it, one line each when they apply (the cases to rework and their plans, inconsistent cases,
tests that failed last run, plan lines to fix) and at most one next command, e.g. "plan the cases not
planned yet: `/plan` with this folder link".

## 6. Example prompts

What to type in Cursor's chat, and what happens next. Replace the app, links and paths with your own.

| # | Type | What happens |
|---|---|---|
| 1 | `/setup app https://qa.shop.example.com` | Registers `shop` in `specs/project-map.md`, saves the address to `.env`, creates `src/fixtures/shop/`, then asks how the app signs in. Ends with a green sign-in smoke, or a report of what is missing |
| 2 | `ready` | After you typed `SHOP_LOGIN` and `SHOP_PASSWORD` into `.env` yourself: `npm run auth:check`, then one sign-in through the tests. A refused password is never retried — sign in by hand first, then reply again |
| 3 | `/setup another account or role — shop: a member without admin rights` | Empty `SHOP_MEMBER_LOGIN` / `SHOP_MEMBER_PASSWORD` entries for you to fill and the role's lines in the ```auth block; after `ready`, `npm run auth:sign-in -- shop member`. Specs use it with `test.use({ role: "member" })` |
| 4 | `/plan shop · Account → Addresses: add, edit and delete a delivery address` | Explores the screens live, splits the cases into scenarios with one owner and route each, tries the setups, writes `specs/shop/account/addresses/addresses.md`, shows the confirm table and asks "Write these <n> now?" |
| 5 | `/plan https://tracker.example/issue/SHOP-123` or `/plan https://tms.example/p/1/folders/42` | A ticket's acceptance criteria become the requirements; a TMS folder's cases are the plan's set, each block drafted from its case. Cases already automated are skipped; a stand that contradicts the cases gets one question |
| 6 | `/plan https://tracker.example/issue/SHOP-512` (a confirmed bug) | A block proving the result the bug says it should have, drafted by `plan:block --bug`; what the app does now is its `Seen:` line, never a check |
| 7 | `1` | **Yes, write them**: each test from `spec:draft`, then one `npm run verify`, one automatic heal if a failure appears, a summary that leads with the verdict and gives the `/review` line |
| 8 | `/implement specs/shop/account/addresses/addresses.md` | In a new chat: only cases `ready to implement now` and not automated yet; locators from the live app; ends with `npm run qa:gate` and verification |
| 9 | `/implement specs/shop/account/addresses/addresses.md Layer: visual · the list with two addresses · Approve baseline: no` | A screenshot test of its own in `addresses-visual.ui.spec.ts`, masks for generated values; reports that the baseline needs your approval |
| 10 | `/verify shop tests/ui/shop/account/addresses/addresses.ui.spec.ts` | `npm run verify -- shop <spec paths>`: the gate, each new or changed check proven able to fail, one run with `--retries=0`, the block; then the Allure report at a local address, the reviews, a summary with one next command. "Verify the addresses tests." works too |
| 11 | `/review specs/shop/account/addresses/addresses.md #1 #2 — tests/ui/shop/account/addresses/addresses.ui.spec.ts` | In a **new chat**: one line per finding, or "none". Paste the report back into the chat that wrote the tests: each finding fixed and verified again, or answered with the check that holds it |
| 12 | `/heal explain`, then `/heal` | Both read `reports/run-summary.md` — `/heal` takes the tests its "heal the red tests" line names. `explain` stops at each failure's verdict, cause, expected and received, and what to check by hand. `/heal` acts on the verdict: possible bug → you retest by hand; stand or data → its second pass decides, or the data is restored or the lookup changed; the product changed → `/plan <plan> — <what changed>`; test needs fixing → the smallest fix, re-checked live. The assertion never changes |
| 13 | `/triage` or `triage the run https://ci.example/jobs/123` | The last local run, or — for a CI link — the job's `reports/` folder you unpack here. Every failure sorted by its verdict; moved paths and labels fixed on evidence; a changed value refreshed only with a quoted source, else asked as "is this intended?" — one message to answer `1 yes, 2 no` |
| 14 | `I retested it by hand — it is a bug, ticket SHOP-456. Add it to known bugs.` | Asks before it adds the row to `specs/known-bugs.md` and a line to the plan's change log. The test keeps its code and shows grey at its step until the ticket is fixed |
| 15 | `/plan specs/shop/account/addresses/addresses.md — Street is now required` | A refresh: "Already automated" first, the `Blocked` lines re-checked, only the changed part checked again, the touched cases and tests updated, a `## Change log` line, asks before writing anything |
| 16 | `/coverage https://tms.example/p/1/folders/42` | The coverage table of that folder: every case automated, to rework, not automated (why, since when) or inconsistent |
