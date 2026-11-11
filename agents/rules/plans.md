---
description: Feature and journey plans — the stability gate, the map first, sources and the live check, searched before blocked, scenarios with one owner and one route each, whole cases, rating, smoke choice, TMS cases and case drift, E2E journey plans, the plan body and status words (read by the gate), later passes and "to rework", confirmation, refresh vs heal vs triage, known bugs
globs: specs/**
alwaysApply: false
---

# Plans

A plan (`specs/<app>/<area>/<feature>/<feature>.md`; a journey `specs/e2e/<app>/<area>/<journey>.md`) lets
implementation not guess; writing it writes no tests. The plan is the source of truth for what is
automated — tests follow the plan, never the other way round.

## Stability gate — automation follows manual QA

A feature is automated once it is on the stand and accepted by manual QA (`docs/test-strategy.md` §1). Not
on the stand, the stand contradicting the requirements in more than isolated places (forms still changing,
whole blocks missing), or the user says it is in development → **stop**: say what was found, write no plan,
next step "come back when the feature is stable on the stand and accepted by manual QA". Isolated drift is
a `blocked` case, not this gate.

## Read the map first

- Targets use names already in the map; a missing app or service → ask its name and env URL name, add it.
- A session needed and no ```auth block for the app → the setup skill's sign-in first; never a mechanism
  invented in a plan.
- A role the user asks for that the map lacks → ask its slug, register it in the app's block. A role only a
  requirements doc mentions → no question: plan against the map's roles, one informational line on the case.
- Every role the cases use passes `npm run auth:check -- <roles>` before the confirmation; missing values →
  name the exact variables to add to `.env` and wait. A role without values → one `blocked` case per
  feature until filled, never variants that cannot run. A role with no account at all → `Blocked` after the
  search (§Searched before blocked); the account is the user's, asked once after the summary. Which
  registered role a pass covers is the user's call — ask only when genuinely ambiguous.

## Sources of truth

The coverage basis decides what **defines the set**; the other sources confirm, correct and expose gaps:

| Basis | What enters the plan | `Why` of a case |
|---|---|---|
| `test-cases` (a TMS location given) | exactly those cases, as their scenarios (§TMS cases) | the case id |
| `requirements` (a ticket or doc) | every documented rule, AC and flow, plus the negative a rule's risk calls for (one per rule, not per field) | the rule (`AC-3`, "end ≥ start") |
| `value-and-risk` (the feature in words) | what the rating makes P1/P2 | the scenario or the risk |

Words alone mean "explore the app live" — never consult documentation the user did not give. No documented
spec → say so in the plan. Never a scenario no source, live app or contract grounds. An API collection
(Bruno) informs a plan but never defines it (`api.md`).

**Live check — docs drift; confirm every candidate before giving it a status** (`live-app.md`). A later
pass or a refresh explores only what the plan does not hold yet (a changed screen, a new route, a case whose
text changed, a re-checked `Blocked` line):
- UI: the real page by the case's own gesture; a documented block missing → `blocked`, drift noted.
- **Routes**, per action: the network requests — does it reach the server, its method, path and query, what
  it sent and what came back — decide the `Route:` (§Routes). **Twice where the app caches** (first open,
  reopen, a changed period): no request the second time → routed on the first only, or `screen-only`.
- API: read the service's registered contract, a few real calls where it is ambiguous — status codes are the
  usual drift. A status or message no source states is never guessed — searched for (§Searched before blocked).
- A state cases change that other cases see → a lock (`specs.md`). An overlay or global spinner the test
  does not cause → the map's ```app-wide block, never a case.
- Every case's `Data:` and preconditions are proven on the stand before the plan is shown, each value the
  case names read first as a rule or an illustration (`data-and-fixtures.md` §Data sources).
- A probe that changes something kept or shared is asked of the user first (`live-app.md` §Probes).

## Searched before blocked

No case is `Blocked` — a rule no source states, data, an item or an account the stand lacks — before three
searches (the plan skill §5 "Searched before blocked"): **the rule** in the run's sources, docs and tickets (to
prove this case, never to add one) · **the data** in every tenant each map account opens — `npm run stand:find
-- <app> --in "GET <path with {tenant}>" --where "<what the case needs>"` — and the outside systems the tests can
read · **making it** (an API, an item kept for the tests alone); an account is never made — it is the user's.
Only a way tried now lifts the block. The reason — the step, what stops it, what unblocks it, cheapest first —
ends with ` · searched: <place> (<result>); …` or ` · searched: none (<why>)` where no search lifts it (a
declined probe, a case the user kept); `qa:gate` warns without it.

## Layers — one owner and one test per scenario

**No expected result is proven twice** (`docs/Layer Routing Algorithm.md` §4–§6). A case (a TMS case, an AC)
becomes its **scenarios** — one obligation that fails on its own: "the address is saved and shown in the list"
is one, "another customer cannot read it" another. Each scenario has exactly **one owner** — its `Level:` — and
one test in that owner's folder, decided by where a failure would point:

| Owner | Where the case looks for the result | Never |
|---|---|---|
| **UI** (`tests/ui`) | on the screen of the feature where the action happened — the test checks the action's answer and the screen | another feature's screen; an API twin "to check the data" |
| **E2E** (`tests/e2e`) | somewhere else — another feature, role or app: the action here, the result there | a single-page check |
| **API** (`tests/api`) | on no screen: another input of a rule (other values, a boundary), access the page never tries (someone else's id, a call the page does not make), the contract, a file's content, a refusal with no screen of its own; two places showing the same figures | a person's scenario written again |

- Several obligations → scenarios `S1`, `S2`, … — a block and a test each (`<case id> · S2 · <what it proves>`);
  a scenario may take several steps, each with its route. Never split by layer ("the server stores it" / "the
  screen shows it"), gesture, page, or a stand item proving the same rule.
- **The owner says its reason** — where the result is (`- Level: E2E — settings here, result in the cart`); one
  the user moved says so (`— the total is on the cart (the user's choice, <date>)`).
- Two scenarios, not one: the positive and the negative of an action whose contract documents the error; a
  form refusing before any request (`no-request`) and the server refusing (`api`). A rule's matrix (other
  values, a boundary, `401`/`403`) is API; the UI keeps one pass, plus a negative that differs on screen.
- A refusal met on screen (no menu item, a redirect, an error page) is that UI scenario's, the page's own 403 a
  bare route line (`intercept GET /api/reports → 403`). A download: the UI starts it; its content is API.
- An action the app answers with a message: `toast=text` (the exact words, the brief's `Messages:`) **and**
  what it left on screen (`list=value`) — the message alone never passes the case.
- **Owner check** — never a test for the sake of an owner, from evidence only: no API when nothing falls outside
  the screens · no UI without a screen · no E2E when no journey crosses pages, roles or services. A run limited
  to one owner that finds none → ask: drop the limit · stop; E2E asked, nothing crossing → ask: write it as UI
  scenarios · stop. The outcome → `## Owners`. An app with an API (its map row) and no API scenario says, for each
  place one comes from, why there is none — `none · other inputs: <why> · access: <why> · contract: <why>`, each a
  reason of a few words from the live check ("one role, no ids in the address"), never a bare "none"; `qa:gate`
  fails a plan without it.

## Routes — how each scenario proves its result

Each ready scenario has a `- Route:` line — one per step for a scenario of several (`- Route (step <n>): …`,
numbered as the case numbers its steps, kept when a scenario is split out; several under one number for a step
awaiting several answers). It is a formula `qa:gate` (`routes.mjs`) parses — the full syntax:
`docs/Layer Routing Algorithm.md` §7. It comes from the live check, shows in the confirm table, and implement
never changes it.

| Route | When | The test |
|---|---|---|
| `api <METHOD> <path> → <status>? <fields>` | an API scenario | the bound client, `expectJson` |
| `intercept <METHOD> <path> → <status>? (sent: … ·)? (query: … ·)? <fields> · screen <token>=<kind>, …` | the gesture's answer holds the result | `answerTo(<answer path>, () => <page>.<action>(…), { has, sent, query, status })`, then the screen |
| `… → <status>? check: <rule>[(<args>)] · screen …` | stand data nobody knows beforehand | `answerTo(…, { check: <rule> })` (an API scenario: the rule called on its answer) |
| `… → empty · read <METHOD> <path> → <fields>` / `… → empty · until <helper> → <fields>` | the answer is not the new state (204, 202, an echo, a job id) — a reload decides | one client read, or the registered helper, in the check step |
| `… → (query: … ·)? input · screen …` | the answer only feeds a later step (a list the browser then searches) | nothing checked on that answer |
| `no-request · screen …` / `screen-only · screen …` | the browser decides alone / the fact exists only on screen | nothing listened to |

- **Screen kinds**: `value` — a reader against `shown<Block>(…)`; `text` — exact words (a message, a label, a
  control's choice); `state` — disabled, hidden, checked, a count; `visible` — only that it appeared, never for
  fields the screen must show.
- **The answer's truth**: *case data* (the test made it, the case states it, a kept item's facts) — `has:`,
  the screen from `shown<Block>(caseData)` (`, answer` for what only the server knows); *stand data* — `check:
  <rule>`, a named rule of `src/assertions/<app>/` stating what the server could get wrong (parts add up, a
  period's bounds — never "the list has items"), its source on `- Rules:`, its oracle (another endpoint) read by
  a fixture or the app's helper, never a spec step; only then the screen from `shown<Block>(answer)`.
- The path is evidence, like a locator: moved with the same fields → updated with the test, never a new
  scenario. A route the stand does not hold goes back to the plan, never into a changed check.

## A case is written whole or not at all

A part of a case never leaves manual regression, so a test of a part saves no one work:
- every scenario's route proven on the stand → written, every scenario in this run; a step another case here
  proves (`Covered by #N`) keeps it whole;
- a step no owner can cover (an account or item missing, no delete, a person's eye) → the whole case to *Not
  now* `Blocked` / `Cannot be automated`, naming that step ("step 3: …") and what unblocks it — no test of its
  other scenarios;
- a scenario whose owner this run leaves out → the whole case *Not now* `Needs <owner>`.

`qa:gate` (`cases.mjs`, `routes.mjs`, `repeats.mjs`) fails the rest. A case may stay manual (too unstable, an
unreachable system or account, a person's eye, cost above value) — a *Not now* line with an actionable reason,
never silence.

## Rating (bases `requirements` and `value-and-risk`)

1. **Scenarios** — walk the feature live; write why a person comes here, in their words. Value: *Core* (why
   the feature exists) · *Common* · *Rare*. Every Core and Common happy path is P1.
2. **Risks** — every line gets cases or one word why not: access (who sees or changes it, someone else's
   data, anonymous) · rules (required, limits, dependencies, duplicates) · data integrity (created → shown
   everywhere, deleted → gone, edits persist) · calculations · states (empty, data, read-only, disabled) ·
   side effects. A check that is nobody's scenario has Value `—`.
3. **Priority** = Severity (`01-workflow.md` §Severity) × Likelihood — High (complex logic, drift found
   live) · Medium (ordinary CRUD) · Low (static display) — never below its scenario's weight:

   | Severity \ Likelihood | High | Medium | Low |
   |---|---|---|---|
   | Critical | P1 | P1 | P2 |
   | Major | P1 | P2 | P3 |
   | Minor | P2 | P3 | — |

P1 and P2 are written; P3 goes to *Not now* `Postponed`. Priority is for triage, never for choosing a run:
every feature case is `@regression`. A case another plan of the app already holds (same outcome, same screen
or request) → *Not now* `Covered by <that plan> #N`. More than ~8 API or ~6 UI scenarios for one feature
usually means variants of one rule rated apart — fold them. A mutation whose contract documents an error gets
a positive and a negative scenario. No schema-only scenario: an answer's schema rides on its call (`api.md`).

## Smoke — one case per feature at most

Smoke = the template's sign-in check + at most **one** test per feature: one of its own cases (never a
separate smoke file), its main scenario (Core; a UI case when the feature has a screen), under the app's
first account (a public app: signed out), dependable (content *or* empty state, read-only or cleaning up after itself), tagged `@smoke`
besides `@regression`. None for an E2E journey, a role's own feature or a `@visual` test. No case fits → no
smoke, one line why.

## TMS cases

- The TMS is the map's §Test cases (TMS): `- tms:`, one `- case link <app>: <URL with {id}>` per app
  (`{folder}` when the TMS needs it; filled from the first case link of that app the user pastes, never
  guessed), `- id format:`. No TMS named → no case links, no coverage table. Unreachable → one line, fall
  back to the next basis and record the basis used. Read-only (`01-workflow.md` §Asking).
- Given a TMS location its cases **are** the set — one block each, or one per scenario (`### 1. TC-101 · <the
  case's title>`, `### 2. TC-101 · S2 · <what it proves>`); cases named by link or id → only those; a refresh
  loads only the cases the change touches. A loaded case is saved as `state/sources/<id>.json` and drafted by
  `plan:block --case` (§Plan body) in its own words; a priority word off the plan's scale stays the plan's
  choice until picked (`Priority: P1 | P2 | P3 (TMS: "High")`).
- **Already automated**: a case linked by a test of another feature is *Not now* `Covered by <that spec>`,
  never written again (moving it here moves the existing test). A case whose title and steps match another
  id's is one case copied in the TMS: `Covered by <spec> — the same as <other id>`, and
  `## Manual case corrections` says "keep one in the TMS".
- **Case drift** — the stand contradicts a case: never silently rewrite or drop it. Ask once per plan ("Case
  drift"), listing each drift with its source (sought as triage seeks it, §When the product changes): (1) **the
  stand is right** — test what it does now, each correction under `## Manual case corrections` · (2) **the case
  is right** — `blocked` with the difference, `· searched: none (the user kept the case)` · (3) **the value is
  an example — test by the criterion** — `Data:` `case says "<value>" → <the criterion>`, the correction `data
  "<value>" → "<the criterion>"`. Recommended: a drift with a source (a ticket, a commit) → 1; an illustration
  → 3; the rest → 2; an unclear value → none; drifts of several kinds → one question per kind.
- A step no owner can automate (a person's eye, a captcha, a device) → *Not now* `Cannot be automated`. A
  documented rule or critical risk no case covers → *Not now* `Gap`; the user decides.
- No step-by-step sync with the TMS; a changed expectation goes through the plan. **A suite's coverage** (on
  request, and after writing tests from TMS cases): the suite's case list from the TMS + `npm run
  suite:coverage -- --app <app>` → a table: automated (every scenario its one test, last result) · to rework
  (written before routing — no routes, or a scenario tested twice) · not automated (blocked and what unblocks
  it, postponed, cannot be automated, planned but not written, not planned) · inconsistent (fix the plan or the
  tests — the gate fails these too).

## E2E journeys

A **full journey** across pages, roles or services — frontend, backend, persisted state — ending in a
user-visible outcome only it produces (an order placed → a manager approves it → the customer sees the
status). Not E2E: a page render, field visibility, one form's validation, one click's feedback, a navigation
check, a contract or schema check; with nothing to connect it is a UI case, said plainly. Few and high value:
one representative journey when lower layers cover the variants, no data matrices. The journey comes from
the user's own description ("from start to the final outcome, in a sentence or two"); steps are never
guessed. Status is exactly `ready to implement now` or `blocked` (no "ready if"); blocked, with what
unblocks it, when data cannot be created or removed safely, an external dependency (mailbox, reset link,
payment) is missing or unstable, a role is not in the map or has no `.env` values, or the final outcome
cannot be observed reliably. No cross-browser or responsive journeys: such a risk becomes a UI case.

A journey has a **journey plan of its own** — `specs/e2e/<app>/<area>/<journey>.md`, spec
`tests/e2e/<app>/<area>/<journey>.e2e.spec.ts`: the plan body's shape without `## Owners`, `## Scope` and the
API and UI briefs — each block's `Level: E2E` names its owner, and its `## E2E brief` holds `Messages:` and
`Locks:`. The feature plan a journey case came from keeps one *Not now* line `Covered by <that spec>`; a case
moved out of a plan renumbers the cases after it, and every plan or map line naming its old place is updated.
One app per test: a journey that must cross two apps is its case's *Not now* `Blocked`, naming both.

## Visual, cross-browser, responsive

Properties of UI cases, not layers, planned only for a risk found on the stand: `@cross-browser` —
engine-specific behaviour of a control the case drives; `@responsive` — layout or controls that change on a
phone (the case names what the phone shows and why the desktop viewport is not enough); `@visual` — a stable
state whose appearance matters (masks: name the fields in the UI brief, or `mask in @visual: none — default
empty state only`). They use the plan's statuses.

**Decided in every plan with a UI case, from evidence — never from memory.** The live check runs the probe of
`live-app.md` §Browsers, phone, screenshots on each screen the UI cases use, and the plan records one decision
per kind in `## Browsers, phone, screenshots` (the gate fails a plan with UI cases without it):

| Line | Yes when the probe finds | Then |
|---|---|---|
| `browsers:` | a native date, time, file, colour or range input, an editable or draggable area, or a custom widget the case drives (a date picker, drag and drop, copy to clipboard) | the case that drives it gets `@cross-browser` |
| `phone:` | at phone width (393 px) a control the case uses is hidden, moved behind a menu or covered (a sticky bar, a banner) — fields that only stack are no risk | that case gets `@responsive`, its steps say what the phone shows |
| `screenshots:` | a stable state the cases reach whose look matters (a form, a dialog, an empty, error or confirmation state) | a screenshot checkpoint proposed for after the tests (`/implement <plan> Layer: visual`) — the baseline is the user's to approve |

Each line names the cases (`#9 @cross-browser — the date of birth field is an input type=date`) or says
`none — <what was checked>`. The user can strike any of them at the confirm.

## Plan body

`scripts/agent/suite-coverage.mjs` and `qa:gate` (`plans.mjs`, `cases.mjs`, `routes.mjs`) read the case blocks
and *Not now* lines — keep the shape exactly. A new plan's sections are written by hand; **each case block by
command** — `npm run plan:block -- <plan> --title "<title>" [--tms <id>] [--owner API|UI|E2E] [--why "<≤ 8
words>"] [--role <slug>] [--tag <tag>…] [--rules "<source>"] [--steps "<step>" …]`, or drafted from a saved
source with `--case | --bug state/sources/<id>.json` (§TMS cases, §Known bugs) — `--rules` when a route names a rule
(`spec:draft` refuses a `check:` route without its `- Rules:` line); appended in this shape, its `<…>` and choices yours to fill
from the live check (`npm run spec:draft` refuses a block still holding one). A plan with a ready case holds no
`<…>` of this template anywhere — filled, or its line dropped; `qa:gate` fails one left.

```markdown
# <Area> — <Feature>
- Ticket: <KEY>-<number> | none

## Owners
- this run: auto | api | ui | e2e
- found: UI <n> · API <n> · E2E <n> — <why each API scenario exists (another input of a rule, access, the contract) | an app with an API and API 0: none · other inputs: <why> · access: <why> · contract: <why> | an app without one: none: <why>>

## Scope
- in: / out:

## Feature Targets (from specs/project-map.md)
- UI app: <map name> / env <NAME> | none
- API service: <map name> / env <NAME> | none

## Auth (from map)
- auth as: none | action | precondition · role: <role from the map | none>

## Test cases
### 1. <The outcome in one sentence | <case id> · <the case's title> | <case id> · S<n> · <what it proves>>
- Level: API | UI | E2E — <why this owner: where the result is, ≤ 8 words> · Tag: @regression [@smoke] [@cross-browser] [@responsive] · Role: <role> · TMS: <case id | not yet documented | —>
- Route: <one line, docs/Layer Routing Algorithm.md §7 — e.g. intercept POST /api/orders → 201 · id, total · screen list=value, toast=text>
  (a scenario of several steps: one `- Route (step <n>): …` line per step)
- Value: Core | Common | Rare | — · Severity: Critical | Major | Minor · Priority: P1 | P2 | P3
- Why: <the basis in ≤ 8 words; an API scenario: what no screen shows — "another input of the cap">
- Status: ready to implement now
- Data: none | stand | API setup | UI setup | mocked — <what; an illustration: case says "<value>" → <the criterion>>
- Rules: <each check: rule of the routes — where it is written: the case, the PRD, a doc> (only when a route names a rule)
- Preconditions: <what must exist | none>
- Steps:
  1. <what the person or the client does>
     - expect: <the observable outcome that proves THIS scenario — the answer's fields and what the screen shows, as its route names them>
- Cleanup: <what is removed and how | none>
  (a block from a bug ends with `- Seen: <its actual result> — <id> "<its title>": the bug's behaviour, never an expect`; no test checks it)

## Browsers, phone, screenshots (a plan with UI cases)
- browsers: <#N @cross-browser — <the control and why engines differ> | none — <what was checked>>
- phone: <#N @responsive — <what the phone shows> | none — <what was checked at 393 px>>
- screenshots: <#N <the state> — after the tests, Layer: visual | none — <why no stable state matters>>

## Not now
- <Title> · TMS: <case id | —> · <Blocked | Postponed | Cannot be automated | Needs <API | UI | E2E> | Covered by #N | Covered by <spec path> | Gap> since <YYYY-MM-DD> — <reason a QA engineer can act on; Blocked: the step that stops it, what unblocks it, then ` · searched: <place> (<result>); …`>

## Manual case corrections
- <case id> step <n> — expected "<the case>" → "<what the stand does>" | data "<the case's value>" → "<the criterion>"

## Change log
- <date> — <what changed> — cases affected: <names | none, new plan>

## API brief
- endpoints the routes name, statuses from the contract (the fields to assert are in each route)

## UI brief
- page, actions, step names
- Messages: <action> → success "<exact text>" · error "<exact text>" | none
- Components: reuse <Name> · new <Name> (reason) | none
- Lands: <switch> on <page> → <page it lands on> | none
- Locks: <lock> — <the shared state> — cases #N | none

## E2E brief (a journey plan)
- connects: <the features and roles the journey crosses — one app>
- journey steps, final user-visible check, why API/UI is not enough, setup and cleanup
- Messages: <action> → success "<exact text>" · error "<exact text>" | none
- Locks: <lock> — <the shared state> — cases #N | none
```

Status words, exact: `ready to implement now` · `blocked` · `postponed` · `cannot be automated`; E2E cases are
only `ready to implement now` or `blocked`. A *Not now* line keeps its TMS id and its first `since` date while
the reason stays. "Covered by #N" (another case here proves the step) and "Covered by <spec path>" (another
feature or a journey automates it) keep a case written; every other *Not now* reason keeps it out whole.

## A later pass

- Starts from what is automated: `npm run suite:coverage -- --app <app>`. A case `automated` (every scenario
  with its one test) is never drafted, written or rewritten again — but in a refresh, which edits the tests a
  change touches; one short of a scenario gets only that one. Show "Already automated: <n> of <m>" and a table
  `Case | Owners | Coverage | Last run`.
- **`to rework`** — a feature written before routing (no routes, or a scenario tested twice; the gate warns)
  is reworked only in a refresh the user asks for, then **whole**: every ready case routed, every test checked
  against its routes, a pair merged into the owner's one test and the twin deleted (its spec too when emptied).
- Re-checks the `Blocked` lines first against what their reason names (a role now in the map, a block now on
  the page, a status now in the contract): lifted → back into the cases with a change-log line; still there
  → keeps its date. Say the outcome in one line.
- Nothing left → stop: no plan change, no code; give the one useful next step (heal a failed run, the run
  command, a refresh naming what changed).

## Confirm before any code

Show markdown tables in chat — the user decides from this message alone:
- **Will be written (<n>)** — `# | Test | Owner | Why this owner | Checks | Suite | Priority | Why it is
  needed`; Checks — the route in plain words (`answer: street, city · screen: the list, the toast`, `no request ·
  screen: Save disabled`) — no two rows prove the same thing; Suite *Regression* or *Regression + Smoke*;
  Priority `P1 · Critical`; Why ≤ 8 words starting with *main scenario* / *frequent scenario* / *rare scenario* /
  *risk* / *case TC-…* / *rule AC-…*.
- **Will be changed or removed (<c>)** — when the pass edits or deletes tests (a refresh, a rework): `Test | Spec
  | Change | Why`, `edited: <what>` or `removed — folded into #N | the twin of #N | the case dropped the step`. **A
  pass that only changes tests** shows the header line and this table alone (no empty "Will be written", no
  data, priority or smoke line).
- One line each under the tables: **Test data** (in plain words, the setups tried, exceptions by number — a
  faked answer, a setup proven in part, a kept object to approve, an illustration tested by its criterion) ·
  **Priority** legend ("P1 is looked at first when it fails · Critical / Major / Minor — how bad a breakage
  is") · **Smoke** (which case, "say 'no smoke' to keep it regression only") · **Browsers, phone,
  screenshots** (the three decisions in a few words, "say 'no' to any of them") · **Already automated (<n>)** on
  a later pass (ids, spec, last run) · findings outside this plan (a word about another plan's test only after
  running it with `--retries=0`).
- **Not now (<m>)** — `Test | Why not now`, one actionable clause each (the `searched:` tail stays in the plan);
  grouped by reason above ~15 rows.

Then, in the same turn, ask "Write these <n> now?" (`<n>` — the rows to write, change and remove) with
numbered options: write them · drop the limit and write <k> more (only when the run is limited to one owner and
*Not now* holds `Needs <owner>` cases) · add them to <feature> instead (only when the cases sit on another plan's
screen) · let me adjust the plan first. Only after "write them" does implementation start. After implementing,
the plan matches the code: wherever a test does or checks something other than the plan's step or `expect`,
fix the case and add a change-log line.

## When the product changes — refresh, not heal

**Plan refresh** (the plan skill, a journey too) — an expected status or message no longer matches; a
control, field, step or endpoint was added or removed; a new expected outcome; the TMS, contract or docs
disagree with the plan; **a rule changed** (the gate's, a rule's, a review finding the user names); or the
failure's reason is unclear and may be drift:
1. `Blocked` lines re-checked first (§A later pass).
2. Evidence first — the user's words, a contract diff, a ticket, a triage verdict's quote, or, when nobody
   knows, the plan, the failing tests and the live app compared; from the TMS only the cases the change
   touches, by title. Only observed or documented differences enter; remaining doubt is `blocked` with the
   missing source.
3. Re-run the sources and the live check for the changed part only; per touched case: unchanged → leave ·
   changed → update (`blocked` when undocumented after the search) · breaks the changed rule → reworked to it ·
   gone → remove, noted · folded into another scenario → its block and test removed, that block's route naming
   what it took over · new → add, rated as usual.
4. One `## Change log` line per refresh, naming the change (`S2 folded into S1`). Ready cases with code: edit
   only their tests in the existing spec, never rewrite the file; tests of removed scenarios are deleted.
5. An owner the user names is refreshed first; still look at the others for side effects (a shared Page
   Object, a shared rule). A feature step that broke a journey: refresh the feature plan, then the journey.

**Technical heal** (one or two red tests — `/heal`, the verify skill's Heal) — the plan still holds: a locator
moved with the same behaviour, a right answer moved (the same fields at another path — the client's answer path
and the route, like a locator), readiness or timing, fixture, import or config wiring, a payload against an
unchanged contract, setup isolation (`code.md` §Healing). A heal that would change intent, expected text, a
status or the scope → stop and take the refresh path. Never heal requirement drift.

**Triage** (three or more red tests, or a CI run — `/triage`): every failure sorted by its verdict, each
changed value traced to a quoted source before any expectation moves (`02-guardrails.md` §Never fitted to the
product) — "product changed — <ticket>" → this refresh, its quote the evidence.

## Known bugs — `specs/known-bugs.md`

- A failing test whose step the user retested by hand and found broken is a **confirmed bug**: its
  expectation stays as the case says, never bent to the bug, and its code is not touched.
- A bug's ticket (steps, expected, actual) as a source of coverage → one block proving its expected result:
  `npm run plan:block -- <plan> --bug state/sources/<id>.json` — its actual result is the block's `- Seen:`
  line, never an `expect`.
- Its ticket is filed in the map's tracker only with the user's explicit yes (draft the text in chat). Once
  the ticket exists, add one row — `| Test | Layer | Ticket | Fails at step | Since |`: the test's full title
  or the case id it starts with · API, UI or E2E · the ticket · the step's title as the test names it · the
  date — and a change-log line in the plan. The ticket URL comes from the file's `ticket link:` line, never a
  spec. Never `test.fail`, `test.skip` or `@flaky` for it; the gate fails a row naming no test or missing its
  ticket or step.
- The run marks the test itself (`src/fixtures/reporting.fixture.ts`): grey "Known bug — waiting for the
  fix" while it fails at that step; red "Known bug looks fixed — retest the ticket" when it passes; red with
  the real cause when anything else fails it. "Looks fixed" → the user retests: fixed → they close it, the
  row leaves, the change log says so; not fixed → the test no longer catches the bug: fix the test.
