# Skill: Implement API Feature

## Goal

Use this skill to implement API tests following the framework API architecture rules.

The goal is to add minimal, readable, request/response-based API coverage without introducing UI patterns, duplicated authentication logic, or unnecessary service abstractions.

---

## Related Rules

Follow these rules:

- API Architecture Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Configuration and Secrets Rules;
- Fixtures and Test Data Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Agent Workflow;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- adding a new API test;
- adding coverage for a new endpoint;
- adding a positive API contract test;
- adding a negative API contract test;
- adding an authorized API test;
- adding API setup validation;
- extending API coverage for an existing feature.

---

## When NOT To Use

Do not use this skill when:

- the task is UI-only;
- the test verifies UI behavior;
- the task requires Page Objects or Component Objects;
- the task is only to refactor API support code;
- the API behavior or contract is unknown;
- the required endpoint, method, or expected response is unclear.

If the API contract is unclear, do not guess.

Report the missing information or inspect the project-approved API contract source.

---

## Inputs

Use relevant available context:

- endpoint path;
- HTTP method;
- request payload;
- query parameters;
- path parameters;
- authentication requirements;
- expected status code;
- expected response fields;
- error contract for negative cases;
- existing API clients;
- existing builders;
- existing schemas or types;
- existing auth provider;
- project map;
- API Architecture Rules.

---

## Workflow

### 1. Identify Endpoint and Method

Identify:

- endpoint path;
- HTTP method;
- required path parameters;
- required query parameters;
- required request body;
- expected response status;
- essential response fields.

Do not create tests without knowing the expected API behavior.

Expected output:

- endpoint is known;
- method is known;
- expected response is known.

---

### 2. Identify Authentication Requirement

Determine whether the endpoint requires authentication.

If authentication is required:

- use the project-approved auth provider;
- use the project-approved authenticated API fixture if one exists;
- do not duplicate login logic;
- do not call login directly inside the test;
- do not hardcode tokens;
- do not hardcode credentials.

Authentication must go through the approved auth mechanism.

Do not assume the fixture name.

Follow the project map.

---

### 3. Check Existing API Support

Before creating new API support code, check existing:

- API clients;
- request helpers;
- auth provider;
- fixtures;
- builders;
- generators;
- schemas;
- types;
- assertion helpers.

Prefer reuse over creating new abstractions.

Do not create duplicate clients or helpers with overlapping responsibilities.

---

### 4. Decide Whether a Client Is Needed

Do not create an API client by default.

Use raw request or existing transport when the endpoint is used only once and remains readable.

Create or update a thin API client only when:

- endpoint calls are reused;
- grouping improves clarity;
- multiple tests need the same endpoint;
- request composition becomes duplicated;
- project conventions require clients.

API clients must stay thin.

Clients should compose requests and return responses or typed data.

Clients must not hide assertions by default.

Clients must not hide business workflows.

---

### 5. Prepare Request Data

If the endpoint requires a payload, use existing builders, datasets, or factories.

Create a new builder only when reusable structured data is needed.

Do not create inline reusable payloads in specs.

Do not generate unique values inline in specs.

Use generators for unique primitive values.

Keep domain-specific payload builders in the project layer.

---

### 6. Implement the Positive Test

Implement a minimal positive API test.

The test should have one primary API action under test.

Setup and cleanup API calls are allowed when required, but they must not hide the primary action under test.

The test must validate:

- status code;
- essential response fields;
- relevant contract fields;
- schema or type contract when applicable.

Do not verify only that the response exists.

Weak assertion examples to avoid:

- `response is defined`;
- `body is defined`;
- `status is less than 500` when exact status is known.

---

### 7. Add Negative Cases Only When Applicable

Add negative cases only when they are required by:

- task scope;
- API contract;
- risk;
- validation requirements;
- authorization requirements;
- existing test strategy.

Useful negative cases may include:

- missing required field;
- invalid field value;
- unauthorized request;
- forbidden role;
- not found resource;
- duplicate entity;
- invalid query parameter.

Negative tests must validate:

- expected status code;
- error code or error message;
- essential error response fields.

Do not add random negative cases just to increase test count.

---

### 8. Keep API Tests Independent From UI

API tests must not use:

- Page Objects;
- Component Objects;
- UI fixtures;
- UI navigation;
- browser page interactions;
- UI selectors.

API tests must rely on request and response behavior only.

Do not mix UI setup into API tests.

Prefer API setup for API tests.

---

### 9. Apply Minimal Changes

Keep changes minimal and targeted.

Do not introduce:

- complex service hierarchies;
- generic wrappers around Playwright request without clear value;
- workflow services for one endpoint;
- project-specific API logic in framework core;
- duplicated auth logic;
- hidden assertions inside clients;
- hidden login calls inside tests.

---

### 10. Verification

After implementation:

1. run the impacted API spec;
2. run related API specs if shared client, fixture, builder, or auth provider was changed;
3. run the repository quality gate command defined by the project map.

If the project quality gate is `npm run qa:gate`, run it after targeted API verification.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## Auth Guardrails

Do not:

- hardcode tokens;
- hardcode credentials;
- call login directly inside API tests;
- duplicate login logic across tests;
- recreate tokens per test without reason;
- share one global token across unrelated roles or accounts;
- hide auth failures;
- put project-specific roles or users into framework core.

Use:

- project-approved auth provider;
- project-approved authenticated API fixture;
- explicit token/session reuse strategy;
- project-level role and user definitions.

---

## Client Guardrails

API clients are optional.

Use a client only when it improves reuse or clarity.

A client may:

- compose endpoint paths;
- add headers;
- pass query parameters;
- send payloads;
- return response or typed data.

A client must not:

- perform scenario assertions by default;
- hide business workflows;
- perform login directly;
- create unrelated setup data;
- become a complex service hierarchy.

---

## Test Design Rules

API tests should:

- have one primary API action under test;
- keep setup and cleanup explicit;
- validate exact expected status codes;
- validate essential response fields;
- validate error contracts for negative tests;
- use builders for reusable payloads;
- avoid UI patterns;
- remain readable and minimal.

API tests should not:

- depend on execution order;
- depend on data from another test;
- rely on UI state;
- use fake assertions;
- hide the primary action inside fixtures or clients;
- chain many API calls unless testing a workflow.

---

## Workflow API Tests

Multiple business API calls are allowed only when the test explicitly verifies a workflow.

Workflow tests must make the workflow clear in the test name and steps.

Do not turn normal endpoint tests into long API chains.

If a workflow becomes reused across suites, consider a project-level flow only when justified by the Project Scaling and Domain Flow rules.

---

## Output Format

When reporting the implementation result, use this structure:

### 1. Endpoint

- method:
- endpoint:
- auth required:
- primary behavior:

### 2. Implementation

- spec added or updated:
- client added or updated:
- builder added or updated:
- fixture used:

### 3. Assertions

- status:
- essential fields:
- schema or contract:
- negative cases, if any:

### 4. Verification

- impacted spec:
- related specs:
- quality gate:
- not run reason, if any:

---

## Done Criteria

This skill is complete when:

- endpoint and method are identified;
- authentication strategy is clear;
- auth logic is not duplicated;
- test uses request/response model only;
- one primary API action under test is clear;
- setup and cleanup are explicit when needed;
- status code is validated;
- essential response fields are validated;
- negative cases are added only when applicable;
- no UI patterns are introduced;
- no unnecessary abstraction is introduced;
- impacted API spec is run or documented as not run;
- quality gate is run or documented as not run.

---

## Anti-Patterns

Avoid:

- Page Objects in API tests;
- Component Objects in API tests;
- browser page interactions in API tests;
- hardcoded tokens;
- hardcoded credentials;
- login calls inside every test;
- duplicated authentication logic;
- complex service hierarchies;
- clients that hide assertions;
- clients that hide workflows;
- one giant API service for all endpoints;
- long API chains for simple endpoint tests;
- fake assertions;
- changing expected behavior without contract confirmation;
- putting project-specific endpoints or clients into framework core.

---

## Main Principle

API tests verify API behavior through explicit request and response contracts.

Auth is centralized.

Clients are thin and optional.

Tests are minimal and readable.

The framework core provides mechanisms.

The project layer owns concrete endpoints, payloads, roles, users, clients, and domain contracts.