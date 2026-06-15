# Skill: Review Generated Code Quality

## Goal

Use this skill to review recently generated or modified code for readability, duplication, unnecessary abstractions, local helper misuse, and maintainability issues.

This is a review-only skill.

Do not modify files.

---

## Related Rules

Follow these rules:

- Code Quality and Cleanliness Rules
- Agent Workflow
- Core / Project Boundary and Structure Rules
- Project Map Rules
- Fixtures and Test Data Rules
- Page Object and Component Object Core Rules
- API Architecture Rules
- Allure Reporting Rules
- Visual Testing Rules
- Examples Policy

---

## When To Use

Use this skill when:

- AI generated new tests;
- AI modified multiple files;
- tests pass but code feels messy;
- there may be duplicated logic;
- local helpers were added;
- new abstractions were introduced;
- visual or reporting logic was added;
- API tests or builders were generated;
- review is needed before accepting changes.

---

## When NOT To Use

Do not use this skill when:

- the task is to heal a failing test;
- the task is to implement new code immediately;
- only formatting changed;
- no code was generated or modified.

Use Heal UI Test for failures.

Use Simplify Overengineered Test Architecture when cleanup changes are requested.

---

## Review Scope

Review:

- specs;
- Page Objects;
- Component Objects;
- fixtures;
- builders;
- generators;
- API clients;
- reporting helpers;
- visual checks;
- project map changes;
- rules/skills changes if modified.

Do not apply fixes.

Only report findings.

---

## Workflow

### 1. Identify Changed Files

List changed files.

Classify them by layer:

- spec;
- page;
- component;
- fixture;
- data;
- API;
- reporting;
- config;
- rule;
- skill.

---

### 2. Check Duplication

Look for repeated:

- test data objects;
- payloads;
- upload paths;
- Allure metadata setup;
- dialog handling;
- visual screenshot options;
- request construction;
- cleanup logic;
- local helper functions.

Decide whether duplication should stay local or move to shared helper/builder/client.

---

### 3. Check Local Helpers

Review local helper functions.

Flag helpers that:

- duplicate shared helpers;
- are reused across multiple tests;
- hardcode feature-specific values unnecessarily;
- hide action under test;
- hide assertions;
- belong in builder, reporting helper, fixture, or API client.

---

### 4. Check Abstractions

Identify unnecessary abstractions:

- component for one locator;
- fixture for one-off value;
- helper for one line;
- API client for one request;
- domain flow for simple page action;
- generic utility with unclear purpose.

Flag abstractions that do not earn their cost.

---

### 5. Check Workarounds

Look for:

- fallback navigation;
- broad try/catch;
- manual retries;
- ignored overlays;
- hidden cleanup;
- comments explaining flaky behavior;
- conditional logic that masks failure.

Flag workarounds that should be fixed at root cause or moved to correct layer.

---

### 6. Check Test Readability

Check whether tests clearly show:

- setup;
- action under test;
- expected result;
- visual checkpoint if any.

Flag tests that:

- are too long;
- mix unrelated scenarios;
- contain too many concerns;
- have unclear step names;
- hide important behavior in helpers.

---

### 7. Check Layer Ownership

Verify:

- assertions stay in specs or assertion helpers;
- Page Objects and Components do not use `expect`;
- Page Objects and Components do not use Allure;
- API clients do not use Allure;
- builders/generators do not use Allure;
- fixtures do not hide action under test.

---

### Spec Readability And Helper Extraction

When reviewing generated specs, check whether the spec is overloaded with technical helper logic.

Flag as major when specs contain non-trivial reusable logic such as:

- sorting/comparison algorithms;
- parsing/normalization helpers;
- repeated assertion predicates;
- large field-specific branching;
- helper functions that obscure the scenario.

Prefer moving such logic to dedicated assertion helpers or data utilities.

Do not flag small local scenario constants or simple one-off values as issues.

---

## Severity

### Critical

Use critical for issues that can cause false positives, false negatives, security risk, or major architecture violation.

Examples:

- `.env` used as upload file;
- fake assertion;
- `waitForTimeout`;
- Allure in Page Object;
- assertion hidden in API client;
- project-specific logic in framework core.

### Major

Use major for maintainability or architecture issues.

Examples:

- duplicated metadata helper;
- reusable data inline in specs;
- unnecessary component;
- workaround in spec;
- API client created without need;
- visual test without meaningful state.

### Minor

Use minor for readability or consistency issues.

Examples:

- unclear name;
- small repeated constant;
- step name could be clearer;
- ordering issue;
- minor import cleanup.

---

## Output Format

### Summary

- files reviewed:
- overall status:
- critical findings:
- major findings:
- minor findings:

### Critical Findings

For each finding:

- file:
- issue:
- why it matters:
- minimal suggested fix:

### Major Findings

For each finding:

- file:
- issue:
- why it matters:
- minimal suggested fix:

### Minor Findings

For each finding:

- file:
- issue:
- why it matters:
- minimal suggested fix:

### Positive Observations

List good patterns found.

### Recommended Next Step

Use one:

- accept changes;
- accept after minor cleanup;
- run Simplify Overengineered Test Architecture;
- run Heal UI Test;
- update rule/skill/project map;
- request changes.

---

## Guardrails

Do not:

- modify files;
- perform cleanup;
- rewrite tests;
- add abstractions;
- remove abstractions;
- run broad refactoring;
- report speculative issues without evidence.

---

## Main Principle

Review generated code like a maintainer.

Passing tests are not enough.

Code must be clear, minimal, deduplicated, and easy to evolve.