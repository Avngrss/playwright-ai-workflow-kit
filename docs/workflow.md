# Workflow

How to work with the kit once the app is added and signs in ([Getting started](getting-started.md)):
the six slash commands, the everyday path, the other paths, where reviews, audits and refactors live,
what you will see in the chat, and example prompts.

## 1. Commands

Six slash commands in `.cursor/commands/` open the four skills in `.cursor/skills/` (setup, plan,
implement, verify). In Cursor's chat, type `/<command>` and then what it needs: a link, a plan path
or a few words. If you leave something out, the skill asks.

| Command | Skill | When to use | Fields |
|---|---|---|---|
| `/setup` | setup | Register an app (its map rows, `.env` address, fixtures, sign-in, first smoke), set up how tests sign in, or add another account or role | **What:** `app` \| `sign-in` \| `another account or role` · the app's URL or slug · details: a name, "sign-in broken", "change how tests sign in", the role |
| `/plan` | plan | A new feature plan or an E2E journey plan. On an existing plan: a later pass, an alignment with the TMS or a refresh, started by itself | what to cover: a TMS folder or case link, a ticket, a requirements doc, an API collection path, your own words, `E2E: <who does what, to what they see>`, or a plan path · the app and layers · what changed |
| `/implement` | implement | Write a plan's ready cases: API first, then UI; a journey plan gets its E2E spec; `visual` adds or checks a screenshot checkpoint | the plan path · cases (default: every ready case not automated yet) · **Layer:** `visual` only — API, UI and E2E follow each case's `Needs:`, whole · **Approve baseline:** `yes` \| `no` (visual only, default no) |
| `/verify` | verify | Check what was just written or healed: run, heal once automatically, review, summarise | the target (default: what this session wrote or healed) |
| `/heal` | verify, §8 Heal | Fix a failing UI, E2E or API test from its verdict, or only explain the failures | the failing test (default: the failures in `reports/run-summary.md`) · mode `heal` or `explain` |
| `/coverage` | verify, §9 Coverage | A TMS suite case by case: automated, not automated or inconsistent. Read-only | the TMS folder link |

Without a command of its own — ask in words, or reference `@.cursor/skills/<name>/SKILL.md`:

- **A change to the project map** (an external system, a TMS case link, the tracker queue, a tag, a
  lock): the setup skill §5.
- **A Page Object, an API client, a fixture, a builder, generator or dataset**, and the decision
  whether a UI block becomes a component: the implement skill §7. `/implement` makes them as its
  cases need them.
- **Allure metadata** (severity, a `tms(<id>)` case link): `/implement` writes it from the plan.
  Readable failures and the report tree are built in; there is nothing to configure.
- **A refactor of passing tests** ("split OrdersPage into components"): on request only — §4.
- **Turning a project back into the reusable kit**: `01-workflow.mdc` §Starter conversion.

## 2. The everyday path

One feature, API and/or UI:

```text
/plan → "Yes, write them" → implement (API, then UI) → verify (one automatic heal on red) — one run
later: /implement (the rest of a plan) · /verify (a rerun) · /heal (a failing run) · /coverage (a TMS folder)
```

### Plan: `/plan`

Tell the agent what to cover: a TMS folder or case link, a ticket, a requirements doc, an API
collection, or the feature in your own words. Tell it the layers too (API, UI, or API + UI). If you
leave anything out, the agent asks. The agent then:

- checks every candidate case on the live stand;
- tries the setup of each case now (data, accounts), instead of promising it for later;
- gives each case a status (`ready to implement now`, `blocked`, `postponed`, `cannot be automated`),
  a reason, and the layers it needs (`Needs:`);
- proposes at most one case as the feature's `@smoke` test.

**Where it lands:** `specs/<app>/<area>/<feature>/<feature>.md`. No test code is written in this step.

The plan ends with a confirm table in the chat: **Will be written** and **Not now**, with the reason
for each case (§5). Then it asks "Write these <n> now?": **Yes, write them** · **Switch to <layers>**
· **Add them to <feature> instead** · **Let me adjust the plan first** (the middle two appear only
when they apply). Nothing is written before you answer.

### Implement: `/implement`

After **Yes, write them**, the same run goes on by itself: first the API cases, then the UI cases,
then verification. Use `/implement <plan>` to implement an existing plan later, for example in a new
chat.

- **API:** `tests/api/<app>/<area>/<feature>/<feature>.api.spec.ts`. Bound clients go in
  `src/api/clients/<app>/`. Statuses and fields come from the contract. Created data is `AQA`-marked
  and removed by the test.
- **UI:** `tests/ui/<app>/<area>/<feature>/<feature>.ui.spec.ts`. Page Objects built from the live
  app go in `src/pages/<app>/` and are wired in `src/fixtures/<app>/pages.fixture.ts`. A UI test
  reads as its case: steps in plain words, named checks, and the toast the app shows after the action.

Only `ready to implement now` cases are written; cases already automated are skipped; each case is
written whole, on every layer its `Needs:` line names. The batch ends with `npm run qa:gate`, and its
findings are fixed the way they say.

### Verify: `/verify`

Implement hands over to the verify skill by itself; `/verify [target]` runs it yourself. It:

- runs everything that was touched in one command,
  `npm run test:app -- <app> <spec paths> --retries=0`, twice: a test is done when it passes twice in
  a row without a retry;
- exercises a further role's sign-in once, so its saved session is really tested;
- runs `npm run qa:gate`;
- opens the Allure report (`npm run allure:open`) and gives you its local address;
- after a fresh implement, heals a failure automatically once and runs again;
- reviews only what the gate cannot check, with findings rated Critical, Major or Minor.

**What you get:** a summary that leads with the verdict (Passed / Failed / Partly passed), then the
TMS suite's coverage in short form, what to mark Automated in the TMS (written there only on your
yes), the manual case corrections, what only you can give (an account, a fact from another system),
and one next command (§5).

### Heal: `/heal`

The verify skill's Heal section. With no arguments, `/heal` takes the failures in
`reports/run-summary.md`, UI, E2E and API alike, and starts from each failure's verdict
([Failure reporting](failure-reporting.md)). `/heal explain` only explains them: verdict, cause,
expected and received, what to check by hand, the next step. After a fix the healed test runs again,
is reviewed and summarised like `/verify`.

- **Technical failures** get the smallest fix at the layer where the problem is: a locator re-checked
  on the live app, a readiness wait, data, a fixture or a client. A heal never softens an assertion,
  adds a fixed wait or uses `test.fail`.
- **Requirement drift** (the product now behaves differently from the plan) stops the heal. The next
  step is `/plan <plan path> — <what changed>`.
- **A bug you confirmed by hand**, once a ticket exists, gets a row in `specs/known-bugs.md` on your
  yes. The test keeps its code and turns grey at its step. A ticket is filed only on your yes.
- **Flaky** (passes and fails on the same code) is classified by cause. If the cause cannot be fixed
  now, the test is quarantined with `@flaky` and a `// flaky: <cause> — <ticket>` line, and runs only
  in `npm run test:flaky`.
- **The same failure again and again** → the agent proposes the smallest change to a rule, a skill,
  the gate or the docs (`01-workflow.mdc` §Hardening rules); shared code changes only on your yes.

### Coverage: `/coverage`

Give the TMS folder link. You get every case of the suite with one of three statuses (§5):

- **automated** — tests on every layer the case needs, with the last run's result;
- **not automated** — why, since when, and what unblocks it;
- **inconsistent** — part of a case is written; `qa:gate` fails it.

The table is built from the TMS, `npm run suite:coverage -- --app <app>`, the plans and the last run.
It is read-only.

### Before a commit

Commit when `npm run qa:gate` passes and the touched tests are green twice with `--retries=0`.
`.env`, `state/` and the run's outputs (`reports/run-summary.*`, Allure results, `test-results/`) are
git-ignored and never committed. Definition of done: [docs/test-strategy.md](test-strategy.md) §8.

## 3. Other paths

Needed less often. Most of them end by going back to the everyday path to implement and verify.

### An existing plan: a later pass, the TMS, a refresh

`/plan <plan path>` (or the same feature, link or words again). There is no separate command: the
plan file exists, so the plan skill starts a later pass by itself.

- **Every pass** starts with "Already automated: <n> of <m>" and its table (§5), re-checks the
  `Blocked` lines ("Unblocked: … · still blocked: …"), and stops with one next step when nothing is
  left to write.
- **With a TMS folder link** — an alignment: every case of the folder is mapped to one plan case or
  one *Not now* line, case drift gets the one question below, and a plan case with no TMS case is
  kept and listed as "not in the TMS". One `## Change log` line.
- **With what changed** (`— Street is now required`) — a refresh: the affected cases are updated, a
  `## Change log` line is added, and the agent asks before writing anything new. A locator-only
  breakage is a heal, not a plan change.

### From a TMS folder

`/plan <TMS folder or case link>` when the feature has no plan yet. The TMS's cases are the plan's
set. The agent:

- reads them through the TMS's MCP or API, or works from the text you paste;
- checks each case live and skips the ones already automated (`npm run suite:coverage`);
- maps every case to a plan case or a *Not now* line: `Blocked`, `Postponed`,
  `Cannot be automated`, `Needs <layers>`, `Covered by <spec>`, or `Gap`.

When the stand contradicts the cases, you get one question per plan:

- **The stand is right:** the agent lists each fix under `## Manual case corrections`, for you to
  make in the TMS.
- **The case is right:** the case stays `blocked`.

The first case link of an app fills the map's `case link <app>` line. Tests link their case through
`tms(<id>)`, and the report shows the link. The TMS is read-only: nothing is created, edited or marked
Automated there without your explicit yes. The project map names the TMS (§Test cases (TMS)); any TMS
works.

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
- A journey is never `@smoke`.
- One journey covers one app. A journey across two apps in one test is not supported yet.
- The `e2e:<app>` project allows 60 s per test and one retry.

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
never tagged on its own — it is a line in the summary for you to decide. For `@visual`: the check sits
inside an existing UI scenario, after its functional checks; dynamic and sensitive parts are masked; a
baseline is created or updated only when you answer `Approve baseline: yes`. A baseline belongs to the OS
it was made on (`…-win32.png` on Windows, `…-linux.png` in CI). CI runs these as separate jobs.

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

To run one app: `npm run test:app -- <app> [layer]`. With several apps in one run, each app gets its
own report in `reports/allure/html/awesome-<app>/`, next to the all-apps report. One app's broken
sign-in stops only that app's tests.

### Upkeep

- `npm run test:flaky` runs the quarantined tests. Five green runs bring a test back
  ([docs/test-strategy.md](test-strategy.md) §8a).
- `npm run data:sweep` removes `AQA`-marked leftovers from the stand. The same sweep also runs before
  and after every test run.
- Shared code (`src/setup/`, `src/reporting/`, `src/fixtures/*.ts`, `src/assertions/shared/`,
  `scripts/`) is changed only when you ask for it, and the summary names every such change
  (`02-guardrails.mdc` §Shared code).

## 4. Where reviews, audits and refactors live

There is no separate review, audit or refactor command. Each concern is covered here:

| Concern | Where it is covered |
|---|---|
| Review of what a batch wrote or changed | `npm run qa:gate` for everything it can check, then `/verify` §6 for only what it cannot: scope, value, plain happy path vs an optional-path positive, positive + negative per mutation, recommendation-first fixtures, the security of changed code, config and CI, shared code changed only on request |
| Coverage of a TMS suite | `/coverage` (verify §9); its short form closes every `/verify` summary |
| Stability: flaky patterns, weak waits, hidden flows | the gate (fixed waits, a test without a check, misused `beforeAll` or serial mode, UI login in `beforeEach`, quarantine without a reason); `/verify` runs with `--retries=0`, twice; `/heal` classifies a flaky test and quarantines it with `@flaky`; the review's synchronisation line |
| Test data: shared data, cleanup, isolation | the plan proves every case's `Data:` and setup on the stand before you confirm; the gate (a `disposable…` fixture without its sweep, a UI/E2E spec shaping data, copied setup); `npm run data:sweep`; the review's data line |
| Security: secrets and sensitive data | the gate (tokens, `process.env`, raw `console.*`, unmasked attachments); the CI secret scan (gitleaks) over the whole repository; the review's two security lines for changed code, config and CI ([Security and data](security-data-handling.md)) |
| An API collection: inventory and coverage | `/plan <collection path>` (plan §4.4) |
| Refactor: an over-abstraction, a Page Object grown too large, siblings repeating their base | on request only, usually after a gate warning: a behaviour-preserving refactor, then the impacted specs with `--retries=0` and `qa:gate`; a component split only for one of the three reasons (`ui.mdc` §Ownership decisions and refactoring) |
| Hardening after a recurring failure or agent mistake | `/heal` (verify §8.9, `01-workflow.mdc` §Hardening rules) |
| Turning a project back into the reusable kit | ask in words (`01-workflow.mdc` §Starter conversion) |

## 5. What you will see

The shapes below are fixed; the rows are examples (a shop: addresses, orders).

### The plan's confirm

```markdown
Plan: `specs/shop/account/addresses/addresses.md` · basis: value-and-risk · role: customer

**Will be written (3)**

| # | Test | Type | Case needs | Suite | Priority | Why it is needed |
|---|------|------|------------|-------|----------|------------------|
| 1 | Customer adds a delivery address | UI | UI — the form and the list | Regression + Smoke | P1 · Critical | main scenario: keep my addresses |
| 2 | Another customer cannot read the addresses | API | API — the server refuses | Regression | P1 · Critical | risk: someone else's data |
| 3 | An address without a street is refused | API | API — the server answers 400 | Regression | P2 · Major | frequent scenario: a field left empty |

Test data: the tests create their own addresses and remove them (create and delete tried today).
Priority: P1 is looked at first when it fails · Critical / Major / Minor — how bad a breakage is.
Smoke: #1 — the feature's main scenario, under the first account — say "no smoke" to keep it regression only.

**Not now (2)**

| Test | Why not now |
|------|-------------|
| 200-character limit on Street | P3, low risk |
| A saved address is offered at checkout | needs API+UI — UI not in this run |
```

Then: "Write these 3 now?" 1. **Yes, write them** — "3 to write (API 2, UI 1) · 2 not now: P3, needs
API+UI" · 2. **Switch to API + UI and write 1 more** · 3. **Let me adjust the plan first**.

### A later pass

```markdown
Already automated: 3 of 5

| Case | Layer | Coverage | Last run |
|------|-------|----------|----------|
| TC-401 · Customer adds a delivery address | API+UI | automated | passed |
| TC-402 · Another customer cannot read the addresses | API | automated | passed |
| TC-403 · An address without a street is refused | API | automated | failed |
| TC-408 · Customer sets a default address | — | not automated — Blocked since 2026-10-07: needs a second address on the stand | — |
| TC-410 · 200-character limit on Street | — | not automated — Postponed since 2026-10-07: P3 | — |

Unblocked: none · still blocked: TC-408 — the stand still has one address.
```

### The verify summary

```markdown
## Test result — Addresses (Shop › Account) · API + UI

**Partly passed** — 3 of 4 tests green twice with --retries=0; qa:gate passed.
- TC-404 · Customer edits a delivery address — Possible bug — retest by hand: /api/addresses/… answered 500 instead of 200 (still failing after the automatic heal)

Suite "Account › Addresses" — 6 cases · automated 3 (50%) · not automated 3

| Case | Title | Needs | API | UI | Status |
|------|-------|-------|:---:|:--:|--------|
| TC-401 | Customer adds a delivery address | API+UI | ✅ | ✅ | automated |
| TC-404 | Customer edits a delivery address | UI | — | ❌ | automated |
| TC-409 | Another customer cannot edit my address | API | — | — | not automated — step 2: needs a second test account |

Other cases of the suite: automated 1, not automated 2 — full table on request (`/coverage`).

**In the TMS:** mark Automated — TC-401 (API, UI), TC-402 (API) · not automated, add the reason — TC-409: needs a second test account — a member account in `.env` · fix by hand — TC-403 step 3 — expected now "Street is required"

- Report: http://localhost:5252
- Blockers: TC-409 — a second test account
- Review: Minor — src/pages/shop/addresses.page.ts — `street` and `streetInput` name one field; keep one
- Files changed: tests/api/shop/account/addresses/addresses.api.spec.ts, tests/ui/shop/account/addresses/addresses.ui.spec.ts, src/pages/shop/addresses.page.ts, specs/shop/account/addresses/addresses.md

### Next
- `/heal` once you retested TC-404 step 2 by hand — "it is a bug, <ticket>" or "it works by hand"
```

Right under it, when a case waits on something only you can give:

> **TC-409 needs another account: a user without admin rights.** Fill `SHOP_MEMBER_LOGIN` /
> `SHOP_MEMBER_PASSWORD` in `.env` (prepared empty) and reply ready — an account you have signed in
> with by hand.

### The coverage table

```markdown
Suite "Orders" (TMS) — 3 cases · automated 1 (33%) · not automated 2 · inconsistent 0 · last run 2026-10-21

| Case | Title | Needs | API | UI | Status | Why not |
|------|-------|-------|:---:|:--:|--------|---------|
| TC-501 | Customer places an order and sees it in the list | API+UI | ✅ | ✅ | automated | — |
| TC-508 | Another customer cannot edit my order | API | — | — | not automated | Blocked — step 2: needs a second test account without admin rights (since 2026-10-07) |
| TC-517 | Repeat an order | — | — | — | not automated | not planned yet |
```

Under it, one line each when they apply (inconsistent cases, tests that failed last run, plan lines
to fix) and at most one next command, e.g. "plan the cases not planned yet: `/plan` with this folder
link".

## 6. Example prompts

What to type in Cursor's chat, and what happens next. Replace the app, links and paths with your own.

| # | Type | What happens |
|---|---|---|
| 1 | `/setup app https://qa.shop.example.com` | Registers `shop` in `specs/project-map.md`, saves the address to `.env`, creates `src/fixtures/shop/`, then asks how the app signs in. Ends with a green sign-in smoke, or a report of what is missing |
| 2 | `ready` | After you typed `SHOP_LOGIN` and `SHOP_PASSWORD` into `.env` yourself: `npm run auth:check`, then one sign-in through the tests. A refused password is never retried — sign in by hand first, then reply again |
| 3 | `/setup another account or role — shop: a member without admin rights` | Empty `SHOP_MEMBER_LOGIN` / `SHOP_MEMBER_PASSWORD` entries for you to fill and the role's lines in the ```auth block; after `ready`, `npm run auth:sign-in -- shop member`. Specs use it with `test.use({ role: "member" })` |
| 4 | `/plan shop · API + UI · Account → Addresses: add, edit and delete a delivery address` | Explores the screens live, tries the setups, writes `specs/shop/account/addresses/addresses.md`, shows the confirm table and asks "Write these <n> now?" |
| 5 | `/plan https://tracker.example/issue/SHOP-123` or `/plan https://tms.example/p/1/folders/42` | A ticket's acceptance criteria become the requirements; a TMS folder's cases are the plan's set. Cases already automated are skipped; a stand that contradicts the cases gets one question |
| 6 | `1` | **Yes, write them**: the API cases, then the UI cases, the gate and verification, one automatic heal if a failure appears, a summary that leads with the verdict |
| 7 | `/implement specs/shop/account/addresses/addresses.md` | In a new chat: only cases `ready to implement now` and not automated yet; locators from the live app; ends with `npm run qa:gate` and verification |
| 8 | `/implement specs/shop/account/addresses/addresses.md Layer: visual · the list with two addresses · Approve baseline: no` | A screenshot checkpoint inside the existing UI scenario, masks for generated values; reports that the baseline needs your approval |
| 9 | `/verify shop tests/ui/shop/account/addresses/addresses.ui.spec.ts` | `npm run test:app -- shop <spec paths> --retries=0` twice, the gate, the Allure report at a local address, the review, a summary with one next command. "Verify the addresses tests." works too |
| 10 | `/heal explain`, then `/heal` | Both read `reports/run-summary.md`. `explain` stops at each failure's verdict, cause, expected and received, and what to check by hand. `/heal` acts on the verdict: possible bug → you retest by hand; stand or data → restore the data, change the lookup, or rerun once the stand is up; test needs fixing → the smallest fix, re-checked live. The assertion never changes |
| 11 | `I retested it by hand — it is a bug, ticket SHOP-456. Add it to known bugs.` | Asks before it adds the row to `specs/known-bugs.md` and a line to the plan's change log. The test keeps its code and shows grey at its step until the ticket is fixed |
| 12 | `/plan specs/shop/account/addresses/addresses.md — Street is now required` | A later pass: "Already automated" first, the `Blocked` lines re-checked, the touched cases updated, a `## Change log` line, asks before writing new code |
| 13 | `/coverage https://tms.example/p/1/folders/42` | The coverage table of that folder: every case automated, not automated (why, since when) or inconsistent |
