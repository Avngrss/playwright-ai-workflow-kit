# Skill: Audit Test Coverage

## Goal

Use this skill to compare planned coverage against implemented tests and optional TMS mappings.

The goal is to find missing ready coverage, unplanned tests, duplicate or wrong-layer coverage, blocked/postponed violations, TMS traceability gaps, tag/layer issues, and stale coverage artifacts.

This is an **audit-only** skill.

Do not modify files unless the user explicitly requests changes during the same task.

Do not implement missing tests.

Do not delete stale tests.

Do not update TMS entities.

Do not publish results.

Do not infer missing requirements.

---

## Related Rules

Follow these rules:

- Test Strategy and Test Pyramid Rules;
- E2E Testing Rules;
- Test Structure and Tags Rules;
- TMS Integration Rules;
- Cross-Browser and Responsive Testing Rules;
- Test Abstraction Hygiene Rules;
- Agent Workflow;
- Project Map Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- a feature plan or E2E journey plan exists and implementation may be incomplete;
- after planning and implementation batches to verify plan-to-test alignment;
- before cleanup or starter conversion to identify stale or unplanned coverage;
- TMS Source or TMS Mapping sections exist and traceability must be checked;
- duplicate API/UI/E2E coverage is suspected;
- blocked or postponed scenarios may have been implemented accidentally;
- tag or layer ownership needs verification against the project map.

---

## When NOT To Use

Do not use this skill when:

- the task is to implement missing tests;
- the task is to heal a failing test;
- the task is to review code quality of recent diffs only (use Review Generated Code Quality);
- the task is to align a plan with TMS (use Align Feature Plan With TMS);
- the task is to create or update a feature plan (use Plan Test Coverage);
- no plan and no tests exist yet.

Use other skills instead:

- use Plan Test Coverage to create or expand feature coverage plans;
- use Plan E2E Journey for full-journey planning;
- use Align Feature Plan With TMS for TMS alignment in plans;
- use Review Generated Code Quality for architecture/code review of changed files;
- use Implement API/UI/E2E skills when implementation is requested.

---

## Inputs

Collect relevant available context:

### Plans

- `specs/<feature>.md` — feature coverage plan (API, UI, schema, visual, not automated)
- `specs/e2e/<journey>.md` — E2E journey plan (full user/business flows only)

### Implemented tests

- `tests/api/**`
- `tests/ui/**`
- `tests/e2e/**`

Optional narrow scope:

- specific spec paths provided by the user

### Supporting implementation

- `src/test/**` — Page Objects, fixtures, builders, schemas, assertion helpers, clients (only when needed to trace coverage ownership or stale artifacts directly tied to coverage)

### TMS (when present in plan)

- TMS Source section
- TMS Mapping section

### Project conventions

- `.cursor/rules/00-project-map.mdc` — tags, projects, paths, env ownership, fixture entry point

Do not read `process.env` in specs during audit.

Do not use TMS write APIs.

Do not publish test results.

---

## Audit Categories

Classify findings into these categories:

1. **Planned ready coverage implemented** — scenario marked ready to implement now in plan and covered by appropriate test(s)
2. **Planned ready coverage missing** — scenario marked ready to implement now but no matching test found
3. **Implemented but not planned** — test exists without plan justification or outside plan scope
4. **Blocked/postponed but implemented** — plan marks blocked/postponed but test was implemented anyway
5. **Duplicate API/UI/E2E coverage** — same behavior verified at multiple layers without distinct risk
6. **Wrong layer ownership** — behavior at wrong level (for example short UI flow tagged `@e2e`, API contract checked only in UI, E2E duplicating focused UI without journey value)
7. **TMS case mapped but not covered** — TMS Mapping points to automation but no matching test
8. **Covered conceptually but with different data** — behavior appears covered but not with planned scenario data, endpoint, or assertion marker
9. **Tests with missing/wrong tags** — missing required layer or execution tags, forbidden browser/device tags, unregistered feature tags, E2E tagged `@ui`, full journey missing `@e2e`
10. **Tests not matching project map conventions** — wrong spec location, wrong suffix, wrong Playwright project target, fixture import bypass, env read in spec
11. **Stale helpers or implementation artifacts** — only when directly tied to removed or unplanned coverage (unused Page Object, schema, helper, or client with no spec consumer)

---

## Workflow

### 1. Identify Audit Scope

Determine what is being audited:

- one feature plan;
- one E2E journey plan;
- both for a related area;
- optional narrowed test paths.

Record:

- plan path(s);
- related test paths;
- whether TMS sections exist;
- whether audit is feature-level, E2E-level, or combined.

If no plan exists and tests do, audit as **implemented but not planned** review only.

If plan exists and no tests do, audit as **planned ready coverage missing** review only.

---

### 2. Extract Planned Scenarios

From the feature plan, extract each planned scenario with:

- scenario name or id;
- recommended level (API, UI, schema/contract, visual, not automated);
- status (ready to implement now, blocked, postponed, not automated);
- smoke/regression intent when documented;
- target UI app, API service, or precondition service when documented;
- planned spec location or naming hint when documented;
- TMS case id when TMS Mapping exists.

From the E2E journey plan, extract each journey scenario with:

- scenario name;
- status (ready to implement now or blocked — E2E plans must not use conditional readiness);
- final assertion marker;
- setup/cleanup notes;
- why lower-level coverage is insufficient.

Do not treat implementation-detail rows as standalone scenarios.

---

### 3. Inventory Implemented Tests

List relevant specs and classify each test by:

- file path and project target (`api`, `ui-chromium`, `e2e`);
- test title;
- tags (`@api`, `@ui`, `@e2e`, `@visual`, `@smoke`, `@regression`, registered feature/coverage tags);
- primary behavior under verification;
- supporting files in `src/test/**` when needed for ownership or staleness.

Use `npm run test:list` when helpful to enumerate discovered tests without executing them.

Do not run full test suites unless the user explicitly requests execution evidence.

---

### 4. Map Plan To Tests

For each planned scenario marked **ready to implement now**:

- find matching test(s) by behavior, level, and documented scope;
- prefer explicit plan references, spec paths, or TMS mapping links when present;
- accept conceptual match when behavior and level align even if title differs;
- flag **covered conceptually but with different data** when behavior matches but endpoint, payload, user path, or assertion marker differs materially from the plan.

For each implemented test:

- find plan justification;
- if none, classify as **implemented but not planned** or **duplicate** when another test already covers the same risk at the same layer.

Do not assume one plan scenario equals exactly one Playwright test.

One plan scenario may map to multiple tests.

One test may satisfy multiple closely related plan rows only when plan intent clearly allows it.

---

### 5. Check Blocked, Postponed, and Not Automated

Verify plan discipline:

- blocked or postponed scenarios must not have implementing tests unless the plan was updated with new evidence (report plan/test mismatch; do not infer approval);
- not automated scenarios must not have automated tests unless plan is stale;
- E2E scenarios marked blocked must not exist in `tests/e2e/**`.

---

### 6. Check Duplicate and Wrong-Layer Coverage

Compare coverage across layers for the same behavior:

- API plus UI verifying the same backend-only contract without UI-visible risk;
- UI plus E2E where E2E adds no journey value beyond focused UI;
- API plus schema-only duplication without distinct purpose;
- visual checkpoint duplicating functional assertion without visual risk.

Flag **wrong layer ownership** when:

- short page/form/control tests are tagged `@e2e`;
- full journeys are tagged only `@ui`;
- API contract validation lives only in UI or E2E without plan justification;
- E2E hides journey in fixtures/hooks while plan requires visible journey steps.

Use test pyramid rules; do not require a fixed API:UI ratio.

---

### 7. Check TMS Traceability (When Applicable)

When TMS Source and TMS Mapping exist:

- each mapped case with automation decision API/UI/schema/visual/E2E should trace to a test or explicit ready plan row;
- cases marked not automated, blocked, or postponed must not appear fully automated without plan update;
- note **TMS case mapped but not covered**;
- note automated tests with no TMS mapping when traceability is expected for the feature.

Do not update TMS.

Do not add TMS IDs to tests during audit.

---

### 8. Check Tags and Project Map Conventions

Verify against project map tag registry and path conventions:

- required layer tag present (`@api`, `@ui`, `@e2e`, `@visual` when applicable);
- required execution tag present (`@smoke` or `@regression`);
- E2E full journeys use `@e2e`, not `@ui` by default;
- no forbidden browser/device tags;
- `@cross-browser` or `@responsive` only when registered and planned;
- spec suffix and folder match map (`*.api.spec.ts`, `*.ui.spec.ts`, `*.e2e.spec.ts`);
- specs import final fixture entry point when fixtures exist;
- no `process.env` in specs.

---

### 9. Check Stale Coverage Artifacts (Limited)

Only when directly tied to coverage gaps:

- Page Objects, components, schemas, assertion helpers, clients, builders, or datasets with no spec consumer;
- tests referencing removed plan scenarios;
- plan rows pointing to spec paths that no longer exist.

Do not recommend broad cleanup unrelated to coverage alignment.

---

### 10. Build Coverage Matrix

Produce a matrix linking plan scenarios to tests.

Minimum columns:

- plan scenario;
- level;
- plan status;
- matched test(s) or `none`;
- audit category;
- notes.

Optional TMS column when mapping exists.

---

## Guardrails

Do not:

- modify files unless explicitly requested;
- implement missing tests;
- delete stale tests or helpers;
- update plans automatically;
- update TMS entities;
- publish results;
- weaken assertions;
- infer undocumented requirements, status codes, or validation messages;
- guess missing plan justification without evidence;
- run broad refactoring;
- treat code review as a substitute for coverage alignment.

If contract or product behavior is unclear, report **blocked** or **needs plan update** — do not invent coverage.

---

## Output Format

Use this structure:

### Summary

- audit scope:
- plans reviewed:
- tests reviewed:
- TMS included: yes/no
- overall coverage alignment:
- highest-risk gaps:

### Coverage Matrix

| Plan scenario | Level | Plan status | Test(s) | Category | Notes |
|---|---|---|---|---|---|

### Planned Ready Coverage Implemented

- scenario:
- test(s):
- notes:

### Planned Ready Coverage Missing

- scenario:
- level:
- plan reference:
- recommended next command:

### Implemented But Not Planned

- test:
- behavior:
- suggested action: add to plan / remove test / merge / investigate

### Blocked/Postponed Violations

- plan scenario:
- status in plan:
- violating test(s):
- suggested action:

### Duplicate Coverage Risks

- behavior:
- layers/tests involved:
- distinct risk kept at:
- suggested action:

### Wrong Layer Ownership

- test:
- current layer:
- expected layer:
- reason:

### TMS Traceability Gaps

- case id:
- mapping decision:
- gap:
- suggested action:

### Tag and Convention Issues

- file/test:
- issue:
- project map rule:

### Stale Coverage Artifacts

- artifact:
- reason stale:
- tied test/plan gap:

### Recommended Cleanup or Implementation Batches

Group follow-up work into small batches, for example:

- implement missing ready API batch;
- implement missing ready UI batch;
- implement ready E2E journey;
- update feature plan for unplanned tests;
- align TMS mapping;
- remove or retag wrong-layer tests;
- refactor stale helpers after coverage decision.

Do not execute batches during audit.

### Recommended Next Command

Choose one primary next step, for example:

- `/implement-api-batch`
- `/implement-ui-batch`
- `/implement-e2e-flow`
- `/plan-feature`
- `/plan-e2e-journey`
- `/align-plan-with-tms`
- `/review-generated`
- `/refactor-overengineering`
- `/update-project-map`
- user decision required

---

## Done Criteria

This skill is complete when:

- scope and inputs were identified;
- planned scenarios and implemented tests were inventoried;
- findings were classified into audit categories with evidence;
- coverage matrix was produced;
- missing ready coverage and unplanned tests were listed;
- duplicate, wrong-layer, blocked/postponed, TMS, tag, and stale-artifact issues were reported when applicable;
- recommended next command was named;
- no files were modified unless explicitly requested.

---

## Main Principle

Coverage audit compares intent to implementation.

Plans and TMS mappings describe what should exist.

Tests describe what was built.

Report gaps and mismatches with evidence.

Recommend the smallest next workflow command.

Do not implement or delete during audit.
