# Skill: Implement API Feature From Plan

## Goal

Use this skill when an API.Use this skill when an API feature plan already exists and API automation must be implemented.

The planner creates or validates the feature plan.

This skill implements the selected API scope from the approved plan.

Do not implement UI tests with this skill.

Do not implement visual checks with this skill.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- Test Strategy and Test Pyramid Rules;
- API Architecture Rules;
- API Schema Validation Rules;
- Fixtures and Test Data Rules;
- Project Map Rules;
- Configuration and Secrets Rules;
- Multi-Target Environment Rules;
- Authentication Strategy Rules;
- Sorting and Filtering Assertion Strategy;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Temporary Debug Artifact Cleanup Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- a feature test plan exists;
- API automation must be implemented for planned scenarios;
- API coverage ready to implement now must be added;
- existing API assertion helpers need minimal updates;
- existing API schemas need minimal updates;
- reusable test data may be needed;
- the implementation must follow repository architecture.

---

## When NOT To Use

Do not use this skill when:

- no feature plan exists;
- the task is only to plan coverage;
- the task is only to heal a failing API test;
- the task is only UI automation;
- the task is only visual testing;
- the task is only to create a data builder;
- the task is a broad refactor without API feature implementation.

If no feature plan exists, invoke or request planning first.

Do not invent missing requirements.

Use Heal API Test when an existing API test is failing.

Use Create Test Data Builder when reusable structured data is the only task.

Use Refactor Overengineering when behavior-preserving cleanup is the only task.

---

## Inputs

Use relevant available context:

- feature plan;
- selected API implementation scope;
- API contract or OpenAPI/Swagger documentation;
- project map;
- existing API specs;
- existing assertion helpers;
- existing Zod schemas;
- existing API clients or request helpers;
- existing builders, generators, datasets, and fixtures;
- relevant rules;
- quality gate command from the project map.

Use the project map as the source of truth for:

- spec locations;
- assertion helper locations;
- schema locations;
- data locations;
- fixture entry points;
- path aliases;
- tags;
- verification commands.

Do not invent paths, aliases, commands, or naming conventions.

---

## Implementation Scope

Implement only the selected API scope.

Preferred implementation scope is:

- all API coverage marked as ready to implement now in the feature plan.

Do not implement:

- UI coverage;
- visual checkpoints;
- schema checks not selected for this API task;
- blocked or postponed scenarios;
- adjacent endpoint capabilities;
- adjacent query parameters;
- unrelated negative cases;
- helper-only scenarios.

If the selected scope is ambiguous, stop and report the ambiguity.

---

## Workflow

### 1. Read And Validate The Feature Plan

Read the feature plan and identify:

- feature scope;
- source of truth;
- in-scope API behaviors;
- out-of-scope behaviors;
- API scenarios ready to implement now;
- blocked or postponed API scenarios;
- expected status codes;
- expected response assertions;
- schema validation decisions;
- negative coverage decisions;
- required tags;
- required test data;
- contract gaps or blockers;
- API/service Feature Target and env name from project map;
- Auth Strategy (required, role, auth as, API mode);
- verification command.

Use only the API/service Feature Target listed in the feature plan. Do not fall back to `UI_PRECONDITION_API_BASE_URL` or a generic `API_BASE_URL` when the project map defines a specific service target.

If the required API/service Feature Target is missing from the plan, stop and report:

"API/service Feature Target is missing from the feature plan. Update the plan and project map before implementation."

If the scenario needs a session and Auth Strategy is missing from the plan, or the API mode is not registered in the project map, stop and report:

"Auth Strategy is missing from the feature plan. Update the plan and project map before implementation."

Do not invent login, tokens, or headers.

Do not invent env variable names.

Do not derive API host from UI host.

Do not implement scenarios that are unclear.

Do not implement blocked or postponed scenarios.

Do not implement implementation details as scenarios.

---

### 2. Check Project Map

Before creating or modifying files, check the project map for:

- API spec locations;
- assertion helper locations;
- schema locations;
- builder/generator/dataset locations;
- API client/helper locations;
- fixture entry point;
- path aliases;
- tags;
- quality gate command;
- registered API service env names.

Do not invent folders, aliases, commands, or naming conventions.

Place new API specs at `tests/api/<feature>/<feature>.api.spec.ts`.

Do not create API specs at the `tests/api/` root.

Rule reference:

- `.cursor/rules/spec-feature-placement.rules.mdc`

If the project map defines multiple API services, bind clients and requests to the service documented in the feature plan through the approved config layer.

---

### 2A. Fixture Recommendation Gate

If a new fixture seems useful but was not explicitly requested:

- provide a short fixture recommendation with reuse evidence;
- wait for user confirmation before creating the fixture file;
- continue with minimal inline setup when confirmation is not yet given.

If the user explicitly requests the fixture, implement it directly.

---

### 3. Scope Boundary Check

Before writing API tests, verify the selected implementation scope against the feature plan and user request.

Implement only API coverage that belongs to the selected scope.

Do not expand API tests to adjacent endpoint capabilities, query parameters, filters, states, flows, or negative cases unless they are explicitly in scope.

If the selected API scope is derived from UI behavior, map only the specified UI behavior, option, or state to confirmed API requests.

Do not guess undocumented API parameters or values.

If a related API behavior is useful but outside the selected scope, report it as out of scope or future coverage instead of implementing it.

Examples:

- if scope is API coverage for visible Sort dropdown options, do not add filter, search, category, brand, rental, or filter-plus-sort interaction coverage unless explicitly listed;
- if scope is Brand filter API coverage, do not add sorting, category, search, or price range coverage unless explicitly listed;
- if scope is Login API coverage, do not add registration API coverage except as approved setup/precondition.

---

### 4. Validate API Contract And Expected Behavior

For each selected API scenario, identify:

- endpoint;
- method;
- query parameters or request body;
- expected status code;
- expected response shape;
- documented error behavior;
- authentication or authorization requirements;
- contract gaps.

Use the API contract as the source of truth when available.

Do not guess expected status codes.

Do not assert undocumented response fields unless they are required by the behavior under test and already accepted by the project.

If contract and live behavior differ, report the gap.

---

### 5. Scenario Deduplication Check

Before writing API tests, check whether selected coverage items are distinct API behaviors or contract risks.

Do not create a separate test only to exercise:

- assertion helper;
- Zod schema;
- builder;
- generator;
- API client;
- fixture;
- metadata helper;
- reporting helper.

These are implementation details, not standalone API scenarios.

If a response contract assertion belongs to the same API behavior, include it in the same scenario test unless the plan explicitly identifies a distinct contract risk.

Avoid duplicate tests that:

- send the same request;
- use the same payload;
- assert the same status;
- differ only by whether an assertion helper or schema helper is called.

If the plan lists an implementation detail as a scenario, treat it as an implementation decision and report the correction.

---

### 6. Negative Coverage Decision Check

Before writing API tests, check whether the selected API behavior has documented negative or error cases.

For documented error behavior, implement negative API coverage at API level when it is safe and stable.

Good API negative candidates include:

- invalid credentials;
- missing required fields;
- invalid formats;
- unauthorized request;
- forbidden role;
- duplicate entity;
- invalid token;
- unsupported documented enum value;
- documented validation error.

If status code, response body, auth setup, validation contract, or required data is unclear, do not guess.

Report unclear negative cases as blocked or postponed with the missing contract or setup detail.

Do not replace API negative coverage with UI tests unless the UI-specific risk is visible user feedback.

Do not add negative tests for undocumented behavior just because they seem useful.

---

### 6A. Positive And Negative Coverage Balance

For create, update, delete, login, registration, checkout, and similar state-changing endpoints, keep coverage balanced:

- at least one positive path with contract-relevant assertions;
- at least one deterministic negative path when contract evidence exists;
- explicit blocked or postponed status when negative behavior is undocumented or non-deterministic.

Do not ship mutation coverage as positive-only when the feature plan already documents negative scenarios as ready to implement now.

If a negative case cannot be implemented safely, document the blocker in the feature plan and implementation report instead of silently skipping it.

---

### 7. Scenario Data Implementation Check

Before writing API tests, decide how scenario data should be represented.

Use local constants when:

- data is deterministic;
- data is small;
- data is used by one spec or one scenario;
- no variants or overrides are needed.

Use local scenario cases when:

- multiple values verify the same behavior;
- variants are small and specific to one spec.

Use datasets when:

- static scenario cases are reused;
- variants are meaningful across multiple tests or specs.

Use builders when:

- structured data is reused;
- valid defaults and `Partial<T>` overrides are needed;
- negative variants modify one or more fields;
- unique or formatted values are required;
- the same data shape is shared across API and UI tests.

Use generators when:

- unique primitive values are required;
- formatted primitive values are required;
- freshness prevents collisions or backend validation failures.

Builder defaults must be valid by default.

Invalid or negative data must be explicit through overrides.

Do not define reusable `buildData`, `buildPayload`, `buildFormData`, or similar factory functions inside specs.

Before adding inline payloads, search existing builders, datasets, generators, and setup helpers for the same entity shape.

Do not duplicate API registration/login/contact payloads across specs and `src/test/setup/**`; consume shared builders instead.

Do not create a builder for one-off deterministic payloads.

Do not create a separate test only because a helper, builder, dataset, or schema exists.

---

### 8. Schema Validation Decision

Before writing manual response shape assertions, decide whether a Zod schema is justified.

Use Zod schema validation when the response shape is:

- reused across multiple tests;
- nested;
- paginated;
- contract-critical;
- large enough that manual type checks reduce readability;
- used by multiple assertion helpers;
- shared across API tests and UI setup checks.

Do not create Zod schemas for trivial one-off responses.

If using Zod:

- place reusable schemas under `src/test/schemas/api/`;
- infer response types from schemas with `z.infer`;
- use the shared Zod assertion helper for `safeParse` plus Playwright `expect`;
- create the shared Zod assertion helper if it does not exist yet;
- do not duplicate `safeParse` plus `expect` wrapper logic in every response assertion helper;
- keep feature-specific response helpers as thin wrappers with domain-readable names;
- keep behavior assertions separate from schema validation;
- do not define reusable schemas inside specs.

Assertion helpers may contain Playwright `expect`.

API clients must not contain schema assertions.

Specs should normally import feature-specific assertion helpers, not raw schemas or the generic Zod helper, when a feature-specific helper exists.

For non-trivial success responses, schema validation call is mandatory in the spec flow:

- perform response schema validation through the feature-specific assertion helper;
- then perform scenario behavior assertions on the parsed typed response.

Do not rely only on manual field assertions when the scenario is planned with schema/contract validation ready now.

Do not migrate unrelated response helpers while implementing a feature.

---

### 9. API Client Decision

Use direct Playwright `request` calls when:

- the endpoint is used only once or twice;
- request composition is simple;
- no reusable authentication or request setup is needed.

Create or update a thin API client only when:

- endpoint calls are reused across multiple specs;
- request composition is duplicated;
- authentication/header setup is repeated;
- a client improves clarity without hiding assertions.

API clients may compose and send requests.

API clients must not:

- contain Playwright `expect`;
- contain Zod schema assertion logic;
- hide behavior assertions;
- validate full response contracts;
- own test data defaults.

Do not create API clients speculatively.

---

### 10. Assertion Helper Decision

Use assertion helpers for:

- reusable response shape validation;
- Zod schema validation wrappers;
- reusable behavior assertions;
- non-trivial response predicates;
- sorting/filtering/list/table/pagination invariants.

Keep scenario-specific assertions in specs when they are simple and readable.

Assertion helpers may use Playwright `expect`.

Do not hide the main behavior under test inside overly broad helpers.

Avoid helper names that combine action and verification.

Good helper responsibilities:

- validate response shape;
- validate sorted order;
- validate filtered result predicate;
- validate token response shape;
- validate conflict error shape.

Bad helper responsibilities:

- send request and assert response;
- create entity and verify full workflow;
- hide setup, action, and assertion together.

For sorting/filtering/list invariants, assertion helpers must also emit approved success diagnostics to the console after invariant checks pass.

Use the shared sort/filter console helper from the assertion layer.

Do not add ad-hoc `console.log` in API specs for sort/filter proof.

Required console content:

- operation kind: `sort` or `filter`;
- readable label such as field/direction or predicate summary;
- item count checked;
- checked sequence or sample in display order.

---

### 10.5 Spec Helper And Reuse Check

Before writing API specs, search existing helpers under:

- `src/test/assertions/**`
- `src/test/reporting/**`
- `src/test/data/**`
- `src/test/schemas/**`

Reuse or extend existing helpers before creating new ones or adding local functions to specs.

Rule reference:

- `.cursor/rules/spec-helper-policy.rules.mdc`

API specs must not define local helper functions for:

- `run*Scenario` orchestration;
- repeated request/response assertion blocks;
- schema validation plumbing already covered by assertion helpers;
- Allure suite path builders.

For table-driven API tests, keep request execution, status checks, and behavior assertions visible inside each `test(...)` body.

Use `buildAllureSuitePath(rootSuite, ...segments)` from `src/test/reporting/allure-metadata.helper.ts` for nested suite paths.

---

### 11. Implement API Tests

Implement tests for the selected API scope only.

Create or update the spec at `tests/api/<feature>/<feature>.api.spec.ts`.

Do not add a flat spec under `tests/api/`.

API tests must:

- use the final fixture entry point or project-approved API fixture;
- use required tags;
- keep request, status assertion, schema/shape assertion, and behavior assertion readable;
- avoid unrelated setup;
- avoid shared static data when fresh data is possible;
- avoid inline random data;
- avoid process.env access in specs;
- avoid full API contract validation in setup steps;
- avoid over-abstracting early.
- add Allure metadata through `src/test/reporting/allure-metadata.helper.ts` by default for new or updated specs.

Allure metadata placement for API specs:

- use `beforeEach` for shared suite metadata (feature, suite, owner, layer);
- add story/severity per test close to the API scenario.

Use one test per distinct API behavior or contract risk.

Use table-driven tests when multiple values verify the same behavior.

Do not create a full Cartesian matrix unless the feature plan explicitly requires it.

Do not add `test.fixme` placeholders for postponed API scenarios unless the project convention explicitly requires visible skipped tests.

Prefer documenting blocked/postponed cases in the feature plan and implementation report.

---

### 12. Preconditions And Setup

Use the lowest reliable setup layer for API preconditions.

If a test needs an existing backend entity, use approved API setup, builders, generators, or fixtures.

Do not derive API host from UI host.

Do not build API URLs manually in specs when project config provides the base URL.

Do not read secrets or environment variables directly in specs.

Use the API service and env name documented in the feature plan and project map.

Do not substitute a generic `API_BASE_URL` when the plan names a specific service.

Do not use shared static credentials when fresh data can be created safely.

If setup fails, inspect the setup response before blaming assertions or schemas.

If reusable default test data becomes invalid due to backend validation, fix the builder or generator default.

Do not weaken expected behavior to hide setup failures.

---

### 13. Verification

After changes:

1. run the impacted API spec or specs;
2. run related API specs if shared builders, generators, schemas, assertion helpers, API clients, or fixtures were changed;
3. run the repository quality gate command defined by the project map.

4. remove temporary discovery/debug artifacts created during the task.

Rule reference:

- `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`

Default examples:

- impacted API spec command may use `npx playwright test <spec-path> --project=api`;
- quality gate may be `npm run qa:gate`.

Use the project map as the source of truth.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

### 14. Healing

If implemented API tests fail, do not patch blindly.

Use Heal API Test skill.

Do not:

- weaken assertions;
- remove schema validation to pass;
- change expected status without contract evidence;
- add skips for failures that should be investigated;
- silently widen schemas;
- mark fields optional or nullable only to make tests pass;
- blame Zod if the failure happens before schema validation.

Fix root cause at the correct layer.

---

### 15. Hardening

After implementation, harden only reusable learnings.

Consider hardening when the work reveals:

- missing rule;
- missing skill;
- repeated data issue;
- repeated schema validation issue;
- repeated scope creep;
- repeated helper misuse;
- fixture boundary problem;
- diagnostics gap.

Do not add rules or abstractions for one-off cases.

---

## Guardrails

Do not:

- implement without reading the feature plan;
- implement blocked or postponed scenarios;
- implement UI tests;
- implement visual checkpoints;
- modify unrelated files;
- create speculative API clients;
- create builders for one-off values;
- create schemas for trivial one-off responses;
- migrate unrelated helpers;
- use undocumented status codes as expected behavior;
- guess undocumented response fields;
- hide behavior assertions inside schemas;
- put schema validation into API clients;
- put reusable schemas inside specs;
- create one test per data value when a parameterized case is enough;
- add helper-only tests;
- bypass the project fixture entry point;
- change expected behavior unless the requirement or contract changed.

---

## Output Format

When reporting implementation, use this structure:

### 1. API Scope

- feature:
- scenarios implemented:
- scenarios blocked/postponed:
- out-of-scope items:

### 2. Data

- reused data:
- local constants:
- local scenario cases:
- datasets:
- builders updated:
- generators updated:
- fixture changes:

### 3. API Structure

- specs added or updated:
- schemas added or updated:
- assertion helpers added or updated:
- API clients added or updated:
- API client decision:

### 4. Tests

- tags used:
- positive coverage:
- negative coverage:
- schema/contract checks:
- behavior assertions:

### 5. Verification

- impacted specs run:
- related specs run:
- quality gate:
- not run reason, if any:

### 6. Hardening

- needed: yes or no;
- action taken or postponed;
- reason:

---

## Done Criteria

This skill is complete when:

- feature plan was read;
- selected API scope was validated;
- project map was followed;
- scope did not expand to adjacent behavior;
- mutation-style API scenarios include both positive and documented negative coverage, or the negative gap is explicitly blocked/postponed with reason;
- required test data was identified before tests;
- documented negative/error coverage was implemented or blocked/postponed with reason;
- schema validation decision was made for non-trivial responses;
- Zod schemas were used only when justified;
- shared Zod assertion helper was used when Zod schema validation was implemented;
- non-trivial success responses call the feature-specific schema assertion helper before manual behavior assertions;
- behavior assertions remained separate from schema validation;
- API clients were created only when justified;
- tests use required tags;
- implementation details are not standalone tests;
- no speculative abstractions were added;
- impacted API specs were run or documented as not run;
- quality gate was run or documented as not run;
- temporary debug scripts and discovery dumps were removed or explicitly preserved by user request.

---

## Main Principle

Planner creates the plan.

This skill implements the selected API scope from the plan.

API tests own backend contract and behavior risks.

Zod validates response shape.

Assertion helpers connect validation and reusable behavior checks to Playwright reporting.

Builders and generators own reusable test data.

Specs show the API scenario.

Verification proves the implementation.

Healing fixes root causes at the correct layer.


The goal is to implement API automation from the approved feature plan while keeping tests readable, maintainable, contract-aware, and aligned with the test pyramid.

