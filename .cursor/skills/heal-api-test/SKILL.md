# Skill: Heal API Test

## Goal

Use this skill when an API test is failing and the root cause must be diagnosed and fixed without masking real product behavior.

The goal is to identify whether the failure is caused by:

- test data;
- setup or precondition;
- request payload;
- authentication or authorization;
- environment/runtime issue;
- contract drift;
- schema validation mismatch;
- assertion bug;
- product behavior change.

Apply the smallest correct fix at the right layer.

Do not weaken assertions just to make the test pass.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- API Architecture Rules;
- API Schema Validation Rules;
- Fixtures and Test Data Rules;
- Project Map Rules;
- Configuration and Secrets Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- an API spec fails;
- API setup or precondition fails;
- a request returns an unexpected status code;
- response body shape no longer matches schema;
- Zod schema validation fails;
- API test data appears invalid;
- authentication or authorization setup fails;
- API behavior may have changed;
- a test fails before reaching the intended assertion.

---

## When NOT To Use

Do not use this skill when:

- the task is to add new API coverage;
- the task is normal API implementation from a feature plan;
- the task is only architecture cleanup;
- the task is UI-only;
- the failure is already understood and only a simple refactor is needed.

Use Implement API Feature for planned implementation.

Use Refactor Overengineering for behavior-preserving cleanup.

Use Review Generated Code Quality for review-only tasks.

---

## Inputs

Use available context:

- failing test output;
- failing spec file;
- related assertion helpers;
- related schemas;
- related builders/generators;
- related API clients/helpers;
- request payload;
- response status;
- response body;
- API contract;
- project map;
- relevant rules;
- quality gate command.

Do not invent missing contract behavior.

Do not guess expected status codes or response body shapes.

---

## Workflow

### 1. Identify The Failing Point

Identify exactly where the test fails.

Classify the failing point as one of:

- request setup;
- precondition setup;
- request execution;
- status assertion;
- schema validation;
- behavior assertion;
- cleanup;
- unrelated environment failure.

If the test fails before the migrated or changed helper is reached, say so explicitly.

---

### 2. Capture Actual API Evidence

Inspect or report:

- request method;
- endpoint;
- request payload or query params;
- response status;
- response body;
- relevant headers only if needed;
- auth/setup context.

Do not log secrets, tokens, passwords, or sensitive values.

Mask sensitive data in reports.

---

### 3. Compare Against Contract And Test Intent

Compare actual behavior with:

- API contract;
- feature plan;
- existing test intent;
- current builders/generators;
- schema validation rules.

Classify the root cause as one of:

- test data invalid;
- builder/generator default invalid;
- request payload mismatch;
- missing required field;
- wrong field name;
- auth/setup issue;
- environment or backend instability;
- undocumented contract change;
- Zod schema too strict;
- assertion/helper bug;
- product bug.

---

### 4. Choose The Correct Fix Layer

Fix at the lowest correct layer.

Use this mapping:

- invalid reusable default data -> builder or generator;
- one-off invalid test value -> spec data;
- request composition bug -> API client/helper only if one exists and owns request composition;
- schema mismatch with documented contract -> schema;
- schema too strict without contract support -> schema strictness;
- behavior assertion wrong -> assertion helper or spec;
- auth/setup issue -> approved setup layer;
- product contract changed -> update test only with contract evidence;
- unclear behavior -> report blocked instead of forcing pass.

Do not fix API failures by weakening assertions without evidence.

Do not hide failures with skips unless the case is explicitly blocked/postponed.

---

### 5. Zod-Specific Checks

If the failure involves Zod schema validation:

- verify the schema matches the documented or accepted response contract;
- verify optional and nullable fields preserve previous behavior;
- verify `.strict()` is used only if the contract requires it;
- verify behavior assertions are not hidden inside schemas;
- verify feature-specific helpers use the shared Zod assertion helper;
- verify specs do not call raw `schema.parse()` when a feature helper exists.

If the failure happens before schema validation, do not modify schemas.

---

### 6. Test Data Checks

If the failure involves setup or preconditions:

- inspect builder defaults;
- inspect generator output;
- check uniqueness requirements;
- check password/email/name/role constraints;
- check backend validation errors;
- check whether shared static data is blocked, reused, locked, leaked, or expired.

Builder defaults must be valid by default.

Invalid or negative data must be explicit through overrides.

Do not put reusable data generation directly into specs.

---

### 7. Apply Minimal Fix

Apply only the minimal fix required to address the confirmed root cause.

Do not:

- add new coverage;
- refactor unrelated files;
- introduce API clients unless request composition reuse clearly justifies it;
- migrate unrelated helpers;
- change expected behavior without contract evidence;
- silence schema errors;
- remove assertions to pass tests.

---

### 8. Verify

After the fix, run:

1. the failing API spec;
2. related API specs if shared builders, generators, schemas, assertion helpers, API clients, or fixtures changed;
3. the quality gate command from the project map.

If verification cannot be completed, report why.

---

## Output Format

Report using this structure:

### 1. Root Cause

- failing test:
- failing step:
- actual status/body:
- root cause:
- evidence:

### 2. Classification

- failure type:
- affected layer:
- Zod/schema involved: yes/no:
- product behavior change suspected: yes/no:

### 3. Fix Applied

- files changed:
- fix summary:
- why this layer was correct:
- behavior preserved: yes/no:

### 4. Verification

- failing spec rerun:
- related specs rerun:
- quality gate:
- not run reason, if any:

### 5. Remaining Risks

- ...

---

## Done Criteria

This skill is complete when:

- the failing point is identified;
- actual API evidence is captured safely;
- root cause is classified;
- the fix is applied at the correct layer;
- assertions are not weakened without evidence;
- schemas are changed only when schema/contract mismatch is confirmed;
- reusable invalid data is fixed in builders or generators;
- impacted specs are rerun or documented as not run;
- quality gate is rerun or documented as not run.

---

## Main Principle

API healing fixes root cause at the correct layer.

Do not mask product behavior.

Do not weaken assertions.

Do not blame Zod when the failure happens before schema validation.

Do not change schemas unless the schema is the actual problem.
``