# Skill: Plan From TMS

## Goal

Use this skill when `specs/<feature>.md` does not exist yet and TMS/Qase cases are the main planning input.

The goal is to create a complete feature coverage plan from TMS test intent, add traceability, choose automation ownership by risk, and write `specs/<feature>.md` without implementing tests.

This skill does not replace Plan Test Coverage when UI/API requirements are the primary source.

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

For TMS access, discovery, negative/boundary policy, and reporter separation, follow TMS Integration Rules.

---

## Skill Boundary

Use Plan From TMS when:

- `specs/<feature>.md` does not exist;
- TMS cases are the main planning source for the feature.

Use Align Feature Plan With TMS (`.cursor/skills/align-plan-with-tms/SKILL.md`) when `specs/<feature>.md` already exists.

Use Plan Test Coverage when creating a feature plan primarily from UI/API requirements without TMS as the main source.

Use Implement API Feature From Plan or Implement UI Feature From Plan only after the feature plan is reviewed and accepted.

---

## When To Use

Use this skill when:

- no feature plan exists for the target feature;
- Qase or another TMS contains the primary test intent for the feature;
- a new `specs/<feature>.md` must be created from TMS cases;
- TMS cases are UI/manual but automation level must be decided by risk;
- traceability to TMS cases is required before implementation.

---

## When NOT To Use

Do not use this skill when:

- `specs/<feature>.md` already exists and only needs TMS alignment;
- the task is to implement tests;
- the task is to create or update TMS cases;
- the task is to create a Qase run;
- the task is to publish automation results;
- the task is only to heal a failing test.

If a feature plan already exists, stop and use Align Feature Plan With TMS instead.

---

## Inputs

Use available context:

- feature name;
- target plan path, normally `specs/<feature>.md`;
- TMS provider;
- Qase project code;
- suite id or suite path/name;
- case ids or filter, if provided;
- API contract source, if known;
- UI target, if known;
- existing automated specs for the same feature area, if relevant;
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
- search or filter cases;
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

## Qase MCP Usage

Use Qase MCP as the preferred mechanism for reading Qase data.

If Qase MCP is unavailable, report that MCP is unavailable and list available MCP servers.

When the task explicitly says Qase MCP only, do not use direct Qase API fallback.

When access mode is read-only MCP only, record that in the feature plan TMS Source section.

---

## Workflow

### 1. Confirm Plan Does Not Exist

Confirm the target feature plan path, normally `specs/<feature>.md`.

If the file already exists and the task is to align rather than recreate, stop and use Align Feature Plan With TMS.

If the user explicitly asks to replace an existing plan, stop and ask for confirmation before overwriting.

---

### 2. Read TMS Cases

Use Qase MCP when provider is Qase.

Read the selected TMS cases in read-only mode.

Capture per case:

- case id;
- title;
- preconditions;
- steps summary;
- expected result summary;
- priority;
- severity;
- status;
- tags or custom fields, if available.

Do not dump full raw case text into the feature plan.

Summarize intent instead.

---

### 3. Interpret TMS Intent

Treat TMS cases as test intent and traceability source.

Do not assume one TMS case equals one Playwright test.

For each case or consolidated intent group, identify:

- user-facing intent;
- backend/API risk, if any;
- validation risk;
- boundary risk;
- schema/contract risk;
- visual risk;
- setup/data risk;
- whether the case is manual-only or automation-suitable.

TMS cases may be written as UI/manual scenarios.

Do not blindly preserve the TMS case level as the automation level.

UI/manual TMS cases may map to API, schema/contract, UI, visual checkpoint, not automated, blocked, or postponed depending on risk and available source of truth.

Consolidate cases that verify the same distinct behavior into one planned scenario when appropriate.

---

### 4. Identify Source Of Truth

Before recommending API or schema coverage, identify available source of truth.

Prefer, in order:

- project map API contract source;
- documented OpenAPI/Swagger for the feature area;
- explicit prompt or requirement references;
- stable UI behavior described in TMS when no API contract exists.

If a TMS case implies backend behavior but no API contract or accepted source is available, mark API coverage as blocked or postponed.

Do not invent API assertions, status codes, response bodies, or boundary limits.

---

### 5. Define Feature Scope

Define the feature scope from TMS suite intent and feature name.

Identify:

- feature name;
- in-scope behaviors derived from TMS intent;
- out-of-scope adjacent controls, endpoints, or combinations unless TMS cases clearly cover them;
- UI target, if applicable;
- API contract source, if applicable.

Do not expand scope to unrelated catalog, auth, search, sort, filter, or visual areas unless TMS cases or explicit prompt require them.

---

### 6. Decide Automation Ownership

Use the test pyramid and TMS Integration Rules.

Prefer API or schema/contract coverage when the TMS intent describes backend contract, predicates, documented validation, response shape, auth, or documented negative behavior.

Prefer UI coverage when the TMS intent describes visible user journey, browser interaction, visible feedback, navigation, or frontend/backend integration visible to the user.

Prefer visual checkpoint only when the TMS intent describes meaningful visual layout risk.

Use blocked or postponed when contract, setup, UI path, or environment details are missing.

Use not automated when automation value is low, behavior is unstable, or manual verification is more appropriate.

---

### 7. Negative And Boundary Cases

Implement negative or boundary planning only when the contract or accepted source of truth defines expected behavior.

Do not guess:

- status codes;
- response bodies;
- validation messages;
- boundary limits;
- unsupported enum behavior;
- malformed request behavior.

If TMS describes useful negative or boundary intent but the contract is unclear, mark blocked or postponed with reason.

---

### 8. Optional Existing Automation Check

If related automation already exists in the repository, inspect it lightly.

Identify whether TMS intent is:

- already covered;
- conceptually covered with different values;
- partially covered;
- not covered;
- blocked by missing contract or setup.

Prefer mapping existing automation to TMS intent when behavior is equivalent.

Do not add duplicate planned coverage only to match exact TMS steps unless traceability requires exact values or behavior.

If no related automation exists, state that in the plan summary.

---

### 9. Write Feature Plan

Create or update only `specs/<feature>.md` unless the prompt provides another approved path.

Include TMS sections and the normal feature coverage plan sections listed below.

Do not implement tests.

Do not create builders, fixtures, Page Objects, schemas, API clients, assertion helpers, or visual checkpoints.

Do not modify TMS entities.

Do not add TMS IDs to tests yet.

Stop after writing the feature plan.

---

## Required Feature Plan Structure

Write `specs/<feature>.md` with these sections in a practical order.

### Feature / Area

- name;
- scope;
- source of truth;
- in scope;
- out of scope;
- UI target;
- API contract source;
- requirements/specs.

### TMS Source

- provider;
- project code;
- suite id;
- suite title/path;
- cases reviewed;
- access mode;
- MCP server;
- filter/QQL, if used;
- source type, such as UI/manual or risk-based.

### TMS Planning Summary

Start with a short summary:

- cases reviewed;
- ready to implement now;
- blocked/postponed;
- not automated;
- out of scope;
- already covered by existing automation, if any.

### TMS Mapping

For each reviewed TMS case:

- case id;
- title;
- intent/risk;
- automation decision;
- target level;
- reason;
- planned scenario, if any;
- status.

Allowed statuses:

- ready to implement now;
- blocked;
- postponed;
- not automated;
- out of scope;
- covered by existing automation;
- conceptually covered;
- partially covered.

### Coverage Matrix

For each behavior derived from TMS intent:

- behavior;
- risk;
- recommended level;
- priority: smoke or regression;
- reason;
- duplicate coverage risk;
- notes;
- related TMS case ids, when useful.

### Smoke / Regression Split

- smoke;
- regression.

### API Coverage

Ready to implement now:

- scenarios;
- reason;
- dependencies;
- blockers;
- implementation decisions.

Blocked or postponed:

- scenarios;
- reason;
- blocker or clarification needed.

### API Implementation Brief

For each API scenario ready to implement now:

- endpoint;
- method;
- tags;
- payload source;
- scenario data strategy;
- expected status;
- response assertions;
- schema validation decision;
- negative coverage decision;
- boundary coverage decision;
- builder decision;
- API client decision;
- assertion helper decision;
- contract gaps/blockers.

### UI Coverage

Ready to implement now:

- scenarios;
- reason;
- dependencies;
- blockers;
- implementation decisions.

Blocked or postponed:

- scenarios;
- reason;
- blocker or clarification needed.

### UI Implementation Brief

For each UI scenario ready to implement now:

- route/page;
- tags;
- preconditions;
- test data;
- scenario data strategy;
- user steps;
- expected visible outcome;
- unique UI risk;
- why API/schema is not sufficient;
- recommended Page Object;
- Page Object actions/readers;
- Component Object decision;
- locator discovery notes;
- assertions in spec;
- not covered in UI.

### Visual Checkpoints

Planned now:

- target UI state;
- screenshot scope;
- reason;
- dynamic content risks;
- recommended tags.

Postponed:

- target UI state;
- reason postponed.

### Schema / Contract Checks

Planned now:

- checks;
- reason;
- dependencies.

Postponed:

- checks;
- reason postponed.

### Not Automated / Blockers

- unclear contract;
- missing setup;
- unstable behavior;
- low automation value;
- TMS-only manual checks;
- other blockers with reasons.

### Open TMS / Contract Questions

- missing API contract;
- unclear boundary behavior;
- unclear validation message;
- unclear UI expected behavior;
- setup/data uncertainty;
- exact TMS value required or behavioral equivalence acceptable.

### Recommended Next Commands

Informational only. Examples:

- review feature plan;
- `/align-plan-with-tms` if plan already existed and alignment is still needed later;
- `/implement-api-batch`;
- `/implement-ui-batch`;
- `/implement-visual-checkpoint`;
- clarify contract;
- clarify TMS expectation.

Recommended commands are not permission to start implementation during this skill.

For output format details beyond TMS sections, follow Plan Test Coverage where applicable.

---

## Reporting Format

When reporting the work in chat, keep the report concise.

Do not dump full raw TMS case text.

Use:

### 1. Summary

- feature plan created;
- TMS source;
- cases reviewed;
- files changed.

### 2. Planning Result

- ready to implement now;
- blocked/postponed;
- not automated;
- already covered by existing automation, if any.

### 3. Key Decisions

- API ownership;
- UI ownership;
- schema/contract ownership;
- visual ownership;
- blocked reasons.

### 4. Verification

- not run reason;
- recommended next review.

### 5. Recommended Next Step

Use one:

- review feature plan;
- align with existing automation if plan already existed elsewhere;
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
- create speculative abstractions in the plan beyond implementation decisions;
- modify unrelated files;
- overwrite an existing feature plan without explicit user confirmation.

---

## Done Criteria

This skill is complete when:

- the target feature plan did not already exist, or overwrite was explicitly approved;
- TMS cases were read in read-only mode;
- `specs/<feature>.md` was created or updated;
- TMS Source was documented;
- TMS Mapping was added;
- normal feature coverage plan sections were included;
- automation ownership was chosen by risk and source of truth;
- blocked/postponed and not automated items include reasons;
- no TMS entities were modified;
- no tests were implemented;
- no unrelated files were modified;
- recommended next step is clear.

---

## Main Principle

TMS provides traceability and test intent.

Feature plans decide automation ownership.

Use Plan From TMS to create the first plan from TMS cases.

Use Align Feature Plan With TMS when a plan already exists.

Do not let TMS structure force poor automation design.
