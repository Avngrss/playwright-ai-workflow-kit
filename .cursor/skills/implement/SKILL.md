---
name: implement
description: Write the tests of a plan's ready cases — API (bound clients, statuses and fields from the contract, data cleaned up), UI (Page Objects and components from the live app, messages and toasts, locks, the smoke tag), an E2E journey (one journey across pages, roles or services) and visual checkpoints as a layer of their own (Layer: visual — add or check a visual checkpoint, screenshot test, Approve baseline yes/no) — skipping cases already automated. Also the support pieces: add a page object, decide "is this a component" (discover UI components), create an API client, add a fixture, create a test data builder, generator or dataset, and add Allure metadata (severity, a TMS case link, an extra attachment). Use after the plan's confirm ("Yes, write them") or when asked to implement the cases of an existing plan.
---

# Implement

Writes only cases with `Status: ready to implement now`, each on every layer its `Needs:` names. No schema layer or
CI wiring unless the plan asks.

Rules — this skill is the order of work, the rules say how the code looks: `specs.mdc` (the shape of a test,
titles, steps, tags, a UI test reads as its case, hooks, isolation and locks, signing in, E2E, visual), `code.mdc`
(checks, readable code, one home per kind, repeats, sorting and filtering, the report), `ui.mdc`, `api.mdc`,
`data-and-fixtures.mdc`, `live-app.mdc`, `02-guardrails.mdc` (secrets, the gate, shared code).

## 1. Shared start — every layer

1. Read the plan (`specs/<app>/<area>/<feature>/<feature>.md`; a journey: `specs/e2e/<app>/<area>/<journey>.md`).
   Missing → the plan skill. No ready case → nothing to do. `Layer: visual` → §6 only. A layer the user names
   (`/implement … UI`) never splits a case: a ready case whose `Needs:` names both layers is written on both.
2. **Skip what is automated.** "Ready" is the plan's status, not "not written yet": `npm run suite:coverage --
   --app <app>` (cases with a TMS id) and `npm run test:list` (titles) show the tests that exist. A ready case with
   a test on this layer is skipped — never written again or rewritten; say which were skipped and why.
3. **Whole case** — a case is written on every layer its `Needs:` names, in this run: the API part first (§3), then
   the UI part (§4). Never one side of a case.
4. Targets, roles and sign-in only from `specs/project-map.md`. `npm run auth:check -- <app>:<role> …` for the roles
   the ready cases use passes before any code; a role not ready → name the `.env` entries to fill, stop.
5. The plan's `Data:` is the only data source; another source is needed → back to the plan.
6. **Reuse first** — the area's specs, Page Objects and components, the app's clients, builders and finders, and
   `shared/` (`code.mdc` §One home per kind).

## 2. Naming

Each test as `specs.mdc` §Titles, §Steps and §Tags and annotations say, taken from its plan case: the title from
the case (a TMS case `<case id> · <title>`, a split case ` — <its part>`), the case's steps in its order, the layer
tag + `@regression` (`@smoke` only on the plan's smoke case), `annotation: severity.<the case's Severity>` and
`tms(<id>)` from `caseLinks(<folder>)`, the plan's locks (registered in the map first, the setup skill §5), imports
from `src/fixtures/<app>/test`. Report metadata beyond that — a name on each check, a rare masked attachment — as
`code.mdc` §The Allure report says; never Allure code in a spec.

## 3. API

1. **The contract** — statuses, fields and messages from the plan's API brief and the app's contract; a status or
   message no source states → the case goes back to the plan as `blocked` (`api.mdc` §Principles).
2. **Clients** — a one-off request stays `request` in the spec; an endpoint group several tests use → a bound client (§7).
3. **What a case stands on** — the item the plan names or a search cached per worker, checked with `expectStandData`
   / `standDataMissing`; what two or more tests stand on is an app fixture (`data-and-fixtures.mdc` §`stand`,
   §Disposable data and what tests stand on).
4. **The spec** — `tests/api/<app>/<area>/<feature>/<feature>.api.spec.ts`, checks with `expectJson` /
   `expectStatus` and named checks on the fields the plan lists (`api.mdc` §Tests); created data `AQA`-marked and
   registered with `cleanup.add(…)` right after the create; a mutation with a documented error gets its positive and
   its negative case, as planned; more roles → `test.use({ role })` per describe (`specs.mdc` §Signing in).

## 4. UI

1. **Screens** — explored live as `live-app.mdc` says (the role's saved session, the path the test walks, the test
   id, messages, requests, where a switch lands); nothing from exploration goes into code but locators, message
   texts and request paths.
2. **Page Objects and components** — reuse first; a missing screen → a Page Object, a block → the component
   decision (§7); opening, overlays and toasts as `ui.mdc` §Opening a page says.
3. **The spec** — `tests/ui/<app>/<area>/<feature>/<feature>.ui.spec.ts`, reading as its case (`specs.mdc` §A UI test
   reads as its case, §Hooks): the plan's steps, one reader per checked block against its `shown<Block>(…)` in
   `src/assertions/<app>/`, `beforeEach` only opening the page.
4. **Messages** — `expectToast(page, "<exact text>")` on the next line after the action, then the lasting outcome
   (`ui.mdc` §Who checks what).
5. **Sessions and roles** — `session: "own"` / `"signed-out"` for a case that signs in, signs out or ends sessions,
   `role` on a describe; the app's first sign-out test makes the one-time check (`specs.mdc` §Signing in).
6. **Data** by the plan's `Data:` — `stand`, `API setup`, `UI setup` or `mocked` as `data-and-fixtures.mdc` §Data
   sources says; a new `disposable…` fixture or any other fixture → §7 first.
7. A sortable or filterable list → `code.mdc` §Sorting and filtering first.
8. **Browsers and phone** — `@cross-browser` and `@responsive` exactly as the plan's case `Tag:` lines say. The
   screens explored in step 1 get the probe of `live-app.mdc` §Browsers, phone, screenshots once more: a control
   or a phone change the plan's `## Browsers, phone, screenshots` does not name (a screen changed since planning) →
   no tag of your own; a `## Change log` line and one line of the summary — "found <what> on <screen>; add
   @cross-browser to #N?" — the user decides. A plan with UI cases and no such section → the plan skill first.

## 5. E2E

1. **The plan** — `specs/e2e/<app>/<area>/<journey>.md`, missing → the plan skill §7. Only `ready to implement now`
   or `blocked`; blocked (a login, mailbox, payment or cleanup the plan marked missing) → say why, stop.
2. **Still a journey?** A page render, one form's validation or one click's feedback is a UI test — back to the plan
   skill, said plainly (`plans.mdc` §E2E journeys).
3. **Roles** — only those the E2E brief names, all in the map and ready; one browser context per role, closed in
   `finally` (`specs.mdc` §E2E specs and several roles). A journey across two apps in one test is not supported.
4. **Screens** — reuse the area's Page Objects; a screen they do not cover is explored live and gets its Page Object (§7).
5. **The spec** — `tests/e2e/<app>/<area>/<journey>.e2e.spec.ts`, as `specs.mdc` §E2E specs says: the journey
   visible in the spec, API and fixtures only for preconditions and cleanup, the final check a user-visible outcome,
   created data `AQA`-marked and removed.

## 6. Visual checkpoint — `Layer: visual`

A screenshot check of a stable state, asked by the plan or the user (`/implement` with `Layer: visual`), with an
**Approve baseline: yes | no** field (default **no**). Never `@smoke`. When it is worth it, where it goes, stable
state, dynamic content, masks and baselines: `specs.mdc` §Visual checkpoints — this is the order of work:

1. **Worth it?** No appearance risk, no stable state, or a shot that would hold secrets, personal or random data →
   no checkpoint; say why. Unclear value → none.
2. **Existing first** — the UI tests, visual tests, Page Objects, components and screenshot names already there;
   never a duplicate.
3. **Target and place** — the smallest stable target, inside the existing UI scenario that reaches the state (its
   snapshots in `<spec>-snapshots/`); the state reached through the Page Objects and asserted functionally first.
4. **Dynamic parts** — handled in the rule's order; masks in the spec's `toHaveScreenshot("<area|feature|component>-<state>.png",
   { mask: <page>.visualMaskTargets })`, the Page Object exposing `visualMaskTargets` for the plan-backed fields.
   Cannot be stabilised safely → the checkpoint is `blocked` or `postponed` in the plan.
5. **Run by the field**:
   - **no** — run the impacted test once: `npm run test:app -- <app> ui <spec> -g "<title>" --retries=0`; a missing
     baseline → report that approval is required; never update, keep or commit generated baselines; keep the
     failure artifacts or actual screenshots for review and give their paths.
   - **yes** — run it with `--update-snapshots`, report the created or updated snapshot files, run it again without,
     report both results.
   - All visual checks: `npm run test:visual`.
6. **Report** — target, scope and why; readiness checks, dynamic areas and masking, viewport and project; spec,
   screenshot name and tags; baseline status; commands and results (or what was not run, why, and the risk).

## 7. Support pieces

- **A Page Object** — for a route, screen or navigation boundary a ready case needs, never for a block inside a page
  or "just in case" (`ui.mdc` §Ownership). Check `src/pages/<app>/`, `src/components/<app>/` and a shared
  design-system folder first: the route has an owner → extend it; pages built alike → their base. Locators live
  (`live-app.mdc`). Write it as `ui.mdc` §What it holds, §Opening a page and §Locators say; wire one fixture per page
  in `src/fixtures/<app>/pages.fixture.ts`, never a shared or Playwright name (`data-and-fixtures.mdc` §The chain);
  `visualMaskTargets` only with `@visual` checks. Verify the spec that uses it, then `npm run qa:gate`; report file,
  route, owner checked, components, fixture.
- **A component or not** — only for one of the three reasons of `ui.mdc` §When a component; the plan's UI brief
  `Components:` line records it. Ownership unclear → decide before any code, changing no file (`ui.mdc` §Ownership
  decisions): read the specs using the block, the owning Page Object and `src/components/<app>/`, the live UI only
  when files do not settle it. Report the target, each candidate (owner, locators and actions, reuse and complexity
  evidence, root locator, affected specs), the decision, and for an extraction the minimal plan (files to create and
  update, what moves, specs, verification); removing an abstraction → a refactor on request (`ui.mdc` §Ownership
  decisions and refactoring).
- **An API client** — for an endpoint group several tests use (`api.mdc` §Bound clients): its paths, methods,
  payloads and statuses from the contract and the plan's API brief; one client per API area in
  `src/api/clients/<app>/<area>.client.ts` — extend it, never a second; bound in `src/fixtures/<app>/data.fixture.ts`
  with `apiRequestContext` and `authHeaders`; another persona gets its own fixture only when a test needs it. Verify
  the API specs, then `npm run qa:gate`.
- **A fixture** — in the app's own `data.fixture.ts` or `pages.fixture.ts`, never in the shared chain
  (`data-and-fixtures.mdc` §The chain, §Adding a fixture). Asked for → make it; inferred from repetition → the
  recommendation block of §Adding a fixture first, and wait for the user's yes. Its questions all answered, named
  for what it provides, the lowest mechanism that works; a `disposable…` fixture ships its `src/data/sweeps.ts`
  entry in the same change. Verify the specs using it, then `npm run qa:gate`.
- **A builder, generator or dataset** — the same shape in two or more places, a payload with several required
  fields, or a field that must be unique (`data-and-fixtures.mdc` §Where data lives): search `src/data/**` and
  `src/setup/**` first; the shape from the contract (API) or the live form (UI); called directly, a fixture only when
  several specs reuse it; anything persisted cleaned up. Verify: `npm run typecheck`, the specs using it, then
  `npm run qa:gate`.

## 8. Finish — every layer

1. Remove scratch — probe specs, discovery dumps, throwaway copies (`01-workflow.mdc` §Cleanup before "done"); say
   what was removed.
2. **The plan matches the code.** Wherever the test does or checks something other than the plan's step or `expect`
   (a check dropped because it assumed the account's data, a field found required), fix the plan's case and add a
   `## Change log` line.
3. `npm run qa:gate` — findings treated as `02-guardrails.mdc` §Quality gate says.
4. Next: the verify skill.

**Stop** — the plan is missing or has no ready case for the layer → say so; the plan skill. A needed account, contract
or stand item is missing → the case is `blocked` in the plan with what unblocks it; never worked around.
