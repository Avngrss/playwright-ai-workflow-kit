# Skill: Plan E2E Journey

## Goal

Use this skill when a true end-to-end user or business journey needs planning.

The goal is to create or update an E2E journey plan at `specs/e2e/<journey>.md` without implementing Playwright tests.

This skill defines journey intent, boundary, setup/data/cleanup strategy, blockers, and implementation target.

---

## Related Rules

Follow these rules:

- E2E Testing Rules;
- Test Strategy and Test Pyramid Rules;
- Test Structure and Tags Rules;
- Fixtures and Test Data Rules;
- Configuration and Secrets Rules;
- Test Isolation and State Rules;
- Project Map Rules;
- Agent Workflow.

If this skill conflicts with a rule or project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- the candidate is a critical full user/business journey crossing meaningful boundaries;
- lower-level API/UI/schema/visual coverage is not enough;
- E2E planning is required before implementation;
- an E2E journey plan file needs to be created or updated under `specs/e2e/`.

---

## When NOT To Use

Do not use this skill when:

- the scope is a feature-level plan (`specs/<feature>.md`);
- the scope is a short UI check (page render, field visibility, single validation, simple feedback);
- the task is to implement tests;
- the task is to create Playwright code;
- API/UI/schema/visual feature coverage is enough.

If the candidate is not truly E2E, redirect back to feature coverage planning.

---

## Inputs

Use relevant context:

- candidate journey name and business goal;
- related feature plans in `specs/<feature>.md` (for coverage boundary only);
- project map and E2E rules;
- existing routes/pages/fixtures/helpers;
- known setup, data, cleanup, and environment constraints.

Output path must be:

- `specs/e2e/<journey>.md`

---

## Workflow

### 1. Validate E2E Candidate

Confirm the candidate is a true E2E journey:

- crosses multiple states/pages/system boundaries;
- has meaningful final business-visible outcome;
- requires journey-level confidence that lower levels do not provide.

Reject and redirect short UI checks back to feature/UI coverage.

### 2. Define E2E Boundary

Explicitly separate:

- what E2E will cover;
- what remains covered by API/UI/schema/visual feature coverage.

Do not duplicate lower-level checks.

### 3. Define Setup/Data/Cleanup Strategy

Plan only allowed setup:

- API may be used only for setup/preconditions/cleanup;
- API must not replace the UI business flow under test.

Define:

- data strategy (disposable/generated/static);
- cleanup or isolation strategy;
- assumptions and risks.

### 4. Identify Dependencies And Blockers

Capture blockers and dependencies:

- mailbox/reset link/token;
- payment/third-party systems;
- unstable environment;
- unsafe cleanup;
- missing setup capabilities.

Mark blocked journeys clearly with reason.

### 5. Define Implementation Target

Include:

- target Playwright spec location under `tests/e2e/...`;
- required tags including `@e2e`;
- implementation notes for `/implement-e2e-flow`.

No Playwright code in the journey plan.

---

## Output Format

Use this exact structure in `specs/e2e/<journey>.md`:

```md
# <Journey Name> E2E Journey

## Goal

<Business goal of the journey>

## Journey Summary

<Short business-level journey description>

## Business Value

<Why this journey matters>

## E2E Boundary

Covered by E2E:
- ...

Not covered by E2E:
- ...

## Entry Point

<User state / starting point>

## Expected Outcome

<Final business-visible result>

## Data Strategy

<Generated/disposable/static data strategy>

## Setup / Preconditions

<Allowed setup only. API may be used only for setup/preconditions, not to replace the UI journey.>

## Cleanup Strategy

<Safe cleanup approach. API may be used here if available.>

## External Dependencies And Blockers

<Mailbox, payment, reset links, third-party dependencies, unsafe cleanup, unstable environment, etc.>

## Implementation Target

Test location:
- tests/e2e/<area>/<journey>.e2e.spec.ts

Tags:
- @e2e

## Implementation Notes

<Notes for implement-e2e-flow. Do not include Playwright code.>
```

---

## Guardrails

Do not:

- implement tests;
- create Playwright specs;
- replace UI business actions with API calls;
- duplicate API/UI/schema/visual feature coverage;
- write low-level click-by-click steps unless needed for clarity;
- invent missing requirements or dependencies.

---

## Done Criteria

This skill is complete when:

- `specs/e2e/<journey>.md` was created/updated;
- candidate is validated as true E2E (or redirected);
- boundary is explicit (covered vs not covered);
- setup/data/cleanup strategy is defined;
- blockers/dependencies are documented;
- implementation target under `tests/e2e/...` is defined;
- tags include `@e2e`;
- no Playwright implementation was added.
