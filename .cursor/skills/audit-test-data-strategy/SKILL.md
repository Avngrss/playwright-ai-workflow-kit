# Skill: Audit Test Data Strategy

## Goal

Use this skill to assess the safety and maintainability of test data strategy across plans, specs, builders, generators, datasets, fixtures, and E2E flows.

The goal is to find shared mutable data risks, missing cleanup or isolation, improper random data usage, builder/generator/fixture misuse, and destructive flows without a documented data policy.

This is an **audit-only** skill.

Do not modify files unless the user explicitly requests changes during the same task.

Do not create builders, generators, datasets, or fixtures.

Do not change tests.

Do not delete data.

Do not mutate environment values.

Do not update TMS entities.

Do not infer cleanup mechanisms without evidence from plans, code, or project conventions.

---

## Related Rules

Follow these rules:

- Fixtures and Test Data Rules;
- Test Data Generation Rules;
- Test Isolation and State Rules;
- E2E Testing Rules;
- Test Strategy and Test Pyramid Rules;
- Multi-Target Environment Rules;
- Configuration and Secrets Rules;
- Test Abstraction Hygiene Rules;
- Code Quality and Cleanliness Rules;
- Agent Workflow;
- Project Map Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- before implementing E2E journeys with setup, persistence, or destructive state;
- before adding destructive flows (checkout, password reset, profile update, order creation, account deletion);
- before cleanup or starter conversion when data ownership must be verified;
- after implementation when shared users, carts, orders, or fixed entities are suspected;
- when inline random data, duplicated generation logic, or fixture bloat is suspected;
- when parallel-run collisions or test-order dependency may exist;
- when multi-target env ownership for data setup is unclear.

---

## When NOT To Use

Do not use this skill when:

- the task is to create a builder or generator (use Create Test Data Builder);
- the task is to create or wire fixtures (use Create Fixture);
- the task is to fix a failing test (use Heal UI Test or Heal API Test);
- the task is flaky-pattern audit only (use Audit Test Stability);
- the task is plan-to-test coverage alignment (use Audit Test Coverage);
- the task is code-quality review of recent diffs only (use Review Generated Code Quality).

Use other skills instead:

- use Create Test Data Builder to add reusable structured data;
- use Create Fixture for approved fixture wiring;
- use Plan E2E Journey when destructive-flow data policy is missing from journey plans;
- use Audit Test Stability for synchronization and flaky-pattern risks;
- use Audit Test Coverage for missing or unplanned coverage;
- use Heal UI Test or Heal API Test when fixes are requested after audit.

---

## Inputs

Collect relevant available context:

### Plans

- `specs/<feature>.md` — data/setup notes, ready/blocked status, target service ownership when documented
- `specs/e2e/<journey>.md` — setup strategy, test data strategy, cleanup or isolation strategy, external dependencies

### Tests

- `tests/api/**`
- `tests/ui/**`
- `tests/e2e/**`

Optional narrow scope:

- specific plan paths, spec paths, or data folders provided by the user

### Data layer

- `src/test/data/**` — builders, generators, datasets, types (when present)
- common project paths when map differs: builders, generators, datasets under approved data locations documented in project map

### Fixtures and UI setup

- `src/test/fixtures/**` — fixture wiring, hidden setup, shared state
- `src/test/pages/**` — only when Page Objects contain test data generation, defaults, or hidden setup (normally they should not)

Review other `src/test/**` layers only when directly referenced by audited specs or data flow.

### Conventions and environment model

- `.cursor/rules/00-project-map.mdc` — fixture entry point, env names, multi-target ownership, test asset rules
- `.env.example` — env model placeholders only; never read or use real secrets
- multi-target env rules when more than one UI app or API service exists

Do not read real `.env` values during audit.

Do not commit or document secrets.

Do not mutate environment configuration.

---

## Audit Categories

Classify findings into these categories:

### 1. Shared mutable data

- shared users or credentials reused across parallel tests
- shared accounts with mutable profile, cart, or order state
- shared carts, orders, products, or entities modified by multiple tests
- fixed global entities that tests mutate instead of creating disposable data
- static datasets used as writable state instead of read-only reference data

### 2. Isolation

- disposable data strategy present when needed
- unique email, name, id, or entity strategy when collisions would fail tests
- parallel-run safety for created data
- test order independence; no dependency on state from another test
- storage state or session reuse that leaks mutable state between tests

### 3. Cleanup

- cleanup strategy documented and implemented when destructive or mutable data affects others
- destructive flows have cleanup, disposable data, or explicit isolation decision
- cleanup does not hide business assertions or replace verification
- cleanup does not mutate unrelated shared data
- cleanup is safe to retry and scoped to data created by the test

### 4. Data generation

- inline random or unique data in specs (`Date.now()`, `Math.random()`, ad-hoc email strings)
- no faker or random usage directly in specs
- non-deterministic data used where deterministic constants would suffice
- generators with unclear ownership or duplicated across specs/helpers
- duplicated generation logic that should live in generators or builders
- generation inside Page Objects, Components, or assertion helpers
- simple deterministic project-owned generators preferred before faker
- faker usage present only when approved by feature plan, E2E journey plan, or explicit task scope
- generated emails, phones, addresses, or other test data must not affect real external systems

### 5. Builders

- reusable structured business/API/form data uses builders when appropriate
- builders under `src/test/data/builders/**` when project implementation exists
- builders created for one-off deterministic values without reuse justification
- invalid or negative data is explicit through overrides, not hidden as defaults
- builder defaults are valid by default
- builders live in the data layer, not Page Objects or Components

### 6. Fixtures

- fixtures do not hide the action under test or full business journeys
- fixtures do not generate one-off scenario data unnecessarily
- fixtures remain thin setup and wiring only
- API setup in fixtures creates preconditions only and does not replace UI or E2E action under test
- fixture names do not imply hidden completed flows (`loggedInPage`, `createdOrder`, etc.)

### 7. E2E data

- disposable user, order, or entity policy for destructive journeys
- destructive state handling documented in journey plan and reflected in code
- external dependency data risk (email inbox, payment, reset token, captcha)
- password reset, payment, checkout, or verification flows have safe data and cleanup strategy
- E2E blocked in plan when safe data strategy is missing

### 8. Environment assumptions

- data setup tied to a specific environment without config abstraction
- missing target UI app or API service ownership for data creation
- missing multi-target service ownership when feature or journey crosses services
- specs or data helpers reading `process.env` directly against project map rules
- API host derived from UI host by heuristics for data setup

---

## Workflow

### 1. Identify Audit Scope

Determine what is being audited:

- one feature plan and related tests/data;
- one E2E journey plan and related tests/data;
- specific spec or data paths;
- full project data strategy when no narrow scope is given.

Record:

- plan path(s);
- spec path(s);
- data, fixture, and related files reviewed;
- whether audit is feature-level, E2E-level, API/UI data, or combined.

If no plans, tests, or data layer exist in scope, report limited audit scope and review only what is available.

---

### 2. Extract Documented Data Policy

From feature and E2E plans, extract when documented:

- setup strategy;
- test data strategy;
- cleanup or isolation strategy;
- disposable vs shared data decisions;
- blocked/postponed reason when safe data is unavailable;
- target UI app(s), API service(s), and precondition service(s);
- external dependency notes.

Flag gaps when destructive or mutable flows exist in tests but plans omit data policy.

Do not invent cleanup mechanisms not evidenced in plans or code.

---

### 3. Inventory Data Usage In Tests

Review specs for:

- inline random or unique values;
- hardcoded shared users, emails, product ids, or order ids;
- long UI setup repeated instead of approved lower-level data setup;
- API setup scope — precondition only vs replacing action under test;
- missing teardown or isolation comments where destructive state is created;
- direct `process.env` usage.

Map each notable data pattern to audit categories.

---

### 4. Review Data Layer

When `src/test/data/**` or equivalent exists, review:

- builders — defaults, override pattern, invalid data explicitness, reuse justification;
- generators — centralized uniqueness, clear naming, no duplication in specs;
- generators under `src/test/data/generators/**` when project implementation exists;
- builders under `src/test/data/builders/**` when project implementation exists;
- datasets — read-only vs mutable usage;
- types — ownership and reuse.

Flag builders/generators in wrong layers or speculative abstractions with no consumers.

---

### 5. Review Fixtures And Related Setup

Review fixture chain and referenced fixtures for:

- hidden business flows;
- shared mutable state;
- one-off values exposed as fixtures;
- API clients used to perform full flows instead of preconditions;
- cross-test state via global variables or storage state without isolation policy.

Compare fixture behavior against project map fixture entry point rules.

---

### 6. Review E2E And Destructive Flow Data

For E2E specs and journey plans:

- verify disposable user/entity strategy or documented isolation;
- verify cleanup decision for password reset, checkout, profile update, order creation, deletion;
- flag external dependency data risks when control strategy is missing;
- compare implemented data handling with journey plan blocked/ready status.

If plan marks journey blocked due to data/cleanup risk but test exists, report as policy violation.

---

### 7. Review Environment And Service Ownership

Using project map and `.env.example` only:

- verify data setup targets documented env names and services;
- flag generic `API_BASE_URL` or `UI_BASE_URL` use when plan names a specific service or app;
- flag environment-specific hardcoded ids or URLs in specs/data layer;
- flag missing multi-target ownership when plans or tests cross services.

Do not mutate env files during audit.

---

### 8. Classify Severity

Use practical severity for data risks:

**Critical** — likely cross-test failure, false pass, parallel collision, or unsafe destructive flow.

Examples:

- shared mutable user modified by parallel destructive tests;
- destructive E2E without cleanup/isolation when required;
- inline secrets or credentials in tests/data;
- API setup replaces UI/E2E action under test;
- blocked E2E journey implemented without safe data policy.

**Major** — meaningful data strategy gap or maintainability risk.

Examples:

- inline random email in multiple specs;
- missing unique data where backend enforces uniqueness;
- builder defaults invalid for normal use;
- fixture hides main scenario setup;
- missing plan data policy for destructive flow;
- wrong service env ownership for setup.

**Minor** — worth noting but lower immediate collision risk.

Examples:

- one-off constant that could stay inline;
- duplicated small payload object in two specs;
- dataset used read-only but naming suggests mutability.

Only include minor findings when worth fixing now.

---

### 9. Recommend Next Actions (Do Not Apply)

Recommend the smallest correct follow-up, such as:

- update feature or E2E plan with data/cleanup strategy;
- introduce builder or generator only when reuse is evidenced;
- move inline data to generator/builder;
- replace shared mutable entity with disposable data;
- add documented cleanup or isolation;
- fix fixture to precondition-only setup;
- mark E2E blocked until mailbox/payment/cleanup exists;
- use Create Test Data Builder or Create Fixture skills for implementation after audit.

Do not create or modify data artifacts during audit.

---

## Guardrails

Do not:

- modify files unless explicitly requested;
- create builders, generators, datasets, or fixtures;
- change tests;
- delete data or tests;
- mutate environment configuration;
- update TMS;
- infer cleanup mechanisms without evidence;
- guess service ownership when project map is unclear — report blocked/needs clarification;
- use real secrets from `.env` or CI;
- treat audit as implementation.

If safe data strategy cannot be confirmed, report **needs plan update** or **blocked** — do not invent cleanup.

---

## Output Format

Use this structure:

### Summary

- audit scope:
- plans reviewed:
- tests reviewed:
- data/fixture files reviewed:
- overall data strategy status:
- highest-risk patterns:

### Safe Data Patterns Found

List good patterns worth keeping.

Examples:

- disposable unique users;
- read-only datasets;
- documented E2E cleanup;
- thin precondition-only API setup;
- valid builder defaults with explicit negative overrides.

### Data Risks

For each finding:

- file or plan reference:
- category (1–8):
- severity:
- pattern:
- why it matters:
- recommended next action:

Group by category when helpful:

- shared mutable data
- isolation gaps
- cleanup gaps
- generation issues
- builder issues
- fixture issues
- E2E data risks
- environment assumption risks

### Destructive Flow Risks

- flow:
- plan status:
- data/cleanup policy:
- gap:
- recommended next action:

### Cleanup/Isolation Gaps

- flow or entity:
- current state:
- missing strategy:
- recommended next action:

### Builder/Generator Findings

- artifact:
- issue or positive pattern:
- recommended next action:

### Fixture Findings

- fixture:
- issue:
- recommended next action:

### E2E Data Risks

- journey or spec:
- external dependency:
- data policy gap:
- recommended next action:

### Recommended Next Actions

Grouped batches only — do not execute during audit.

Examples:

- update `specs/e2e/<journey>.md` data/cleanup section;
- `/plan-e2e-journey` to document isolation;
- `/create-test-data-builder` when reuse is justified;
- `/create-fixture` for thin precondition wiring;
- `/audit-test-stability` for related flake patterns;
- `/heal-ui-test` or `/heal-api-test` when test fixes are requested;
- user decision required.

### Recommended Next Command

Choose one primary next step.

Do not modify files during audit.

---

## Done Criteria

This skill is complete when:

- audit scope and inputs were identified;
- plans, tests, and relevant data/fixture layers were reviewed;
- findings were classified by audit category and severity with evidence;
- safe patterns and risks were reported;
- destructive-flow and cleanup/isolation gaps were listed when applicable;
- recommended next actions and next command were named;
- no files were modified unless explicitly requested.

---

## Main Principle

Test data strategy audit compares documented intent and implemented data ownership.

Shared mutable state, missing isolation, and destructive flows without policy are the highest risks.

Report evidence-based findings.

Recommend the smallest next workflow step.

Do not create, change, or delete data during audit.
