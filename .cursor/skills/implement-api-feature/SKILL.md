# Skill: Plan Test Coverage

## Goal

Use this skill when planning test coverage and produce a complete feature coverage plan that is directly actionable for implementation agents.Use this skill when planning test coverage for a feature, endpoint, page, or user flow.

The plan must describe the full coverage picture, not only the first small batch.

Do not implement tests during this skill.

---

## Related Rules

Follow these rules:

- Test Strategy and Test Pyramid Rules;
- API Architecture Rules;
- Visual Testing Rules;
- Project Map Rules;
- Agent Workflow;
- Examples Policy.

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

Each behavior should describe something meaningful that the product or system must do.

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

The risk classification should explain why the behavior needs automated coverage.

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

UI coverage is justified only when the risk is user-facing, browser-visible, or frontend-integration specific.

API coverage is preferred for backend contract, validation, data, and status behavior when UI behavior is not the main risk.

---

### 4. Avoid Duplicate Coverage

Check whether the behavior is already covered or better covered at another layer.

Avoid UI tests for backend behavior already covered by API tests unless the UI adds a distinct user-facing risk.

Avoid duplicating the same risk across:

- API;
- UI;
- schema/contract;
- visual checkpoints.

Good layered coverage example:

- API test verifies validation contract;
- UI test verifies visible validation feedback;
- visual checkpoint verifies validation layout.

Bad duplicate coverage example:

- API test verifies required email validation;
- UI test repeats the same backend validation without checking unique UI behavior;
- visual test screenshots the same state without visual value.

---

### 5. Define Smoke vs Regression

Mark each automated scenario as:

- smoke;
- regression.

Smoke should be small, critical, and fast.

Regression may cover broader behavior and edge cases.

Visual checks should default to regression unless the feature plan explicitly requires a critical visual smoke checkpoint.

Do not put every test into smoke.

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
- planned now or postponed;
- dynamic content risks;
- recommended tag: `@visual` with `@regression` by default.

If baseline approval is not requested, visual checkpoints should normally be marked as postponed.

---

### 7. Recommend Implementation Scope

Recommend implementation scope by level.

The plan should provide the full coverage picture, but implementation must still be executed later through separate implementation commands.

Group coverage by:

- API coverage;
- UI coverage;
- visual checkpoints;
- schema/contract checks;
- not automated or blocked items.

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

---

### 8. Create Implementation Briefs

Create implementation briefs that are actionable for implementation agents.

The plan must not leave API or UI details for implementation agents to invent.

API Implementation Brief should include:

- endpoint and method per scenario;
- payload source or builder need;
- scenario data strategy;
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
- scenario data strategy;
- expected visible outcome;
- recommended Page Object;
- likely Page Object actions or readers;
- Component Object decision;
- locator discovery notes if available;
- assertions in spec;
- what API/schema owns instead of UI.

Implementation briefs should describe how to implement the coverage safely, but they must not implement the code.

---

### Scope Boundary Check

Before writing API tests, verify the selected implementation scope against the feature plan and user request.

Implement only API coverage that belongs to the selected scope.

Do not expand API tests to adjacent endpoint capabilities, query parameters, filters, states, or negative cases unless they are explicitly in scope.

If the selected scope is derived from UI behavior, map only the specified UI behavior/options/states to API requests.

Do not guess undocumented API parameters or values.

If a related API behavior is useful but outside the selected scope, report it as out of scope or future coverage instead of implementing it.

---

### 9. Validate Scenarios vs Implementation Decisions

Before finalizing the plan, verify that planned scenarios represent real coverage items.

A scenario must represent one of:

- user behavior;
- API behavior;
- contract behavior;
- visual state;
- error or validation behavior;
- integration risk;
- not automated risk.

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

### 10. Plan Scenario Variants

When a behavior has multiple data variants, decide whether variants should be:

- separate scenarios;
- parameterized cases inside one scenario;
- dataset-driven cases;
- postponed;
- not automated.

Use separate scenarios only when each variant verifies a distinct risk or behavior.

Use parameterized cases or datasets when variants verify the same behavior with different inputs.

Do not create one standalone scenario per data value unless each value has unique product risk.

Good separate scenarios:

- invalid email feedback;
- required field feedback;
- successful submit;
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
- tags:
- payload source:
- scenario data strategy:
- expected status:
- response assertions:
- builder decision:
- API client decision:
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
- tags:
- preconditions:
- test data:
- scenario data strategy:
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
- missing product requirement;
- automation cost higher than value.

### Recommended Next Commands

List the next commands to run manually.

Examples:

- `/implement-api-batch`;
- `/implement-ui-batch`;
- `/implement-visual-checkpoint`;
- `/create-builder`.

Recommended commands are output only.

They are not permission to start implementation during planning.

---

## Done Criteria

This skill is complete when:

- each behavior has a recommended primary test level;
- UI tests are justified by user-facing value;
- API tests cover contract or backend risks;
- visual checkpoints cover visual risks only;
- duplicate coverage is avoided;
- smoke and regression split is clear;
- API coverage ready to implement now is clear, if applicable;
- UI coverage ready to implement now is clear, if applicable;
- blocked and postponed API/UI coverage is clearly explained;
- visual checkpoints are planned or explicitly postponed;
- schema/contract checks are planned or explicitly postponed;
- implementation details are not listed as standalone scenarios;
- scenario variants are grouped or separated intentionally;
- scenario data strategy is specified for non-trivial variants;
- API Implementation Brief is actionable, if API coverage exists;
- UI Implementation Brief is actionable, if UI coverage exists;
- blockers and missing contract details are documented.

The goal is to choose the right test level for each behavior before implementation.

Do not implement tests during this skill.

