# AI Workflow Map

## Purpose

This document explains how to use project rules, skills, agents, and the project map in day-to-day AI-assisted Playwright + TypeScript automation work.

Keep this file visible when working with AI agents.

---

## Mental Model

```text
Project Map = source of truth for structure, commands, aliases, tags, and ownership

Rules = always-on architecture and quality guardrails

Skills = task-specific procedures

Agents = roles that use skills while following rules and the project map
```

### Short Version

- Use **Project Map** to decide where files live and which commands to run.
- Use **Rules** as permanent constraints for all work.
- Use **Skills** when solving a specific task.
- Use **Agents** as roles: planner, generator, healer, reviewer.

---

## Core Operating Principle

```text
What am I doing?
-> choose the right skill

Where should I do it?
-> follow the project map

What must I not violate?
-> rules always apply

What after changes?
-> run verification

What if tests fail?
-> heal root cause

What if the same issue repeats?
-> harden rules, skills, helpers, or project map
```

---

## Rules vs Skills

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

Rules are always active guardrails.

---

### Skills

Skills answer:

```text
How do I perform this specific task correctly?
```

Examples:

- Implement UI Feature From Plan.
- Heal UI Test.
- Create Test Data Builder.
- Discover UI Components.
- Create Fixture.
- Review UI Suite.

Skills are used only when their task matches the current work.

---

## Agent Roles

### Planner

Use when the task needs planning before implementation.

Planner should:

- understand the feature or failure context;
- identify scenarios;
- define batch scope;
- identify affected layers;
- decide which skills may be needed;
- avoid implementation until plan is clear.

---

### Generator

Use when implementing approved work.

Generator should:

- follow the selected skill;
- follow project map;
- keep changes minimal;
- avoid speculative abstractions;
- preserve architecture boundaries;
- request discovery when ownership is unclear.

---

### Healer

Use when tests fail.

Healer should:

- inspect evidence;
- classify root cause;
- fix at the correct layer;
- avoid masking failures;
- run targeted verification.

---

### Reviewer

Use when auditing quality or architecture.

Reviewer should:

- not modify code;
- classify findings by severity;
- explain why each issue matters;
- suggest minimal fixes;
- verify rule and project map compliance.

---

## Main Workflow: New UI Feature

Use when adding UI automation for a new feature or planned scenarios.

```text
Playwright Planner
-> Implement UI Feature From Plan
   -> Create Test Data Builder, if reusable data is needed
   -> Discover UI Components, if ownership is unclear
   -> Create Page Object, if a new route/screen is needed
   -> Create Fixture, if reusable fixture wiring is needed
-> Run Verification
-> Heal UI Test, if tests fail
-> Harden Rules From Failure, if recurring issue is found
```

### Practical Notes

- Planner creates or validates the plan.
- Generator implements only the selected batch.
- Data comes before tests.
- Page Objects are updated minimally.
- Components are created only when justified.
- Verification is mandatory after changes.

---

## Main Workflow: Existing Feature Plan

Use when a feature plan already exists.

```text
Implement UI Feature From Plan
-> Create Test Data Builder, if needed
-> Discover UI Components, if ownership is unclear
-> Create Page Object, if new route/screen is needed
-> Create Fixture, if needed
-> Run Verification
-> Heal UI Test, if failed
```

Do not redo heavy planning if the feature plan is already clear.

---

## Main Workflow: Failing UI Test

Use when one or more UI tests fail.

```text
Heal UI Test
-> Run Verification
-> Harden Rules From Failure, only if recurring issue is found
```

### Do Not Use By Default

- Do not use Implement UI Feature From Plan.
- Do not use Discover UI Components unless ownership is related to the failure.
- Do not use Simplify Overengineered Test Architecture unless architecture is the actual problem.

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
```

Examples:

- component for one button;
- helper for one trivial line;
- fixture for one-off value;
- domain flow for simple page action;
- API client for one one-off request;
- speculative methods for future tests.

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

---

## Main Workflow: New API Test

Use when adding API endpoint coverage.

```text
Implement API Feature
-> Create Test Data Builder, if reusable payload data is needed
-> Create API Client, if endpoint reuse or request composition justifies it
-> Run Verification
```

API tests must stay request/response based.

Do not use:

- Page Objects;
- Component Objects;
- UI fixtures;
- browser page interactions;
- UI selectors.

---

## Main Workflow: New API Client

Use when raw API requests are duplicated or endpoint grouping improves clarity.

```text
Create API Client
```

API clients must be:

- thin;
- optional;
- project-layer when endpoint-specific;
- free from scenario assertions;
- free from hidden workflows;
- free from duplicated login logic.

---

## Main Workflow: UI Suite Review

Use when auditing UI test quality and architecture.

```text
Review UI Suite
```

This skill is review-only.

It reports:

- critical findings;
- major findings;
- minor findings;
- positive observations;
- minimal suggested fixes.

It must not modify files.

---

## Main Workflow: Framework/Core Review

Use when reviewing framework, fixtures, config, auth, API infrastructure, rules, skills, or project map changes.

```text
Review Framework Change
```

It checks:

- core/project boundary;
- fixture boundaries;
- public entry points;
- secrets/config safety;
- speculative abstractions;
- project map consistency.

---

## Main Workflow: Project Structure Changed

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
- changed core/project structure.

Project map must remain the source of truth.

---

## Main Workflow: Recurring Failure or Repeated AI Mistake

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

## New UI feature

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
Run Verification
Heal UI Test
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

## New API endpoint test

Use:

```text
Implement API Feature
```

---

## Reused API endpoint calls

Use:

```text
Create API Client
```

---

## UI suite audit

Use:

```text
Review UI Suite
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

## One simple assertion added to existing test

Use relevant rules and run verification.

Do not create new Page Objects, Components, Fixtures, or Builders unless justified.

---

## Simple deterministic constant

Allowed directly in specs:

- `sortKey = "price,asc"`
- `expectedItemsCount = 10`
- `searchQuery = "laptop"`

Do not use Create Test Data Builder for simple test mechanics constants.

---

# Final Rule Of Thumb

```text
Do not use all skills.
Use the smallest matching skill.
Rules always apply.
Project map always wins for structure and commands.
Verification follows every change.
Healing fixes root causes.
Hardening captures only reusable learning.
```
