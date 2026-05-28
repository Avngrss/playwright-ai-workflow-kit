# AI Agent Prompt Templates

## Purpose

This document contains reusable prompts for working with AI agents in the Playwright + TypeScript test automation framework.

Use these prompts to select the correct workflow, skill, and expectations.

---

## Global Prompt Prefix

Use this prefix when starting most AI-agent tasks.

```text
You are working in a Playwright + TypeScript test automation framework.

Follow the project map as the source of truth for paths, commands, aliases, tags, fixture entry points, and ownership.

Follow all repository rules.

Use the smallest skill that matches the task.

Keep changes minimal and targeted.

Do not introduce speculative abstractions.

Do not modify unrelated files.

If required information is missing, do not invent architecture or behavior. Report the blocker and propose the smallest safe next step.
```

---

# UI Feature Prompts

## Prompt: Plan New UI Feature

```text
Use Playwright Planner.

Task: create or validate a test plan for the UI feature: <feature name>.

Read available requirements/specs and identify:

- feature scope;
- user scenarios;
- smoke vs regression candidates;
- required tags;
- required test data;
- affected pages/routes;
- possible components;
- assertions;
- risks;
- suggested implementation batches.

Do not implement code.

Output a clear feature test plan and recommended first batch.
```

---

## Prompt: Implement UI Feature From Plan

```text
Use Skill: Implement UI Feature From Plan.

Feature plan: <path or pasted plan>.

Implement only this batch: <batch/scenarios>.

Follow project map and all UI architecture rules.

Before writing tests:

- identify required data;
- reuse existing builders/generators/datasets when possible;
- update Page Objects minimally;
- create Component Objects only when justified;
- use Discover UI Components if ownership is unclear.

Tests must:

- use meaningful test.step;
- keep the main action under test explicit;
- use final fixture entry point;
- use required tags;
- avoid inline random data;
- avoid raw selector mechanics in specs.

After implementation, use Run Verification.

If tests fail, use Heal UI Test.
```

---

## Prompt: Add UI Test To Existing Page

```text
Use Skill: Implement UI Feature From Plan if this is part of a planned feature.

If this is a small targeted addition, follow relevant rules and keep the change minimal.

Task: add UI test for <scenario> in <area/page>.

Check existing:

- specs;
- Page Objects;
- Component Objects;
- fixtures;
- builders/generators;
- tags.

Do not create new components, fixtures, or builders unless justified.

Run impacted spec and project quality gate from project map.
```

---

# Healing Prompts

## Prompt: Heal Failing UI Test

```text
Use Skill: Heal UI Test.

Failing test output:
<insert output>

Investigate using:

- failing step;
- stack trace;
- trace/screenshot/video if available;
- affected spec;
- Page Object/Component;
- fixture/data setup.

Classify root cause:

- locator;
- timing/async update;
- navigation/setup;
- fixture;
- test data;
- assertion mismatch;
- environment/config;
- isolation/flakiness.

Apply the minimal fix at the correct layer.

Do not use waitForTimeout.
Do not weaken assertions.
Do not change expected behavior unless requirement is wrong.
Do not hide action under test in hooks or fixtures.

After fix, use Run Verification.
```

---

## Prompt: Investigate Flaky UI Test Without Fixing

```text
Use Heal UI Test in investigation mode only.

Do not modify files.

Analyze flaky test: <test/spec>.

Review:

- failure pattern;
- trace/screenshot/video;
- locator stability;
- setup and fixtures;
- data uniqueness;
- waits and assertions;
- test isolation;
- environment differences.

Output:

- suspected root cause;
- evidence;
- affected layer;
- minimal recommended fix;
- whether hardening is needed.
```

---

# Component and Page Object Prompts

## Prompt: Discover UI Components

```text
Use Skill: Discover UI Components.

Target page/screen/flow: <target>.

Question: should <UI block> stay inside the Page Object or become a Component Object?

Do not modify files.

Review:

- specs;
- Page Objects;
- existing Component Objects;
- fixtures;
- project map;
- rules.

Use Playwright MCP only if repository files are not enough to understand UI structure.

Return:

- component candidates;
- recommendation for each;
- reasoning;
- suggested ownership;
- minimal refactor plan if extraction is justified;
- files that would be affected.
```

---

## Prompt: Refactor Page Object To Components

```text
Use Skill: Refactor Page Object To Components.

Target Page Object: <file/class>.

Reason: <why refactor is needed>.

If ownership is unclear, run Discover UI Components first.

Refactor only justified UI blocks into Component Objects.

Preserve behavior.
Do not add new feature coverage.
Do not add speculative methods.
Do not expose components as fixtures by default.
Do not rewrite unrelated tests.

After refactor, use Run Verification.
```

---

## Prompt: Create Page Object

```text
Use Skill: Create Page Object.

Target route/screen: <route/screen>.

Confirm that this is a real page, screen, route, or navigation boundary.

Check existing Page Objects first.

Create minimal Page Object only if needed by current tests.

Do not create Page Object for a UI block inside an existing page.
Do not add business flows.
Do not add test data generation.
Do not add test.step.
Do not add speculative methods.

Add fixture exposure only if project map convention requires it.

Run impacted spec if usage is added.
```

---

# Test Data and Fixture Prompts

## Prompt: Create Test Data Builder

```text
Use Skill: Create Test Data Builder.

Target data/entity/payload: <target>.

Use this only if reusable structured data is needed.

Identify:

- required fields;
- optional fields;
- unique fields;
- valid defaults;
- existing builders/generators/datasets.

Create or update:

- type;
- generator, only if unique/formatted primitive values are needed;
- builder.

Builder must return valid data by default and support Partial<T> overrides.

Do not generate inline random data in specs.
Do not add data fixture unless reuse justifies it.
Do not put domain-specific builders in framework core.
```

---

## Prompt: Create Fixture

```text
Use Skill: Create Fixture.

Fixture need: <describe need>.

Before creating fixture, confirm:

- reuse is meaningful;
- fixture is thin;
- fixture belongs to correct layer;
- fixture does not hide action under test;
- fixture does not expose component by default;
- final fixture entry point remains the spec entry point.

Do not create fixtures for one-off values.
Do not put business flows inside fixtures.
Do not import intermediate fixture layers from specs.

Run impacted specs and quality gate from project map.
```

---

# API Prompts

## Prompt: Implement API Feature

```text
Use Skill: Implement API Feature.

Endpoint: <method path>.

Identify:

- method;
- path parameters;
- query parameters;
- request body;
- auth requirements;
- expected status;
- essential response fields;
- negative cases, if applicable.

Use project-approved auth provider or authenticated API fixture.
Do not call login directly in tests.
Do not hardcode tokens or credentials.

Use request/response model only.
Do not use Page Objects or Components.

Use Create Test Data Builder if reusable payload data is needed.
Use Create API Client only if reuse or request composition justifies it.

Run impacted API spec and quality gate from project map.
```

---

## Prompt: Create API Client

```text
Use Skill: Create API Client.

Endpoint group: <group/resource>.

Create a thin API client only if endpoint calls are reused or request composition is duplicated.

Check existing clients first.

Client may compose requests and return response or typed data.

Client must not:

- hide assertions;
- hide workflows;
- call login directly;
- hardcode tokens;
- duplicate auth logic;
- become a service hierarchy;
- live in framework core if endpoint-specific.

Run impacted API specs and quality gate.
```

---

# Review Prompts

## Prompt: Review UI Suite

```text
Use Skill: Review UI Suite.

Review area: <spec folder/files>.

Review only.
Do not modify files.

Check:

- test.step usage;
- hook safety;
- assertion ownership;
- fixture usage;
- tags;
- duplicated navigation;
- Page Object ownership;
- Component Object justification;
- locator strategy;
- test data usage;
- overengineering;
- core/project boundary;
- isolation and flakiness risks.

Output findings by severity:

- critical;
- major;
- minor.

For each finding include:

- file;
- issue;
- why it matters;
- minimal suggested fix.

Clearly state if no issues are found.
```

---

## Prompt: Review Framework Change

```text
Use Skill: Review Framework Change.

Review changes in: <files/branch/diff>.

Review only.
Do not modify files.

Check:

- core/project boundary;
- fixture layering;
- public entry points;
- config/secrets handling;
- auth architecture;
- API infrastructure;
- project map consistency;
- speculative abstractions;
- import conventions;
- verification evidence.

Output findings by severity with minimal suggested fixes.
```

---

# Architecture Maintenance Prompts

## Prompt: Simplify Overengineered Architecture

```text
Use Skill: Simplify Overengineered Test Architecture.

Target abstraction: <component/helper/fixture/flow/client>.

Tests currently pass.
Goal is to simplify architecture without changing behavior.

Check actual usage before removing anything.

Remove or inline only unjustified abstractions.

Preserve:

- test intent;
- assertions;
- tags;
- behavior;
- fixture contract;
- public behavior used by specs.

Do not broaden refactor scope.
Run verification after changes.
```

---

## Prompt: Update Project Map

```text
Use Skill: Update Project Map.

Change requiring project map update: <describe change>.

Update only relevant sections.

Check consistency with:

- actual files;
- path aliases;
- package scripts;
- fixture entry points;
- tags;
- rules;
- skills;
- quality gate command.

Do not document experimental structure as stable convention.
Do not duplicate existing entries.
```

---

## Prompt: Harden Rules From Failure

```text
Use Skill: Harden Rules From Failure.

Trigger: <failure/review finding/repeated AI mistake>.

Decide whether this is:

- one-off issue;
- recurring pattern;
- missing rule;
- unclear skill;
- missing project map entry;
- missing helper;
- diagnostics gap.

Do not add rules for one-off issues.
Prefer updating existing rules or skills over creating new ones.
Avoid duplicate or conflicting guidance.

Output hardening decision and minimal change.
```

---

# Verification Prompt

## Prompt: Run Verification

```text
Use Skill: Run Verification.

Changed files: <files>.

Identify affected layer:

- UI spec;
- API spec;
- Page Object;
- Component Object;
- fixture;
- builder;
- generator;
- API client;
- config;
- core;
- rule;
- skill;
- project map.

Choose verification in this order:

1. impacted spec or targeted check;
2. related specs if shared code changed;
3. typecheck or lint if applicable;
4. repository quality gate from project map.

Do not invent commands.
Report commands run and results.
If a check cannot be run, state why and what should be run.
```

---

# Universal Closing Instruction

Add this to prompts when you want strict reporting.

```text
At the end, report:

- what skill was used;
- what rules were most relevant;
- files changed or reviewed;
- verification run or not run;
- remaining risks;
- next recommended step.
```
