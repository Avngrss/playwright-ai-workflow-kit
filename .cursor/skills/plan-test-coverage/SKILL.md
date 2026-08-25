# Skill: Plan Test Coverage

## Goal

Use this skill when planning test coverage for a feature, endpoint, page, or user flow.

The goal is to choose the right test level before implementation and produce a complete feature coverage plan that is directly actionable for implementation agents.

The plan must describe the full coverage picture for API, UI, schema, visual, and not automated levels — not E2E.

E2E is a separate planning layer. Full user or business journeys are planned in `specs/e2e/<area>/<journey>.md`, not in feature coverage plans.

Do not implement tests during this skill.

---

## Related Rules

Follow these rules:

- Test Strategy and Test Pyramid Rules;
- E2E Testing Rules;
- API Architecture Rules;
- API Schema Validation Rules;
- Visual Testing Rules;
- Cross-Browser and Responsive Testing Rules;
- Multi-Target Environment Rules;
- Authentication Strategy Rules;
- Security and Sensitive Data Handling Rules;
- Test Structure and Tags Rules;
- Test Isolation and State Rules;
- Project Map Rules;
- Agent Workflow;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- creating a new feature test plan;
- refreshing an existing feature plan after product, contract, or requirement change;
- deciding whether behavior should be covered by UI, API, visual, schema, or not automated;
- reviewing too many proposed UI tests;
- splitting smoke and regression coverage;
- avoiding duplicate coverage across layers;
- creating API and UI implementation briefs before coding.

Do **not** use this skill to plan E2E journeys. E2E belongs in `specs/e2e/<area>/<journey>.md`.

---

## When NOT To Use

Do not use this skill when:

- the task is a small locator fix;
- test level is already clear;
- a failing test needs healing;
- implementation has already been approved and scoped;
- the task is only to implement tests from an existing plan that is already current.

Use `/update-feature-plan` when the product changed and the plan may be stale.

---

## Updating An Existing Plan

Use this path when automation already exists and the product, contract, or requirements changed.

Inputs:

- existing plan at `specs/<feature>/<feature>.md`;
- description of what changed, or `unknown`;
- optional layer scope: `api`, `ui`, `both`, or `unknown`;
- optional requirements/specs (path, link, pasted text, or attached file) — same input as `/plan-feature`;
- optional failing test paths;
- optional TMS, OpenAPI, or UI discovery inputs.

Attached requirements are a first-class refresh input. When present, use them as intended product behavior and compare:

```text
old plan  vs  attached requirements  vs  live app / contract / failing tests
```

Do not invent fields, messages, or status codes that the requirements do not define.

If requirements and live app disagree, record the drift in Change log and mark unclear items blocked/postponed. Do not silently pick one side.

Unknown delta is allowed when requirements are missing. Discover observed differences from the plan vs live app/contract/failing tests. Do not invent requirements.

If layer scope is `api` or `ui`, refresh that layer first and scan the other layer only for side effects.

Steps:

1. Read the current plan and existing tests for the feature slug.
2. Compare observed or reported product behavior with planned scenarios.
3. If `What changed` is unknown, run discovery and record observed delta; if the plan is still correct, stop and recommend heal.
4. Add a **Change log** entry with date or sprint note and a short delta summary.
5. Refresh **Feature Targets** when URLs, apps, or services changed.
6. Refresh **Auth Strategy** when login, session, token, role, or permission behavior changed.
7. Refresh **Setup & Cleanup Strategy** when persisted/shared state, destructive flows, or isolation changed — or explicitly confirm none/disposable-only.
8. Refresh **Sensitive Data & Visual Masking** when UI/forms/auth/profile visibility changed.
9. Update scenario statuses: ready to implement now, blocked, postponed, not automated, removed.
10. Refresh Implementation Briefs only for ready items affected by the change.
11. Note obsolete tests or helpers that implementation should remove or rewrite.
12. Cross-check project map Auth Strategy: if the plan needs a role slug or mechanism not registered → mark scenarios **blocked** and report map update needed (do not invent slugs in the plan).

Auth / multi-role refresh rules:

- `role: <slug>` must exist in the project map role matrix when `auth as: precondition`;
- **API** scenarios: plan documents API mode; implement brief mentions token/creds/headers per slug — not `storageState`;
- **UI** scenarios: plan documents UI mode; implement brief mentions `test.use({ storageState })`, inject, or auth fixture per slug;
- if a new persona appears, recommend updating project map before marking scenarios ready.

Setup / cleanup refresh rules:

- destructive or mutating scenarios need explicit cleanup owner or disposable isolation;
- if cleanup strategy is missing and state is persisted → **blocked**;
- hook policy: safe `beforeEach` navigation only — not action under test; prefer fixture teardown over hidden cleanup.

Do not implement tests during this skill.

After the plan is updated, implementation and heal follow `.cursor/rules/feature-change-lifecycle.rules.mdc`:

```text
/update-feature-plan → /implement-*-batch → /heal-* (technical only) → qa:gate
```

---

## Workflow

### 1. Identify Behaviors

List the behaviors or requirements to cover.

Do not start from test cases.

Start from:

- user-facing risks;
- backend/API risks;
- validation rules;
- boundary rules;
- integration points;
- visual risks;
- browser-specific risks;
- viewport or responsive layout risks;
- error handling;
- contract/schema risks.

Each behavior should describe something meaningful that the product or system must do.

---

### 2. Define Scope Boundary

Before recommending coverage, define the exact feature scope.

Identify:

- source of truth;
- in-scope behaviors;
- out-of-scope behaviors;
- related but excluded controls, endpoints, query parameters, states, or variants.

Do not expand coverage to adjacent functionality unless it is explicitly in scope.

If a feature is based on a specific UI control, API field, endpoint, user flow, or requirement, use that as the scope boundary.

Examples of adjacent functionality:

- nearby UI controls;
- additional filters;
- additional query parameters;
- related endpoints;
- optional variants;
- unsupported negative cases;
- integration combinations.

Adjacent functionality may be planned only when it covers a distinct stated risk or is explicitly requested.

If scope is ambiguous, document the ambiguity and ask for clarification or mark related items as blocked/postponed.

Implementation briefs must not ask implementation agents to cover adjacent functionality unless it is explicitly included in the feature scope.

---

### 2a. Identify Feature Targets

Before recommending coverage, identify which UI application(s) and API service(s) the feature touches.

Follow Multi-Target Environment Rules and the project map.

For simple projects:

- UI/application target: `UI_BASE_URL`;
- API target: `API_BASE_URL`.

For multi-target projects:

- identify UI/application targets for UI and visual coverage;
- identify API/service targets for API and schema coverage;
- identify external/partner targets when the feature uses them;
- identify setup/cleanup targets only when the feature requires them;
- use env names registered in the project map only;
- do not invent env variable names;
- do not derive API host from UI host;
- do not use generic `API_BASE_URL` when the feature belongs to a specific service.

If more than one UI app or API service exists and target ownership is unclear:

- mark affected scenarios blocked or postponed;
- ask for clarification;
- request project map update for missing env names.

Document target ownership in the feature plan even when only one app and one service exist, if the project map defines named targets.

---

### 2b. Identify Auth Strategy

Follow Authentication Strategy Rules and the project map Auth Strategy section.

Before recommending coverage, decide how this feature authenticates.

For every feature plan, document:

- required: yes or no;
- role only if the project map registers roles and this scenario uses one;
- auth as: `none`, `action`, or `precondition`;
- API mechanism from the project map;
- UI mechanism from the project map;
- persistence and token placement only when a session is used;
- isolation from the project map, or none.

Multi-role (when the product has several personas):

- project map registers a **role matrix** — slugs, API mode, UI mode, session artifact paths, credential env refs;
- feature plan sets `role: <slug from map>` when `auth as: precondition`;
- **API** specs use token/creds/headers for that slug — not `storageState`;
- **UI** specs use map UI mode — typically `test.use({ storageState })` per describe or inject;
- do not invent slugs; one global API token or one global UI `storageState` for all roles is forbidden when roles differ.

Rules:

- features with no session still write Auth Strategy (`required: no`, modes `none`);
- do not invent role names to fill the template;
- login / token-issuance coverage uses `auth as: action`;
- other authenticated coverage uses `auth as: precondition` and a registered mechanism;
- do not invent env token names, `localStorage` keys, storageState paths, or login endpoints;
- if a scenario needs a session and the mechanism is not in the project map, mark it **blocked**.

How-to examples: `docs/auth-strategy.md`.

---

### 3. Classify Risk

For each behavior, classify the main risk:

- backend contract;
- frontend interaction;
- user journey;
- validation;
- boundary validation;
- authorization;
- visual layout;
- data transformation;
- integration;
- configuration;
- error handling;
- browser compatibility;
- responsive layout or navigation.

The risk classification should explain why the behavior needs automated coverage.

---

### 4. Choose Test Level

For each behavior, choose one primary test level:

- static/typecheck;
- API;
- UI;
- visual checkpoint;
- schema/contract;
- not automated.

Do **not** assign E2E in feature coverage plans. If a behavior requires a critical full user or business journey, note that it may need a separate E2E journey plan in `specs/e2e/<area>/<journey>.md` later.

Use the lowest reliable level that proves the behavior.

Do not default everything to UI.

Do not recommend E2E for short UI functional tests such as page render checks, single-form validation, or one-click feedback checks.

UI coverage is justified only when the risk is user-facing, browser-visible, or frontend-integration specific.

Prefer API, UI, schema, and visual coverage for broad coverage.

Use E2E sparingly for high-value journeys — but plan E2E separately in `specs/e2e/<area>/<journey>.md`, not in this feature plan.

Block or postpone E2E journey planning when mailbox, reset-link, reset-token, payment, or other external dependencies are missing, unstable, or lack safe cleanup.

Example:

- forgot-password page render, empty-email validation, and valid-email submit confirmation should remain UI coverage in the feature plan;
- full forgot-password reset plus login with a new password should be noted as a candidate for a separate E2E journey plan and remain blocked or postponed without mailbox/reset-link access and a safe disposable-user or cleanup strategy.

API coverage is preferred for backend contract, validation, data, status behavior, authorization contract, authentication token contract, filtering/sorting predicates, and response shape when UI behavior is not the main risk.

---

### 5. Decide Cross-Browser And Responsive Coverage

After choosing the primary test level for each behavior, decide whether extra cross-browser or responsive coverage is needed.

Follow Cross-Browser and Responsive Testing Rules.

Default:

- no extra cross-browser or responsive coverage unless a documented browser or viewport risk exists;
- state explicitly when no extra coverage is needed.

Cross-browser coverage is justified when there is a documented browser-specific rendering or interaction risk.

Good cross-browser UI candidates:

- critical controls or pages with known engine differences;
- modal, dialog, menu, or native control behavior;
- browser-specific validation or interaction feedback.

Responsive coverage is justified when there is a documented viewport-specific layout or navigation risk.

Good responsive UI candidates:

- mobile navigation or hamburger menu;
- collapsed sidebar or filter panel;
- form or control visibility at a breakpoint;
- layout switching between desktop and mobile states.

Do **not** recommend:

- running every UI scenario in every browser;
- running full E2E journeys across many viewports;
- duplicating API or schema coverage per browser;
- cross-browser visual baselines without explicit baseline approval;
- pixel-exact responsive assertions unless planned visual coverage exists.

E2E cross-browser coverage:

- limit to very small smoke journeys only;
- plan separately in `specs/e2e/<area>/<journey>.md`, not in feature coverage plans;
- do not mix cross-browser E2E expansion into normal feature plans unless noting a future journey-plan candidate.

For each cross-browser or responsive item, specify:

- browser project or viewport;
- user value;
- expected visible behavior;
- why default UI coverage is not sufficient;
- ready to implement now, blocked, postponed, or not automated;
- whether visual coverage is needed and whether baseline approval is required.

If no browser-specific or viewport-specific risk exists, include this note in the plan:

- no extra cross-browser or responsive coverage is needed.

Tag and metadata planning note:

- planned cross-browser coverage should use registered `@cross-browser` when implemented;
- planned responsive coverage should use registered `@responsive` when implemented;
- do not plan browser or device tags such as `@chromium`, `@firefox`, `@webkit`, `@mobile`, `@tablet`, or `@desktop`;
- browser and viewport execution is controlled by Playwright projects documented in the project map;
- reporting dimensions such as browser, project, viewport, and coverage type belong in Allure metadata when useful, not in invented Playwright tags;
- if a needed tag or Playwright project is not registered in the project map, mark the item blocked or postponed or request a project map update.

---

### 6. Avoid Duplicate Coverage

Check whether the behavior is already covered or better covered at another layer.

Avoid UI tests for backend behavior already covered by API tests unless the UI adds a distinct user-facing risk.

Avoid duplicating the same risk across:

- API;
- UI;
- schema/contract;
- visual checkpoints;
- E2E journey plans (planned separately in `specs/e2e/`).

Good layered coverage example:

- API test verifies validation contract;
- UI test verifies visible validation feedback;
- visual checkpoint verifies validation layout.

Bad duplicate coverage example:

- API test verifies required email validation;
- UI test repeats the same backend validation without checking unique UI behavior;
- visual test screenshots the same state without visual value.

---

### 7. UI Value And Test Pyramid Check

Before recommending UI coverage, verify that each UI scenario has distinct user-facing value.

A UI test is justified when it verifies one or more of:

- user journey;
- browser interaction;
- visible validation feedback;
- visible success or error state;
- navigation;
- frontend/backend integration visible to the user;
- behavior that cannot be reliably proven at API or schema level.

Prefer API or schema/contract coverage when the risk is:

- backend validation;
- request/response status;
- response body shape;
- authentication token contract;
- authorization contract;
- data filtering or sorting predicate;
- business rule exposed by API;
- persistence or data transformation.

Do not recommend UI tests only because the behavior exists on a page.

Do not duplicate backend behavior in UI unless the UI adds visible user-facing risk.

For each UI scenario, include:

- unique UI risk;
- why API/schema is not sufficient;
- duplicate coverage risk.

For each API behavior with documented error handling, include either:

- negative API scenario;
- or blocked/postponed reason if the negative contract is unclear.

Avoid UI-heavy plans where multiple UI tests verify backend behavior without unique UI value.

Do not require a fixed API:UI ratio per feature.

Use the pyramid as a decision model, not as a numeric quota.

---

### 8. Boundary And Negative Coverage Check

Before finalizing coverage, check whether the contract or requirement defines boundary or negative behavior.

Review documented limits and constraints such as:

- minimum string length;
- maximum string length;
- numeric ranges;
- date or timestamp formats;
- required fields;
- optional fields;
- nullable fields;
- allowed enum values;
- unsupported enum values;
- file size limits;
- file type limits;
- pagination limits;
- filter ranges;
- sorting allowed values;
- authentication boundaries;
- authorization boundaries;
- uniqueness constraints;
- duplicate entity behavior.

For each documented boundary or negative behavior, the plan must include one of:

- ready API scenario;
- ready UI scenario only when the risk is visible user feedback;
- schema/contract check;
- blocked/postponed item with reason;
- not automated item with reason.

If a boundary requires a critical full journey, note it as a candidate for a separate E2E journey plan — do not add E2E scenarios to the feature plan.

Rules:

- do not guess undocumented status codes, response bodies, validation messages, or boundary limits;
- if boundary behavior is not documented but appears important, mark it as blocked/postponed and describe the missing contract detail;
- prefer API coverage for backend validation, request/response contract, auth, data predicates, status behavior, and schema behavior;
- use UI coverage only when the boundary or negative behavior has distinct visible user-facing value.

---

### 9. Define Smoke vs Regression

Mark each automated scenario as:

- smoke;
- regression.

Smoke should be small, critical, and fast.

Regression may cover broader behavior and edge cases.

Visual checks should default to regression unless the feature plan explicitly requires a critical visual smoke checkpoint.

Do not put every test into smoke.

---

### 10. Decide Visual Checkpoints

Recommend visual checkpoints only for meaningful visual risks.

Good visual checkpoint candidates:

- default form state;
- filled form state;
- validation error state;
- success state;
- modal open state;
- empty state;
- complex component layout.

Do not recommend visual checkpoints for every page by default.

Do not use visual checks to replace functional assertions.

For each recommended visual checkpoint, specify:

- target UI state;
- screenshot scope;
- reason visual coverage is useful;
- planned now or postponed;
- dynamic content risks;
- recommended tag: `@visual` with `@regression` by default.

If baseline approval is not requested, visual checkpoints should normally be marked as postponed.

---

### 11. Recommend Implementation Scope

Recommend implementation scope by level.

The plan should provide the full coverage picture, but implementation must still be executed later through separate implementation commands.

Group coverage by:

- API coverage;
- UI coverage;
- visual checkpoints;
- schema/contract checks;
- not automated or blocked items.

Do **not** group E2E coverage in feature plans. E2E is planned separately in `specs/e2e/<area>/<journey>.md`.

For each group, classify items as:

- ready to implement now;
- blocked;
- postponed;
- not automated.

Ready to implement now should include all safe, stable, and unblocked coverage for that level.

Do not split coverage into first/later batches by default.

Use blocked or postponed only when there is a real reason, such as:

- missing contract details;
- unstable live behavior;
- missing approved setup mechanism;
- unclear auth or role requirements;
- unclear visual baseline strategy;
- high flakiness risk;
- explicitly deferred product scope.

Do not ask one implementation agent to implement API, UI, visual, and schema coverage in the same run.

Implementation commands should later select a level-specific implementation scope, for example:

- all API coverage ready to implement now;
- all UI coverage ready to implement now;
- visual checkpoints planned now.

E2E is planned separately via `/plan-e2e-journey` at `specs/e2e/<area>/<journey>.md`.

Recommended implementation commands are informational only during planning.

Do **not** recommend `/implement-e2e-flow` from feature coverage plans.

If E2E is relevant, recommend `/plan-e2e-journey` first.

Create implementation briefs that are actionable for implementation agents.

The plan must not leave API or UI details for implementation agents to invent.

If a full journey may need E2E later, add a short note pointing to a future `specs/e2e/<area>/<journey>.md` — do not include E2E scenarios or E2E Implementation Brief in the feature plan.

API Implementation Brief should include:

- endpoint and method per scenario;
- payload source or builder need;
- scenario data strategy;
- expected status;
- response assertions;
- schema validation decision;
- negative coverage decision;
- boundary coverage decision;
- API client decision;
- assertion helper decision;
- contract gaps or blockers.

UI Implementation Brief should include:

- route or page;
- scenario steps;
- tags;
- preconditions and test data;
- scenario data strategy;
- expected visible outcome;
- unique UI risk;
- why API/schema is not sufficient;
- recommended Page Object;
- likely Page Object actions or readers;
- Component Object decision;
- locator discovery notes if available;
- assertions in spec;
- what API/schema owns instead of UI.

Implementation briefs should describe how to implement the coverage safely, but they must not implement the code.

---

### 12. Validate Scenarios vs Implementation Decisions

Before finalizing the plan, verify that planned scenarios represent real coverage items.

A scenario must represent one of:

- user behavior;
- API behavior;
- contract behavior;
- visual state;
- error or validation behavior;
- integration risk;
- not automated risk.

Do not list E2E journeys in feature coverage plans. E2E belongs in `specs/e2e/<area>/<journey>.md`.

Do not list implementation details as standalone scenarios.

Implementation details include:

- assertion helpers;
- builders;
- generators;
- API clients;
- fixtures;
- Page Objects;
- Component Objects;
- metadata helpers;
- reporting helpers.

Bad:

- scenario A: POST /messages happy path;
- scenario B: response contract assertion helper.

Good:

- scenario: POST /messages happy path;
- response assertions: status 200 and documented response shape;
- assertion helper decision: use helper only if response assertion is non-trivial.

Helpers, builders, clients, fixtures, Page Objects, Component Objects, and metadata helpers belong in implementation briefs as decisions, not in coverage backlog as scenarios.

---

### 13. Plan Scenario Variants

When a behavior has multiple data variants, decide whether variants should be:

- separate scenarios;
- parameterized cases inside one scenario;
- dataset-driven cases;
- postponed;
- not automated.

Use separate scenarios only when each variant verifies a distinct risk or behavior.

Use parameterized cases or datasets when variants verify the same behavior with different inputs.

Do not create one standalone scenario per data value unless each value has unique product risk.

For form or mutation happy paths, keep the **plain successful submit** as its own ready scenario.

Do not fold the only positive coverage into an optional variant.

Optional extras such as:

- file attachment;
- optional checkboxes;
- optional secondary fields;
- non-default advanced options;

must be planned as separate scenarios or clearly secondary variants.

Do **not** write a single ready UI scenario that agents can implement only as "valid submit with optional attachment/extra field" and leave the plain happy path uncovered.

Good separate scenarios:

- invalid email feedback;
- required field feedback;
- successful submit;
- successful submit with optional attachment, when attachment risk is distinct;
- duplicate email feedback.

Good parameterized or dataset cases:

- subject option values;
- sort options;
- filter values;
- supported dropdown values;
- simple validation field permutations.

Bad:

- scenario A: subject customer-service works;
- scenario B: subject webmaster works;
- scenario C: subject payments works.

Good:

- scenario: supported subject options can be selected;
- scenario data: customer-service, webmaster, payments, return, warranty.

For each variant group, specify:

- behavior being verified;
- variant values;
- whether implementation should use local cases, dataset, or builder;
- why variants are separate scenarios or grouped cases.

---

## Output Format

### Feature / Area

- name:
- scope:
- source of truth:
- in scope:
- out of scope:
- Feature Targets:
- Auth Strategy:
- Setup & Cleanup Strategy:
- target env names (from project map):
- API contract source:
- requirements/specs:

### Feature Targets

List only URLs and systems used by the feature.

Simple project (defaults):

- UI/application target: `UI_BASE_URL`
- API target: `API_BASE_URL`

Multi-target project (examples — use names from project map):

- UI/application target(s):
- API/service target(s):
- external/partner target(s):
- setup/cleanup target(s), only when relevant:
- env names per target:
- unclear targets → blocked/postponed items:

Rules:

- plans must name targets explicitly when more than one app or service exists;
- do not invent env names;
- if ownership is unclear, mark blocked/postponed or ask for clarification.

### Auth Strategy

Required in every feature plan, including features with no session.

```md
## Auth Strategy

- required: yes | no
- role: <only if registered in the project map; omit when no session>
- auth as: none | action | precondition
- API mode: <from project map, or none>
- UI mode: <from project map, or none>
- persistence: none | cookies | localStorage | sessionStorage | mixed
- token placement: <header or storage key from project map>
- isolation: <from project map, or none>
- capture / secrets: <path or env name from project map, or none>
```

Rules:

- use only mechanisms and roles registered in the project map;
- do not invent guest, admin, or other role names;
- login/token issuance = `auth as: action`;
- already-signed-in coverage = `auth as: precondition`;
- missing mechanism → blocked, do not invent.

### Setup & Cleanup Strategy

Required when scenarios create, mutate, or depend on persisted/shared state, or when E2E/feature destructive flows are in scope.

For features with only read-only/disposable data, still document the decision explicitly.

```md
## Setup & Cleanup Strategy

- persisted state: yes | no
- parallel safe: yes | no | serial-only (document reason)
- preferred isolation: disposable data | fixture teardown | spec step cleanup | afterEach | none
- setup owner: none | fixture | API helper | beforeEach navigation | setup project | blocked
- cleanup owner: none | fixture teardown | spec step | afterEach | blocked
- entities created: <user, order, cart, etc. or none>
- cleanup target/service: <Feature Target or none>
- idempotent cleanup: yes | no | n/a
- blocked reason / required unblocker: <only when cleanup or isolation is missing>
```

Rules:

- prefer disposable data over cleanup when safe;
- destructive E2E or mutation flows without cleanup/isolation → **blocked**;
- do not defer cleanup ownership to implementation when the plan already knows the flow is stateful;
- `beforeAll` / shared mutable setup requires serial mode and explicit plan justification;
- run-level `globalSetup` is documented separately only when infra needs it — default is none in the clean starter.

### Sensitive Data & Visual Masking

Required when the feature has UI or `@visual` coverage, or when forms/auth/profile data appears on screen.

```md
## Sensitive Data & Visual Masking

- sensitive fields: <password, token, email, phone, etc.>
- generated/unstable fields: <email, id, timestamp, etc.>
- mask in @visual: <fields/locators or "none — default empty state only">
- mask reason: <privacy | baseline stability | both>
- failure artifacts: <avoid post-submit screen | mask targets | trace note for auth flows>
- Page Object mask targets: <visualMaskTargets plan, or postpone visual>
```

Rules:

- secrets must never appear in logs, attachments, or baselines;
- generated emails/ids on filled forms require mask or empty-state visual strategy;
- if safe visual state is impossible, mark visual checkpoint blocked/postponed;
- reference explicit `visualMaskTargets` and `mask:` convention from security rule.

### Coverage Matrix

For each behavior:

- behavior:
- risk:
- recommended level:
- priority: smoke or regression:
- reason:
- duplicate coverage risk:
- notes:

### Smoke / Regression Split

Smoke:

- ...

Regression:

- ...

### API Coverage

Ready to implement now:

- scenarios:
- reason:
- dependencies:
- blockers:
- implementation decisions:

Blocked or postponed:

- scenarios:
- reason:
- blocker or clarification needed:

### API Implementation Brief

For each API scenario:

- endpoint:
- method:
- API service target:
- env name (from project map):
- tags:
- payload source:
- scenario data strategy:
- expected status:
- response assertions:
- schema validation decision:
- negative coverage decision:
- boundary coverage decision:
- builder decision:
- API client decision:
- auth required:
- auth as:
- API mode (from project map):
- assertion helper decision:
- contract gaps/blockers:

### UI Coverage

Ready to implement now:

- scenarios:
- reason:
- dependencies:
- blockers:
- implementation decisions:

Blocked or postponed:

- scenarios:
- reason:
- blocker or clarification needed:

### UI Implementation Brief

For each UI scenario:

- route/page:
- UI/application Feature Target:
- setup/cleanup Feature Target (if needed):
- env names (from project map):
- auth required:
- auth as:
- UI mode (from project map):
- tags:
- preconditions:
- test data:
- scenario data strategy:
- user steps:
- expected visible outcome:
- unique UI risk:
- why API/schema is not sufficient:
- recommended Page Object:
- Page Object actions/readers:
- Component Object decision:
- locator discovery notes:
- assertions in spec:
- not covered in UI:

### Cross-Browser Coverage

Ready to implement now:

- scenarios:
- browser project:
- reason:
- dependencies:
- blockers:

Blocked or postponed:

- scenarios:
- reason:
- blocker or clarification needed:

If not needed:

- reason no extra cross-browser coverage is required:

### Cross-Browser Implementation Brief

For each cross-browser UI scenario:

- route/page:
- browser project:
- tags:
- preconditions:
- user steps:
- expected visible outcome:
- browser-specific risk:
- why default-browser UI is not sufficient:
- related default UI scenario:
- visual checkpoint decision:

### Responsive Coverage

Ready to implement now:

- scenarios:
- viewport:
- reason:
- dependencies:
- blockers:

Blocked or postponed:

- scenarios:
- reason:
- blocker or clarification needed:

If not needed:

- reason no extra responsive coverage is required:

### Responsive Implementation Brief

For each responsive UI scenario:

- route/page:
- viewport:
- tags:
- preconditions:
- user steps:
- expected visible behavior:
- viewport-specific risk:
- why default-viewport UI is not sufficient:
- related default UI scenario:
- visual checkpoint decision:
- pixel assertion decision: functional only unless planned visual coverage

### E2E Note

E2E is **not** part of feature coverage plans.

When a critical full journey may need automation beyond API and UI coverage, use this exact note format:

Potential E2E journey candidate:
- <journey name>

Suggested journey plan path:
- specs/e2e/<area>/<journey>.md

Reason:
- <why lower-level coverage is not enough>

Important:
- do not implement E2E from this feature plan;
- create a separate E2E journey plan first.

Do not include E2E Coverage or E2E Implementation Brief sections in feature plans.

### Visual Checkpoints

Planned now:

- target UI state:
- screenshot scope:
- reason:
- dynamic content risks:
- recommended tags:

Postponed:

- target UI state:
- reason postponed:

### Schema / Contract Checks

Planned now:

- checks:
- reason:
- dependencies:

Postponed:

- checks:
- reason postponed:

### Not Automated / Blockers

List anything not recommended for automation and why.

Examples:

- unstable behavior;
- unclear contract;
- missing auth/setup mechanism;
- missing E2E mailbox, reset-link, reset-token, payment, or cleanup strategy (note as E2E journey plan blocker, not feature plan E2E coverage);
- missing product requirement;
- automation cost higher than value.

### Recommended Next Commands

List the next commands to run manually.

Examples:

- `/implement-api-batch`;
- `/implement-ui-batch`;
- `/plan-e2e-journey` (only when an E2E Note exists);
- `/implement-visual-checkpoint`;
- `/create-builder`.

Do **not** recommend `/implement-e2e-flow` from feature coverage plans. E2E requires a separate journey plan at `specs/e2e/<area>/<journey>.md`.

Recommended commands are output only.

They are not permission to start implementation during planning.

---

## Done Criteria

This skill is complete when:

- each behavior has a recommended primary test level;
- UI tests are justified by distinct user-facing value;
- E2E is **not** included in the feature plan;
- potential E2E journey candidates are noted with path to `specs/e2e/<area>/<journey>.md` when applicable;
- UI scenarios include unique UI risk and why API/schema is not sufficient;
- form/mutation happy paths keep a plain successful submit separate from optional success variants;
- API tests cover contract or backend risks;
- documented API negative/error behavior is planned or blocked/postponed with reason;
- documented boundary behavior is planned or blocked/postponed with reason;
- boundary coverage decision is specified when the contract defines limits, ranges, formats, enums, required fields, or other boundaries;
- visual checkpoints cover visual risks only;
- duplicate coverage is avoided;
- smoke and regression split is clear;
- API coverage ready to implement now is clear, if applicable;
- UI coverage ready to implement now is clear, if applicable;
- blocked and postponed API/UI coverage is clearly explained;
- full forgot-password E2E is noted as a separate journey plan candidate and remains blocked or postponed without mailbox/reset-link access and safe disposable-user or cleanup strategy;
- visual checkpoints are planned or explicitly postponed;
- schema/contract checks are planned or explicitly postponed;
- implementation details are not listed as standalone scenarios;
- scenario variants are grouped or separated intentionally;
- scenario data strategy is specified for non-trivial variants;
- schema validation decision is specified for non-trivial API response shapes;
- negative coverage decision is specified for API behaviors with documented errors;
- API Implementation Brief is actionable, if API coverage exists;
- UI Implementation Brief is actionable, if UI coverage exists;
- blockers and missing contract details are documented;
- cross-browser and responsive decisions are documented, including explicit no-extra-coverage note when applicable;
- cross-browser or responsive items specify browser project or viewport, user value, and expected visible behavior when planned.
- required Feature Targets (UI/application, API/service, external/partner, and setup/cleanup when relevant) are documented, or simple-project defaults are stated;
- Auth Strategy is documented (required, role, auth as, API/UI modes from the project map);
- Setup & Cleanup Strategy is documented when persisted/shared state or destructive flows are in scope, or explicitly marked none/disposable-only;
- Sensitive Data & Visual Masking is documented when UI or @visual coverage applies;
- Change log is present when refreshing an existing plan;
- project map gaps (missing role slug or mechanism) are reported as blockers — not invented in the plan;
- authenticated coverage without a registered auth mode is blocked;
- unclear target ownership is marked blocked/postponed or clarified before implementation.
