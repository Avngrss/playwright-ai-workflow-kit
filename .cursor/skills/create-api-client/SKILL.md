# Skill: Create API Client

## Goal

Use this skill when a thin API client is justified for reused endpoint calls or request composition.

The goal is to avoid duplicated raw API requests while preventing complex service hierarchies and hidden assertions.

---

## Related Rules

Follow these rules:

- API Architecture Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Configuration and Secrets Rules;
- Fixtures and Test Data Rules;
- Examples Policy.

---

## When To Use

Use this skill when:

- endpoint calls are reused across tests;
- request composition is duplicated;
- endpoint grouping improves clarity;
- multiple specs need the same API operation;
- project convention requires API clients.

---

## When NOT To Use

Do not create an API client when:

- endpoint is used only once and raw request is clearer;
- client would hide assertions;
- client would hide business workflow;
- client would duplicate existing client;
- client is created just in case;
- API contract is unknown.

---

## Workflow

### 1. Identify Endpoint Group

Identify:

- resource area;
- endpoints;
- HTTP methods;
- auth requirements;
- request payloads;
- query and path parameters.

---

### 2. Check Existing Clients

Check whether an existing API client already owns this endpoint group.

Do not create duplicate clients.

---

### 3. Check Project Map

Find:

- API client location;
- naming convention;
- auth provider;
- request transport;
- path aliases;
- fixture integration convention.

---

### 4. Keep Client Thin

Client may:

- compose endpoint paths;
- pass request payloads;
- pass query parameters;
- apply auth headers through approved mechanism;
- return response or typed data.

Client must not:

- perform scenario assertions by default;
- call login directly;
- hardcode tokens;
- hardcode credentials;
- hide business workflows;
- create unrelated setup data;
- become a service hierarchy.

---

### 5. Keep Auth Centralized

Use project-approved auth provider or authenticated request fixture when Auth Strategy is `precondition`.

Follow Authentication Strategy Rules and the project map.

Do not duplicate login logic.

Do not invent tokens, header names, or login endpoints.

---

### 6. Use Builders For Payloads

If payload is reusable, use existing builder or create one through Create Test Data Builder skill.

Do not place large reusable payload objects inside client methods.

---

### 7. Add Fixture Only If Needed

Expose client through fixture only when reused and project convention supports it.

Fixture must remain thin.

Do not hide workflow setup in fixture.

---

### 8. Verify

Run impacted API spec.

Run related API specs if client is shared.

Run quality gate from project map.

---

## Guardrails

Do not:

- create complex service hierarchies;
- create one giant API service;
- hide assertions in client;
- hide workflows in client;
- duplicate auth logic;
- put project-specific client in framework core;
- add client for one-off request;
- hardcode environment values.

---

## Output Format

### Client Decision

- client name:
- endpoint group:
- reason client is needed:
- existing client checked:

### Implementation

- file:
- methods:
- auth mechanism:
- payload builders:

### Fixture

- fixture added: yes or no:
- reason:

### Verification

- impacted API specs:
- related API specs:
- quality gate:

---

## Done Criteria

This skill is complete when:

- client need is justified;
- existing clients were checked;
- client is thin;
- no assertions are hidden;
- no login logic is duplicated;
- auth uses approved mechanism;
- project-specific client stays in project layer;
- impacted API tests are verified or documented as not run.

---

## Main Principle

API clients group reusable endpoint calls.

They do not verify scenarios.

They do not hide workflows.

They stay thin.