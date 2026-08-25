# Skill: Implement UI Feature From Plan

## Goal

Use this skill when a UI feature plan already exists and UI automation must be implemented.

The goal is to implement selected UI coverage from the approved feature plan while keeping architecture consistent, stable, readable, and aligned with the test pyramid.

This skill does not replace the Playwright planner.

The planner creates or validates the feature plan.

This skill implements the selected UI scope from the approved plan.

Do not implement API tests with this skill.

Do not implement visual checkpoints with this skill unless the selected scope explicitly says so.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- UI Feature Implementation Lifecycle;
- Test Strategy and Test Pyramid Rules;
- Test Structure and Tags Rules;
- Fixtures and Test Data Rules;
- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- Cross-Browser and Responsive Testing Rules;
- Test Structure and Tags Rules;
- UI Refactoring Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Configuration and Secrets Rules;
- Multi-Target Environment Rules;
- Authentication Strategy Rules;
- Sorting and Filtering Assertion Strategy;
- Temporary Debug Artifact Cleanup Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## Relationship With Playwright Agents

Use this skill as an implementation workflow for Playwright agents.

Expected agent flow:

- Planner defines the feature plan and selected UI scope;
- Generator implements the selected UI scope using this skill;
- Discover UI Components skill is used when Page Object or Component ownership is unclear;
- Create Test Data Builder skill is used when reusable structured test data is needed;
- Heal UI Test skill is used when implemented UI tests fail;
- Reviewer checks architecture, minimality, test pyramid alignment, and rule compliance.

This skill coordinates UI implementation.

It does not replace specialized skills.

---

## When To Use

Use this skill when:

- a feature test plan exists;
- UI automation must be implemented for planned UI scenarios;
- UI coverage marked as ready to implement now must be added;
- existing Page Objects or Components need minimal updates for planned tests;
- reusable test data may be needed;
- the implementation must follow repository architecture.

---

## When NOT To Use

Do not use this skill when:

- no feature plan exists;
- the task is only to plan coverage;
- the task is only to heal a failing test;
- the task is only to discover UI component ownership;
- the task is only to create a data builder;
- the task is API-only;
- the task is visual-only;
- the task is a broad refactor without feature implementation.

If no feature plan exists, invoke or request planning first.

Do not invent missing requirements.

Use Heal UI Test when an existing UI test is failing.

Use Discover UI Components when Page Object or Component ownership is unclear.

Use Create Test Data Builder when reusable structured data is the only task.

Use Refactor Overengineering when behavior-preserving cleanup is the only task.

---

## Inputs

Use relevant available context:

- feature plan;
- selected UI implementation scope;
- project map;
- existing specs;
- existing Page Objects;
- existing Component Objects;
- existing fixtures;
- existing builders, generators, and datasets;
- relevant rules;
- quality gate command from the project map.

Default feature plan location may be:

- `specs/<feature>/<feature>.md`

Use the project map as the source of truth.

Do not invent paths, aliases, commands, tags, or naming conventions.

---

## Implementation Scope

Implement only the selected UI scope.

Preferred implementation scope is:

- all UI coverage marked as ready to implement now in the feature plan.

Do not implement:

- API coverage;
- visual checkpoints unless explicitly selected;
- blocked or postponed scenarios;
- adjacent page controls;
- adjacent flows;
- adjacent filters, modals, tabs, or navigation paths;
- edge cases not explicitly in scope;
- helper-only scenarios.

If the selected scope is ambiguous, stop and report the ambiguity.

---

## Workflow

### 1. Read And Validate The Feature Plan

Read the feature plan and identify:

- feature scope;
- source of truth;
- in-scope UI behaviors;
- out-of-scope behaviors;
- UI scenarios ready to implement now;
- blocked or postponed UI scenarios;
- expected visible outcomes;
- unique UI risk for each UI scenario;
- why API or schema coverage is not sufficient;
- required tags;
- required test data;
- affected pages;
- affected components;
- expected assertions;
- cross-browser scenarios ready to implement now;
- responsive scenarios ready to implement now;
- explicit note that no extra cross-browser or responsive coverage is needed;
- UI/application Feature Target and env name from project map;
- setup/cleanup Feature Targets only when the plan requires them;
- Auth Strategy (required, role, auth as, UI mode);
- verification command.

Use only the UI/application and optional setup/cleanup Feature Targets listed in the feature plan. Do not fall back to `UI_PRECONDITION_API_BASE_URL` or generic starter env names when the project map defines named targets.

If a required UI/application or setup/cleanup Feature Target is missing from the plan, stop and report:

"Required Feature Target is missing from the feature plan. Update the plan and project map before implementation."

If the scenario needs a signed-in browser and Auth Strategy is missing, or the UI mode is not registered in the project map, stop and report:

"Auth Strategy is missing from the feature plan. Update the plan and project map before implementation."

Do not invent `storageState`, `localStorage` keys, or UI login as hidden setup.

Do not invent env variable names.

Do not derive API host from UI host.

Do not implement scenarios that are unclear.

Do not implement blocked or postponed scenarios.

Do not implement implementation details as scenarios.

If expected behavior is ambiguous, stop and report the ambiguity.

---

### 2. Check Project Map

Before creating or modifying files, check the project map for:

- spec locations;
- Page Object locations;
- Component Object locations;
- fixture entry point;
- data locations;
- assertion helper locations;
- path aliases;
- tags;
- quality gate command.

Do not invent folders, aliases, commands, tags, or naming conventions.

Place new UI specs at `tests/ui/<feature>/<feature>.ui.spec.ts`.

Do not create UI specs at the `tests/ui/` root.

Rule reference:

- `.cursor/rules/spec-feature-placement.rules.mdc`

---

### 2A. Fixture Recommendation Gate

If a new fixture seems useful but was not explicitly requested:

- provide a short fixture recommendation with reuse evidence;
- wait for user confirmation before creating the fixture file;
- continue with minimal inline setup when confirmation is not yet given.

If the user explicitly requests the fixture, implement it directly.

---

### 3. Scope Boundary Check

Before writing UI tests, verify the selected implementation scope against the feature plan and user request.

Implement only UI behavior that belongs to the selected scope.

Do not expand UI tests to adjacent controls, filters, navigation paths, modals, tabs, visual states, API behavior, or edge cases unless they are explicitly in scope.

If related UI behavior is visible on the same page but not part of the selected scope, report it as out of scope or future coverage instead of implementing it.

If scope is ambiguous, stop and report the ambiguity instead of broadening the test suite.

Examples:

- if scope is UI coverage for a Sort dropdown, do not add search, filter, pagination, product details, or visual screenshot coverage unless explicitly listed;
- if scope is Login UI, do not add registration UI coverage except as approved setup or explicitly selected scenario;
- if scope is Brand filter UI, do not add sorting, category, price range, or search coverage unless explicitly listed.

---

### 4. UI Scenario Value Check

Before implementing UI tests, confirm that each selected UI scenario has unique user-facing value.

A UI scenario should verify at least one of:

- visible control or state;
- user action;
- browser interaction;
- navigation;
- visible validation feedback;
- visible success or error feedback;
- frontend integration visible to the user;
- behavior that cannot be reliably proven at API or schema level.

Do not implement UI tests that only duplicate API/schema behavior unless the UI adds visible behavior or interaction risk.

If a planned UI scenario appears to duplicate lower-level coverage without UI value, report it as questionable instead of blindly implementing it.

If a page-level smoke test and a journey test verify the same controls, keep the smoke test only when it adds clear value as a fast availability/default-state check.

Do not expand UI coverage just because related controls or states exist on the page.

---

### 4A. Positive And Negative UI Balance

For form and mutation-oriented features (for example: login, registration, contact form, checkout, profile update), implement both:

- at least one **plain positive** user path proving successful interaction;
- at least one negative user-facing path proving visible validation, conflict, or error feedback.

Plain positive means the core happy path with required fields only.

Do **not** treat an optional-path success as the only positive coverage.

Examples of optional-path positives that do not replace the plain happy path:

- submit with optional file attachment;
- submit with optional checkbox/newsletter;
- submit with optional secondary field filled;
- submit with an advanced or non-default option that is not required for success.

Rules:

- if successful form submit is ready to implement now, implement a plain positive test first;
- keep optional success variants as separate tests when they cover a distinct risk;
- prefer `@smoke` for the plain positive path;
- prefer `@regression` for optional success variants unless the plan explicitly makes the optional path the critical smoke journey;
- if a negative or positive branch is documented as ready to implement now, do not skip it;
- if one branch is blocked, keep the implemented branch and report the blocker explicitly.

Bad incomplete coverage:

- only "submit valid form with attachment" exists;
- no plain "submit valid form" success path.

Good coverage split:

- smoke: submit valid form and see success confirmation;
- regression: submit valid form with optional empty `.txt` attachment and see success confirmation.

---

### 4B. Ready-Scenario Completeness Gate

Before writing or finalizing UI tests, create a direct mapping between:

- each UI scenario marked **ready to implement now** in the feature plan;
- the concrete spec test that implements it.

Rules:

- do not skip a ready scenario silently;
- if a ready scenario is not implemented, mark it explicitly as blocked or postponed with reason before completion;
- do not claim UI implementation complete while any ready scenario is unmapped;
- if two ready scenarios are intentionally merged into one test, document both mappings explicitly in the implementation report.

Minimum traceability expectation:

- scenario from plan: ...
- implemented test title: ...
- status: implemented | blocked | postponed

---

### 5. Optional UI Inspection With Playwright MCP

Use Playwright MCP only when repository files, existing specs, existing Page Objects, and the feature plan are not enough to identify stable locators or actual UI behavior.

Good reasons to use Playwright MCP:

- locator ownership is unclear;
- stable locators cannot be identified from code;
- actual page structure is unclear;
- UI behavior after an action is unclear;
- generated locator candidates need validation;
- page route or visible state differs from the plan;
- form labels, test ids, roles, or validation messages are unknown.

Do not use Playwright MCP by default for every UI implementation task.

Do not commit raw generated/codegen output.

If Playwright MCP is used:

- inspect the real UI state;
- identify stable locator candidates;
- convert discovered locators into Page Object or Component Object ownership;
- keep specs scenario-focused;
- avoid raw selector mechanics in specs;
- report why MCP was needed and what was discovered.

---

### 6. Identify Required Test Data

Before writing tests, identify required data.

Check whether existing data sources can be reused:

- datasets;
- builders;
- generators;
- data fixtures;
- setup helpers.

Use Create Test Data Builder skill if reusable structured data is needed.

Do not generate reusable business data inline in specs.

Do not create data fixtures for one-off values.

#### Test Data Ownership Check

Before writing UI tests:

- identify whether the scenario needs structured form data;
- reuse an existing builder, generator, dataset, or local scenario cases when available;
- search other specs and setup helpers for the same payload/form shape before creating a new inline object or local factory;
- extract duplicated `base...Data` blocks or `createValid...` helpers to the data layer instead of copying them into another spec;
- create or update a dedicated test data builder only if reusable structured data is needed;
- do not define reusable `buildData`, `buildFormData`, `buildRegistrationData`, or similar factory functions inside specs;
- do not export form data types from Page Objects or Component Objects.

If a Page Object action method needs typed data, import the type from the test data layer.

The test data layer should own:

- form data types;
- payload types;
- default test data values;
- builders;
- generators;
- datasets.

Page Objects and Component Objects should not own:

- test data types;
- builders;
- generators;
- default values;
- random or unique data creation.

#### Scenario Data Implementation Check

Before writing UI tests, decide how scenario data should be represented.

Use inline values when:

- the value is one-off;
- the value is specific to one assertion;
- the value does not need reuse or uniqueness.

Use local scenario cases when:

- multiple values verify the same UI behavior;
- variants are small and specific to one spec.

Use datasets when:

- static UI scenario cases are reused;
- dropdown, filter, sort, or option values are tested as a group;
- the same case list is useful across specs.

Use builders when:

- structured form data is reused;
- valid defaults and overrides are needed;
- unique or formatted values are required;
- the same data shape is shared with API setup or API tests.

Use generators when:

- unique primitive values are required;
- formatted primitive values are required;
- freshness prevents collisions or backend validation failures.

Do not create one standalone UI test per simple value unless each value has distinct user-facing risk.

Do not create builders for one-off deterministic form data.

Builder defaults must be valid by default.

Invalid or negative data must be explicit through overrides.

---

### 7. Identify Required Page Objects

Identify affected Page Objects.

Page Objects should represent:

- page;
- screen;
- route;
- navigation boundary.

Do not create a new Page Object for a UI block that belongs inside an existing page layout.

Do not add speculative methods for future tests.

#### Locator Declaration Style Check

When creating or updating Page Objects or Component Objects:

- declare locator fields as readonly fields;
- initialize locator fields inside the constructor;
- do not use getter-based locators by default;
- do not mix getter locators and constructor-initialized locator fields in the same file;
- keep locator initialization simple and side-effect free;
- ensure locator property names match the assigned selector or test id;
- use the project-preferred locator declaration style.

Preferred style:

- `readonly emailInput: Locator;`
- `readonly passwordInput: Locator;`
- `readonly submitButton: Locator;`

Constructor initialization:

- `this.emailInput = page.getByTestId("email");`
- `this.passwordInput = page.getByTestId("password");`
- `this.submitButton = page.getByTestId("register-submit");`

Avoid by default:

- `get emailInput(): Locator { return this.page.getByTestId("email"); }`

Getter-based locators are allowed only when:

- the existing Page Object already consistently uses getter style;
- or there is a specific technical reason documented in the implementation report.

#### Page Object Boundary Check

When creating or updating Page Objects:

- keep Page Objects focused on locators, actions, state readers, and structural markers;
- do not put test data types, builders, generators, or default values into Page Objects;
- do not add assertions to Page Objects;
- do not add `test.step` to Page Objects;
- do not make one Page Object own locators from another page, route, or screen;
- use clear method names that describe the actual UI action.

Method names must match behavior.

Examples:

- use `fillRegistrationForm(data)` when the method fills the full registration form;
- use `fillRequiredFields(data)` only when the method fills strictly required fields;
- use `submit()` only when the method clicks the submit action and does not hide extra workflow.

Do not hide in Page Object methods:

- assertions;
- business workflows;
- test data generation;
- cross-page behavior;
- API setup;
- reporting logic.

---

### 8. Decide Whether Components Are Needed

Prefer Page Object first.

Create or update Component Objects only when justified by:

- reuse;
- real UI complexity;
- semantic UI boundary;
- multiple related locators and actions;
- Page Object growth;
- meaningful reduction of duplication.

Do not create components just because UI elements exist.

If ownership is unclear, use Discover UI Components skill before creating or moving components.

Do not expose Component Objects as fixtures by default.

Access components through the owning Page Object.

---

### 9. Preconditions And Setup

Use the lowest reliable setup layer for preconditions.

If a UI scenario requires an existing backend entity, prefer API or approved data setup over repeating a long UI flow.

Examples of setup data:

- existing user;
- existing product;
- existing order;
- existing duplicate entity;
- existing cart.

The UI test should focus on the user-facing behavior under test.

When UI tests need a signed-in session:

- use the UI mode from the plan and project map Auth Strategy;
- `auth as: action` → keep login visible in the spec;
- `auth as: precondition` → use the registered mode (`storageState`, inject, captured session);
- multi-role: apply the plan's `role: <slug>` via map path — typically `test.use({ storageState: "state/<slug>.json" })` on describe, setup project, or auth fixture inject;
- do not set one global `storageState` on the whole UI Playwright project when login or public specs exist;
- do not UI-login in `beforeEach` when login is not the behavior under test;
- do not plant tokens with `page.evaluate` after the app already loaded without a session.

Guide: `docs/auth-strategy.md` (UI wiring A–C).

When UI tests need backend preconditions:

- prefer an approved API setup mechanism when it exists;
- use the setup Feature Target documented in the feature plan and project map;
- do not derive API host from the UI host;
- do not use host rewriting heuristics such as stripping `www` or prefixing the UI host with `api`;
- do not build API URLs manually in specs;
- do not read `process.env` in specs;
- do not validate full API contracts in UI setup;
- verify only that the required precondition was created successfully;
- avoid shared static credentials when fresh test data can be created safely;
- if no approved API setup mechanism exists, use explicit UI setup temporarily or report a setup architecture gap.

Do not repeat a long UI journey as setup unless:

- no approved reliable lower-level setup exists;
- the UI setup is explicitly temporary;
- the setup is required to use the same backend/runtime path as the UI action under test.

Setup code must not:

- validate the full API contract;
- hide the UI action under test;
- introduce API client abstractions unless reuse justifies it;
- make the test depend on unrelated UI journeys;
- use shared static credentials when fresh data is possible.

---

### 10. Implement Tests

Implement tests for the selected UI scope only.

Create or update the spec at `tests/ui/<feature>/<feature>.ui.spec.ts`.

Do not add a flat spec under `tests/ui/`.

Tests must:

- use `test.step` for meaningful user-level phases;
- keep the main action under test explicit;
- use stable Page Object or Component Object methods;
- avoid raw selector mechanics in specs;
- use required tags;
- avoid hidden behavior in hooks or fixtures;
- avoid inline random data;
- remain readable and minimal.

### Readable failure wiring (first UI batch only)

Before the first UI spec in a project, if `src/test/fixtures/reporting.fixture.ts` does not exist:

- run `.cursor/skills/configure-readable-failures/SKILL.md` once;
- then continue with specs below.

Do not re-run on every feature.

- add Allure metadata through `src/test/reporting/allure-metadata.helper.ts` by default for new or updated specs.

Allure metadata placement for UI specs:

- use `beforeEach` for shared suite metadata (feature, suite, owner, layer);
- add story/severity per test close to the scenario.

`beforeEach` may perform only safe navigation and page-loaded checks.

Do not perform the action under test in `beforeEach`.

Do not repeat navigation already done in `beforeEach`.

When multiple tests in the same `describe` open the same page and verify the same loaded marker, prefer moving that shared setup to `beforeEach`.

Do not create one UI test per simple value unless each value has distinct user-facing risk.

Use table-driven tests only when multiple values verify the same UI behavior.

Do not create a full interaction matrix unless the feature plan explicitly requires it.

#### Cross-Browser And Responsive Implementation Check

Implement cross-browser or responsive UI scenarios only when they are marked ready to implement now in the feature plan.

Rules:

- implement only the browser project or viewport defined by the plan and project map;
- do not expand normal UI scenarios into a browser or viewport matrix unless explicitly planned;
- do not duplicate API or schema behavior per browser;
- use functional assertions for responsive behavior unless the selected scope is an approved visual checkpoint;
- do not assert exact pixels for responsive functional coverage;
- use tags only when registered in the project map; do not invent browser or responsive tags;
- keep browser or viewport setup visible in the spec; do not hide it in fixtures in a way that obscures the scenario under test.

Tag guardrail:

- use only tags registered in the project map Tag Registry;
- add `@cross-browser` only for planned cross-browser coverage;
- add `@responsive` only for planned responsive coverage;
- do not use `@firefox`, `@webkit`, `@chromium`, `@mobile`, `@tablet`, or `@desktop` as tags;
- do not invent tags;
- do not use Allure metadata as a substitute for required Playwright layer or execution tags.

If the feature plan states that no extra cross-browser or responsive coverage is needed, do not add browser or viewport variants during implementation.

If cross-browser or responsive scope is ambiguous, stop and report the ambiguity.

#### Cross-Page Navigation Check

When a UI scenario redirects from one page to another:

- assert the URL if relevant;
- use the destination Page Object for visible destination markers;
- do not use raw `page.locator(...)` in specs for destination page elements;
- do not use direct `page.getByTestId(...)`, `page.getByRole(...)`, `page.getByText(...)`, or `page.getByLabel(...)` in specs for destination page elements;
- do not put destination page locators into the source Page Object.

Example:

Registration redirects to Login page.

Correct approach:

- RegisterPage owns registration page locators and actions;
- LoginPage owns login page markers and locators;
- the spec asserts navigation using URL and LoginPage marker.

Avoid:

- asserting Login page elements with raw selectors in the Registration spec;
- adding Login page locators to RegisterPage;
- using RegisterPage to verify Login page state.

---

### 11. Spec Helper And Assertion Logic Check

Before writing UI specs, search existing helpers under:

- `src/test/assertions/**`
- `src/test/reporting/**`
- `src/test/data/**`

Reuse or extend existing helpers before creating new ones or adding local functions to specs.

Rule reference:

- `.cursor/rules/spec-helper-policy.rules.mdc`

Before writing UI specs, keep specs focused on scenario flow.

Specs may contain:

- scenario data cases;
- small deterministic constants;
- `test.step` blocks;
- calls to Page Object or Component actions/readers;
- calls to assertion helpers;
- direct scenario assertions.

Specs must not define local helper functions by default.

Specs must not accumulate reusable technical helper logic.

Move reusable or non-trivial logic to dedicated helpers when it includes:

- sorting or comparison algorithms;
- normalization logic;
- parsing logic used by assertions;
- repeated predicate checks;
- field-specific assertion branching;
- reusable validation of arrays, tables, lists, cards, or API-like structures;
- UI stability polling or signature waits;
- Allure suite path builders;
- matrix/table-driven scenario orchestration such as `run*Scenario`.

Preferred destinations:

- assertion helpers for reusable or non-trivial assertions;
- UI stability helpers under `src/test/assertions/ui/**`;
- reporting helpers under `src/test/reporting/**`;
- test data datasets for reusable scenario cases;
- generators for unique primitive values;
- builders for reusable structured data.

For table-driven UI tests, keep `test.step`, actions, and verification inside each `test(...)` body.

Do not create helper files for one-line one-off logic.

Do not hide the user action under test inside helpers.

Scenario data may stay in the spec when it is local to that spec and improves readability.

---

## Assertion Policy

Dedicated assertion helpers may be used for reusable or non-trivial assertions.

Page Objects and Component Objects must not use Playwright `expect`.

Page Objects and Component Objects may expose:

- locators;
- actions;
- state readers;
- parsed values;
- structural markers.

Allowed Page Object or Component Object methods:

- `open()`;
- `submit()`;
- `fillRegistrationForm(data)`;
- `getVisibleItems()`;
- `getValidationMessageText()`;
- `isLoaded()`;
- `waitForReady()`.

Not allowed in Page Objects or Component Objects:

- `expect`;
- `test.step`;
- `toHaveScreenshot`;
- Allure;
- `process.env`;
- inline random data;
- business assertions;
- screenshot assertions.

Business assertions must not be hidden inside Page Objects or Component Objects.

Do not use methods that combine action and verification.

Avoid method patterns such as:

- `sortAndVerify`;
- `loginAndExpectSuccess`;
- `submitAndValidate`;

---

## Sorting And Filtering Console Diagnostics

When implementing or updating sorting or filtering UI coverage, follow Sorting and Filtering Assertion Strategy.

Required:

- invariant-based sort or filter assertions live in assertion helpers, not specs;
- successful verification emits a concise console summary through the shared sort/filter console helper;
- console output includes operation kind, label, item count, and checked sequence or sample;
- specs do not add ad-hoc `console.log` for sort/filter proof.

Implementation checklist:

1. extract comparable values through Page Object or Component state readers;
2. assert monotonic order or filter predicate in a reusable assertion helper;
3. call `logSortFilterVerification(...)` only after the invariant assertion passes;
4. keep failure details in Playwright `expect` messages, not console output.

Review must fail when sort/filter tests pass silently without console diagnostics from the assertion helper layer.
- `createAndCheck`.

Keep action and verification explicit in the spec.

Scenario-specific assertions belong in specs.

---

## Fixture Usage

Use the final fixture entry point defined by the project map.

Default example:

- `src/test/fixtures/test`

Do not import `@playwright/test` directly in UI specs that require project fixtures.

Do not import intermediate fixture files directly unless explicitly allowed by the project map.

Fixture layering reference:

- `base.fixture.ts` provides Playwright base test and `expect`;
- `data.fixture.ts` provides reusable test data fixtures;
- `pages.fixture.ts` provides Page Object fixtures;
- `test.ts` is the final fixture entry point for specs.

This structure is a guideline.

Follow the project map.

---

## Component Composition

Prefer Page Object composition over God Page Objects.

Rules:

- Page Objects represent routes, pages, screens, or navigation boundaries;
- Page Objects compose Component Objects;
- Component Objects own meaningful UI block behavior;
- Component Objects are normally accessed through Page Objects;
- Component Objects are not exposed through fixtures by default.

Good usage pattern:

- `pageObject.sorting.apply("price,asc")`
- `pageObject.resultList.getVisibleItems()`

These names are illustrative.

Follow existing project naming.

---

## Verification

After changes:

1. run impacted spec or specs;
2. run related specs if shared Page Objects, Components, fixtures, builders, generators, datasets, or assertion helpers were changed;
3. run the repository quality gate command defined by the project map.

4. remove temporary discovery/debug artifacts created during the task.

Rule reference:

- `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`

Default examples:

- impacted UI spec command may use `npx playwright test <spec-path>`;
- quality gate may be `npm run qa:gate`.

Use the project map as the source of truth.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## Healing

If implemented tests fail, do not patch blindly.

Use Heal UI Test skill.

Do not:

- add `waitForTimeout`;
- add fake assertions;
- blindly increase timeouts;
- weaken assertions;
- change expected behavior without requirement confirmation;
- move action under test into hooks or fixtures.

Fix root cause at the correct layer.

---

## Hardening

After implementation, harden only reusable learnings.

Consider hardening when the work reveals:

- missing rule;
- missing skill;
- repeated data pattern;
- repeated locator issue;
- unclear component ownership;
- fixture boundary problem;
- diagnostics gap.

Do not add rules or abstractions for one-off cases.

---

## Guardrails

Do not:

- implement without reading the feature plan;
- implement blocked or postponed scenarios;
- implement unrelated UI behavior;
- implement API tests;
- implement visual checkpoints unless explicitly selected;
- expand UI coverage into cross-browser or responsive matrices unless explicitly selected in the feature plan;
- modify unrelated files;
- create speculative abstractions;
- create components just in case;
- create fixtures for one-off values;
- create builders for one-off deterministic data;
- use `waitForTimeout`;
- use fake assertions;
- hide action under test in hooks;
- hide action under test in fixtures;
- bypass the final fixture entry point;
- import intermediate fixture layers from specs;
- put project-specific logic into framework core;
- change expected behavior unless the requirement is wrong;
- use unregistered Playwright tags;
- use browser or device names as Playwright tags;
- use Allure metadata instead of required Playwright layer or execution tags.

---

## Output Format

When reporting implementation, use this structure:

### 1. UI Scope

- feature:
- scenarios implemented:
- scenarios blocked/postponed:
- out-of-scope items:

### 2. Data

- reused data:
- local constants:
- local scenario cases:
- datasets:
- builders updated:
- generators updated:
- fixture changes:

### 3. UI Structure

- Page Objects updated:
- Components updated:
- Components created:
- ownership decisions:

### 4. Tests

- specs added or updated:
- tags used:
- hooks used:
- browser project or viewport used, if applicable:
- unique UI value covered:
- API/schema behavior intentionally not duplicated:

### 5. Verification

- impacted specs run:
- related specs run:
- quality gate:
- not run reason, if any:

### 6. Hardening

- needed: yes or no;
- action taken or postponed;
- reason:

---

## Done Criteria

This skill is complete when:

- feature plan was read;
- selected UI scope was validated;
- project map was followed;
- scope did not expand to adjacent behavior;
- form/mutation-style UI scenarios include both plain positive and negative user-facing coverage when both are planned as ready;
- optional success variants do not replace the plain happy path as the only positive coverage;
- each implemented UI scenario has distinct user-facing value;
- UI tests do not duplicate API/schema behavior without UI-specific risk;
- required data was identified before tests;
- Page Objects were updated minimally;
- Component Objects were created only when justified;
- tests use meaningful `test.step`;
- hooks do not hide the action under test;
- scenario-specific assertions remain explicit in specs;
- reusable technical helper logic is not accumulated in specs;
- fixtures are used through the final fixture entry point;
- no speculative abstractions were added;
- browser or viewport coverage was implemented only when planned in the feature plan;
- no unplanned browser matrix was introduced;
- no unplanned responsive viewport matrix was introduced;
- responsive checks assert visible user-facing behavior, not pixel-perfect layout unless visual coverage was planned;
- impacted specs were run or documented as not run;
- quality gate was run or documented as not run;
- every UI scenario marked ready to implement now is mapped to an implemented test or explicitly marked blocked/postponed with reason;
- temporary debug scripts and discovery dumps were removed or explicitly preserved by user request.

---

## Main Principle

Planner creates the plan.

This skill implements the selected UI scope from the plan.

UI tests prove distinct user-facing browser behavior.

API and schema tests own backend contract and data predicates.

Data comes before tests.

Page Objects own page boundaries.

Components are extracted only when justified.

Specs show the scenario.

Verification proves the implementation.

Healing fixes root causes.

Hardening captures reusable learning only when needed.