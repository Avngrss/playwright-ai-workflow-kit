# Skill: Review Generated Code Quality

## Goal

Use this skill to review recently generated or modified code for correctness, readability, duplication, unnecessary abstractions, scope creep, layer ownership, and maintainability issues.

This is a review-only skill.

Do not modify files.

---

## Related Rules

Follow these rules:

- Code Quality and Cleanliness Rules;
- Agent Workflow;
- Test Strategy and Test Pyramid Rules;
- Test Structure and Tags Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Fixtures and Test Data Rules;
- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- API Architecture Rules;
- API Schema Validation Rules;
- Allure Reporting Rules;
- Visual Testing Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- AI generated new tests;
- AI modified multiple files;
- tests pass but code feels messy;
- there may be duplicated logic;
- local helpers were added;
- new abstractions were introduced;
- API tests, UI tests, builders, schemas, or helpers were generated;
- visual or reporting logic was added;
- review is needed before accepting changes.

---

## When NOT To Use

Do not use this skill when:

- the task is to heal a failing test;
- the task is to implement new code immediately;
- only formatting changed;
- no code was generated or modified.

Use Heal UI Test for failing UI tests.

Use Heal API Test for failing API tests.

Use Refactor Overengineering when cleanup changes are requested.

---

## Review Scope

Review changed or generated:

- specs;
- Page Objects;
- Component Objects;
- fixtures;
- builders;
- generators;
- datasets;
- API clients;
- API assertion helpers;
- API schemas;
- shared assertion helpers;
- reporting helpers;
- visual checks;
- project map changes;
- rules, skills, or commands if modified.

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
- builder;
- generator;
- dataset;
- API;
- schema;
- assertion helper;
- reporting;
- config;
- rule;
- skill;
- command.

---

### 2. Check Scope Alignment

Check whether the changes match the requested task and feature plan.

Flag as major when:

- implementation expanded beyond the selected scope;
- adjacent controls, endpoints, query parameters, flows, or states were implemented without being explicitly in scope;
- blocked or postponed scenarios were implemented without new evidence;
- API, UI, visual, or schema coverage were mixed when the task requested only one layer;
- implementation details were treated as standalone scenarios.

Do not flag related code changes when they are necessary to implement the selected scope.

---

### 3. Check Test Pyramid And Coverage Balance

When reviewing generated tests, check whether the implementation respects the test pyramid.

Flag as major when:

- UI tests duplicate API/schema coverage without unique user-facing value;
- many UI tests are generated for behavior better covered at API level;
- one feature becomes UI-heavy without planning justification;
- API/schema coverage is missing for contract-critical backend behavior;
- API tests cover only positive paths while documented negative behavior is ignored;
- UI tests verify backend predicates instead of visible user-facing behavior;
- setup uses long UI flows when approved lower-level setup exists.

Do not require a fixed API:UI ratio per feature.

Evaluate whether each UI test has a distinct user-facing risk.

For API negative cases, distinguish between:

- missing coverage despite documented contract;
- intentionally blocked/postponed coverage because contract or setup is unclear.

---

### 4. Check Duplication

Look for repeated:

- test data objects;
- payloads;
- scenario cases;
- upload data;
- Allure metadata setup;
- dialog handling;
- visual screenshot options;
- request construction;
- cleanup logic;
- local helper functions;
- Zod `safeParse` plus Playwright `expect` wrapper logic.

Decide whether duplication should stay local or move to a shared helper, builder, generator, dataset, API client, schema, or assertion helper.

Do not flag small local scenario constants that improve readability.

---

### 5. Check Local Helpers

Review local helper functions.

Flag helpers that:

- duplicate shared helpers;
- are reused across multiple tests;
- hardcode feature-specific values unnecessarily;
- hide the action under test;
- hide assertions;
- contain non-trivial reusable technical logic;
- belong in a builder, generator, dataset, reporting helper, fixture, assertion helper, or API client.

Do not flag one-line one-off helpers unless they reduce readability.

---

### 6. Check Spec Readability And Helper Extraction

When reviewing generated specs, check whether specs are overloaded with technical helper logic.

Flag as major when specs contain non-trivial reusable logic such as:

- sorting or comparison algorithms;
- parsing or normalization helpers;
- repeated assertion predicates;
- reusable array, table, list, card, or response validation;
- large field-specific assertion branching;
- helper functions that obscure the scenario.

Prefer moving such logic to dedicated assertion helpers or data utilities.

Do not flag small local scenario constants or simple one-off values as issues.

Specs should show:

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

### 7. Check Abstractions

Identify unnecessary abstractions:

- component for one locator;
- fixture for one-off value;
- helper for one line;
- API client for one request;
- builder for one-off deterministic data;
- domain flow for simple page action;
- generic utility with unclear purpose;
- schema for trivial one-off response.

Flag abstractions that do not earn their cost.

Do not flag abstractions that clearly reduce repeated logic or enforce correct ownership.

---

### 8. Check Layer Ownership

Verify:

- assertions stay in specs or assertion helpers;
- Page Objects and Components do not use Playwright `expect`;
- Page Objects and Components do not use Allure;
- Page Objects and Components do not own test data types, builders, generators, or defaults;
- API clients do not use Playwright `expect`;
- API clients do not perform schema assertions;
- API clients do not hide behavior assertions;
- builders and generators do not use Allure;
- fixtures do not hide the action under test;
- specs import the final fixture entry point when project fixtures are needed.

Flag ownership violations as major unless they can cause false positives/negatives, in which case flag as critical.

---

### 9. API Schema Validation Review

When API files are changed, review schema validation ownership.

Check that:

- non-trivial reused response shapes use Zod when appropriate;
- Zod schemas live under `src/test/schemas/api/`;
- feature-specific assertion helpers use the shared Zod assertion helper;
- repeated Zod `safeParse` plus Playwright `expect` logic is centralized in the shared Zod assertion helper;
- specs import feature-specific assertion helpers when available;
- specs do not contain reusable Zod schemas;
- specs do not call raw `schema.parse()` directly when an assertion helper exists;
- API clients do not contain schema assertions;
- behavior assertions are not hidden inside Zod schemas;
- Zod-inferred types are used instead of duplicate manual interfaces where practical;
- optional and nullable fields preserve the intended contract behavior;
- `.strict()` is used only when the contract requires it.

Do not request Zod schemas for trivial one-off responses.

Flag as major when:

- schema validation is placed in specs, API clients, Page Objects, builders, generators, or fixtures;
- schemas assert undocumented fields without justification;
- behavior checks are hidden in schemas;
- shared Zod helper is bypassed repeatedly;
- duplicate manual runtime type checks remain in a non-trivial migrated helper.

---

### 10. API Negative Coverage Review

When API tests are changed, check whether documented negative/error behavior is covered or explicitly blocked.

Flag as major when:

- documented invalid credentials behavior is missing;
- documented required field validation is missing;
- documented invalid format validation is missing;
- documented unauthorized/forbidden behavior is missing;
- documented duplicate entity behavior is missing;
- documented invalid token behavior is missing;
- only positive API paths are implemented while documented negative cases are ignored.

Do not require negative tests for undocumented behavior.

If the contract is unclear, the correct outcome is blocked/postponed with reason, not guessed assertions.

---

### 11. UI Scenario Value Review

When UI tests are changed, check that each UI scenario has unique user-facing value.

Flag as major when:

- a UI test exists only because an element exists on the page;
- a UI test duplicates backend/API behavior without visible UI risk;
- UI tests verify backend predicates instead of visible behavior;
- a page-level smoke duplicates a journey test without clear availability/default-state value;
- many UI tests are added without planning justification.

Accept UI tests that verify:

- user journey;
- visible validation feedback;
- visible success/error feedback;
- navigation;
- browser interaction;
- frontend/backend integration visible to the user;
- behavior not reliably proven at API/schema level.

---

### 12. Check Test Data And Builders

Review generated or modified test data.

Flag as major when:

- reusable structured data is created inline in specs;
- builder defaults are invalid by default;
- negative data is hidden as default data;
- generators are used inside specs instead of data layer;
- shared static data risks collisions or backend validation failures;
- local scenario cases should be datasets because they are reused.

Do not require builders for one-off deterministic payloads.

Builder defaults must be valid by default.

Invalid or negative data must be explicit through overrides.

---

### 13. Check Fixtures And Setup

Review setup and fixture usage.

Flag as major when:

- fixtures hide the action under test;
- UI setup repeats long flows when approved lower-level setup exists;
- specs import intermediate fixture layers without project approval;
- setup validates full API contracts instead of only creating required preconditions;
- setup reads `process.env` directly in specs;
- API host is derived from UI host by heuristics.

---

### 14. Check Visual Testing

When visual changes are present, verify that:

- visual assertions stay in specs;
- functional assertion happens before screenshot assertion;
- `@visual` tag is used;
- visual checks default to `@regression`;
- baseline updates were not performed without explicit approval;
- dynamic content is handled deliberately;
- screenshot scope is meaningful.

Flag as major when:

- visual checkpoint has no meaningful visual risk;
- screenshot assertion is hidden in Page Object or Component;
- baseline update was done without approval;
- visual test replaces functional assertions.

---

### 15. Check Reporting And Metadata

When reporting metadata is changed, verify that:

- metadata is in specs or approved reporting helpers;
- Allure logic is not in Page Objects, Components, builders, generators, or API clients;
- tags are structured in Playwright details object;
- tags are not embedded in test titles;
- required layer and execution tags are present;
- feature/domain tags are registered in the project map or tag registry before use.

Flag ad-hoc tags as major when they affect filtering/reporting consistency.

---

### 16. Check Workarounds

Look for:

- `waitForTimeout`;
- fake assertions;
- fallback navigation;
- broad try/catch;
- manual retries;
- ignored overlays;
- hidden cleanup;
- comments explaining flaky behavior;
- conditional logic that masks failure.

Flag workarounds that should be fixed at root cause or moved to the correct layer.

Use critical severity for fake assertions and `waitForTimeout`.

---

## Severity

### Critical

Use critical for issues that can cause false positives, false negatives, security risk, or major architecture violation.

Examples:

- fake assertion;
- `waitForTimeout`;
- assertion hidden in API client;
- assertion hidden in Page Object;
- project-specific logic in framework core;
- secrets or `.env` values used as test data;
- test passes without actually verifying the intended behavior.

### Major

Use major for maintainability, scope, pyramid, or architecture issues.

Examples:

- UI test duplicates API/schema behavior without UI value;
- documented API negative coverage is ignored;
- reusable data inline in specs;
- unnecessary component;
- workaround in spec;
- API client created without need;
- schema validation in wrong layer;
- visual test without meaningful state;
- scope expanded beyond request.

### Minor

Use minor for readability or consistency issues.

Examples:

- unclear name;
- small repeated constant;
- step name could be clearer;
- ordering issue;
- minor import cleanup.

Only include minor findings when worth fixing now.

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
- run refactor-overengineering;
- run heal-ui-test;
- run heal-api-test;
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
- report speculative issues without evidence;
- require a fixed API:UI ratio per feature;
- request Zod schemas for trivial one-off responses;
- request builders for one-off deterministic payloads.

---

## Main Principle

Review generated code like a maintainer.

Passing tests are not enough.

Code must be clear, minimal, deduplicated, correctly layered, scoped to the request, and easy to evolve.