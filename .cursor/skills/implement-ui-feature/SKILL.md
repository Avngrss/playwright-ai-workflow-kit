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

---

### 5. Identify Required Page Objects

Identify affected Page Objects.

Update Page Objects minimally.

Page Objects should represent:

- page;
- screen;
- route;
- navigation boundary.

Do not create a new Page Object for a UI block that belongs inside an existing page layout.

Do not add speculative methods for future tests.

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

## Assertion Policy

Scenario-specific assertions belong in specs.

Small structural readiness assertions may live in Page Objects or Component Objects when they represent stable UI readiness.

Allowed structural examples:

- `expectLoaded`;
- `expectVisible`;
- `expectReady`;
- `expectHidden`;
- `expectNoActiveFilters`.

Business assertions must not be hidden inside Page Objects or Component Objects.

Do not use methods that combine action and verification.

Avoid method patterns such as:

- `sortAndVerify`;
- `loginAndExpectSuccess`;
- `submitAndValidate`;
- `createAndCheck`.

Keep action and verification explicit in the spec.

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