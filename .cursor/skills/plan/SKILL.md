---
name: plan
description: Plan automated coverage before any test is written — a feature plan (API, UI or API + UI) from TMS cases (plan from TMS, a TMS link), a ticket or requirements doc, the user's own words, or an API collection (plan from an API collection, Bruno + OpenAPI/Swagger), or an E2E journey plan (plan an E2E journey across pages, roles or apps); live check on the stand, preconditions proven, every case with a status, a reason and the layers it needs, then the confirm table "Write these n now?". An existing plan starts a later pass by itself — what is automated first, blocked lines re-checked, aligning a plan with its TMS cases (align plan with TMS) or a refresh after a product change (update the plan). Writes no tests.
---

# Plan

Writes `specs/<app>/<area>/<feature>/<feature>.md` (a journey: `specs/e2e/<app>/<area>/<journey>.md`) so
implementation never guesses. Writes no tests. After the user's "Yes" the ready cases go to the implement skill.

Rules: **`plans.mdc`** holds what a plan is — the stability gate, sources, layers, whole case, rating, smoke, TMS
cases, E2E journeys, the plan body and status words, later passes, confirmation, refresh, known bugs. This skill is
the order of work and never restates them. Asking, the TMS read-only, language: `01-workflow.mdc`. Secrets:
`02-guardrails.mdc`. The browser and probes: `live-app.mdc`. Data sources: `data-and-fixtures.mdc`. Collections:
`api.mdc`.

## 1. Inputs and basis

1. Read `specs/project-map.md` (`plans.mdc` §Read the map first). The app is not in §Apps and services → the setup
   skill (add an app) first; no ```auth block and the feature needs a signed-in user → the setup skill (sign-in).
2. **Which app** — from the user's words; several apps set up and none named → ask "Which app?" with one numbered
   option per app and a last one "Add a new app" (→ the setup skill).
3. **Coverage** — from the user's words ("API tests for …", "only UI"); otherwise ask "Which tests should we write?":
   1. **API** — server-side checks without a browser: responses, saved data, business rules, access.
   2. **UI** — what the user sees and does on screen, in the browser.
   3. **API + UI** — both layers for this feature, each covering its own side, never the same thing twice.
   4. **E2E** — one long scenario across features, roles or apps (§7).

   Never all of them unless asked. The choice is what this run writes; the layers each case needs are found on the
   stand (§6 Whole case). API chosen and the map's `api:` mode takes credentials from a browser (`session-token`,
   `session-cookies`, `refresh-token`) → one line, no question: "API tests take their credentials from a browser
   sign-in — a broken sign-in page fails them too." The app's API row has no Docs (Swagger) link → one line: API
   cases need the contract; they stay blocked until the user shares it.
4. **What we cover** — not given yet → send this message and nothing else, then wait:

   > **What are we covering?** Paste one of these, or several:
   > - **A TMS link** to a folder or one case — the plan covers exactly those cases.
   > - **A ticket** (its id or link) — its acceptance criteria become the requirements.
   > - **A requirements doc** (a path or link) — every documented rule gets a case.
   > - **An API collection** (`collections/bruno/<service>/…`, with the OpenAPI/Swagger if there is one) — its requests become candidates, rated by risk.
   > - **The feature in your own words**, e.g. "Account → Addresses" — the app is explored live: user scenarios first, then the risks around them.

   Every line stays while the map names no TMS or tracker yet — the first link pasted fills the map (the setup
   skill §5); a line leaves only once the user said there is no such system. When §Tracker queue has a query, the user's own open
   tickets (read-only, at most 2) may be offered as numbered options; an error or no result adds nothing,
   silently. QA work tracked as a sub-task (the map's note) → plan for the parent story.
5. **Read the reply by its content** — the first match is the basis (what each basis puts in the plan:
   `plans.mdc` §Sources of truth); everything else is context:

   | The reply holds | Basis | Feature name from | Then |
   |---|---|---|---|
   | a TMS link | `test-cases` | the folder title | §4.2 |
   | a ticket id or link | `requirements` | the ticket summary | its summary, description and acceptance criteria (and the parent when the story alone does not explain the feature); the plan header carries `Ticket:` |
   | a doc path or link | `requirements` | the doc title | §4.1 |
   | a collection path | `value-and-risk` over the requests | the service or domain | §4.4 |
   | only words | `value-and-risk` | the user's words | no documentation search of your own — explore the app live |

   A link to **one case inside a folder** → ask: "1. Only <case id> — <title> · 2. The whole folder (<n> cases)". A
   TMS link of an app whose `case link <app>` line is missing → write it from this link (the setup skill §5).
6. **Slugs** (kebab-case, `00-project-map.mdc` §Layout): `feature` from the ticket or the user's words (never a page
   you noticed); `area` groups siblings — an existing area clearly holding them → ask "1. <area> · 2. New area";
   the app is its registered `Platform`. An existing feature folder that is clearly the same feature → ask which is
   meant, never a near-duplicate.
7. The plan file exists → §3 (a later pass, an alignment with TMS cases, or a refresh) — never straight to code.

## 2. Gates — before any case is drafted

- **Stability gate** (`plans.mdc` §Stability gate) — it stops the run: say what was found, write no plan, give the
  next step it names.
- **Layer check** (`plans.mdc` §Layers) — its questions asked as numbered options; API + UI with one layer empty →
  no question, the reason in the plan's `## Coverage choice`.
- **Roles** (`plans.mdc` §Read the map first) — `npm run auth:check -- <app>:<role>` for every role the cases use;
  values missing → before the confirm table, name the exact entries ("Fill APP_MANAGER_LOGIN, APP_MANAGER_PASSWORD
  in .env, then reply ready") and wait. A role the user asks for that the map lacks → the setup skill §3.9.

## 3. A later pass, an alignment, a refresh

Starts by itself whenever the plan file exists (§1 step 7) — there is no separate command; the user's words or
link say which of the three it is.

### Already automated — every pass starts here

1. `npm run suite:coverage -- --app <app>` (clean JSON: `node scripts/agent/suite-coverage.mjs --app <app>`) for
   cases with a TMS id; plan cases without an id by their titles in `npm run test:list`. What is done, what gets
   only its missing layer, and what another feature already automates or the TMS copies: `plans.mdc` §A later pass
   and §TMS cases.
2. Show it first: "Already automated: <a> of <n>" and a table `Case | Layer | Coverage | Last run`, automated cases
   first, then the rest with their status and since date.
3. Re-check every `Blocked` line (`plans.mdc` §A later pass) and say it in one line ("Unblocked: TC-408 — the map now
   has a second account · still blocked: TC-416").
4. **Nothing left** → stop: no plan change, no code, no confirm question; the table, the re-check line and one next
   step (a failed last run → `/heal`; never run → the run command; the product changed → `/plan <plan path> —
   <what changed>`; new cases → their link).

### Alignment with TMS cases

A plan exists and the user pastes TMS cases for it, or the TMS folder changed: read the plan and the folder's cases
(§4.2 step 1), "Already automated" first, then
1. **map every case of the folder** to exactly one plan case (`TMS:` carries its id) or one *Not now* line; a case
   new to the plan goes through §5 and §6;
2. case drift → the one question of §4.2; corrections are fixed in the TMS by hand, or by the agent only on the
   user's explicit yes to that write;
3. **a plan case with no TMS case** is kept (it still has its `Why`); the summary lists it as "not in the TMS — add a
   case or keep it plan-only";
4. one `## Change log` line for the alignment; then step 4 above, or the confirm (§8).

### Refresh after a product change

The steps of `plans.mdc` §When the product changes. "Update the plan" with no evidence → ask what changed first. A
locator-only breakage is a heal (`/heal`), never a refresh. New cases go through §5–§8; edited cases keep their tests
in the existing spec.

## 4. Sources of truth

### 4.1 Requirements

A ticket → each acceptance criterion is a candidate. A doc → read in full; every flow, edge case, business rule,
access rule and documented negative is a candidate.

### 4.2 TMS cases and case drift

1. Load the folder's cases (id, title, steps, expected results, priority) through the TMS's MCP or API. Unreachable
   → one line ("No TMS is reachable from here — paste the cases' text, or describe the feature"), then the pasted
   text, or the next basis, recorded.
2. Apply `plans.mdc` §TMS cases to every case. **Case drift** — ask once per plan, listing the drifts, with its two
   options (the stand is right → `## Manual case corrections`; the case is right → kept `blocked`).

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

## 5. Live check and preconditions — proven, never promised

Confirm every candidate on the stand before it gets a status — a targeted confirm/refute pass, not exploration
(`plans.mdc` §Sources of truth; how: `live-app.mdc`). Record as you go:
- the exact message after each action → UI brief `Messages:`;
- a state the cases change that others see, or a real stand item a case changes → a lock registered in the map
  (the setup skill §5) and named in the UI brief `Locks:`;
- an overlay or global spinner the test does not cause → the map's ```app-wide block, said in one line;
- on each screen the UI cases use, the probe of `live-app.mdc` §Browsers, phone, screenshots — its numbers and
  what the phone width showed are the evidence for §6.

Try every case's `Data:` and `Preconditions:` now, before the confirm table (`data-and-fixtures.mdc` §Data sources):
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

## 6. Rating, whole case, smoke

Read this app's other plans (`specs/<app>/**`) before drafting, then rate every candidate as `plans.mdc` §Rating
says; a case without `Why` is not written.

### Whole case

Decide each case's layers from the live check's evidence (do the network requests show the move going to the
server?) by `plans.mdc` §Layers and §A case is written whole or not at all — the API cases first, then each UI
candidate's "what does this prove that the API cases don't?". The evidence goes into `Needs:`; a needed layer not
chosen for this run makes the confirm question offer the switch.

### Smoke

Propose the one case `plans.mdc` §Smoke allows. None fits → no smoke case, one line why. A later plan keeps the one
already tagged.

### Browsers, phone, screenshots

A plan with UI cases decides all three from the probe's evidence (`plans.mdc` §Visual, cross-browser, responsive):
the case that drives an engine-sensitive control gets `@cross-browser`; a case whose controls change at phone width
gets `@responsive` and says in its steps what the phone shows; a stable state whose look matters becomes a proposed
screenshot checkpoint for after the tests. Each decision, yes or `none — <what was checked>`, goes into
`## Browsers, phone, screenshots` and one line of the confirm. A later pass re-runs the probe on a screen that changed.

## 7. An E2E journey — its brief

What counts as a journey and its statuses: `plans.mdc` §E2E journeys. Implementation: the implement skill, E2E.

1. **Inputs** — the app and the sources as §1. No journey described yet → ask, free text, and wait: "Describe the
   journey in a sentence or two — who does what, from the start to what they must see at the end."
2. **Is it a journey?** Nothing to connect → ask: 1. Switch to UI · 2. Stop.
3. **Roles** — which role acts at which step comes only from the description; each in the map's block and ready
   (`npm run auth:check -- <app>:<role> …`); one missing → the whole journey `blocked`, naming it (the setup skill
   §3.9). A journey across two apps in one test is not supported yet — say so and stop.
4. **Already covered** — the app's plans and `npm run test:list`: a lower-layer case that proves a step stays there;
   the journey checks the hand-over. The same journey planned already → a later pass over that plan (§3).
5. **Live check** — walk the journey on the stand as each role, every step and the final outcome; note what each
   step needs (data, a mailbox, a payment, cleanup); preconditions and cleanup proven as §5.
6. **Write it** — `<journey>` kebab-case after the outcome (`place-order-then-manager-approves`), its case and
   `## E2E brief` in the shape of `plans.mdc` §Plan body, filled from what was found: what it connects, the 3–6
   steps (role — what they do — what they see), the final check only this journey produces, why a lower layer
   cannot see it, setup and cleanup.
7. **Confirm** — the journey as a short table (`# | Step | Role | Checks`), the test-data line and anything blocked;
   then ask "Write this journey now?": 1. Yes, write it · 2. Let me adjust the plan first. **Yes** → the implement
   skill §5, then the verify skill, in the same run.

## 8. Confirm — "Write these n now?"

The tables and lines of `plans.mdc` §Confirm before any code, printed in chat:

```markdown
Plan: `specs/<app>/<area>/<feature>/<feature>.md` · basis: value-and-risk · role: customer

**Will be written (<n>)**

| # | Test | Type | Case needs | Suite | Priority | Why it is needed |
|---|------|------|------------|-------|----------|------------------|
| 1 | Customer adds a delivery address | UI | UI — the form and the list | Regression + Smoke | P1 · Critical | main scenario: keep my addresses |
| 2 | Another customer cannot read the addresses | API | API — the server refuses | Regression | P1 · Critical | risk: someone else's data |

Test data: the tests create their own entries and remove them (create and delete tried today) · #4 uses a faked server answer.
Priority: P1 is looked at first when it fails · Critical / Major / Minor — how bad a breakage is.
Smoke: #1 — the feature's main scenario, under the first account — say "no smoke" to keep it regression only.
Browsers, phone, screenshots: #3 @cross-browser — the delivery date is an input type=date · phone: none — at 393 px the form keeps its fields · screenshot of the empty list after the tests (Layer: visual, your approval) — say "no" to any of them.

**Not now (<m>)**

| Test | Why not now |
|------|-------------|
| 200-character limit on Street | P3, low risk |
| A saved address is offered at checkout | needs API+UI — UI not in this run |
```

The test-data line also names a setup proven only in part and a kept object to approve. A claim about another
plan's test ("it will fail") only after running it: `npm run test:app -- <app> <layer> <its spec> -g "<its title>" --retries=0`.

Then ask "Write these <n> now?":
1. **Yes, write them** — "<n> to write (API <a>, UI <u>) · <m> not now: <reasons>".
2. **Switch to <layers> and write <k> more** — only when *Not now* holds `Needs` cases of a layer not chosen.
3. **Add them to <feature> instead** — only for a new plan whose cases sit on another plan's screen or requests (its
   `Covered by <that plan>` lines): this plan file is removed, the cases join that plan as a later pass with a
   `## Change log` line there.
4. **Let me adjust the plan first** — back into this skill.

Only after **Yes** → the implement skill (API cases first, then UI), then the verify skill.

**Stop** — no feature, or no answer about coverage → ask once. Never implement from this skill.
