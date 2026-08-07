# Skill: Heal UI Test

## Goal

Use this skill when one or more UI tests fail and require minimal, correct fixes.

The goal is to identify the real root cause and fix it at the correct layer without masking the failure.

Healing must be minimal, targeted, and evidence-based.

---

## Related Rules

Follow these rules:

- Core Playwright Rules;
- Test Structure and Tags Rules;
- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- Fixtures and Test Data Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Configuration and Secrets Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Agent Workflow;
- Temporary Debug Artifact Cleanup Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- one or more UI tests fail;
- a locator no longer finds the target element;
- a UI assertion times out;
- navigation does not reach the expected page;
- setup or fixture state is incorrect;
- test data is invalid, missing, or insufficient;
- UI behavior changed and the test must be reviewed;
- the test is flaky and needs root-cause healing;
- a previous fix masked the real problem.

---

## When NOT To Use

Do not use this skill when:

- the task is to implement a new feature test;
- the task is to refactor Page Objects without a failing test;
- the failure is unrelated to UI tests;
- the requirement is unknown and expected behavior cannot be safely determined;
- the fix would require a broad redesign before investigation.

If expected behavior is unclear, stop and report the ambiguity.

Do not guess product behavior.

---

## Inputs

Use relevant available context:

- failing test output;
- failing step name;
- error message;
- stack trace;
- Playwright trace;
- screenshot;
- video;
- HTML report;
- affected spec;
- Page Object;
- Component Object;
- fixtures;
- test data builder or generator;
- project map;
- relevant rules;
- recent code changes.

Use Playwright MCP only when repository files and failure artifacts are not enough to understand the UI state.

---

## Workflow

### 1. Identify the Failing Test and Step

Identify:

- failing spec file;
- failing test title;
- failing `test.step`;
- failing assertion or action;
- exact error message;
- stack trace location;
- affected locator or method;
- whether the failure is reproducible or flaky.

Expected output:

- failing area is known;
- failing step is known;
- failing layer candidate is known.

---

### 2. Read the Failure Evidence

Inspect available evidence before changing code.

Use:

- test output;
- trace;
- screenshot;
- video;
- console logs;
- network errors;
- HTML report;
- CI logs.

Do not apply a fix before understanding what failed.

Do not change code based only on assumptions.

---

### 3. Classify Root Cause

Classify the failure into one or more categories.

Possible categories:

- locator issue;
- timing or async UI update;
- navigation issue;
- setup issue;
- fixture issue;
- test data issue;
- insufficient data precondition;
- assertion mismatch;
- environment/configuration issue;
- authentication/session issue;
- application behavior change;
- product requirement change;
- test isolation or shared state issue;
- external dependency issue.

If root cause is unclear, do not guess.

Collect more evidence or report the blocker.

---

## Root Cause Guidance

### Locator Issue

Signs:

- locator resolves to zero elements;
- locator resolves to multiple unexpected elements;
- accessible name changed;
- test id changed;
- UI structure changed;
- element moved into another component.

Fix location:

- Page Object;
- Component Object;
- locator strategy.

Preferred fix:

- update locator to stable user-facing locator or configured test id;
- keep raw selectors out of specs;
- avoid fragile CSS and XPath unless no reliable alternative exists.

Do not fix by adding sleeps.

---

### Timing or Async UI Update

Signs:

- assertion times out;
- element appears later;
- data loads after network response;
- UI updates after animation or async state change.

Fix location:

- spec assertion;
- Page Object action;
- Component Object action;
- loaded-state marker.

Preferred fix:

- use Playwright web-first assertions;
- wait for specific visible UI state;
- wait for meaningful application state;
- improve structural readiness check if needed.

Do not use `waitForTimeout`.

Do not blindly increase timeout.

---

### Navigation or Setup Issue

Signs:

- test starts on wrong page;
- page did not load;
- URL is unexpected;
- `beforeEach` setup failed;
- repeated navigation conflicts with hook navigation.

Fix location:

- spec;
- hook;
- Page Object navigation method;
- fixture setup.

Preferred fix:

- keep `beforeEach` limited to safe navigation and page-loaded checks;
- do not hide action under test in hooks;
- avoid repeating navigation already done in `beforeEach`;
- keep navigation-path tests in separate `describe` blocks when needed.

---

### Test Data Issue

Signs:

- required entity does not exist;
- form data is invalid;
- generated value is not unique;
- dataset is insufficient;
- sorting/filtering test has too few items;
- test depends on dynamic uncontrolled data.

Fix location:

- builder;
- generator;
- dataset;
- data fixture;
- setup helper.

Preferred fix:

- use builders for reusable structured data;
- use generators for unique primitive values;
- avoid inline random data in specs;
- add data preconditions where behavior requires enough data.

Do not mask insufficient data with fake assertions.

---

### Assertion Mismatch

Signs:

- actual UI behavior differs from expected assertion;
- assertion checks too much;
- assertion checks unstable exact data;
- assertion belongs to wrong layer;
- product behavior may have changed.

Fix location:

- spec;
- assertion helper;
- structural Page Object assertion only when appropriate.

Preferred fix:

- keep scenario-specific assertions in specs;
- use invariant-based assertions for dynamic lists;
- verify essential behavior, not unstable incidental details;
- confirm requirement before changing expected behavior.

Do not weaken assertions just to pass.

Do not use fake assertions.

---

### Environment or Configuration Issue

Signs:

- base URL is wrong;
- credentials are missing;
- feature flag differs;
- environment data differs;
- auth state is invalid;
- CI-only failure.

Fix location:

- config provider;
- fixtures;
- auth provider;
- project map;
- CI configuration.

Preferred fix:

- do not hardcode environment values;
- do not read `process.env` in Page Objects or Components;
- resolve configuration through approved providers;
- protect secrets and tokens.

Do not patch specs with environment-specific hacks.

---

### Test Isolation or Shared State Issue

Signs:

- test passes alone but fails in suite;
- test depends on previous test;
- shared account state changes;
- created data conflicts with another test;
- failure appears only in parallel execution.

Fix location:

- fixture scope;
- data generation;
- setup/cleanup;
- storage state;
- test isolation strategy.

Preferred fix:

- make data unique;
- clean up created data when needed;
- avoid global mutable state;
- avoid test order dependency;
- isolate accounts, roles, or storage state where needed.

---

## 4. Choose the Correct Fix Layer

Apply the fix in the smallest correct layer.

Use this guidance:

- broken selector: Page Object or Component Object;
- wrong user action abstraction: Page Object or Component Object;
- wrong scenario step: spec;
- wrong scenario assertion: spec;
- reusable structural readiness issue: Page Object or Component Object;
- invalid reusable data: builder, generator, or dataset;
- wrong fixture wiring: fixture layer;
- wrong config/env value: config provider or project map;
- repeated cross-page business setup: project flow only if already justified;
- flaky shared state: test isolation, data, fixture scope, or cleanup.

Do not fix everything in the spec.

Do not fix everything in Page Objects.

Do not introduce new abstractions unless the root cause requires it.

---

## 5. Apply Minimal Fix

Apply the smallest change that addresses the root cause.

Rules:

- keep changes minimal and targeted;
- do not modify unrelated files;
- do not refactor while healing unless necessary;
- do not add speculative methods;
- do not introduce component fixtures by default;
- do not move business flows into Page Objects;
- do not move action under test into hooks or fixtures;
- do not bypass project map.

---

## 6. Re-run Targeted Verification

After the fix, run the smallest impacted verification first.

Recommended order:

1. re-run the impacted spec;
2. re-run related specs if shared Page Object, Component Object, fixture, or data builder was changed;
3. run the repository quality gate command defined by the project map.

4. remove temporary discovery/debug artifacts created during healing.

Rule reference:

- `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`

If the repository command is `npm run qa:gate`, run it after targeted verification.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## 7. Harden Only If Needed

After healing, consider whether the failure reveals a reusable pattern or recurring risk.

Harden only when justified.

Possible hardening actions:

- improve a rule;
- improve a skill;
- improve a builder;
- improve a generator;
- improve a locator pattern;
- add a missing structural readiness check;
- improve diagnostics;
- update project map.

Do not add new rules or abstractions for one-off failures.

---

## Guardrails

Do not:

- use `waitForTimeout`;
- add fake assertions;
- blindly increase timeouts;
- blindly increase retries;
- weaken assertions to make tests pass;
- change expected behavior unless the spec or requirement is wrong;
- hide action under test in fixtures;
- hide action under test in hooks;
- move scenario verification into Page Objects;
- add broad `try/catch` that swallows errors;
- ignore failing setup;
- patch around broken test data;
- create new components or flows unless the root cause requires it;
- modify unrelated files.

---

## Assertion Policy

Scenario-specific assertions belong in specs.

Page Objects and Component Objects must not import or use Playwright `expect`.

They may expose structural locators, markers, parsed values, or state reader methods.

Scenario-specific assertions must be explicit in specs.

Reusable assertion logic may live in dedicated assertion helpers.

Do not use methods that combine action and verification.

Business assertions must not be hidden inside Page Objects or Component Objects.

Do not use methods that combine action and verification, such as:

- `submitAndVerify`;
- `loginAndExpectSuccess`;
- `sortAndVerify`;
- `createOrderAndValidate`.

Keep the action and the verification explicit in the spec.

---

## Output Format

When reporting the healing result, use this structure:

### 1. Failing Test

- spec:
- test:
- failing step:
- error:

### 2. Root Cause

- category:
- evidence:
- affected layer:

### 3. Fix Applied

- files changed:
- summary:
- why this layer was correct:

### 4. Verification

- targeted spec run:
- related tests run:
- quality gate:
- not run reason, if any:

### 5. Hardening

- needed: yes or no;
- action taken or postponed;
- reason:

---

## Done Criteria

This skill is complete when:

- failing step was identified;
- root cause was classified;
- fix was applied at the correct layer;
- change was minimal and targeted;
- no forbidden workaround was introduced;
- impacted spec was re-run or documented as not run;
- quality gate was run or documented as not run;
- temporary debug scripts and discovery dumps created during healing were removed or explicitly preserved by user request;
- hardening was considered only for reusable learnings.

---

## Anti-Patterns

Avoid:

- adding `waitForTimeout`;
- changing expected text without checking requirement;
- replacing meaningful assertions with weak assertions;
- adding `expect(true).toBeTruthy()`;
- moving test actions into `beforeEach`;
- moving test actions into fixtures;
- fixing locator issues directly in specs when Page Object exists;
- creating a new component during healing without clear ownership need;
- broad refactoring during healing;
- ignoring trace or screenshot evidence;
- assuming environment behavior without checking config;
- hiding failures with `try/catch`.

---

## Main Principle

Healing means fixing the root cause.

Do not mask the symptom.

Do not broaden the change.

Do not guess.

Use evidence, correct layer ownership, minimal change, and targeted verification.