# Skill: Align Feature Plan With TMS

## Goal

Use this skill when a feature coverage plan already exists and must be aligned with TMS cases.

The goal is to compare TMS test intent with the existing automation plan, add traceability, identify coverage gaps, and update the feature plan without implementing tests.

This skill does not replace Plan Test Coverage.

This skill does not implement API or UI tests.

This skill does not modify TMS entities.

---

## Related Rules

Follow these rules:

- TMS Integration Rules;
- Test Strategy and Test Pyramid Rules;
- API Architecture Rules;
- API Schema Validation Rules;
- Visual Testing Rules;
- Project Map Rules;
- Agent Workflow;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- a feature plan already exists;
- Qase or another TMS contains related test cases;
- TMS cases should be used for traceability;
- existing automation needs to be compared with TMS cases;
- TMS cases are UI/manual cases but automation level must be decided by risk;
- coverage gaps must be documented before implementation.

---

## When NOT To Use

Do not use this skill when:

- no feature plan exists and the task is to create a plan only from TMS cases;
- the task is to implement tests;
- the task is to create or update TMS cases;
- the task is to create a Qase run;
- the task is to publish automation results;
- the task is only to heal a failing test.

Use Plan Test Coverage when creating a feature plan from UI/API requirements.

Use Plan From TMS (`.cursor/skills/plan-from-tms/SKILL.md`) when no feature plan exists and TMS is the main planning source.

Use this Align Feature Plan With TMS skill when `specs/<feature>.md` already exists.

Use Implement API Feature From Plan or Implement UI Feature From Plan only after the aligned feature plan is accepted.

---

## Inputs

Use available context:

- existing feature plan path;
- TMS provider;
- Qase project code;
- suite id or suite path/name;
- case ids or filter, if provided;
- API contract source, if available;
- current automated specs, if relevant;
- existing schemas, assertion helpers, Page Objects, builders, and fixtures, if relevant;
- project map;
- relevant rules.

Required TMS context:

- provider;
- project code;
- suite id or suite name/path;
- access mode.

If project code is missing, do not guess.

List available Qase projects in read-only mode and ask the user to choose, or report a clear blocker.

If suite id, path, or name is missing, list available suites for the selected project in read-only mode and ask the user to choose, or report a clear blocker.

Do not require an extra discovery flag in the prompt.

---

## Default TMS Access Mode

Use read-only TMS access by default.

Allowed:

- list projects;
- list suites;
- read test cases;
- search/filter cases;
- read case metadata.

Not allowed unless explicitly requested:

- create TMS cases;
- update TMS cases;
- delete TMS cases;
- reorder TMS cases or suites;
- create test runs;
- publish results;
- create or update defects;
- modify custom fields, milestones, environments, shared steps, or attachments.

---

## Workflow

### 1. Read Existing Feature Plan

Read the existing feature plan first.

Identify:

- feature name;
- source of truth;
- in scope;
- out of scope;
- API coverage ready to implement now;
- API coverage blocked/postponed;
- UI coverage ready to implement now;
- UI coverage blocked/postponed;
- visual checkpoints;
- schema/contract checks;
- not automated items;
- API Implementation Brief;
- UI Implementation Brief.

Do not replace the feature plan blindly with TMS cases.

---

### 2. Read TMS Cases

Use Qase MCP when provider is Qase.

Read the selected TMS cases in read-only mode.

Capture:

- case id;
- title;
- preconditions;
- steps summary;
- expected result summary;
- priority;
- severity;
- status;
- tags or custom fields, if available.

If Qase MCP is unavailable and the prompt says Qase MCP only, stop and report available MCP servers.

Do not use direct Qase API fallback when the task explicitly says Qase MCP only.

---

### 3. Interpret TMS Intent

Treat TMS cases as test intent and traceability source.

Do not assume one TMS case equals one Playwright test.

For each case, identify:

- user-facing intent;
- backend/API risk, if any;
- validation risk;
- boundary risk;
- schema/contract risk;
- visual risk;
- setup/data risk;
- whether the case is manual-only or automation-suitable.

TMS cases may be written as UI/manual cases.

Do not blindly preserve the TMS case level as the automation level.

Choose automation level by risk and available source of truth.

---

### 4. Compare Against Existing Plan

For each TMS case, classify relationship to the current plan:

- already covered;
- conceptually covered with different data values;
- partially covered;
- missing but ready to implement;
- blocked/postponed;
- not automated;
- out of scope.

Prefer mapping existing automation to TMS intent when behavior is equivalent.

Do not add duplicate tests only to match exact TMS values unless traceability requires exact values or behavior.

---

### 5. Decide Automation Ownership

Use the test pyramid.

Prefer API or schema/contract coverage when the TMS case describes:

- backend validation;
- request/response status;
- response body shape;
- authentication token behavior;
- authorization behavior;
- filtering predicate;
- sorting predicate;
- data transformation;
- persistence behavior;
- boundary behavior;
- documented negative behavior.

Prefer UI coverage when the TMS case describes:

- visible user journey;
- browser interaction;
- visible validation feedback;
- visible success or error state;
- navigation;
- frontend/backend integration visible to the user.

Prefer visual checkpoint only when the TMS case describes meaningful visual layout risk.

Use blocked/postponed when:

- API contract is missing;
- status or response body is unclear;
- boundary behavior is undocumented;
- required setup mechanism is missing;
- UI interaction path is unclear;
- stable locator or UI state is unclear;
- environment is unstable.

Use not automated when:

- automation value is low;
- behavior is better verified manually;
- observation is unreliable;
- requirement is unclear;
- automation cost is higher than value.

---

### 6. Negative And Boundary Cases

If TMS cases describe negative or boundary behavior, check whether source of truth defines expected behavior.

Do not guess:

- status codes;
- response bodies;
- validation messages;
- boundary limits;
- unsupported enum behavior;
- malformed request behavior.

If expected behavior is unclear, mark the item blocked/postponed with reason.

Do not implement or plan guessed negative API tests.

---

### 7. Update Feature Plan

Update only `specs/<feature>.md` unless the prompt provides another feature plan path.

Add or update in that feature plan:

- TMS Source;
- TMS Mapping;
- coverage gaps;
- ready-to-implement additions;
- blocked/postponed items;
- not automated items;
- open questions;
- implementation brief adjustments if needed.

Do not implement tests.

Do not create builders, fixtures, Page Objects, schemas, API clients, assertion helpers, or visual checkpoints.

Do not modify TMS entities.

---

## Required Output Style In The Feature Plan

The aligned feature plan should be easy to act on.

Use this order for TMS-related sections:

### TMS Source

Include:

- provider:
- project code:
- suite id:
- suite title/path:
- cases reviewed:
- access mode:
- MCP server:
- filter/QQL, if used:

### TMS Alignment Summary

Start with a short summary:

- already covered:
- partially covered:
- missing and ready:
- blocked/postponed:
- not automated:
- out of scope:

### TMS Mapping

For each TMS case:

- case id:
- title:
- intent/risk:
- current coverage status:
- automation decision:
- target level:
- reason:
- planned scenario, if any:
- status:

Allowed statuses:

- covered;
- conceptually covered;
- partially covered;
- ready to implement now;
- blocked;
- postponed;
- not automated;
- out of scope.

### TMS-Driven Plan Adjustments

List only actual plan changes:

- API coverage added to ready now:
- UI coverage added to ready now:
- schema/contract checks added:
- blocked/postponed items added:
- not automated items added:
- no-change mappings:

### Open TMS / Contract Questions

List unresolved questions, for example:

- missing API contract;
- unclear boundary behavior;
- unclear validation message;
- unclear UI expected behavior;
- setup/data uncertainty;
- exact TMS value required or behavioral equivalence acceptable.

---

## Reporting Format

When reporting the work in chat, keep the report concise.

Use:

### 1. Summary

- feature plan:
- TMS source:
- cases reviewed:
- files changed:

### 2. Alignment Result

- already covered:
- missing and ready:
- blocked/postponed:
- not automated:

### 3. Key Decisions

- API ownership:
- UI ownership:
- schema/contract ownership:
- visual ownership:
- blocked reasons:

### 4. Verification

- not run reason:
- recommended next review:

### 5. Recommended Next Step

Use one:

- review aligned feature plan;
- implement API ready coverage;
- implement UI ready coverage;
- clarify contract;
- clarify TMS expectation;
- no automation needed.

---

## Guardrails

Do not:

- implement tests;
- modify TMS cases;
- create TMS runs;
- publish results;
- add reporter integration;
- add TMS IDs to tests before mapping review;
- assume one TMS case equals one Playwright test;
- convert every UI/manual TMS case into UI automation;
- invent API coverage without API source of truth;
- guess undocumented negative or boundary behavior;
- overwrite existing feature plan decisions without explaining why;
- create speculative abstractions;
- modify unrelated files.

---

## Done Criteria

This skill is complete when:

- the existing feature plan was read;
- TMS cases were read in read-only mode;
- TMS Source was documented;
- TMS Mapping was added or updated;
- existing coverage was compared against TMS intent;
- missing ready coverage was identified;
- blocked/postponed items include reasons;
- not automated items include reasons;
- no TMS entities were modified;
- no tests were implemented;
- no unrelated files were modified;
- recommended next step is clear.

---

## Main Principle

TMS provides traceability and test intent.

Feature plans decide automation ownership.

Use TMS alignment to compare intent against planned or existing automation.

Do not let TMS structure force poor automation design.