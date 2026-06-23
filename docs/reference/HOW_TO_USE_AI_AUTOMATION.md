# How To Use AI Automation System

## Purpose

This quality gate should be run.This file explains how to use the project AI automation system in daily work.

Main file:

- `.cursor/rules/00-project-map.mdc`

Before creating files or folders, check the Project Map first.

Project Map decides structure and commands.

Rules and skills must not override project-specific structure from Project Map.

---

## 1. Project Map

Project Map is the source of truth.

Use it to understand:

- where files should be created;
- which fixture entry point to use;
- where Page Objects and Components live;
- where API schemas live;
- where assertion helpers live;
- where test data builders, generators, and datasets live;
- which aliases are allowed;
- which commands should be executed;
- which tags are allowed;
- which environment variables belong to which layer;

---

## 2. Rules

Rules are always-on guardrails.

They define what is allowed and what is forbidden.

Examples:

- do not use `waitForTimeout`;
- do not use fake assertions;
- do not put project-specific logic into framework core;
- do not create fixtures for one-off values;
- do not use Playwright `expect` inside Page Objects or Components;
- do not put schema assertions inside API clients;
- do not generate inline random data in specs;
- do not hide action under test in hooks or fixtures;
- do not create speculative abstractions.

You do not manually run rules.

Cursor/AI agents use rules as background constraints.

---

## 3. Skills

Skills are task-specific workflows.

Use a skill when the task matches the skill purpose.

Examples:

- new feature coverage planning -> `Plan Test Coverage`;
- API implementation -> `Implement API Feature From Plan`;
- UI implementation -> `Implement UI Feature From Plan`;
- failing API test -> `Heal API Test`;
- failing UI test -> `Heal UI Test`;
- reusable test data -> `Create Test Data Builder`;
- unclear component ownership -> `Discover UI Components`;
- new fixture -> `Create Fixture`;
- code quality review -> `Review Generated Code Quality`;
- framework review -> `Review Framework Change`;
- after changes -> `Run Verification`.

Do not use all skills for every task.

Use the smallest skill that matches the current problem.

---

## 4. Commands

Commands are reusable task launchers.

Examples:

- `/plan-feature`;
- `/implement-api-batch`;
- `/implement-ui-batch`;
- `/review-generated`;
- `/refactor-overengineering`;
- `/heal-api-test`;
- `/heal-ui-test`;
- `/update-project-map`.

Commands should stay short.

Commands should not duplicate all rules or full skill logic.

Skills contain task methodology.

Rules contain permanent constraints.

Project Map contains project-specific structure and commands.

---

## 5. Scripts

### Update Project Map

Run this after changing repository structure, rules, skills, folders, commands, or important files.

Command:

- `npm run project-map:update`

What it does:

- updates repository tree inside `.cursor/rules/00-project-map.mdc`;
- updates only the generated section if the project map script is configured that way;
- does not make architecture decisions.

Do not manually add broad repository tree sync noise to focused feature/refactor commits unless explicitly requested.

---

### Check Conventions

Run this after changing UI specs, Page Objects, Components, fixtures, or framework conventions.

Command:

- `npm run conventions:check`

What it checks may include:

- UI specs use `test.step`;
- UI specs do not use `waitForTimeout`;
- UI specs use the final fixture entry point;
- UI specs do not instantiate Page Objects directly;
- UI specs have required layer and execution tags;
- Page Objects and Components do not use `expect`;
- Page Objects and Components do not use `test.step`;
- Page Objects and Components do not read `process.env`;
- Page Objects and Components do not generate random data inline.

Follow Project Map for the exact command behavior.

---

### Quality Gate

Run this before considering work complete.

Command:

- `npm run qa:gate`

At minimum, it runs convention checks.

Depending on project configuration, it may also include:

- typecheck;
- lint;
- project map checks;
- other repository checks.

Follow Project Map for the exact quality gate definition.

---

## 6. Environment Variables

Environment variable ownership matters.

Current convention:

```text
PRACTICE_TESTING_URL = UI application base URL

API_BASE_URL = API project/tests base URL

UI_PRECONDITION_API_BASE_URL = API backend used by UI precondition setup

UI_API_BASE_URL = optional documented fallback for UI precondition API base
```

Important rules:

- API tests use `API_BASE_URL`.
- UI browser tests use the UI base URL.
- UI API precondition setup must use an API backend aligned with the UI runtime backend.
- UI specs must not read environment variables directly.
- UI specs must not derive API host from UI host.
- API host derivation by string replacement is forbidden.
- Config/env access belongs in approved config or fixture layer.

Example:

```text
PRACTICE_TESTING_URL=https://practicesoftwaretesting.com
API_BASE_URL=https://api-holtesting.practicesoftwaretesting.com
UI_PRECONDITION_API_BASE_URL=https://api.practicesoftwaretesting.com
```

This split is intentional.

`API_BASE_URL` and `UI_PRECONDITION_API_BASE_URL` may point to different environments.

---

## 7. Typical Workflow: New Feature

Use this flow for a new feature, endpoint, page, or user flow.

```text
1. Plan Feature Coverage
2. Review the feature plan if the feature is broad, risky, or has API/UI overlap
3. Create or validate Test Data Builder, if needed
4. Implement selected API coverage marked ready to implement now, if present
5. Implement selected UI coverage marked ready to implement now, if present
6. Add visual checkpoints later, if planned and explicitly selected
7. Review Generated Code Quality
8. Refactor / Heal / Harden only if needed
```

Practical notes:

- Planning comes before implementation.
- Do not implement API and UI in one agent run.
- Use `ready to implement now / blocked-postponed`.
- Do not use `first batch / later batch`.
- Do not create builders, clients, fixtures, schemas, components, or helpers speculatively.
- API should own backend contract, schema, negative, boundary, auth, filtering, sorting, and data predicate risks.
- UI should own distinct user-facing browser behavior.
- Visual checks should own visual layout risk only.

---

## 8. Typical Workflow: Feature Planning

Use when adding or revising coverage for a feature.

Use:

```text
/plan-feature
```

Expected result:

- create or update `specs/<feature>.md`;
- include source of truth;
- include in scope and out of scope;
- include coverage matrix;
- include smoke/regression split;
- include API/UI/visual/schema/not automated decisions;
- include ready to implement now vs blocked/postponed;
- include API Implementation Brief;
- include UI Implementation Brief;
- include recommended next commands.

Use Agent mode when the output must be saved to `specs/<feature>.md`.

Do not use Cursor Plan mode Build for planning-only tasks that must write a plan file.

Planning must not implement tests.

Planning must not create builders, fixtures, Page Objects, API clients, schemas, assertion helpers, or visual checkpoints.

Recommended next commands are informational only.

---

## 9. Typical Workflow: API Implementation

Use when API coverage is selected from an approved feature plan.

Use:

```text
/implement-api-batch
```

Expected scope:

- implement selected API coverage marked ready to implement now;
- do not implement UI tests;
- do not implement visual tests;
- do not implement blocked/postponed scenarios;
- do not expand to adjacent endpoints, query parameters, filters, states, or negative cases unless explicitly in scope.

API implementation should consider:

- positive behavior;
- documented negative behavior;
- documented boundary behavior;
- schema/contract shape;
- response assertions;
- builder/data needs;
- API client necessity;
- assertion helper necessity.

Use Zod for non-trivial, reused, nested, paginated, or contract-critical response shapes.

Use shared Zod assertion helper when using Zod.

Do not create Zod schemas for trivial one-off responses.

Do not put schema validation into API clients.

Do not guess undocumented status codes, response bodies, validation messages, or boundary limits.

If behavior is unclear, mark it blocked/postponed with reason.

---

## 10. Typical Workflow: UI Implementation

Use when UI coverage is selected from an approved feature plan.

Use:

```text
/implement-ui-batch
```

Expected scope:

- implement selected UI coverage marked ready to implement now;
- do not implement API tests;
- do not implement visual screenshots unless explicitly requested;
- do not implement blocked/postponed scenarios;
- do not expand to adjacent controls, flows, filters, states, or pages unless explicitly in scope.

UI implementation should prove:

- user journey;
- browser interaction;
- visible validation feedback;
- visible success or error state;
- navigation;
- frontend/backend integration visible to the user.

UI tests should not duplicate API/schema coverage without distinct visible UI risk.

Page Objects should own:

- locators;
- actions;
- state readers;
- structural markers.

Page Objects and Components must not own:

- assertions;
- test data builders;
- random data generation;
- API setup;
- reporting logic.

---

## 11. Typical Workflow: UI API Preconditions

Use when a UI test needs backend state before the UI action under test.

Preferred approach:

```text
approved API precondition fixture
```

Current registered-user setup example:

```text
registrationApiPreconditionSetup.createRegisteredUser(...)
```

Rules:

- use approved setup fixture only;
- setup must be aligned with UI runtime backend;
- specs must not read env variables;
- specs must not derive API host from UI host;
- setup must verify only required precondition creation;
- setup must not validate full API contract;
- setup must not hide the UI action under test.

If API-created data is not visible to UI, diagnose environment alignment before refactoring tests.

Do not add waits or weaken assertions to mask setup mismatch.

---

## 12. Typical Workflow: Failing API Test

Use this flow:

```text
/heal-api-test
```

or use skill directly:

```text
Heal API Test
```

Steps:

1. Identify failing point.
2. Capture method, endpoint, request payload/query, status, and response body.
3. Compare with contract and test intent.
4. Classify root cause.
5. Fix at the correct layer.
6. Run impacted API spec.
7. Run related specs if shared code changed.
8. Run `npm run qa:gate`.

Root cause examples:

- invalid builder default;
- wrong request payload;
- setup/precondition failure;
- schema too strict or too weak;
- assertion bug;
- product behavior change;
- environment/config mismatch.

Do not fix API failures by:

- weakening assertions;
- silently widening schemas;
- changing expected status without contract evidence;
- removing schema validation to pass;
- adding unrelated coverage.

---

## 13. Typical Workflow: Failing UI Test

Use this flow:

```text
/heal-ui-test
```

or use skill directly:

```text
Heal UI Test
```

Steps:

1. Identify failing step.
2. Inspect stack trace and trace/screenshot/video if available.
3. Classify root cause.
4. Apply minimal fix at the correct layer.
5. Run impacted UI spec.
6. Run `npm run qa:gate`.

Root cause examples:

- locator issue;
- invalid test data;
- setup/precondition issue;
- environment/config mismatch;
- changed UI behavior;
- assertion mismatch.

Do not fix UI failures by:

- adding `waitForTimeout`;
- weakening assertions;
- changing expected behavior without product confirmation;
- hiding actions in hooks or fixtures.

---

## 14. Typical Workflow: Reusable Test Data

Use when reusable structured data is needed.

Use:

```text
Create Test Data Builder
```

Rules:

- builder defaults must be valid by default;
- invalid or negative data must be explicit through overrides;
- use generators for unique primitive values;
- do not generate reusable business data inline in specs;
- do not create builders for one-off deterministic values.

If data must be exposed through fixtures:

```text
Create Fixture
```

Only expose data through fixtures when reuse is justified.

---

## 15. Typical Workflow: New Fixture

Use when reusable dependency wiring or setup is needed.

Use:

```text
Create Fixture
```

Fixture must answer:

- what does it provide?
- which layer owns it?
- is reuse justified?
- does it stay thin?
- does it avoid hiding the action under test?
- does it preserve the final fixture entry point?

Fixtures may:

- create objects;
- wire dependencies;
- provide thin setup;
- provide teardown.

Fixtures must not:

- hide the action under test;
- perform business flow by default;
- perform assertions unrelated to setup success;
- generate one-off values;
- silently change app state.

---

## 16. Typical Workflow: Unclear Component Ownership

Use when it is unclear whether a UI block should stay inside a Page Object or become a Component Object.

Use:

```text
Discover UI Components
```

Possible decisions:

- keep inside Page Object;
- extract Component Object now;
- reuse existing Component Object;
- postpone extraction;
- remove unnecessary abstraction.

If extraction is justified:

```text
Refactor Page Object To Components
```

Then run verification.

---

## 17. Typical Workflow: Overengineered Architecture

Use when tests pass, but code is too complex, duplicated, or noisy.

Use:

```text
/refactor-overengineering
```

or skill directly:

```text
Simplify Overengineered Test Architecture
```

Examples:

- component for one button;
- helper for one trivial line;
- fixture for one-off value;
- domain flow for simple page action;
- API client for one one-off request;
- speculative methods for future tests;
- duplicated Zod safeParse wrapper;
- helper logic inside specs.

Do not change behavior.

Do not add new coverage.

Run impacted specs and quality gate after changes.

---

## 18. Typical Workflow: Review Generated Code

Use after AI generated or modified code.

Use:

```text
/review-generated
```

or skill directly:

```text
Review Generated Code Quality
```

Review should check:

- scope alignment;
- test pyramid;
- UI value;
- API positive/negative/boundary coverage;
- Zod/schema ownership;
- shared Zod helper usage;
- helper logic inside specs;
- fixture/setup boundaries;
- Page Object/Component ownership;
- API client necessity;
- tags;
- reporting ownership;
- verification evidence.

Review is read-only.

Do not modify files during review.

---

## 19. Typical Workflow: Framework Or Project Map Change

Use for framework, fixtures, config, auth, API infrastructure, rules, skills, commands, or project map changes.

Use:

```text
Review Framework Change
```

or:

```text
Update Project Map
```

Use `Update Project Map` when:

- new folder convention is added;
- new alias is added;
- new tag is added;
- new fixture entry point is added;
- new environment convention is added;
- new skill/command/rule is added;
- project structure changed.

Project Map must remain the source of truth.

Keep project map changes scoped to the current change.

Do not include unrelated repository tree sync noise in focused commits unless explicitly requested.

---

## 20. Prompt Usage

Use prompt templates from:

- `AI_AGENT_PROMPT_TEMPLATES.md`

Use workflow reference from:

- `AI_WORKFLOW_MAP.md`

Recommended prompt structure:

1. Choose command or skill.
2. Provide task context.
3. Provide target files or feature plan.
4. Provide scope.
5. Provide stop condition if needed.
6. Ask for verification summary.

Prompts should be short.

Do not repeat all rules in every prompt.

Add `source of truth / in scope / out of scope` only when scope may expand.

For simple targeted tasks, keep the prompt short.

---

## 21. Simple Rule Of Thumb

Use this decision model:

- Need new feature coverage -> `Plan Feature Coverage`.
- Need API implementation from plan -> `Implement API Feature From Plan`.
- Need UI implementation from plan -> `Implement UI Feature From Plan`.
- API test failed -> `Heal API Test`.
- UI test failed -> `Heal UI Test`.
- Need reusable data -> `Create Test Data Builder`.
- Need fixture -> `Create Fixture`.
- Need new page abstraction -> `Create Page Object`.
- Unsure about component -> `Discover UI Components`.
- Page Object too large -> `Refactor Page Object To Components`.
- Architecture too complex -> `Simplify Overengineered Test Architecture`.
- Need API client -> `Create API Client`.
- Need review -> `Review Generated Code Quality`.
- Framework/core changed -> `Review Framework Change`.
- Structure or convention changed -> `Update Project Map`.
- Repeated issue -> `Harden Rules From Failure`.
- Any code change -> `Run Verification`.

---

## 22. Final Principle

Do not use everything at once.

Use the smallest matching skill or command.

Rules always apply.

Project Map decides structure, commands, tags, environment ownership, and fixture entry points.

Feature plan defines selected implementation scope.

API owns backend contract, schema, negative, boundary, auth, filtering, sorting, and data predicate risks.

UI owns distinct user-facing browser behavior.

Scripts enforce basic conventions.

Verification follows every change.

The system consists of:

- Project Map
- Rules
- Skills
- Commands
- Scripts
- Prompt templates
- Workflow map

Use the smallest workflow that matches the current task.

Do not use every skill for every task.

---


