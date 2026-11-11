---
name: implement
description: Write the tests of a plan's ready cases — one test per scenario in its owner's folder, each started from npm run spec:draft and checking what its Route names — API (bound clients, answer types from npm run api:types and a schema of the fields read, statuses and fields from the contract, data cleaned up), UI (Page Objects and components from the live app, the action's answer through answerTo, messages and toasts, locks, the smoke tag), an E2E journey (one journey across pages or roles) and visual checkpoints as a layer of their own (Layer: visual — add or check a visual checkpoint, screenshot test, Approve baseline yes/no) — skipping scenarios already automated. Also the support pieces: add a page object, decide "is this a component" (discover UI components), create an API client, add a fixture, create a test data builder, generator or dataset, and add Allure metadata (severity, a TMS case link, an extra attachment). Use after the plan's confirm ("Yes, write them") or when asked to implement the cases of an existing plan.
---

# Implement

Writes only cases with `Status: ready to implement now` — every scenario of a ready case, one test each in its
owner's folder. No schema-only test or CI wiring unless the plan asks.

Rules — this skill is the order of work, the rules say how the code looks: `specs.md` (the shape of a test,
titles, steps, tags, a UI test reads as its case, hooks, isolation and locks, signing in, E2E, visual), `code.md`
(read whole for new code; for an edit, a heal, a refresh or a triage fix, the sections its changed lines meet),
`ui.md`, `api.md`, `data-and-fixtures.md`, `live-app.md`, `02-guardrails.md` (secrets, the gate, shared code).
What each route asks a test to check: `docs/Layer Routing Algorithm.md` §7.

## 1. Shared start — every layer

1. Read the plan (`specs/<app>/<area>/<feature>/<feature>.md`; a journey: `specs/e2e/<app>/<area>/<journey>.md`).
   Missing → the plan skill. No ready case → nothing to do. `Layer: visual` → §6 only. An owner the user names
   (`/implement … UI`) never splits a case: a ready case is written whole, every scenario.
2. **Skip what is automated** — "ready" is the plan's status, not "not written yet": `npm run suite:coverage --
   --app <app>` (cases with a TMS id) and `npm run test:list` (titles). A ready scenario with its test is never
   written again or rewritten; say which were skipped and why.
3. **Whole case** — every scenario of a ready case in this run, one test in its owner's folder (its `Level:`),
   checking what its `Route:` names, nothing more or less; a route that does not hold on the stand goes back to the
   plan, never into a changed check.
4. Targets, roles and sign-in only from `specs/project-map.md`; `npm run auth:check -- <app>:<role> …` for the ready
   cases' roles passes before any code — a role not ready → name the `.env` entries to fill, stop.
5. The plan's `Data:` is the only data source; another source is needed → back to the plan.
6. **Reuse first** — the area's specs, Page Objects and components, the app's clients, builders and finders, and
   `shared/` (`code.md` §One home per kind).
7. **Each test starts as `npm run spec:draft -- <plan> <#>`** (`specs.md` §The shape of a test) — appended in its
   owner's spec, or the file created; write each step where its `// Route…:` / `// expect:` comments say, replacing
   them (the gate fails a test still holding them).

## 2. Naming

Each test as `specs.md` §Titles, §Steps and §Tags say, from its plan block (`spec:draft` writes it so): the title
from the block (a TMS case `<case id> · <title>`, a scenario of a split case `<case id> · S<n> · <what it proves>`),
the case's steps in its order, the layer tag + `@regression` (`@smoke` only on the plan's smoke case),
`annotation: severity.<the case's Severity>` and `tms(<id>)` from `caseLinks(<folder>)`, the plan's locks
(registered in the map first, the setup skill §5), imports from `src/fixtures/<app>/test`. Report metadata beyond
that as `code.md` §The Allure report says; never Allure code in a spec.

## 3. API

**API tests only** (the run is limited to API, or every scenario it writes is API-owned) — read only: §1, §2, this
section, §8; `specs.md` and `code.md` but their UI parts; `api.md`; `data-and-fixtures.md`; `live-app.md` only
its probes. Not read: §4, §5, `ui.md`.

1. **The contract** — statuses, fields and messages from the plan's API brief and the app's contract; one no source
   states → the case back to the plan as `blocked` (`api.md` §Principles).
2. **Clients** — a one-off request stays `request` in the spec; an endpoint group several tests use → a bound client
   (§7) with its answer schemas and answer paths (`api.md` §Bound clients, §Response schemas — `npm run api:types --
   <app>` for the app's first client when its API row has a contract, and whenever the API changed).
3. **What a case stands on** — the item the plan names or a search cached per worker, checked with `expectStandData`
   / `standDataMissing`; what two or more tests stand on is an app fixture (`data-and-fixtures.md` §`stand`,
   §Disposable data and what tests stand on).
4. **The spec** — `tests/api/<app>/<area>/<feature>/<feature>.api.spec.ts`, only the scenarios no screen shows (a
   person's scenario never again "to check the data"), as `api.md` §Tests says, on the fields its route names;
   created data `AQA`-marked, `cleanup.add(…)` right after the create; a mutation with a documented error gets its
   positive and negative scenario, as planned; more roles → `test.use({ role })` per describe (`specs.md` §Signing
   in).

## 4. UI

1. **Screens** — explored live as `live-app.md` says (the role's saved session, the path the test walks, the test
   id, messages, requests, where a switch lands); nothing from exploration goes into code but locators, message
   texts and request paths.
2. **Page Objects and components** — reuse first; a missing screen → a Page Object, a block → the component decision
   (§7); opening, overlays and toasts as `ui.md` §Opening a page says.
3. **The spec** — `tests/ui/<app>/<area>/<feature>/<feature>.ui.spec.ts`, reading as its case (`specs.md` §A UI test
   reads as its case, §Hooks): the plan's steps, one reader per checked block against its `shown<Block>(…)`,
   `beforeEach` only opening the page.
4. **The action's answer** (an `intercept` route) — taken in the spec in one line through `answerTo` / `answersTo`,
   the Page Object method handed to it (it never returns or checks the answer), with the route's `sent:`, `query:`,
   `has:`, `check:` and `status:`. A `no-request` or `screen-only` scenario listens to nothing.
5. **Messages** — `expectToast(page, "<exact text>")` on the next line after the action, then the lasting outcome
   (`ui.md` §Who checks what).
6. **Sessions and roles** — `session: "own"` / `"signed-out"` for a case that signs in, signs out or ends sessions,
   `role` on a describe; the app's first sign-out test makes the one-time check (`specs.md` §Signing in).
7. **Data** by the plan's `Data:` (`data-and-fixtures.md` §Data sources); a new `disposable…` fixture or any other
   fixture → §7 first. A sortable or filterable list → `code.md` §Sorting and filtering first.
8. **Browsers and phone** — `@cross-browser` and `@responsive` exactly as the case's `Tag:` lines say. The screens of
   step 1 get the probe of `live-app.md` §Browsers, phone, screenshots once more: a control or a phone change the
   plan's `## Browsers, phone, screenshots` does not name (a screen changed since planning) → no tag of your own; a
   `## Change log` line and one summary line — "found <what> on <screen>; add @cross-browser to #N?" — the user
   decides. A plan with UI cases and no such section → the plan skill first.

## 5. E2E

1. **The plan** — `specs/e2e/<app>/<area>/<journey>.md`, missing → the plan skill §7. Only `ready to implement now`
   or `blocked`; blocked (a login, mailbox, payment or cleanup the plan marked missing) → say why, stop.
2. **Still a journey?** A page render, one form's validation or one click's feedback is a UI test — back to the plan
   skill, said plainly (`plans.md` §E2E journeys).
3. **Roles** — only those the E2E brief names, all in the map and ready (`specs.md` §E2E specs and several roles).
   A journey across apps is the plan's *Not now* `Blocked`, never a test.
4. **Screens** — reuse the area's Page Objects; a screen they do not cover is explored live and gets its Page Object (§7).
5. **The spec** — `tests/e2e/<app>/<area>/<journey>.e2e.spec.ts`, as `specs.md` §E2E specs says (client calls only
   where the route allows).

## 6. Visual checkpoint — `Layer: visual`

A screenshot check of a stable state, asked by the plan or the user (`/implement` with `Layer: visual`), with an
**Approve baseline: yes | no** field (default **no**). When it is worth it, where it goes, `@smoke` never, stable
state, dynamic content, masks and baselines: `specs.md` §Visual checkpoints — this is the order of work:

1. **Worth it?** No appearance risk, no stable state, or a shot holding secrets, personal or random data → no
   checkpoint, say why; unclear value → none.
2. **Existing first** — the UI and visual tests, Page Objects, components and screenshot names already there; never
   a duplicate.
3. **Target and place** — the smallest stable target, a test of its own in `<feature>-visual.ui.spec.ts`, never a
   screenshot inside the feature's UI spec; the state reached through the Page Objects and asserted functionally
   first.
4. **Dynamic parts** — in the rule's order; masks as `toHaveScreenshot("<area|feature|component>-<state>.png", {
   mask: <page>.visualMaskTargets })`, the Page Object exposing `visualMaskTargets` for the plan-backed fields.
   Cannot be stabilised safely → the checkpoint is `blocked` or `postponed` in the plan.
5. **Run by the field**:
   - **no** — `npm run verify -- <app> <spec>:<line>`: a missing baseline reads "screenshot without a baseline" →
     report that approval is required; never update, keep or commit generated baselines; keep the failure
     artifacts or actual screenshots for review and give their paths.
   - **yes** — `npm run test:app -- <app> ui <spec> -g "<title>" --update-snapshots --retries=0`, report the created
     or updated snapshot files, then `npm run verify -- <app> <spec>:<line>` without; report both results.
   - All visual checks: `npm run test:visual`.
6. **Report** — target, scope and why; readiness checks, dynamic areas and masking, viewport and project; spec,
   screenshot name and tags; baseline status; commands and results (or what was not run, why, and the risk).

## 7. Support pieces

- **A Page Object** — for a route, screen or navigation boundary a ready case needs, never for a block inside a page
  or "just in case" (`ui.md` §Ownership). Check `src/pages/<app>/`, `src/components/<app>/` and a shared
  design-system folder first: the route has an owner → extend it; pages built alike → their base. Locators live
  (`live-app.md`); written as `ui.md` §What it holds, §Opening a page and §Locators say; one fixture per page in
  `src/fixtures/<app>/pages.fixture.ts` (`data-and-fixtures.md` §The chain); `visualMaskTargets` only with
  `@visual` checks. Verify the spec that uses it (`npm run verify`); report file, route, owner checked, components,
  fixture.
- **A component or not** — only for one of the three reasons of `ui.md` §When a component; the UI brief's
  `Components:` line records it. Ownership unclear → decide before any code, changing no file (`ui.md` §Ownership
  decisions and refactoring): read the specs using the block, the owning Page Object and `src/components/<app>/`,
  the live UI only when files do not settle it. Report the target, each candidate (owner, locators and actions,
  reuse and complexity evidence, root locator, affected specs), the decision, and for an extraction the minimal
  plan (files to create and update, what moves, specs, verification); removing an abstraction → a refactor on
  request.
- **An API client** — `api.md` §Bound clients: paths, methods, payloads and statuses from the contract and the
  plan's API brief, answer types and schemas as §3; one client per API area in `src/api/clients/<app>/<area>.client.ts`
  — extend it, never a second; bound in `src/fixtures/<app>/data.fixture.ts` with `apiRequestContext` and
  `authHeaders`; another persona gets its own fixture only when a test needs it. Verify the API specs.
- **A fixture** — in the app's own `data.fixture.ts` or `pages.fixture.ts`, never in the shared chain; asked for →
  make it, inferred from repetition → the recommendation block first, and wait for the user's yes; its questions all
  answered, named for what it provides, the lowest mechanism that works (`data-and-fixtures.md` §The chain,
  §Adding a fixture, §Never hide the action under test, §Setup and cleanup); a `disposable…` fixture ships its
  `src/data/sweeps.ts` entry in the same change. Verify the specs using it.
- **A builder, generator or dataset** — the same shape in two or more places, a payload with several required
  fields, or a field that must be unique (`data-and-fixtures.md` §Where data lives): search `src/data/**` and
  `src/setup/**` first; the shape from the contract (API) or the live form (UI); called directly, a fixture only
  when several specs reuse it; anything persisted cleaned up. Verify the specs using it (`npm run typecheck` first).

## 8. Finish — every layer

1. Remove scratch — probe specs, scripts, discovery dumps, throwaway copies (`01-workflow.md` §Cleanup before
   "done"); say what was removed.
2. **The plan matches the code.** Wherever the test does or checks something other than the plan's step, route or
   `expect` (a check dropped because it assumed the account's data, a field found required), fix the plan's block
   and add a `## Change log` line.
3. `npm run qa:gate` while writing — a finding is fixed the way it says, never dodged (`02-guardrails.md` §Quality
   gate); a finding that looks wrong is a suspected gate bug: the code stays as the rules want it, the summary names it.
4. Next: the verify skill — one `npm run verify` of the specs written (it runs the gate again first).

**Stop** — the plan is missing or has no ready case for the layer → say so; the plan skill. A needed account, contract
or stand item is missing → the case is `blocked` in the plan with what unblocks it; never worked around.
