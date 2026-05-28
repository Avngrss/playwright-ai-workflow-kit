# Skill: Review Framework Change

## Goal

Use this skill to review changes that affect framework architecture, core utilities, fixtures, configuration, rules, skills, API infrastructure, or shared test infrastructure.

This is a review-only skill.

Do not modify files.

The result is a structured review report.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Fixtures and Test Data Rules;
- API Architecture Rules;
- Configuration and Secrets Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Examples Policy.

If this skill conflicts with the project map or a more specific rule, follow the project map and the more specific rule.

---

## When To Use

Use this skill when reviewing changes to:

- framework core;
- fixtures;
- configuration;
- auth providers;
- API transport;
- logging;
- reporting;
- utilities;
- test data infrastructure;
- project map;
- rules;
- skills;
- public fixture entry points;
- shared abstractions.

---

## When NOT To Use

Do not use this skill when:

- only one UI spec changed;
- only one Page Object locator changed;
- only one API test changed;
- the task is implementation, not review;
- the task is to heal a failing test.

Use more specific skills when applicable.

---

## Review Checklist

Check:

- change is minimal and targeted;
- no unrelated files were modified;
- project map was followed;
- framework core does not contain project-specific logic;
- project-specific code does not leak into core;
- public entry points remain stable;
- fixture layering remains clean;
- no action under test is hidden in fixtures;
- no direct `process.env` access appears in wrong layers;
- no secrets, tokens, passwords, cookies, or storage states are committed;
- no hardcoded URLs or environment values were added;
- abstractions are not speculative;
- utilities are reusable and responsibility is clear;
- API clients remain thin;
- auth logic is not duplicated;
- changes do not break existing import conventions;
- diagnostics remain actionable;
- verification was run or clearly documented as not run.

---

## Severity Model

### Critical

Use critical when the change can break framework universality, security, test correctness, or public APIs.

Examples:

- project-specific Page Object added to core;
- hardcoded token or password;
- fixture hides action under test;
- breaking public fixture entry point without migration;
- auth logic duplicated across tests;
- fake assertion introduced.

### Major

Use major when the change hurts maintainability, extensibility, or architecture.

Examples:

- overgrown fixture;
- vague utility;
- duplicated helper;
- client hides assertions;
- project map not updated after structural change.

### Minor

Use minor for small consistency or style issues.

Examples:

- unclear naming;
- small import inconsistency;
- missing documentation for a new convention.

---

## Output Format

### Summary

- reviewed change:
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

### Final Recommendation

Use one:

- approve;
- approve with minor comments;
- request changes;
- block due to critical issue.

---

## Guardrails

Do not:

- modify files;
- apply fixes;
- perform refactoring;
- introduce new rules;
- introduce new skills;
- make assumptions without evidence;
- require abstractions without clear need.

---

## Main Principle

Review architecture, not only syntax.

Framework changes must preserve universality, stability, and clear ownership.