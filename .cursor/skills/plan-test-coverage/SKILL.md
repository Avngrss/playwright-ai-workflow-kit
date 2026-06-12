# Skill: Plan Test Coverage# Skill## Goal

Use this skill when planning test coverage for a feature, endpoint, page, or user flow.

The goal is to choose the right test level before implementation and produce a plan that is directly actionable for implementation agents.

Do not implement tests during this skill.

---

## Related Rules

Follow these rules:

- Test Strategy and Test Pyramid Rules
- API Architecture Rules
- Visual Testing Rules
- Project Map Rules
- Agent Workflow
- Examples Policy

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- creating a new feature test plan;
- deciding whether behavior should be covered by UI, API, visual, schema, or not automated;
- reviewing too many proposed UI tests;
- splitting smoke and regression coverage;
- avoiding duplicate coverage across layers;
- creating API and UI implementation briefs before coding.

---

## When NOT To Use

Do not use this skill when:

- the task is a small locator fix;
- test level is already clear;
- a failing test needs healing;
- implementation has already been approved and scoped;
- the task is only to implement tests from an existing plan.

---

## Workflow

### 1. Identify Behaviors

List the behaviors or requirements to cover.

Do not start from test cases.

Start from:

- user-facing risks;
- backend/API risks;
- validation rules;
- integration points;
- visual risks;
- error handling;
- contract/schema risks.

---

### 2. Classify Risk

For each behavior, classify the main risk:

- backend contract;
- frontend interaction;
- user journey;
- validation;
- authorization;
- visual layout;
- data transformation;
- integration;
- configuration;
- error handling.

---

### 3. Choose Test Level

For each behavior, choose one primary test level:

- static/typecheck;
- API;
- UI;
- visual checkpoint;
- schema/contract;
- not automated.

Use the lowest reliable level that proves the behavior.

Do not default everything to UI.

---

### 4. Avoid Duplicate Coverage

Check whether the behavior is already covered or better covered at another layer.

Avoid UI tests for backend behavior already covered by API tests unless the UI adds a distinct user-facing risk.

Avoid duplicating the same risk across:

- API;
- UI;
- schema/contract;
- visual checkpoints.

---

### 5. Define Smoke vs Regression

Mark each automated scenario as:

- smoke;
- regression.

Smoke should be small, critical, and fast.

Regression may cover broader behavior and edge cases.

Visual checks should default to regression unless the feature plan explicitly requires a critical visual smoke checkpoint.

---

### 6. Decide Visual Checkpoints

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
- priority: first batch or postponed;
- dynamic content risks;
- recommended tag: `@visual` with `@regression` by default.

---

### 7. Recommend First Implementation Batches

Recommend first implementation batches.

The batches should be:

- small;
- high value;
- independently verifiable;
- not overloaded with every edge case.

Separate implementation batches by level:

- first API batch;
- first UI batch;
- visual checkpoints, if any;
- schema/contract checks, if separate.

Do not ask one implementation agent to implement API and UI in the same run.

---

### 8. Create Implementation Briefs

Create implementation briefs that are actionable for implementation agents.

The plan must not leave API or UI details for implementation agents to invent.

API Implementation Brief should include:

- endpoint and method per scenario;
- payload source or builder need;
- expected status;
- response assertions;
- API client decision;
- assertion helper decision;
- contract gaps or blockers.

UI Implementation Brief should include:

- route or page;
- scenario steps;
- tags;
- preconditions and test data;
- expected visible outcome;
- recommended Page Object;
- likely Page Object actions or readers;
- Component Object decision;
- locator discovery notes if available;
- assertions in spec;
- what API/schema owns instead of UI.

---

## Output Format

### Feature / Area

- name:
- scope:
- UI target:
- API contract source:
- requirements/specs:

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

### First API Batch

- scenarios:
- reason:
- dependencies:
- blockers:

### API Implementation Brief

For each API scenario:

- endpoint:
- method:
- tags:
- payload source:
- expected status:
- response assertions:
- builder decision:
- API client decision:
- assertion helper decision:
- contract gaps/blockers:

### First UI Batch

- scenarios:
- reason:
- dependencies:
- blockers:

### UI Implementation Brief

For each UI scenario:

- route/page:
- tags:
- preconditions:
- test data:
- user steps:
- expected visible outcome:
- recommended Page Object:
- Page Object actions/readers:
- Component Object decision:
- locator discovery notes:
- assertions in spec:
- not covered in UI:

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

### Not Automated

List anything not recommended for automation and why.

### Recommended Implementation Order

1. ...
2. ...
3. ...

---

## Done Criteria

This skill is complete when:

- each behavior has a recommended primary test level;
- UI tests are justified by user-facing value;
- API tests cover contract or backend risks;
- visual checkpoints cover visual risks only;
- duplicate coverage is avoided;
- smoke and regression split is clear;
- first API batch is clear, if applicable;
- first UI batch is clear, if applicable;
- visual checkpoints are planned or explicitly postponed;
- API Implementation Brief is actionable, if API coverage exists;
- UI Implementation Brief is actionable, if UI coverage exists;
- blockers and missing contract details are documented.

The goal is to choose the right test level for each behavior before implementation.

Do not implement tests during this skill.

