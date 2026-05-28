# Skill: Review UI Suite

## Goal

Use this skill for review-only audits of UI test architecture, readability, stability, and rule compliance.

This skill must not modify code.

The result of this skill is a structured review report with findings, severity, reasoning, and minimal suggested fixes.

---

## Related Rules

Follow these rules:

- Core Playwright Rules;
- Agent Workflow;
- Test Structure and Tags Rules;
- Fixtures and Test Data Rules;
- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- UI Refactoring Rules;
- UI Patterns Catalog;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Configuration and Secrets Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- reviewing a UI test suite;
- reviewing newly generated UI tests;
- reviewing Page Object or Component Object changes;
- reviewing fixture usage in UI specs;
- checking tag coverage;
- checking `test.step` clarity;
- checking whether hooks hide behavior;
- checking for overengineering;
- checking whether tests follow project architecture;
- performing audit without making changes.

---

## When NOT To Use

Do not use this skill when:

- code changes are expected immediately;
- the task is to heal a failing test;
- the task is to implement a new feature;
- the task is to create a data builder;
- the task is to decide unclear component ownership in detail.

Use other skills instead:

- use Heal UI Test when tests fail;
- use Implement UI Feature From Plan for implementation;
- use Create Test Data Builder for reusable test data;
- use Discover UI Components when Page Object or Component ownership is unclear;
- use Simplify Overengineered Test Architecture when simplification changes are requested.

---

## Inputs

Use relevant available context:

- UI spec files;
- Page Objects;
- Component Objects;
- fixtures;
- builders and generators;
- project map;
- tags registry;
- rules;
- recent changes;
- test output if available.

Do not modify files during review.

---

## Review Scope

Review the suite for:

- test structure;
- `test.step` usage;
- hook usage;
- fixture usage;
- Page Object and Component Object ownership;
- assertion ownership;
- locator strategy;
- test data usage;
- tags;
- navigation duplication;
- unnecessary abstractions;
- test isolation risks;
- flakiness risks;
- core/project boundary violations;
- import conventions.

---

## Workflow

### 1. Confirm Review-Only Mode

Before reviewing, confirm that this is an audit.

Do not apply fixes.

Do not rename files.

Do not refactor.

Do not update tests.

Output must be findings only.

---

### 2. Review Test Structure

Check whether UI specs:

- use `test.step` for meaningful user-level phases;
- avoid one huge step wrapping the whole test;
- avoid one step per low-level click;
- use clear user-intent step names;
- keep the main action under test explicit;
- avoid raw selector mechanics in specs;
- remain readable and minimal.

Flag technical step names such as:

- `Click button`;
- `Fill input`;
- `Wait`;
- `Check element`.

---

### 3. Review Hooks

Check `beforeEach` and other hooks.

Verify that hooks:

- perform only safe setup;
- do not hide the action under test;
- do not hide business flows;
- do not silently change application state;
- do not duplicate navigation already done in tests.

Safe `beforeEach` usage may include:

- page navigation;
- structural page-loaded checks;
- generic setup required for every test in the suite.

Flag hooks that perform the behavior being verified by the test.

---

### 4. Review Assertions

Check assertion ownership.

Scenario-specific assertions must be explicit in specs.

Page Objects and Component Objects must not import or use Playwright `expect`.

They may expose structural locators, markers, parsed values, or state reader methods.

Scenario-specific assertions must be explicit in specs.

Reusable assertion logic may live in dedicated assertion helpers.

Do not use methods that combine action and verification.

Flag assertions in Page Objects or Components when they:

- verify business outcomes;
- verify scenario-specific behavior;
- hide expected results;
- combine action and verification;
- make Page Objects or Components aware of product rules.

Flag method patterns such as:

- `sortAndVerify`;
- `loginAndExpectSuccess`;
- `submitAndValidate`;
- `createAndCheck`.

---

### 5. Review Fixture Usage

Check whether specs use the final fixture entry point defined by the project map.

Flag:

- direct `@playwright/test` imports in specs that require project fixtures;
- imports from intermediate fixture layers;
- manual Page Object creation in specs when Page Object fixtures exist;
- fixtures created for one-off values;
- fixtures that hide the action under test;
- component fixtures without clear justification;
- overloaded base fixtures.

Verify that fixtures remain thin and focused on setup or dependency wiring.

---

### 6. Review Tags

Check that UI tests have required tags.

Verify:

- every UI test is covered by `@ui`;
- every UI test is classified as `@smoke` or `@regression`;
- tags use Playwright details-object style;
- tags are not embedded in test title strings;
- project-specific tags are defined in the tag registry or project map.

Flag inconsistent tags such as:

- `@Smoke`;
- `@smoke-test`;
- `@regress`;
- `@ui-test`;
- ad-hoc domain tags not defined by the project.

---

### 7. Review Navigation

Check whether tests duplicate navigation already performed in `beforeEach`.

Flag:

- repeated page opening inside tests when `beforeEach` already opens the same page;
- navigation-path tests placed in suites with destination-page `beforeEach`;
- hidden navigation inside fixtures or helpers;
- Page Objects that navigate to unrelated pages.

Navigation-path tests should be grouped separately when needed.

---

### 8. Review Page Objects

Check that Page Objects:

- represent one page, screen, route, or navigation boundary;
- expose page-level user actions;
- compose Component Objects when justified;
- do not become God Page Objects;
- do not contain cross-page business flows;
- do not contain test runner logic;
- do not contain `test.step`;
- do not generate test data;
- do not read `process.env` directly;
- do not contain speculative methods.

Flag Page Objects with:

- too many unrelated methods;
- unrelated UI areas mixed together;
- selectors for multiple pages;
- business workflows;
- future-only methods;
- generic `clickElement` style methods.

---

### 9. Review Component Objects

Check that Component Objects:

- represent meaningful UI blocks;
- own component-level locators and actions;
- have clear ownership through a Page Object;
- are not exposed as fixtures by default;
- are justified by reuse, complexity, semantic boundary, or Page Object growth.

Flag components that:

- wrap a single locator;
- wrap a single button or link;
- only rename Playwright methods;
- are used once and add no readability;
- duplicate existing components;
- contain unrelated page behavior;
- contain cross-page workflows.

---

### 10. Review Locators

Check locator strategy.

Prefer:

- stable user-facing locators;
- configured `getByTestId`;
- accessible roles and names when stable.

Flag:

- fragile CSS;
- generated class names;
- XPath without justification;
- `nth-child`;
- layout-dependent selectors;
- raw selectors scattered across specs;
- direct `[data-test="..."]` usage when project uses configured `getByTestId`.

Locators should normally live in Page Objects or Component Objects.

---

### 11. Review Test Data

Check test data usage.

Flag:

- inline `Date.now()`;
- inline `Math.random()`;
- duplicated payload objects;
- reusable business data created directly in specs;
- missing builders for repeated structured data;
- unique fields not generated through generators;
- data fixtures for one-off values;
- project-specific builders placed in framework core.

Simple deterministic constants are allowed directly in specs when they describe test mechanics.

Examples:

- `sortKey = "price,asc"`;
- `expectedItemsCount = 10`;
- `searchQuery = "laptop"`.

---

### 12. Review Overengineering

Check for unnecessary abstractions.

Flag:

- components with no meaningful behavior;
- helpers with trivial one-off logic;
- utilities that only wrap Playwright methods;
- fixtures with no meaningful reuse;
- domain flows for simple page behavior;
- API-like services in UI tests;
- duplicate abstractions with overlapping responsibilities;
- abstractions created only for future possible tests.

Do not recommend removal if the abstraction clearly improves readability or isolates real complexity.

---

### 13. Review Core / Project Boundary

Check whether project-specific code leaked into framework core.

Flag core usage of:

- Page Objects for a concrete product;
- Component Objects for a concrete product;
- concrete users;
- concrete roles;
- concrete endpoints;
- selectors;
- domain models;
- project-specific builders;
- project-specific datasets;
- business flows;
- product-specific tags.

Framework core should provide mechanisms.

Project layer should own product behavior.

---

### 14. Review Test Isolation and Flakiness Risks

Look for risks such as:

- dependency on test execution order;
- shared mutable state;
- reused non-isolated accounts;
- created data without cleanup when cleanup is required;
- insufficient data preconditions;
- broad retries;
- blind timeout increases;
- hidden setup;
- environment-specific hacks.

Flag anything that may cause flaky or order-dependent behavior.

---

## Severity Model

Classify findings by severity.

### Critical

Use critical when the issue can cause false positives, false negatives, broken architecture, security risk, or major instability.

Examples:

- fake assertions;
- `waitForTimeout`;
- action under test hidden in fixture or hook;
- expected behavior changed without requirement;
- project-specific logic in framework core;
- hardcoded tokens or credentials;
- UI test depending on another test.

### Major

Use major when the issue hurts maintainability, readability, stability, or architecture but does not immediately invalidate the test.

Examples:

- weak locator strategy;
- missing required tags;
- component fixture without justification;
- God Page Object;
- scenario assertion hidden in Page Object;
- duplicated navigation;
- inline reusable random test data.

### Minor

Use minor for style, clarity, or small consistency issues.

Examples:

- unclear step name;
- inconsistent naming;
- small import convention issue;
- minor duplicated helper;
- overly verbose test step.

---

## Output Format

Return findings using this structure.

### Summary

- reviewed area:
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

List good patterns found, if any.

Examples:

- good fixture usage;
- clear `test.step` structure;
- correct Page Object composition;
- stable locators;
- good tag coverage.

### No Issues

If no issues are found, clearly state:

- no critical issues found;
- no major issues found;
- no minor issues found;
- suite follows the reviewed rules.

---

## Guardrails

Do not:

- modify files;
- apply fixes;
- rewrite tests;
- refactor Page Objects;
- create new components;
- create new rules;
- run broad implementation work;
- report speculative issues without evidence;
- require abstractions that are not justified;
- mark examples from rules as mandatory implementation.

---

## Done Criteria

This skill is complete when:

- review-only mode was respected;
- relevant specs and UI architecture files were reviewed;
- findings are classified by severity;
- every finding explains why it matters;
- every finding includes a minimal suggested fix;
- false positives are avoided;
- no code was modified;
- no issues found is explicitly stated when applicable.

---

## Main Principle

Review architecture, readability, stability, and rule compliance.

Do not change code.

Find the smallest meaningful improvements.

Prefer evidence over opinion.