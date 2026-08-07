# Skill: Implement E2E Flow From Journey Plan

## Goal

Use this skill when an E2E journey plan already exists and approved E2E automation must be implemented.

The goal is to implement selected E2E coverage from an accepted E2E journey plan at `specs/e2e/<journey>.md` while keeping journeys readable, isolated, stable, and aligned with E2E Testing Rules.

E2E means a full user or business flow crossing multiple states, pages, or system boundaries.

E2E is not a simple UI functional test.

This skill does not create E2E scenarios from scratch.

This skill does not convert short UI tests into E2E.

The E2E journey plan defines the scenario and readiness.

This skill implements the selected E2E scope from the approved journey plan.

Example invocation:

`/implement-e2e-flow specs/e2e/user-onboarding.md`

Do not implement API contract tests with this skill.

Do not implement focused UI functional tests with this skill.

Do not implement visual checkpoints with this skill unless the selected scope explicitly says so.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- E2E Testing Rules;
- Cross-Browser and Responsive Testing Rules;
- Test Strategy and Test Pyramid Rules;
- Test Structure and Tags Rules;
- Fixtures and Test Data Rules;
- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Configuration and Secrets Rules;
- Multi-Target Environment Rules;
- Reporting Allure Rules;
- Temporary Debug Artifact Cleanup Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

Primary rule reference:

- `.cursor/rules/e2e-testing.rules.mdc`

---

## Relationship With Other Skills

Use this skill as an implementation workflow for approved E2E scenarios.

Expected flow:

- E2E journey plan at `specs/e2e/<journey>.md` defines E2E scenarios;
- this skill implements E2E coverage marked ready to implement now from the journey plan;
- Plan Test Coverage skill owns feature coverage plans (API, UI, schema, visual) — not E2E;
- Implement UI Feature skill owns focused UI functional coverage;
- Implement API Feature skill owns API contract and backend behavior coverage;
- Create Test Data Builder skill is used when reusable structured test data is needed;
- Heal UI Test skill may be used when implemented E2E browser tests fail;
- Refactor Overengineering skill is used only for behavior-preserving cleanup after implementation.

This skill coordinates E2E implementation.

It does not replace planning or lower-level implementation skills.

---

## When To Use

Use this skill when:

- `specs/e2e/<journey>.md` exists and includes a ready-to-implement-now scenario;
- setup strategy is clear;
- test data strategy is clear;
- cleanup or isolation strategy is clear;
- final assertion is clear;
- the scenario is truly a full user or business journey;
- existing Page Objects, fixtures, builders, or approved API setup can support the journey;
- the implementation must follow repository architecture.

---

## When NOT To Use

Do not use this skill when:

- no E2E journey plan exists at `specs/e2e/<journey>.md`;
- the task is only to plan feature coverage (use Plan Test Coverage for API/UI/schema/visual);
- the task is only to create an E2E journey plan without implementation;
- the E2E scenario is blocked;
- setup, data, or cleanup strategy is missing or unclear;
- the scenario is a short page, control, or validation UI test;
- the scenario is an API contract test;
- the scenario is a visual-only test;
- mailbox, reset-link, reset-token, payment, or other required external dependency is unavailable or unstable;
- the task is only to heal a failing test without E2E implementation scope;
- the task is only to create a data builder;
- the task is a broad refactor without E2E implementation.

If no E2E journey plan exists, stop with:

"E2E journey plan is required. Create it first with /plan-e2e-journey under specs/e2e/<journey>.md."

Do not invent missing requirements.

Do not upgrade a UI functional test to E2E because the feature exists.

Examples that must remain in feature plans as UI/API coverage, not E2E:

- forgot-password page render;
- empty forgot-password validation feedback;
- valid forgot-password submit confirmation;
- login form invalid-credentials feedback;
- product sort dropdown visibility.

Full forgot-password reset plus login with a new password belongs in a separate E2E journey plan and must remain **blocked** without mailbox/reset-link access and a safe disposable-user or cleanup strategy.

If E2E scope is not yet defined, stop and direct planning to `/plan-e2e-journey`.

Use Implement UI Feature for focused UI functional coverage.

Use Implement API Feature for API contract coverage.

Use Heal UI Test when an existing E2E browser test is failing.

Use Create Test Data Builder when reusable structured data is the only task.

Use Refactor Overengineering when behavior-preserving cleanup is the only task.

---

## Inputs

Use relevant available context:

- E2E journey plan at `specs/e2e/<journey>.md`;
- selected E2E implementation scope;
- project map;
- existing E2E specs, if any;
- existing UI specs for related pages;
- existing Page Objects;
- existing Component Objects;
- existing fixtures;
- approved API precondition mechanisms;
- existing builders, generators, and datasets;
- relevant rules;
- quality gate command from the project map.

Default E2E journey plan location:

- `specs/e2e/<journey>.md`

Do not read E2E scenarios from feature coverage plans at `specs/<feature>.md`.

Use the project map as the source of truth for:

- E2E spec location;
- fixture entry point;
- data locations;
- path aliases;
- tags;
- Playwright project guidance;
- verification commands.

Do not invent paths, aliases, commands, tags, or naming conventions.

---

## Implementation Scope

Implement only the selected E2E scope.

Preferred implementation scope is:

- all E2E coverage marked as ready to implement now in the E2E journey plan at `specs/e2e/<journey>.md`.

Do not implement:

- focused UI functional coverage;
- API contract coverage;
- schema validation coverage;
- visual checkpoints unless explicitly selected;
- blocked E2E scenarios;
- adjacent journeys not explicitly in scope;
- helper-only scenarios.

If the selected scope is ambiguous, stop and report the ambiguity.

If the scenario is not truly E2E, stop and report that it belongs at UI, API, schema, or not automated level instead.

Do not implement blocked scenarios.

---

## Strict Plan Validation

Before implementation, validate the E2E journey plan is deterministic and implementation-ready.

If the E2E plan contains:

- conditional language ("if", "until", "when available", "ready once", "conditionally")
- unclear determinism
- missing **Determinism Guarantees** section
- missing **Final Assertion Marker** section
- vague final assertion wording
- missing cleanup/isolation strategy
- undefined external dependency behavior
- status other than exactly **ready to implement now** or **blocked**
- status is **blocked**

→ treat the journey as **BLOCKED** and STOP implementation.

Do not attempt to interpret, repair, or fix the plan during implementation.

Stop with:

"This E2E journey is blocked: <reason>. Resolve the blocker or create a different E2E journey plan."

---

## Workflow

### 1. Read The E2E Journey Plan

Read `specs/e2e/<journey>.md` and run **Strict Plan Validation** first.

Identify:

- journey scope;
- business value;
- source of truth;
- E2E scenarios ready to implement now;
- blocked E2E scenarios;
- determinism guarantees;
- final assertion marker;
- user journey steps;
- systems or states crossed;
- setup strategy;
- test data strategy;
- cleanup or isolation strategy;
- final assertion;
- why API/UI/schema coverage is not sufficient;
- flakiness risks;
- external dependencies;
- Feature Targets (UI/application, API/service, external, and setup/cleanup when relevant) with env names from project map;
- required tags;
- affected pages or flows;
- verification command.

If the journey plan is missing a required Feature Target, stop and report:

"Required Feature Target is missing from the E2E journey plan. Update the plan and project map before implementation."

Use only Feature Targets listed in the E2E journey plan. Do not fall back to `UI_PRECONDITION_API_BASE_URL`.

Do not guess targets.

Do not invent env variable names.

Do not derive API host from UI host.

Do not read E2E scenarios from feature coverage plans.

Do not implement scenarios that are unclear.

Do not implement blocked scenarios.

If **Strict Plan Validation** fails, stop immediately.

Do not invent missing planning details.

If expected behavior or unblockers are ambiguous, stop and report the ambiguity.

---

### 2. Verify The Scenario Is Truly E2E

Before writing code, confirm the selected scenario crosses meaningful boundaries.

An E2E scenario should normally include:

- setup or precondition;
- one or more UI actions;
- backend or persisted state change, when applicable;
- user-visible final outcome;
- cleanup or isolation strategy.

Reject implementation when the scenario is only:

- page render check;
- field visibility check;
- one-form validation check;
- one-click UI feedback check;
- simple navigation check;
- backend contract check;
- response schema check;
- visual-only check.

If the scenario does not cross meaningful page, state, data, or system boundaries, stop and report that it belongs in UI, API, schema, or not automated coverage.

---

### 3. Verify Ready Status And Required Planning Details

Confirm status is exactly **ready to implement now**.

Confirm all required planning details are present:

- business value;
- user journey;
- systems or states crossed;
- setup strategy;
- test data strategy;
- cleanup or isolation strategy;
- determinism guarantees;
- final assertion marker;
- why API/UI/schema coverage is not sufficient;
- flakiness risks;
- external dependency strategy, if applicable.

If status is not exactly **ready to implement now**, or any required detail is missing, stop and report the blocker.

Do not guess setup, cleanup, mailbox, reset-link, payment, or external dependency behavior.

---

### 4. Check Project Map

Before creating or modifying files, check the project map for:

- E2E spec location;
- E2E rule reference;
- `@e2e` tag convention;
- required `@smoke` or `@regression` tag;
- `@e2e` vs `@ui` layer tag policy;
- fixture entry point;
- approved API precondition mechanisms;
- data locations;
- path aliases;
- Playwright project guidance;
- quality gate command.

Default E2E spec location unless the project map says otherwise:

- `tests/e2e/**/*.e2e.spec.ts`

Use the Playwright E2E project defined in the project map and `playwright.config.ts`.

Do not invent folders, aliases, commands, tags, or naming conventions.

---

### 5. Inspect Existing Abstractions

Check whether existing abstractions can be reused or minimally extended:

- Page Objects;
- Component Objects;
- fixtures;
- builders;
- generators;
- datasets;
- approved API precondition setup;
- assertion helpers.

Prefer reuse over new abstractions.

Do not create duplicate Page Objects, fixtures, builders, or workflow wrappers for the same journey.

Page Objects may expose page actions and state readers.

Page Objects must not hide the entire E2E scenario in a full-flow method.

---

### 6. Validate Setup, Data, And Cleanup Strategy

Before implementing the spec, validate the planned safety model.

Setup rules:

- API or fixture setup may create preconditions only;
- setup must verify only required setup success;
- setup must not replace the UI journey under test;
- setup must not validate full API contracts;
- setup must not hide the main user journey.

Data rules:

- use disposable or isolated data;
- prefer unique emails, users, or entities when needed;
- do not use shared mutable users unless explicitly approved by the plan or project map;
- do not depend on test execution order;
- do not assume existing mutable live data.

Cleanup and isolation rules:

- destructive flows require cleanup or intentional isolation;
- if cleanup is unavailable and isolation is not safe, stop and treat the scenario as blocked;
- external dependencies must be stable; otherwise the scenario must remain blocked;

Examples of destructive flows:

- password reset;
- password change;
- profile update;
- checkout or order creation;
- account deletion;
- payment flow;
- email verification flow.

---

### 7. Implement The E2E Spec

Implement the selected scenario under the project map E2E location unless the map defines another convention.

Tagging:

- use `@e2e`;
- also use `@smoke` or `@regression`;
- do not use `@ui` by default for full-journey E2E specs;
- feature or domain tags may be added when registered in the project map.

Structure:

- keep the full journey visible in the spec;
- use `test.step` for meaningful user-level phases;
- use Page Objects and Component Objects for actions and state readers;
- keep scenario-specific assertions in the spec or dedicated assertion helpers;
- use generic open or wait-for-ready setup in `beforeEach` only when it is safe context setup;
- do not hide journey steps in `beforeEach`, other hooks, fixtures, Page Object full-flow methods, API clients, helpers, or domain workflow wrappers.

API usage inside E2E:

- API calls are allowed for setup or cleanup;
- limited API checks are allowed only when final persisted state verification is explicitly part of the E2E value;
- do not duplicate API schema validation in E2E;
- do not assert detailed response bodies in setup calls.

Assertions:

- final assertions must prove a meaningful journey outcome;
- do not rely only on URL change, click success, request sent, no error, or page did not crash;
- do not weaken assertions to make the test pass;
- do not use fake assertions;
- do not use `waitForTimeout`.

Reporting:

- specs may use the shared Allure metadata helper;
- concrete metadata values belong in specs;
- Page Objects, Components, API clients, builders, and generators must not call Allure.

Do not add visual checkpoints to E2E specs by default.

---

### 8. Minimal Support Changes Only When Justified

Create or update support files only when the selected E2E scope requires them.

Allowed minimal support changes when justified:

- Page Object action or reader needed by the journey;
- builder or generator for reusable isolated data;
- fixture wiring for approved precondition setup;
- cleanup helper when reuse justifies it.

Do not create:

- speculative Page Object full-flow methods;
- domain workflow wrappers that hide the journey;
- fixtures that perform the E2E scenario;
- API clients created only for one setup call unless reuse justifies them;
- builders for one-off deterministic data;
- components for one-off UI fragments.

---

## Data, Setup, And Cleanup Requirements

Every implemented E2E scenario must make these explicit in code and in the implementation report:

- setup strategy;
- test data strategy;
- cleanup or isolation strategy;
- final assertion;
- why lower-level coverage is not sufficient for this journey.

Required practices:

- disposable or isolated data;
- no shared mutable users unless explicitly approved;
- destructive flows require cleanup or safe isolation;
- external dependencies must be stable;
- blocked scenarios must not be implemented speculatively.

If safe data or cleanup cannot be implemented as planned, stop and report the blocker instead of weakening the test.

---

## Verification

After changes:

1. run the impacted E2E spec;
2. run related specs if shared Page Objects, fixtures, builders, generators, datasets, or setup helpers were changed;
3. run the repository quality gate command defined by the project map.

4. remove temporary discovery/debug artifacts created during the task.

Rule reference:

- `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`

Default examples:

- impacted E2E spec command may use `npx playwright test <spec-path>`;
- quality gate may be `npm run qa:gate`.

Use the dedicated E2E Playwright project from `playwright.config.ts` unless project map says otherwise.

Use the project map as the source of truth.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## Healing

If implemented E2E tests fail, do not patch blindly.

Use Heal UI Test skill for browser-side failures when appropriate.

Do not:

- add `waitForTimeout`;
- add fake assertions;
- blindly increase timeouts;
- weaken assertions;
- change expected behavior without requirement confirmation;
- move journey steps into hooks or fixtures;
- hide setup or journey behavior inside Page Object full-flow methods.

Fix root cause at the correct layer.

If the failure reveals missing mailbox, reset-link, cleanup, or external dependency support, stop and report the scenario as blocked instead of masking instability.

---

## Guardrails

Do not:

- implement without reading the E2E journey plan at `specs/e2e/<journey>.md`;
- read E2E scenarios from feature coverage plans;
- create E2E scenarios from scratch during implementation;
- convert short UI tests into E2E;
- implement blocked scenarios;
- interpret or repair non-deterministic journey plans;
- implement unrelated journeys;
- implement API contract tests;
- implement focused UI functional tests;
- implement visual checkpoints unless explicitly selected;
- modify unrelated files;
- create speculative abstractions;
- create fixtures that perform the E2E journey;
- create Page Object full-flow methods that hide the scenario;
- use shared mutable users without explicit approval;
- implement destructive flows without cleanup or isolation;
- implement flows with unstable external dependencies;
- validate full API contracts inside E2E;
- hide journey steps in hooks, fixtures, helpers, or workflow wrappers;
- use `@ui` by default on full-journey E2E specs;
- use `waitForTimeout`;
- use fake assertions;
- bypass the final fixture entry point;
- import intermediate fixture layers from specs;
- put project-specific logic into framework core;
- change expected behavior unless the requirement is wrong.

### Cross-Browser And Responsive Policy

E2E cross-browser and responsive expansion is **not** the default.

- implement E2E on the primary browser project and default viewport unless `specs/e2e/<journey>.md` explicitly plans browser or viewport variants;
- only planned small smoke journeys may be expanded across browsers or viewports;
- if the journey plan does not document cross-browser or responsive expansion, do not add a browser or viewport matrix during implementation.

---

## Output Format

When reporting implementation, use this structure:

### 1. E2E Scope

- E2E journey plan:
- selected E2E scenario:
- ready status confirmed: yes or no;
- truly E2E confirmed: yes or no;

### 2. Strategy

- setup strategy:
- test data strategy:
- cleanup or isolation strategy:
- external dependencies:
- why API/UI/schema coverage is not sufficient:

### 3. Structure

- spec path:
- Page Objects used:
- fixtures or approved setup used:
- support files changed:

### 4. Test

- journey steps visible in spec: yes or no;
- final assertions:
- tags used:
- API setup scope:
- visual checkpoints added: yes or no;

### 5. Verification

- impacted E2E spec run:
- related specs run:
- quality gate:
- not run reason, if any:

### 6. Remaining Risks

- flakiness risks:
- cleanup risks:
- external dependency risks:
- project or config follow-up needed:

### Cleanup

- temporary artifacts removed:
- temporary artifacts preserved:
- unsure artifacts left untouched:

---

## Done Criteria

This skill is complete when:

- E2E journey plan at `specs/e2e/<journey>.md` was read;
- **Strict Plan Validation** passed;
- selected E2E scope was validated as **ready to implement now** only;
- scenario was confirmed as truly E2E;
- setup, data, cleanup, and final assertion strategies were confirmed before implementation;
- project map was followed;
- E2E spec was implemented under the approved location unless the map defines another convention;
- tags include `@e2e` plus `@smoke` or `@regression`;
- `@ui` was not used by default on the full-journey E2E spec;
- journey steps remained visible in the spec;
- API setup was limited to preconditions and did not replace the UI journey;
- full API contract validation was not added to E2E;
- no journey steps were hidden in hooks, fixtures, or Page Object full-flow methods;
- no `waitForTimeout` or weakened assertions were added;
- disposable or isolated data strategy was applied;
- destructive flow cleanup or isolation was implemented or the scenario was blocked instead of guessed;
- no speculative abstractions were added;
- impacted E2E spec was run or documented as not run;
- quality gate was run or documented as not run;
- temporary debug scripts and discovery dumps were removed or explicitly preserved by user request.

---

## Main Principle

E2E journey plan at `specs/e2e/<journey>.md` defines the scenario and readiness.

This skill implements only approved full-journey E2E coverage from the journey plan.

Focused UI, API, schema, and visual coverage remain in feature coverage plans at lower levels.

E2E proves critical user or business journeys with safe setup, isolated data, visible steps, and meaningful final outcomes.

Verification proves the implementation.

Healing fixes root causes without hiding the journey.