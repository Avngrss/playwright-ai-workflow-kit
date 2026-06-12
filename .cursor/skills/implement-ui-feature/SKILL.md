# Skill: Implement UI Feature From Plan

## Goal

Use this skill when a UI feature plan already exists and UI automation must be implemented.

The goal is to implement UI automation in small, reviewable batches while keeping architecture consistent, stable, and easy to maintain.

This skill does not replace the Playwright planner.

The planner creates or validates the feature plan.

This skill implements the approved plan.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- UI Feature Implementation Lifecycle;
- Test Structure and Tags Rules;
- Fixtures and Test Data Rules;
- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- UI Refactoring Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Configuration and Secrets Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## Relationship With Playwright Agents

Use this skill as an implementation workflow for Playwright agents.

Expected agent flow:

- Planner defines the feature plan and batch scope;
- Generator implements the batch using this skill;
- Discover UI Components skill is used when Page Object or Component ownership is unclear;
- Create Test Data Builder skill is used when reusable test data is needed;
- Heal UI Test skill is used when implemented tests fail;
- Reviewer checks architecture, minimality, and rule compliance.

This skill coordinates implementation.

It does not replace specialized skills.

---

## When To Use

Use this skill when:

- a feature test plan exists;
- UI automation must be implemented for planned scenarios;
- a batch of UI tests needs to be added;
- existing Page Objects or Components need minimal updates for planned tests;
- reusable test data may be needed;
- the implementation must follow repository architecture.

---

## When NOT To Use

Do not use this skill when:

- no feature plan exists;
- the task is only to heal a failing test;
- the task is only to discover UI component ownership;
- the task is only to create a data builder;
- the task is API-only;
- the task is a broad refactor without feature implementation.

If no feature plan exists, invoke or request planning first.

Do not invent missing requirements.

---

## Inputs

Use relevant available context:

- feature plan;
- target scenarios;
- project map;
- existing specs;
- existing Page Objects;
- existing Component Objects;
- existing fixtures;
- existing builders, generators, and datasets;
- relevant rules;
- quality gate command from the project map.

Default feature plan location may be:

- `specs/<feature>.md`

Use the project map as the source of truth.

Do not invent paths.

---

## Batch Scope

Implement in small batches.

Preferred batch size:

- 3 to 5 scenarios.

Use smaller batches when:

- the feature is complex;
- Page Object ownership is unclear;
- test data is not ready;
- UI structure is unstable;
- multiple layers are affected.

Do not implement a large feature in one uncontrolled change.

---

## Workflow

### 1. Read and Validate the Feature Plan

Read the feature plan and identify:

- feature scope;
- selected batch scenarios;
- expected behavior;
- required tags;
- required test data;
- affected pages;
- affected components;
- expected assertions;
- verification command.

Do not implement scenarios that are unclear.

If expected behavior is ambiguous, stop and report the ambiguity.

---

### 2. Select Batch Scope

Select a small implementation batch.

The batch should be:

- coherent;
- reviewable;
- independently verifiable;
- not mixed with unrelated scenarios.

Do not combine unrelated UI areas in one batch.

---

### 3. Check Project Map

Before creating or modifying files, check the project map for:

- spec locations;
- Page Object locations;
- Component Object locations;
- fixture entry point;
- data locations;
- path aliases;
- tags;
- quality gate command.

Do not invent folders, aliases, commands, or naming conventions.

---


### Optional UI Inspection With Playwright MCP### Optional UI Inspection With feature plan are not enough to identify stable locators or actual UI behavior.

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

### 4. Identify Required Test Data

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
- reuse an existing builder, generator, or dataset when available;
- create or update a dedicated test data builder only if reusable structured data is needed;
- do not define reusable buildData, buildFormData, buildRegistrationData, or similar factory functions inside specs;
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

---

### 5. Identify Required Page Objects

Identify.Identify affected Page Objects.

Page Objects should represent:

- page;
- screen;
- route;
- navigation boundary.

Do not create a new Page Object for a UI block that belongs inside an existing page layout.

Do not add speculative methods for future tests.

#### Locator Declaration Style Check

When creating or updatingators as readonly fields;When creating or updating Page Objects or Component Objects:
- initialize locator fields inside the constructor;
- do not use getter-based locators by default;
- do not mix getter locators and constructor-initialized locator fields in the same file;
- keep locator initialization simple and side-effect free;
- ensure locator property names match the assigned selector or test id.

Preferred style:

- readonly emailInput: Locator;
- readonly passwordInput: Locator;
- readonly submitButton: Locator;

Constructor initialization:

- this.emailInput = page.getByTestId("email");
- this.passwordInput = page.getByTestId("password");
- this.submitButton = page.getByTestId("register-submit");

Avoid by default:

- get emailInput(): Locator { return this.page.getByTestId("email"); }

Getter-based locators are allowed only when:

- the existing Page Object already consistently uses getter style;
- or there is a specific technical reason documented in the implementation report.

- use the project-preferred locator declaration style;

#### Page Object Boundary Check

When creating or updating Page Objects:

- keep Page Objects focused on locators, actions, state readers, and structural markers;
- do not put test data types, builders, generators, or default values into Page Objects;
- do not add assertions to Page Objects;
- do not add test.step to Page Objects;
- do not make one Page Object own locators from another page, route, or screen;
- use clear method names that describe the actual UI action.

Method names must match behavior.

Examples:

- use fillRegistrationForm(data) when the method fills the full registration form;
- use fillRequiredFields(data) only when the method fills strictly required fields;
- use submit() only when the method clicks the submit action and does not hide extra workflow.

Do not hide in Page Object methods:

- assertions;
- business workflows;
- test data generation;
- cross-page behavior;
- API setup;
- reporting logic.

---

### 6. Decide Whether Components Are Needed

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

### 7. Implement Tests

Implement tests for the selected batch only.

Tests must:

- use `test.step` for meaningful user-level phases;
- keep the main action under test explicit;
- use stable Page Object or Component Object methods;
- avoid raw selector mechanics in specs;
- use required tags;
- avoid hidden behavior in hooks or fixtures;
- avoid inline random data;
- remain readable and minimal.

`beforeEach` may perform only safe navigation and page-loaded checks.

Do not perform the action under test in `beforeEach`.

Do not repeat navigation already done in `beforeEach`.

---

#### Cross-Page Navigation Check

When a UI scenario redirects from one page to another:

- assert the URL if relevant;
- use the destination Page Object for visible destination markers;
- do not use raw page.locator(...) in specs for destination page elements;
- do not use direct page.getByTestId(...), page.getByRole(...), page.getByText(...), or page.getByLabel(...) in specs for destination page elements;
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

#### Preconditions And Setup

Use the lowest reliable setup layer for preconditions.

If a UI scenario requires an existing backend entity, prefer API or approved data setup over repeating a long UI flow.

Examples of setup data:

- existing user;
- existing product;
- existing order;
- existing duplicate entity;
- existing cart.

The UI test should focus on the user-facing behavior under test.

When UI tests need backend preconditions:

- prefer an approved API setup mechanism when it exists;
- do not derive API host from the UI host;
- do not use host rewriting heuristics such as stripping `www` or prefixing the UI host with `api`;
- do not build API URLs manually in specs;
- do not read `process.env` in specs;
- do not validate full API contracts in UI setup;
- verify only that the required precondition was created successfully;
- avoid shared static credentials when fresh test data can be created safely;
- if no approved API setup mechanism exists, use explicit UI setup temporarily or report a setup architecture gap.

Example:

For duplicate registration email feedback:

- create the existing user through API or approved setup if reliable;
- otherwise create the existing user through the UI flow as an explicit temporary setup;
- open the registration page;
- submit the registration form with the same email;
- assert visible duplicate email feedback.

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

## Assertion Policy## Assertion Policy assertion helpers may be used for reusable or non-trivial assertions.

Page Objects and Component Objects must not use Playwright expect.

Page Objects and Component Objects may expose:

- locators;
- actions;
- state readers;
- parsed values;
- structural markers.

Allowed Page Object or Component Object methods:

- open();
- submit();
- fillRegistrationForm(data);
- getVisibleItems();
- getValidationMessageText();
- isLoaded();
- waitForReady();

Not allowed in Page Objects or Component Objects:

- expect;
- test.step;
- toHaveScreenshot;
- Allure;
- process.env;
- inline random data;
- business assertions;
- screenshot assertions.

Business assertions must not be hidden inside Page Objects or Component Objects.

Do not use methods that combine action and verification.

Avoid method patterns such as:

- sortAndVerify;
- loginAndExpectSuccess;
- submitAndValidate;
- createAndCheck.

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
2. run related specs if shared Page Objects, Components, fixtures, or builders were changed;
3. run the repository quality gate command defined by the project map.

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
- implement too many scenarios in one batch;
- modify unrelated files;
- create speculative abstractions;
- create components just in case;
- create fixtures for one-off values;
- use `waitForTimeout`;
- use fake assertions;
- hide action under test in hooks;
- hide action under test in fixtures;
- bypass the final fixture entry point;
- import intermediate fixture layers from specs;
- put project-specific logic into framework core;
- change expected behavior unless the requirement is wrong.

---

## Output Format

When reporting implementation, use this structure:

### 1. Batch Scope

- feature:
- scenarios implemented:
- scenarios postponed:

### 2. Data

- reused data:
- new or updated builders:
- new or updated generators:
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
- batch scope was selected;
- project map was followed;
- required data was identified before tests;
- Page Objects were updated minimally;
- Component Objects were created only when justified;
- tests use meaningful `test.step`;
- hooks do not hide the action under test;
- scenario-specific assertions remain explicit in specs;
- fixtures are used through the final fixture entry point;
- no speculative abstractions were added;
- impacted specs were run or documented as not run;
- quality gate was run or documented as not run.

---
## Optional UI Discovery

Use Playwright generator/codegen/MCP only when repository files and existing Page Objects are not enough to identify stable locators or actual UI behavior.

Do not treat generated code as final implementation.

Generated code must be converted into the project architecture:
- selectors/actions in Page Objects or Components;
- specs remain scenario-focused;
- no raw selector mechanics in specs;
- required tags and test.step are added;
- no speculative components or fixtures.

Do not run a separate discovery step unless locator ownership or UI behavior is unclear.

---

## Main Principle

Planner creates the plan.

This skill implements the plan.

Data comes before tests.

Page Objects own page boundaries.

Components are extracted only when justified.

Specs show the scenario.

Verification proves the batch.

Healing fixes root causes.

Hardening captures reusable learning only when needed.