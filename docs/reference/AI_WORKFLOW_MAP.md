# AI Workflow Map

## Purpose

This document explains how to use project rules, skills, agents, commands, and the project map in day-to-day AI-assisted Playwright + TypeScript automation work.

```text
Project Map = source of truth for structure, commands, aliases, tags, environment ownership, fixture entry points, and file ownership

Rules = always-on architecture and quality guardrails

Skills = task-specific procedures

Commands = reusable task launchers

Agents = roles that use skills while following rules and the project map

Prompt = the current task ticket
```

### Short Version

- Use **Project Map** to decide where files live and which commands to run.
- Use **Rules** as permanent constraints for all work.
- Use **Skills** when solving a specific task.
- Use **Commands** to start repeatable workflows.
- Use **Agents** as roles: planner, generator, healer, reviewer.
- Keep prompts short.
- Put methodology into skills.
- Put permanent constraints into rules.
- Put project-specific conventions into the project map.

---

## Core Operating Principle

```text
What am I doing?
-> choose the right skill or command

Where should I do it?
-> follow the project map

What must I not violate?
-> rules always apply

What is the selected scope?
-> follow the feature plan or task boundary

What after changes?
-> run verification

What if tests fail?
-> heal root cause

What if the same issue repeats?
-> harden rules, skills, helpers, or project map only when the learning is reusable
```

---

## Rules vs Skills vs Commands

### Rules

Rules answer:

```text
What is allowed?
What is forbidden?
Where are the architecture boundaries?
```

Examples:

- Do not use `waitForTimeout`.
- Do not use fake assertions.
- Do not put project-specific logic into framework core.
- Do not create fixtures for one-off values.
- Do not create Component Objects just in case.
- Do not generate inline random data in specs.
- Do not put Playwright `expect` into Page Objects or Component Objects.
- Do not put schema assertions into API clients.
- Do not hide the action under test in fixtures or hooks.

Rules are always active guardrails.

---

### Skills

Skills answer:

```text
How do I perform this specific task correctly?
```

Examples:

- Plan Test Coverage.
- Plan From TMS.
- Align Feature Plan With TMS.
- Implement API Feature From Plan.
- Implement UI Feature From Plan.
- Heal API Test.
- Heal UI Test.
- Create Test Data Builder.
- Discover UI Components.
- Create Fixture.
- Review Generated Code Quality.

Skills are used only when their task matches the current work.

---

### Commands

Commands answer:

```text
How do I start a repeatable workflow quickly?
```

Examples:

- `/plan-feature`
- `/plan-from-tms`
- `/align-plan-with-tms`
- `/implement-api-batch`
- `/implement-ui-batch`
- `/review-generated`
- `/refactor-overengineering`
- `/heal-api-test`
- `/heal-ui-test`
- `/update-project-map`

Commands should be short.

Commands should not duplicate all rules or all skill logic.

---

## Agent Roles

### Planner

Use when the task needs coverage planning before implementation.

Planner should:

- understand the feature or flow;
- define source of truth;
- define in scope and out of scope;
- identify behaviors and risks;
- choose the correct primary test level;
- classify ready to implement now vs blocked/postponed;
- identify API negative and boundary decisions;
- identify UI unique user-facing value;
- create actionable API and UI implementation briefs;
- avoid implementation.

Planner must create or update the feature plan file when requested.

For feature plans, use Agent mode when the output must be saved to `specs/<feature>.md`.

Do not use Cursor Plan mode Build for planning-only tasks that must write a plan file.

---

### Generator

Use when implementing approved work.

Generator should:

- follow the selected skill;
- follow the feature plan;
- follow the project map;
- keep changes minimal;
- avoid speculative abstractions;
- preserve architecture boundaries;
- request discovery when ownership is unclear;
- implement only selected ready-now coverage;
- avoid broadening scope.

---

### Healer

Use when tests fail.

Healer should:

- inspect evidence;
- identify the failing point;
- capture actual request/status/body or UI evidence;
- classify root cause;
- fix at the correct layer;
- avoid masking failures;
- avoid weakening assertions;
- run targeted verification.

Use API healing for API failures.

Use UI healing for UI failures.

---

### Reviewer

Use when auditing quality or architecture.

Reviewer should:

- not modify code;
- classify findings by severity;
- explain why each issue matters;
- suggest minimal fixes;
- verify rule and project map compliance;
- check scope alignment;
- check test pyramid alignment;
- check Zod/schema ownership;
- check fixture and setup boundaries.

---

## Main Workflow: New Feature

Use when adding coverage for a new feature, endpoint, page, or flow.

```text
Plan Feature Coverage
-> Review Feature Plan, if feature is broad, risky, or has API/UI overlap
-> Create or validate Test Data Builder, if needed
-> Implement selected API coverage marked ready to implement now, if present
-> Implement selected UI coverage marked ready to implement now, if present
-> Add visual checkpoints later, if planned and explicitly selected
-> Review Generated Code Quality
-> Refactor / Heal / Harden only if needed
```

### Practical Notes

- Planning comes before implementation.
- Do not implement API and UI in one agent run.
- Use ready to implement now / blocked-postponed.
- Do not use first batch / later batch terminology.
- Do not create builders, clients, fixtures, schemas, components, or helpers speculatively.
- API should own backend contract, schema, negative, boundary, auth, filtering, sorting, and data predicate risks.
- UI should own distinct user-facing browser behavior.
- Visual should own visual layout risk only.
- If the plan is too vague, refine the relevant implementation brief before coding.

---

## TMS Planning Workflows

Qase is the current TMS provider (`TOOLSSHOP`; MCP server name `qase`). Default mode is **read-only**.

MCP ownership:

- project `.cursor/mcp.json` — `playwright` only (project-level; safe to commit)
- Qase MCP — user/global Cursor MCP settings (not project `.cursor/mcp.json`); requires `QASE_API_TOKEN` in user config; never commit real tokens

TMS cases are planning input and traceability — **do not assume 1 TMS case = 1 Playwright test**.

TMS Source and TMS Mapping belong in `specs/<feature>.md`.

Qase reporter/result publishing is not configured. TMS writes require explicit user approval.

Never commit real Qase tokens into docs, rules, skills, commands, or specs.

### No existing feature plan (TMS-first)

```text
/plan-from-tms
-> review generated plan
-> implement selected ready API/UI coverage
```

Use when `specs/<feature>.md` does not exist and Qase cases are the main input.

### Existing feature plan + TMS alignment

```text
/plan-feature (or plan already exists)
-> /align-plan-with-tms
-> review aligned plan
-> implement selected ready API/UI coverage
```

Use when a plan exists and must be aligned with Qase suite/cases.

### Normal planning (not TMS-first)

```text
/plan-feature
-> review plan (optional)
-> implement selected ready API/UI coverage
```

Do not implement directly from TMS cases. Do not implement blocked/postponed coverage without clarification.

---

## Main Workflow: Existing Feature Plan

Use when a feature plan already exists.

```text
Implement selected API coverage marked ready to implement now
or
Implement selected UI coverage marked ready to implement now
-> Run Verification
-> Review Generated Code Quality
-> Heal if failed
```

Do not redo heavy planning if the feature plan is already clear.

Do not implement blocked or postponed coverage.

Do not implement API and UI coverage together.

---

## Main Workflow: New API Coverage

Use when adding API endpoint or API behavior coverage from a plan.

```text
Implement API Feature From Plan
-> Create Test Data Builder, if reusable payload data is needed
-> Create API Client, only if endpoint reuse or request composition justifies it
-> Run Verification
-> Review Generated Code Quality
-> Heal API Test, if failed
```

API tests should own:

- request/response behavior;
- documented status behavior;
- response schema/shape;
- documented negative cases;
- documented boundary cases;
- auth and authorization contract;
- filtering, sorting, and data predicates;
- backend validation behavior.

API tests must not use:

- Page Objects;
- Component Objects;
- browser page interactions;
- UI selectors;
- UI fixtures as action layer.

### API Schema Validation

Use Zod for non-trivial, reused, nested, paginated, or contract-critical response shapes.

Use the shared Zod assertion helper for `safeParse` plus Playwright `expect`.

Keep behavior assertions separate from schema validation.

Do not put schema assertions into API clients.

Do not call raw `schema.parse()` in specs when a feature-specific assertion helper exists.

---

## Main Workflow: New UI Coverage

Use when adding UI automation from a feature plan.

```text
Implement UI Feature From Plan
-> Create Test Data Builder, if reusable structured data is needed
-> Discover UI Components, if ownership is unclear
-> Create Page Object, if a new route/screen is needed
-> Create Fixture, if reusable fixture wiring is needed
-> Run Verification
-> Review Generated Code Quality
-> Heal UI Test, if failed
```

UI tests should own:

- user journeys;
- visible browser behavior;
- visible validation feedback;
- visible success or error states;
- navigation;
- frontend/backend integration visible to the user.

UI tests should not duplicate API/schema coverage without distinct visible UI value.

### UI Precondition Setup

When a UI test needs backend preconditions, prefer approved API precondition setup if available and reliable.

UI specs must not:

- read env variables directly;
- derive API host from UI host;
- validate full API contracts during setup;
- hide the UI action under test in fixture or hook.

For registered-user UI preconditions, use the approved fixture if available:

```text
registrationApiPreconditionSetup.createRegisteredUser(...)
```

Environment ownership:

```text
API_BASE_URL = API project/tests

UI_PRECONDITION_API_BASE_URL = API backend used for UI preconditions

UI_API_BASE_URL = optional documented fallback for UI precondition API base
```

`UI_PRECONDITION_API_BASE_URL` must point to the same API backend used by the UI runtime.

---

## Main Workflow: Visual Checkpoint

Use only when visual coverage is planned or explicitly requested.

```text
Implement Visual Checkpoint
-> Run targeted visual verification
-> Review Generated Code Quality
```

Visual checks should:

- have meaningful visual risk;
- be inside a stable UI flow;
- use functional assertions before screenshot assertion;
- use `@visual`;
- default to `@regression`;
- avoid baseline updates unless explicitly requested.

Visual checks should not replace functional assertions.

---

## Main Workflow: Failing API Test

Use when one or more API tests fail.

```text
Heal API Test
-> Run impacted API spec
-> Run related specs if shared code changed
-> Run quality gate
-> Harden Rules From Failure, only if recurring issue is found
```

API healer should:

- inspect failing endpoint/method;
- inspect request payload/query;
- inspect response status/body;
- classify root cause;
- distinguish data/setup/schema/assertion/product/environment failures;
- fix at the correct layer;
- avoid weakening assertions;
- avoid silently widening schemas;
- avoid changing expected status without contract evidence.

Examples of correct API healing:

- invalid builder default -> fix builder/generator;
- schema mismatch with contract -> fix schema;
- assertion bug -> fix assertion helper/spec;
- environment mismatch -> fix config/setup, not assertions.

---

## Main Workflow: Failing UI Test

Use when one or more UI tests fail.

```text
Heal UI Test
-> Run impacted UI spec
-> Run related specs if shared code changed
-> Run quality gate
-> Harden Rules From Failure, only if recurring issue is found
```

UI healer should:

- inspect failing step;
- inspect trace/screenshot/video if available;
- classify root cause;
- avoid `waitForTimeout`;
- avoid weakening assertions;
- avoid moving action under test into hooks or fixtures;
- fix at the correct layer.

Examples of correct UI healing:

- invalid default form data -> fix builder;
- wrong locator -> fix Page Object locator;
- changed product behavior -> confirm behavior before changing assertion;
- setup mismatch -> fix setup/config layer.

---

## Main Workflow: API / UI Environment Mismatch

Use when API-created data is not visible to UI, or UI-created data is not visible to API tests.

```text
Investigate API Environment Or Setup Mismatch
-> Fix config/setup only if confirmed
-> Run targeted verification
```

Check:

- API project base URL;
- UI base URL;
- UI runtime API endpoint from browser network;
- UI precondition API base URL;
- whether API-created data is visible to UI runtime;
- whether UI-created data is visible to API runtime.

Do not derive API host from UI host.

Do not read env variables in specs.

Do not fix environment mismatch by weakening assertions.

---

## Main Workflow: Reusable Test Data

Use when reusable structured data is needed.

```text
Create Test Data Builder
```

If data must be exposed through fixtures:

```text
Create Fixture
```

Only expose data through fixtures when reuse is justified.

Builder defaults must be valid by default.

Invalid or negative data must be explicit through overrides.

---

## Main Workflow: New Fixture

Use when reusable dependency wiring or setup is needed.

```text
Create Fixture
```

The fixture must answer:

- What does it provide?
- Which layer owns it?
- Is reuse justified?
- Does it stay thin?
- Does it avoid hiding the action under test?
- Does it preserve the final fixture entry point?

Fixtures wire dependencies.

Fixtures do not hide scenarios.

---

## Main Workflow: Unclear Component Ownership

Use when it is unclear whether a UI block should stay in a Page Object or become a Component Object.

```text
Discover UI Components
```

Possible decisions:

- keep inside Page Object;
- extract Component Object now;
- reuse existing Component Object;
- postpone extraction;
- remove unnecessary abstraction.

If extraction is recommended:

```text
Refactor Page Object To Components
-> Run Verification
```

---

## Main Workflow: Large Page Object

Use when a Page Object has grown too large or mixes unrelated UI areas.

```text
Discover UI Components, if ownership is unclear
-> Refactor Page Object To Components
-> Run Verification
```

Do not use Simplify Overengineered Test Architecture for this case unless the goal is to remove unnecessary abstractions.

---

## Main Workflow: Overengineered Architecture

Use when tests pass, but architecture is too complex.

```text
Simplify Overengineered Test Architecture
-> Run Verification
-> Review Generated Code Quality
```

Examples:

- component for one button;
- helper for one trivial line;
- fixture for one-off value;
- domain flow for simple page action;
- API client for one one-off request;
- speculative methods for future tests;
- duplicated Zod `safeParse` wrapper;
- helper logic inside specs.

---

## Main Workflow: Generated Code Review

Use after AI generated or modified code.

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
- helper logic in specs;
- fixture/setup boundaries;
- Page Object/Component ownership;
- API client necessity;
- tags;
- reporting ownership;
- verification evidence.

This skill is review-only.

It must not modify files.

---

## Main Workflow: Framework/Core Review

Use when reviewing framework, fixtures, config, auth, API infrastructure, rules, skills, commands, or project map changes.

```text
Review Framework Change
```

It checks:

- core/project boundary;
- fixture boundaries;
- public entry points;
- secrets/config safety;
- speculative abstractions;
- project map consistency;
- command/skill/rule consistency.

---

## Main Workflow: Project Structure Or Convention Changed

Use when repository conventions changed.

```text
Update Project Map
```

Examples:

- new folder convention;
- new alias;
- new tag;
- new fixture entry point;
- new quality gate command;
- new rule;
- new skill;
- new command;
- changed core/project structure;
- new env/config convention.

Project map must remain the source of truth.

Do not add broad repository tree sync noise to focused feature/refactor commits unless explicitly requested.

---

## Main Workflow: Recurring Failure Or Repeated AI Mistake

Use when a failure reveals reusable learning.

```text
Harden Rules From Failure
```

It decides whether to update:

- rule;
- skill;
- project map;
- helper;
- diagnostics;
- documentation.

Do not create new rules for one-off issues.

---

## Main Workflow: After Any Code Change

Use after implementation, healing, refactoring, or framework changes.

```text
Run Verification
```

Verification order:

1. impacted spec or targeted check;
2. related specs if shared code changed;
3. typecheck/lint if applicable;
4. repository quality gate from project map.

---

# Skill Selection Cheat Sheet

## New feature

Use:

```text
Plan Feature Coverage
```

Then use one selected implementation skill:

```text
Implement API Feature From Plan
```

or

```text
Implement UI Feature From Plan
```

Optional:

```text
Create Test Data Builder
Create Fixture
Implement Visual Checkpoint
Review Generated Code Quality
```

---

## Existing feature plan

Use:

```text
Implement API Feature From Plan
```

or

```text
Implement UI Feature From Plan
```

Do not redo planning if the plan is clear.

---

## New API endpoint or behavior

Use:

```text
Implement API Feature From Plan
```

Optional:

```text
Create Test Data Builder
Create API Client
```

---

## New UI behavior

Use:

```text
Implement UI Feature From Plan
```

Optional:

```text
Create Test Data Builder
Discover UI Components
Create Page Object
Create Fixture
```

---

## Failing API test

Use:

```text
Heal API Test
Run Verification
```

Optional:

```text
Harden Rules From Failure
```

---

## Failing UI test

Use:

```text
Heal UI Test
Run Verification
```

Optional:

```text
Harden Rules From Failure
```

---

## Reusable test data

Use:

```text
Create Test Data Builder
```

---

## New fixture

Use:

```text
Create Fixture
```

---

## UI API precondition setup

Use:

```text
Create Fixture
```

Then document in project map.

---

## New route or screen

Use:

```text
Create Page Object
```

---

## Unclear component ownership

Use:

```text
Discover UI Components
```

---

## Large Page Object

Use:

```text
Refactor Page Object To Components
```

Use discovery first if ownership is unclear.

---

## Too much abstraction

Use:

```text
Simplify Overengineered Test Architecture
```

---

## Reused API endpoint calls

Use:

```text
Create API Client
```

Only when reuse is justified.

---

## Generated code audit

Use:

```text
Review Generated Code Quality
```

---

## Framework/core audit

Use:

```text
Review Framework Change
```

---

## Structure or convention changed

Use:

```text
Update Project Map
```

---

## Recurring failure pattern

Use:

```text
Harden Rules From Failure
```

---

## After any change

Use:

```text
Run Verification
```

---

# When Not To Use All Skills

Do not use every skill for every task.

Choose the smallest skill that matches the current problem.

## Small locator fix

Use:

```text
Heal UI Test
```

Do not use:

```text
Implement UI Feature From Plan
Discover UI Components
Create Page Object
```

---

## API test status/body failure

Use:

```text
Heal API Test
```

Do not use:

```text
Implement API Feature From Plan
Refactor Overengineering
```

unless the root cause is implementation or architecture.

---

## One simple assertion added to existing test

Use relevant rules and run verification.

Do not create new Page Objects, Components, Fixtures, Builders, Schemas, or API Clients unless justified.

---

## Simple deterministic constant

Allowed directly in specs:

- `sortKey = "price,asc"`
- `expectedItemsCount = 10`
- `searchQuery = "laptop"`

Do not use Create Test Data Builder for simple test mechanics constants.

---

## Feature plan already clear

Use implementation skill directly.

Do not redo planning.

---

## Test passes but code is noisy

Use:

```text
Review Generated Code Quality
```

Then:

```text
Simplify Overengineered Test Architecture
```

only if review finds concrete issues.

---

# Final Rule Of Thumb

```text
Do not use all skills.
Use the smallest matching skill.
Rules always apply.
Project map always wins for structure, commands, tags, environment ownership, and fixture entry points.
Feature plan defines selected implementation scope.
API owns backend contract and data predicates.
UI owns distinct user-facing browser behavior.
Verification follows every change.
Healing fixes root causes.
Hardening captures only reusable learning.
```

Keep this file visible when working with AI agents.

---

