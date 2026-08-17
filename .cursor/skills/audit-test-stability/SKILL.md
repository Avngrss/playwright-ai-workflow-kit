# Skill: Audit Test Stability

## Goal

Use this skill to detect flaky-test patterns, weak synchronization, hidden user journeys, debug artifacts, data instability, and environment-driven test workarounds in UI and E2E automation.

The goal is to find stability risks before they become intermittent CI failures.

This is an **audit-only** skill.

Do not modify files unless the user explicitly requests changes during the same task.

Do not fix tests.

Do not add retries.

Do not weaken assertions.

Do not add waits.

Do not install browsers.

Do not run broad test suites unless the user explicitly requests execution evidence.

---

## Related Rules

Follow these rules:

- Core Playwright Rules;
- Flakiness Policy Rules;
- E2E Testing Rules;
- Test Structure and Tags Rules;
- Test Isolation and State Rules;
- Page Object and Component Object Core Rules;
- Fixtures and Test Data Rules;
- Diagnostics and Reporting Rules;
- Agent Workflow;
- Project Map Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- after UI or E2E implementation batches;
- before committing new or changed UI/E2E tests;
- after a failed run when static code review may reveal root-cause patterns;
- when tests pass locally but look unstable on review;
- when retry logic, sleeps, or weak assertions are suspected;
- when E2E journeys may hide steps in fixtures, hooks, or Page Objects;
- when shared data, missing cleanup, or external dependencies may cause instability.

---

## When NOT To Use

Do not use this skill when:

- the task is to fix a failing test (use Heal UI Test or Heal API Test);
- the task is to compare plan vs implemented coverage (use Audit Test Coverage);
- the task is code-quality review of recent diffs only (use Review Generated Code Quality);
- the task is broad UI suite architecture review without stability focus (use Review UI Suite);
- only API tests changed and no UI/E2E stability risk exists.

Use other skills instead:

- use Heal UI Test to fix failing or flaky UI tests;
- use Heal API Test to fix failing API tests;
- use Audit Test Coverage for plan-to-test alignment;
- use Review Generated Code Quality for architecture and scope review of changed files;
- use Review UI Suite for broader UI suite maintainability audits.

---

## Inputs

Collect relevant available context:

### Tests

- `tests/ui/**`
- `tests/e2e/**`

Optional narrow scope:

- specific spec paths provided by the user

### Supporting implementation

- `src/test/pages/**` — Page Objects used by audited specs
- `src/test/components/**` — Component Objects when referenced by audited flows
- `src/test/fixtures/**` — fixture setup that may hide journeys or create unstable state
- `src/test/assertions/**` — assertion helpers that may weaken or hide verification

Review `src/test/**` layers beyond the list above only when directly referenced by audited UI/E2E specs.

### Configuration and conventions

- `playwright.config.ts` — projects, retries, timeouts, trace/video settings (read-only context; do not modify)
- `.cursor/rules/00-project-map.mdc` — fixture entry point, projects, isolation conventions

### Optional failure evidence

- recent verification report;
- failed spec output;
- trace, screenshot, or HTML report summary when provided by the user.

Do not install browsers to reproduce failures during audit.

Do not publish test results.

---

## Audit Categories

Classify findings into these categories:

### 1. Forbidden waits

- `waitForTimeout`
- arbitrary sleeps or fixed delays
- polling loops without a clear observable condition
- busy-wait patterns that mask missing readiness checks

### 2. Retry anti-patterns

- repeated click loops until something happens
- `try/catch` around clicks or navigation used as retry
- explicit “attempt N times” user-action logic
- retrying user actions instead of waiting for observable UI, network, or navigation result

### 3. Weak assertions

- URL-only as final proof of completed behavior
- no assertion after a meaningful user action
- no final business outcome assertion in E2E
- no visible state assertion where user-visible outcome is the risk
- “no error appeared” or absence-only checks as the only proof
- fake assertions that always pass

### 4. Synchronization issues

- click without waiting for expected result state
- navigation without waiting for destination readiness marker
- overly broad network waits unrelated to the action under test
- stale locator reused after DOM update or rerender
- missing visible or enabled checks before critical actions
- assertion before UI is in a stable ready state
- race between setup and first action

### 5. Hidden flow

- full E2E journey hidden in fixture, `beforeEach`, or helper
- Page Object method hides the whole journey under test
- API setup replaces the UI action under test instead of creating preconditions only
- domain flow wrapper hides scenario steps required to stay visible in specs

### 6. Debug artifacts

- `throw new Error("debug...")` or similar debug throws left in code
- `page.pause()`
- console-only diagnostics left in committed tests or Page Objects, except approved sort/filter success diagnostics in assertion helpers
- temporary debug scripts referenced by tests
- screenshots, traces, or videos used as test logic instead of diagnostics

### 7. Data instability

- shared mutable users or accounts
- fixed global entities modified by parallel runs
- non-unique emails, names, or entity identifiers when uniqueness is required
- missing cleanup or isolation for destructive flows (password reset, checkout, profile update, order creation)
- test order dependency or state leaking between tests

### 8. Environment/config confusion

- missing browser binary or runner setup treated as a test defect in code comments or weakened assertions
- Playwright project or spec path mismatch bypassed by moving tests instead of fixing config
- assertions weakened because environment failed instead of fixing setup/config
- specs reading `process.env` directly against project map rules

### 9. E2E-specific stability

- external dependency not controlled (email inbox, payment, captcha, third-party auth)
- password reset, payment, or reset-link flow not deterministic
- final confirmation marker unstable or too weak for journey completion
- cleanup or isolation strategy missing for destructive E2E flows
- timing assumptions on external delivery or async backend propagation without stable UI marker

---

## Workflow

### 1. Identify Audit Scope

Determine what is being audited:

- specific spec paths;
- a UI feature folder;
- an E2E journey folder;
- all UI/E2E tests when no narrow scope is given.

Record:

- spec paths reviewed;
- related Page Objects, fixtures, and assertion helpers;
- whether failure evidence was provided;
- whether audit is UI-only, E2E-only, or both.

If no UI/E2E tests exist in scope, report that audit cannot produce stability findings and stop.

---

### 2. Scan Specs For Stability Signals

Review spec files for:

- forbidden waits and retry loops;
- weak or missing assertions after actions;
- hidden journey steps in hooks or helpers;
- debug artifacts;
- raw selector mechanics that bypass Page Objects when project structure expects encapsulation;
- `test.step` visibility of user journey phases;
- tag correctness for layer (`@ui`, `@e2e`) when relevant to stability expectations.

Prefer evidence from code, not assumptions about runtime behavior.

---

### 3. Review Supporting Layers

When specs call into supporting code, review only referenced files for stability risks:

- Page Objects and Components — retry loops, sleeps, hidden assertions, debug code;
- fixtures — hidden login, hidden navigation, hidden business flows, shared mutable state;
- assertion helpers — weakened checks, absence-only proof, URL-only helpers for E2E outcomes.

Do not perform broad unrelated refactors.

Do not audit API-only layers unless referenced by audited UI/E2E setup in scope.

---

### 4. Check Configuration Context

Read `playwright.config.ts` and project map for context only:

- whether spec paths match intended projects (`ui-chromium`, `e2e`);
- whether retries/timeouts explain intermittent passes;
- whether missing project/browser configuration could be misdiagnosed as product flakiness.

Do not modify config during audit.

Report config gaps separately from test-code flakiness.

---

### 5. Correlate Optional Failure Evidence

When a failed spec or report is provided:

- map failure point to audit category;
- distinguish product defect from synchronization defect from data defect from environment defect;
- note if static code already predicted the failure pattern.

Do not rerun full suites unless explicitly requested.

---

### 6. Classify Severity

Use three severity levels:

**Critical** — likely false pass/fail, hidden verification, or high intermittent failure risk.

Examples:

- `waitForTimeout` used to stabilize test;
- fake assertion;
- E2E final outcome not verified;
- full journey hidden in fixture/hook;
- shared mutable user in parallel suite;
- destructive E2E without cleanup/isolation;
- assertions weakened to mask environment failure.

**Major** — meaningful stability or maintainability risk.

Examples:

- retry-click loop;
- URL-only E2E proof;
- missing readiness assertion before critical action;
- API setup replacing UI action under test;
- non-unique data where collisions are likely;
- unstable external dependency in E2E without control strategy.

**Minor** — worth fixing but lower immediate flake risk.

Examples:

- debug `console.log` left in spec;
- approved sort/filter `console.info` diagnostics missing from assertion helpers when sort/filter coverage was added or changed;
- slightly weak step naming that hides verification intent;
- broad network wait that currently passes but is fragile;
- missing `test.step` structure without direct sync risk.

Only include minor findings when worth fixing now.

---

### 7. Recommend Fix Strategy (Do Not Apply)

For each finding, recommend the smallest correct fix strategy, such as:

- replace sleep with web-first assertion on stable UI marker;
- move hidden journey steps back into spec;
- add visible final outcome assertion;
- use disposable unique data or approved cleanup;
- fix Playwright project/config alignment;
- mark E2E blocked until external dependency is controlled;
- use Heal UI Test for targeted fix after audit.

Do not apply fixes during audit.

---

## Guardrails

Do not:

- modify files unless explicitly requested;
- fix tests;
- add retries;
- weaken assertions;
- add waits;
- install browsers;
- run broad suites unless asked;
- mask instability with timeout increases;
- treat audit as implementation;
- infer product requirements to justify weak assertions;
- delete debug code during audit unless explicitly requested.

If expected behavior or environment ownership is unclear, report **needs clarification** — do not guess fixes.

---

## Output Format

Use this structure:

### Summary

- audit scope:
- specs reviewed:
- supporting files reviewed:
- failure evidence used: yes/no
- overall stability status:
- highest-risk patterns:

### Critical Flaky Risks

For each finding:

- file:
- pattern:
- root-cause category:
- why it matters:
- recommended fix strategy:

### Major Stability Risks

For each finding:

- file:
- pattern:
- root-cause category:
- why it matters:
- recommended fix strategy:

### Minor Maintainability Risks

Include only when worth fixing now.

For each finding:

- file:
- pattern:
- root-cause category:
- recommended fix strategy:

### Affected Files

- list of spec and supporting files with findings

### Root-Cause Category Summary

Count or list findings by audit category 1–9.

### Recommended Fix Strategy

Grouped by category or file batch.

Do not apply fixes during audit.

### Recommended Next Command

Choose one primary next step, for example:

- `/heal-ui-test`
- `/heal-api-test`
- `/review-generated`
- `/audit-test-coverage`
- `/refactor-overengineering`
- `/plan-e2e-journey`
- user decision required

Use `/heal-ui-test` when the audit found stability defects and the user wants actual fixes.

---

## Done Criteria

This skill is complete when:

- audit scope and inputs were identified;
- UI/E2E specs and referenced supporting files were reviewed;
- findings were classified by audit category and severity with evidence;
- affected files and root-cause categories were reported;
- fix strategies were recommended without applying them;
- recommended next command was named;
- no files were modified unless explicitly requested.

---

## Main Principle

Stability audit finds patterns that cause intermittent failure before they spread.

Report evidence-based risks.

Recommend root-cause fixes at the correct layer.

Do not heal, weaken, or wait during audit.
