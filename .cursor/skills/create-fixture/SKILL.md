# Skill: Create Fixture

## Goal

Use this skill when a new Playwright fixture is needed for reusable dependency wiring, setup, Page Objects, test data, API clients, or infrastructure.

The goal is to add fixtures only when they are justified, thin, correctly layered, and do not hide the action under test.

---

## Related Rules

Follow these rules:

- Fixtures and Test Data Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Agent Workflow;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Examples Policy.

---

## When To Use

Use this skill when:

- object creation is repeated across tests;
- dependency wiring is reused;
- Page Object fixtures are needed;
- data fixtures are reused across specs;
- API client fixture is reused;
- auth provider fixture is reused;
- setup and teardown need fixture lifecycle;
- fixture composition needs extension.

---

## When NOT To Use

Do not create a fixture for:

- one-off values;
- a single local constant;
- the action under test;
- business flow execution;
- hiding complex scenario setup;
- speculative future reuse;
- every Component Object by default.

---

## Workflow

### 1. Identify Fixture Purpose

Classify fixture type:

- infrastructure;
- config;
- logger;
- API transport;
- auth provider;
- Page Object;
- data builder;
- generated data;
- project setup.

Clarify what the fixture provides.

---

### 2. Check Project Map

Find:

- fixture folder;
- fixture layering chain;
- final fixture entry point;
- naming convention;
- import aliases.

Do not invent fixture paths.

---

### 3. Choose Correct Layer

Use existing fixture layers.

Common chain:

- base fixture;
- data fixture;
- pages fixture;
- final test entry point.

Follow project map.

Core fixtures must be infrastructure-focused.

Project fixtures may expose Page Objects, project data, and project clients.

---

### 4. Check Reuse

Create fixture only when reuse is meaningful.

Ask:

- is this used across multiple tests or specs?
- does it reduce repeated wiring?
- does it improve consistency?
- does it avoid fixture bloat?
- does it keep scenario explicit?

If answer is unclear, do not create fixture.

---

### 5. Ensure Fixture Is Thin

Fixture may:

- create object;
- wire dependencies;
- prepare safe setup;
- provide teardown.

Fixture must not:

- hide action under test;
- perform business flow by default;
- perform assertions;
- generate one-off values;
- silently change app state;
- become orchestration layer.

---

### 6. Expose Through Final Entry Point

Specs must use the final fixture entry point.

Do not import intermediate fixture layers directly from specs unless project map explicitly allows it.

---

## Component Fixture Policy

Do not expose Component Objects as fixtures by default.

Prefer access through owning Page Object.

Component fixture is allowed only when:

- direct access is needed across multiple suites;
- Page Object composition is less clear;
- ownership remains obvious;
- fixture does not create fixture explosion.

---

## Output Format

### Fixture Purpose

- name:
- type:
- reason:

### Layer

- fixture file:
- extends from:
- final entry point:

### Reuse Justification

- reused by:
- why fixture is needed:

### Guardrails Check

- hides action under test: yes or no:
- business flow inside fixture: yes or no:
- one-off value: yes or no:

### Verification

- impacted specs:
- quality gate:

---

## Done Criteria

This skill is complete when:

- fixture purpose is clear;
- fixture belongs to correct layer;
- fixture is thin;
- reuse is justified;
- final fixture entry point is preserved;
- no action under test is hidden;
- impacted specs are run or documented as not run.

---

## Main Principle

Fixtures wire dependencies.

Fixtures do not hide scenarios.