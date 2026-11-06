---
name: plan
description: Plan automated coverage before any test is written — a feature plan from TMS cases (plan from TMS, a TMS link), a ticket, a confirmed bug, a requirements doc, the user's own words or an API collection (Bruno + OpenAPI/Swagger), or an E2E journey plan; live check on the stand, preconditions proven, stand data searched before a case is blocked (npm run stand:find), every scenario with one owner — API, UI or E2E — and its route, case blocks by command (npm run plan:block), then the confirm table "Write these n now?". An existing plan starts a later pass by itself — what is automated first, blocked lines re-checked, an alignment with its TMS cases, one or two cases added, or a refresh after a product or rule change (refresh the plan, update the plan) — only the changed part. Writes no tests.
---

# Plan

Writes `specs/<app>/<area>/<feature>/<feature>.md` (a journey: `specs/e2e/<app>/<area>/<journey>.md`) so
implementation never guesses. Writes no tests. After the user's "Yes" the ready cases go to the implement skill.

Rules: **`plans.mdc`** holds what a plan is — the stability gate, sources, owners and routes, whole case, rating,
smoke, TMS cases, E2E journeys, the plan body and status words, later passes, confirmation, refresh, known bugs.
This skill is the order of work and never restates them. Owners, routes and scenarios: `docs/Layer Routing
Algorithm.md` (§6 one scenario proven once, §7 the `Route` formula, §18 a TMS case split into scenarios). Asking,
the TMS read-only, language: `01-workflow.mdc`. Secrets: `02-guardrails.mdc`. The browser and probes:
`live-app.mdc`. Data sources: `data-and-fixtures.mdc`. Collections: `api.mdc`.

## 1. Inputs and basis

1. Read `specs/project-map.md` (`plans.mdc` §Read the map first). The app is not in §Apps and services → the setup
   skill (add an app) first; no ```auth block and the feature needs a signed-in user → the setup skill (sign-in).
2. **Which app** — from the user's words; several apps set up and none named → ask "Which app?" with one numbered
   option per app and a last one "Add a new app" (→ the setup skill).
3. **Owners** — no question: each scenario's one owner (API, UI or E2E) is found on the stand (§6 Whole case), and
   the run writes every owner it finds. The user's words limit it ("API tests for …", "only UI") → this run
   writes only that owner's scenarios; a case with a scenario of another owner waits whole in *Not now*
   `Needs <owner>` (the confirm offers to drop the limit). "E2E", or a journey described → §7. The map's `api:`
   mode takes credentials from a browser (`session-token`, `session-cookies`, `refresh-token`) and the plan has
   API scenarios → one line, no question: "API tests take their credentials from a browser sign-in — a broken
   sign-in page fails them too." The app's API row has no Docs (Swagger) link → one line: API scenarios need the
   contract; they stay blocked until the user shares it.
4. **What we cover** — not given yet → send this message and nothing else, then wait:

   > **What are we covering?** Paste one of these, or several:
   > - **A TMS link** to a folder or one case — the plan covers exactly those cases.
   > - **A ticket** (its id or link) — its acceptance criteria become the requirements.
   > - **A confirmed bug** (its id or link) — the expected result it names becomes a case.
   > - **A requirements doc** (a path or link) — every documented rule gets a case.
   > - **An API collection** (`collections/bruno/<service>/…`, with the OpenAPI/Swagger if there is one) — its requests become candidates, rated by risk.
   > - **The feature in your own words**, e.g. "Account → Addresses" — the app is explored live: user scenarios first, then the risks around them.

   Every line stays while the map names no TMS or tracker yet — the first link pasted fills the map (the setup
   skill §5); a line leaves only once the user said there is no such system. When §Tracker queue has a query, the
   user's own open tickets (read-only, at most 2) may be offered as numbered options; an error or no result adds
   nothing, silently. QA work tracked as a sub-task (the map's note) → plan for the parent story.
5. **Read the reply by its content** — the first match is the basis (what each basis puts in the plan:
   `plans.mdc` §Sources of truth); everything else is context:

   | The reply holds | Basis | Feature name from | Then |
   |---|---|---|---|
   | a TMS link | `test-cases` | the folder title | §4.2 |
   | a ticket id or link | `requirements` | the ticket summary | its summary, description and acceptance criteria (and the parent when the story alone does not explain the feature); the plan header carries `Ticket:` |
   | a confirmed bug's id or link | `requirements` | the feature it breaks | its steps, expected and actual result; its block by `--bug` (§4.5) |
   | a doc path or link | `requirements` | the doc title | §4.1 |
   | a collection path | `value-and-risk` over the requests | the service or domain | §4.4 |
   | only words | `value-and-risk` | the user's words | no documentation search of your own — explore the app live (a blocker's search aside: §5 Searched before blocked) |

   A link to **one case inside a folder** → ask: "1. Only <case id> — <title> · 2. The whole folder (<n> cases)". A
   TMS link of an app whose `case link <app>` line is missing → write it from this link (the setup skill §5).
6. **Slugs** (kebab-case, `00-project-map.mdc` §Layout): `feature` from the ticket or the user's words (never a page
   you noticed); `area` groups siblings — an existing area clearly holding them → ask "1. <area> · 2. New area";
   the app is its registered `Platform`. An existing feature folder that is clearly the same feature → ask which is
   meant, never a near-duplicate.
7. The plan file exists → §3 (a later pass, an alignment with TMS cases, one or two cases, or a refresh) — never
   straight to code.

## 2. Gates — before any case is drafted

- **Stability gate** (`plans.mdc` §Stability gate) — it stops the run: say what was found, write no plan, give the
  next step it names.
- **Owner check** — never a test for the sake of an owner; from evidence only: no API scenario when nothing falls
  outside the screens (no other input of a rule, no access the screen never tries, no contract the cases name) ·
  no UI without a screen · no E2E without a journey across pages or roles. A run limited to one owner that finds
  none of its scenarios → ask "1. Drop the limit — write every owner · 2. Stop"; E2E asked, no crossing journey →
  "1. Write it as UI scenarios · 2. Stop". The outcome goes into the plan's `## Owners`.
- **Roles** (`plans.mdc` §Read the map first) — `npm run auth:check -- <app>:<role>` for every role the cases use;
  values missing → before the confirm table, name the exact entries ("Fill APP_MANAGER_LOGIN, APP_MANAGER_PASSWORD
  in .env, then reply ready") and wait. A role the user asks for that the map lacks → the setup skill §3.9.

## 3. A later pass, an alignment, a refresh

Starts by itself whenever the plan file exists (§1 step 7) — there is no separate command; the user's words or
link say which it is. A later pass or a refresh explores only what the plan does not hold yet (§5).

### Already automated — every pass starts here

1. `npm run suite:coverage -- --app <app>` (clean JSON: `node scripts/agent/suite-coverage.mjs --app <app>`) —
   this plan's cases are those whose `plan.plan` is this plan, and its `withoutTms` rows (matched by title). An
   `automated` case is never drafted, written or rewritten again — but in a refresh, which edits the tests a
   change touches; a case short of a scenario gets only the missing one (`plans.mdc` §A later pass, §TMS cases).
   **To rework** (written before routing — a scenario tested twice, or no routes) is reworked only in a refresh
   the user asks for, then whole: every ready case routed, every test checked against its route, a pair merged
   into the owner's one test, the twin deleted (its spec file too when emptied).
2. Show it first: "Already automated: <a> of <n>" and a table `Case | Owners | Coverage | Last run`, automated
   cases first, then the rest with their status and since date.
3. Re-check every `Blocked` line (`plans.mdc` §A later pass) — stand data with the `npm run stand:find` its
   `searched:` tail names — and say it in one line ("Unblocked: TC-408 — the map now has a second account · still
   blocked: TC-416").
4. **Nothing left** (and no refresh asked) → stop: no plan change, no code, no confirm question; the table, the
   re-check line and one next step (a failed last run → `/heal` or `/triage`; never run → the run command; the
   product or a rule changed → `/plan <plan path> — <what changed>`; new cases → their link).

### Alignment with TMS cases

A plan exists and the user pastes TMS cases for it, or the TMS folder changed: read the plan and the folder's cases
(§4.2 step 1), "Already automated" first, then
1. **map every case of the folder** to its plan blocks (`TMS:` carries its id) or one *Not now* line; a case new to
   the plan goes through §4.5, §5 and §6;
2. case drift → the one question of §4.2; corrections are fixed in the TMS by hand, or by the agent only on the
   user's explicit yes to that write;
3. **a plan case with no TMS case** is kept (it still has its `Why`); the summary lists it as "not in the TMS — add a
   case or keep it plan-only";
4. one `## Change log` line for the alignment; then step 4 above, or the confirm (§8).

### One or two cases of a planned feature

Adding, unblocking or reworking one or two cases, no change named — **read only**: §1 steps 1 and 7, the plan
itself; §4 for the case's source and §4.5; §5 with what the case meets; §6 Whole case (the rating only for a case
with no TMS priority); §8. Not read: the stability gate, the owner check (unless the run is limited), §6 Smoke. A
case leaving *Not now* is added as a new block; its *Not now* line, the `## Owners` count, the briefs' and the
map's lock lines it needs and a `## Change log` line change with it.

### Refresh after a product or rule change

The steps of `plans.mdc` §When the product changes. A locator-only breakage is a heal (`/heal`), never a refresh;
nothing changed → "Already automated" alone. **Read only**: "Already automated" (its table only when the refresh
adds or removes cases); §4 for the changed part's source; §5 for the changed screen, request, contract or `Data:`,
and its Searched before blocked only when met; §6 Whole case for a changed or new scenario (an edited expected text
with the same route and owner is not one), §4.5 for a new one; §8 (a pass that only changes tests: its short form).
Not read: the map (unless the change brings a role or app the plan does not use yet), the owner check, §6 Smoke
(unless the change touches the `@smoke` case).

1. **Evidence first** — the product (a field, a contract, a screen: the user's words, a contract diff, a ticket,
   the run summary's `Plans to refresh:`) or **a rule** (a rule's, the gate's, a review finding the user names — its
   text); "update the plan" with no evidence → ask what changed. Basis `test-cases` → **only the cases the change
   touches**, their current text by title from the TMS (the whole folder only when the change is broad or the user
   asks): a step the TMS dropped leaves the plan and its test, an added step is planned.
2. The sources and the live check for **the changed part only**; a rule change touches the stand only where it
   moves an owner or a check.
3. Per touched case as `plans.mdc` §When the product changes says, and also: breaks the changed rule → reworked to
   it · folded into another scenario → its block and test removed, that block's route names what it took over. The
   `## Change log` line names the change (a rule by its name; `S2 folded into S1`).
4. Then the implement skill for the edited tests (the sections their lines meet) and the new ones, and the verify
   skill (§2, §6.2 — light for an edited test, full for a new one).

**From triage** (the verify skill §10, a "Product changed" verdict or a "yes"): its quote — a ticket's field, a
`file:line`, a commit, the user's yes — is the evidence and the source, nothing it cites searched again; step 3,
the edited tests, then back to the triage for its verify and its one message — no confirm here.

## 4. Sources of truth

### 4.1 Requirements

A ticket → each acceptance criterion is a candidate. A doc → read in full; every flow, edge case, business rule,
access rule and documented negative is a candidate. A confirmed bug → one case: the expected result it names.

### 4.2 TMS cases and case drift

1. Load the folder's cases (id, title, precondition, steps, expected results, priority) through the TMS's MCP or
   API. Unreachable → one line ("No TMS is reachable from here — paste the cases' text, or describe the feature"),
   then the pasted text, or the next basis, recorded.
2. Apply `plans.mdc` §TMS cases to every case. **Case drift** — ask once per plan, listing the drifts, with its
   options (the stand is right → `## Manual case corrections`; the case is right → kept `blocked`; a value the case
   names is an example → tested by the criterion). A value or drift the user already decided (in the request, or
   the plan's `Data:`, *Not now* or `## Manual case corrections` lines) is not asked again.

### 4.3 The contract

API statuses, fields and messages from the contract (the Docs column of the app's API row), with a few real calls
where it is ambiguous (`plans.mdc` §Sources of truth, `api.mdc` §Principles).

### 4.4 An API collection

Planning input, never the set by itself (`api.mdc` §API collections):
1. **Inventory** — read-only, no request executed: the path and its format; requests grouped by service or domain,
   each with its method, path, body or example, headers, auth hints and variables; service and env names against
   the map; stateful or destructive requests flagged (DELETE, payment, order creation, user mutation, admin
   operations; production-looking ones loudly); with a contract, method, path, status, schema, parameters and auth
   compared and the drift reported — never undocumented behaviour inferred. Coverage against the other plans and
   `tests/api/**` (covered, planned but untested, a test without a source) goes into the plan's `## API brief`.
2. Group requests into **business capabilities**, never one test per request; each capability is rated (§6).
3. Service ownership and `.env` names only from the map (an unregistered name → the setup skill §5 first); auth by
   the app's `api:` mode — a protected request without a working sign-in → `blocked`.
4. Contract and collection disagree → a drift line in the plan, the affected cases `blocked` or `postponed`.
   Destructive or stateful requests are `ready` only with their cleanup or isolation proven (§5).
5. A secret in the collection is never copied anywhere; it is a finding. The collection summary goes into the plan's
   `## API brief` and `## Scope`, implementation advice apart from the cases; the collection, the contract and the
   TMS are not modified.

### 4.5 Case blocks by command

Each block is appended to `## Test cases` by command, numbered, in the shape of `plans.mdc` §Plan body — its `<…>`
and choices yours to fill from the live check (§5); a new plan's other sections are written by hand:

- **from a title or the user's words** — `npm run plan:block -- <plan> --title "<title>" [--tms <id>] [--owner
  API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>] [--steps "<step>" …]`;
- **from a TMS case or a confirmed bug** — save what the TMS or tracker tool returned as
  `state/sources/<id>.json` in the neutral shape of `scripts/agent/plan-draft.mjs`, then `npm run plan:block --
  <plan> --case|--bug state/sources/<id>.json [--scenario S<k> --title "<what it proves>" [--take <n>[-<m>]]]
  [--owner …] [--why …] [--role …]`: its title, id, priority, precondition, steps and expected results copied in
  its words; a bug's expected result is the last expect, its actual result the block's `- Seen:` line (never an
  expect); a priority off the plan's scale stays a choice beside the TMS word for you to decide. A case of several
  scenarios (`docs/Layer Routing Algorithm.md` §18) → one call per scenario with `--scenario` and `--take`.

`npm run spec:draft` refuses a block still holding the template's `<…>` or a choice on its Value line.

## 5. Live check and preconditions — proven, never promised

Confirm every candidate on the stand before it gets a status — a targeted confirm/refute pass, not exploration
(`plans.mdc` §Sources of truth; how: `live-app.mdc`). **Which tool**: the Playwright MCP to explore what is not
known yet (a screen's first look, its requests); the saved-session script (`live-app.mdc` — a one-off Playwright
script with the role's saved session, outside `tests/`, deleted after) to check what the plan already names (a
text, a count, a request's answer), and whenever the MCP does not answer within a minute. A later pass or a refresh
explores only what the plan does not hold — a changed screen, a new route, a case whose text changed, a re-checked
`Blocked` line. Record as you go:
- per action, the network requests — whether it reaches the server, its method, path and answer: the evidence of
  the scenario's owner and its `Route:` (§6); where the app caches (first open, reopen, a changed period), twice;
- the exact message after each action → UI brief `Messages:`;
- a state the cases change that others see, or a real stand item a case changes → a lock registered in the map
  (the setup skill §5) and named in the UI brief `Locks:` (a journey plan: its E2E brief's);
- an overlay or global spinner the test does not cause → the map's ```app-wide block, said in one line;
- on each screen the UI cases use, the probe of `live-app.mdc` §Browsers, phone, screenshots — its numbers and
  what the phone width showed are the evidence for §6.

Try every case's `Data:` and `Preconditions:` now, before the confirm table (`data-and-fixtures.mdc` §Data sources):
- **each value the case names, first** — a rule value (a boundary, a status, an error text, a value a requirement
  names) is tested as written; an illustration ("e.g.", the ticket's example, a plain name) by the criterion it
  stands for, the stand holding it or not — `Data: stand — case says "Acme" → any brand with two products`, on the
  confirm's test-data line. Unclear → ask, one question per value: "1. A rule — test it as written · 2. An example
  — test by the criterion"; a TMS case's value the stand lacks → the case-drift question of §4.2 instead;
- `stand` — confirmed live; the plan names what was found and the date;
- `API setup` — one real create, `AQA`-marked, removed at once; its shape and required fields go into the API brief;
- `UI setup` — the probe that answers a request (`live-app.mdc` §Probes);
- a probe that changes something kept or shared → all such probes in one question first (`live-app.mdc` §Probes);
- removal is tried with the create; what cannot be removed is the finding: ask "1. Keep one object made once for the
  tests (named in the plan and the map) · 2. Block the case".

### What the tests can neither read nor make

A fact another system owns: the ladder of `data-and-fixtures.mdc` §Facts only another system knows. Its "ask the
user" step goes out as the verify skill's "What only the engineer can give" message; the dependency goes into the
map's §External systems (the setup skill §5).

Not proven → `blocked`: what was tried, what failed, what unblocks it — the cheapest way first. Proven only in part
→ named in the test-data line under the confirm table (§8).

### Searched before blocked

No case is `Blocked` — on a rule no source states, or data, an item or an account the stand lacks — before three
searches:
1. **the rule** — the run's requirements (the ticket and its parent, the doc, the case), the API docs the map links,
   this repository's `docs/` on the feature and the feature's tickets in the map's tracker (read-only) — to prove
   this case, never to add one; found → the block's `- Rules:` line cites it;
2. **the data** — every other tenant (store, project, team) each map account can open, and the outside system the
   tests can read (the map's §External systems). Stand data first by `npm run stand:find -- <app> --in "GET <path
   with {tenant}>" --where "<what the case needs>"` — every account × tenant (the app's `tenants:` line, added to
   its ```auth block when missing; the header of `scripts/agent/stand-find.mjs`): found → `stand`, the item named;
   nowhere → its last `searched:` line is the tail's place;
3. **making it** — an API creating it (`API setup`), or an item kept for the tests alone, made once with the map's
   accounts, offered in the one probe question above; declined → blocked. Only a way tried now, its removal too,
   lifts the block — found but untried (declined, refused, unanswered) → still `Blocked`, the reason naming the way.

A missing account: step 2 is the map's other accounts (their rights read live) and `.env`; step 3 never makes one —
an account is the user's (the verify skill's "What only the engineer can give").

The reason then ends with the tail ` · searched: <place>; <place>` — each place as a person repeats it, its result
in brackets (`docs/orders.md (no limit stated)`, `GET /api/shops as manager (2 shops, none closed)`, `kept team
offered, declined 2026-11-03`); `searched: none (<why>)` only where no search lifts it (a declined probe, a drifted
case kept). One readable line: the reason ≤ ~40 words, the tail ≤ ~5 places. The gate warns on a Blocked line
without it.

## 6. Rating, whole case, smoke

Read this app's other plans (`specs/<app>/**`) before drafting, then rate every candidate as `plans.mdc` §Rating
says; a case without `Why` is not written.

### Whole case

From the live check's evidence, per case (`plans.mdc` §A case is written whole or not at all, `docs/Layer Routing
Algorithm.md`):
- **scenarios** — split only where obligations fail separately; one obligation is one block over any number of
  steps, never split by layer, gesture, page or stand item;
- **owner** — the block's `Level:` with its reason (where the result is): a person's action on a screen is UI, its
  test checking the action's answer and the screen — no API twin; an API scenario is what no screen shows (another
  input of a rule, access, the contract);
- **route** — the block's `Route:` (one `Route (step <n>):` line per step of a scenario of several), in the syntax
  of §7 there, from the requests seen: how the answer is proven (the case's data, the fields named, or `check:
  <rule>`) and which screen tokens show it; a message after the action is `toast=text` and what it left on screen;
- **data** a scenario stands on is preparation, never a check.

Every scenario's route proven on the stand → written, every scenario this run; a step no owner can cover (an
account or item missing, no delete, a person's eye) → the whole case *Not now* `Blocked` / `Cannot be automated`
naming that step; a scenario whose owner this run leaves out → the whole case *Not now* `Needs <owner>`. `qa:gate`
enforces it.

### Smoke

Propose the one case `plans.mdc` §Smoke allows. None fits → no smoke case, one line why. A later plan keeps the one
already tagged.

### Browsers, phone, screenshots

A plan with UI cases decides all three from the probe's evidence (`plans.mdc` §Visual, cross-browser, responsive):
the case that drives an engine-sensitive control gets `@cross-browser`; a case whose controls change at phone width
gets `@responsive` and says in its steps what the phone shows; a stable state whose look matters becomes a proposed
screenshot checkpoint for after the tests. Each decision, yes or `none — <what was checked>`, goes into
`## Browsers, phone, screenshots` and one line of the confirm. A later pass re-runs the probe on a screen that changed.

## 7. An E2E journey — its plan

What counts as a journey and its statuses: `plans.mdc` §E2E journeys. Implementation: the implement skill, E2E.
**One journey over planned features — read only**: steps 1–7 below, §4 for its source, §5 with what the journey
meets (and its Searched before blocked), §6 Whole case; then the implement skill §5 and the verify skill §2, §3 per
further role, §6.2 **Full**, §7.

1. **Inputs** — the app and the sources as §1, and the plans of the features the journey crosses (the blocks and
   UI briefs of the screens its steps pass). No journey described yet → ask, free text, and wait: "Describe the
   journey in a sentence or two — who does what, from the start to what they must see at the end."
2. **Is it a journey?** Nothing to connect → ask: 1. Write it as UI scenarios (a case of a feature plan: §3 "One or
   two cases") · 2. Stop.
3. **Roles** — which role acts at which step comes only from the description; each in the map's block and ready
   (`npm run auth:check -- <app>:<role> …`); one missing → the whole journey `blocked`, naming it (the setup skill
   §3.9). One app per test: a journey that must cross two apps is its case's *Not now* `Blocked`, naming both apps.
4. **Already covered** — the app's plans and `npm run test:list`: a lower-layer case that proves a step stays there;
   the journey checks the hand-over. The same journey planned already → a later pass over that plan (§3).
5. **Live check** — walk the journey on the stand as each role, every step and the final outcome; note what each
   step needs (data, a mailbox, a payment, cleanup); preconditions and cleanup proven as §5.
6. **Write it** — its own plan `specs/e2e/<app>/<area>/<journey>.md`, `<journey>` kebab-case after the outcome
   (`place-order-then-manager-approves`), no `## Owners` (its one owner, E2E, on each block); the block by
   `npm run plan:block -- <plan> … --owner E2E` (§4.5) and its `## E2E brief` with `Locks:` and `Messages:` lines,
   in the shape of `plans.mdc` §Plan body: what it connects, the 3–6 steps (role — what they do — what they see),
   the final check only this journey produces, why a lower layer cannot see it, setup and cleanup. A feature plan
   the journey leaves keeps one *Not now* line `Covered by <its spec>`.
7. **Confirm** — the journey as a short table (`# | Step | Role | Checks`), the test-data line and anything blocked;
   then ask "Write this journey now?": 1. Yes, write it · 2. Let me adjust the plan first. **Yes** → the implement
   skill §5, then the verify skill, in the same run.

## 8. Confirm — "Write these n now?"

The tables and lines of `plans.mdc` §Confirm before any code, printed in chat:

```markdown
Plan: `specs/<app>/<area>/<feature>/<feature>.md` · basis: value-and-risk · role: customer

**Will be written (<n>)**

| # | Test | Owner | Why this owner | Checks | Suite | Priority | Why it is needed |
|---|------|-------|----------------|--------|-------|----------|------------------|
| 1 | Customer adds a delivery address | UI | the result on the same screen: the list | answer: street, city · screen: the list, the toast | Regression + Smoke | P1 · Critical | main scenario: keep my addresses |
| 2 | Another customer cannot read the addresses | API | no screen: a direct request is refused | answer: 403 · error code | Regression | P1 · Critical | risk: someone else's data |
| 3 | Save stays off until Street is filled | UI | the browser decides alone, on the form | no request · screen: Save disabled | Regression | P2 · Minor | rule: Street is required |

Test data: the tests create their own entries and remove them (create and delete tried today) · #4 uses a faked server answer.
Priority: P1 is looked at first when it fails · Critical / Major / Minor — how bad a breakage is.
Smoke: #1 — the feature's main scenario, under the first account — say "no smoke" to keep it regression only.
Browsers, phone, screenshots: #3 @cross-browser — the delivery date is an input type=date · phone: none — at 393 px the form keeps its fields · screenshot of the empty list after the tests (Layer: visual, your approval) — say "no" to any of them.

**Will be changed or removed (<c>)**

| Test | Spec | Change | Why |
|------|------|--------|-----|
| The address list answers street and city | `addresses.api.spec.ts` | removed — folded into #1 | #1 checks that answer on its own action |

**Not now (<m>)**

| Test | Why not now |
|------|-------------|
| 200-character limit on Street | P3, low risk |
| A saved address is offered at checkout | needs UI — not in this run |
```

**Checks** is the route in plain words — no two rows prove the same thing. **Will be changed or removed** appears
only when the pass edits or deletes existing tests (`edited: <what>` or `removed — <folded into #N | the case
dropped the step | the twin of #N>`). **A pass that only changes tests** has the short form: the header line and
that table alone — no empty "Will be written (0)", no test-data, priority or smoke line, *Not now* only for a case
entering or leaving it. Each *Not now* case one actionable clause (its `searched:` tail stays in the plan). The
test-data line also names an illustration tested by its criterion, a setup proven only in part and a kept object to
approve. A claim about another plan's test ("it will fail") only after running it: `npm run test:app -- <app>
<layer> <its spec> -g "<its title>" --retries=0`.

Then ask "Write these <n> now?" (`<n>` — the rows to write, change and remove):
1. **Yes, write them** — "<n> to write (API <a>, UI <u>) · <c> to change or remove · <m> not now: <reasons>".
2. **Drop the limit and write <k> more** — only when the run is limited to one owner and *Not now* holds
   `Needs <owner>` cases.
3. **Add them to <feature> instead** — only for a new plan whose cases sit on another plan's screen or requests (its
   `Covered by <that plan>` lines): this plan file is removed, the cases join that plan as a later pass with a
   `## Change log` line there.
4. **Let me adjust the plan first** — back into this skill.

Only after **Yes** → the implement skill (each test from `npm run spec:draft`), then the verify skill.

**Stop** — no feature, or a scenario with no route proven on the stand → `blocked`, never a guessed route; no answer
about the feature → ask once. Never implement from this skill.
