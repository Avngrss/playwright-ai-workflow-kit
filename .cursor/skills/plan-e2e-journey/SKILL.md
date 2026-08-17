# Skill: Plan E2E Journey

## Goal

Use this skill when a true end-to-end user or business journey needs planning.

The goal is to create or update an E2E journey plan at `specs/e2e/<area>/<journey>.md` without implementing Playwright tests.

This skill defines journey intent, boundary, setup/data/cleanup strategy, blockers, and implementation target.

---

## Related Rules

Follow these rules:

- E2E Testing Rules;
- Cross-Browser and Responsive Testing Rules;
- Test Strategy and Test Pyramid Rules;
- Test Structure and Tags Rules;
- Fixtures and Test Data Rules;
- Configuration and Secrets Rules;
- Multi-Target Environment Rules;
- Authentication Strategy Rules;
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

- the scope is a feature-level plan (`specs/<feature>/<feature>.md`);
- the scope is a short UI check (page render, field visibility, single validation, simple feedback);
- the task is to implement tests;
- the task is to create Playwright code;
- API/UI/schema/visual feature coverage is enough.

If the candidate is not truly E2E, redirect back to feature coverage planning.

---

## Inputs

Use relevant context:

- candidate journey name and business goal;
- related feature plans in `specs/<feature>/<feature>.md` (for coverage boundary only);
- project map and E2E rules;
- existing routes/pages/fixtures/helpers;
- known setup, data, cleanup, and environment constraints.

Output path must be:

- `specs/e2e/<area>/<journey>.md`

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

### 2a. Document Feature Targets

Follow Multi-Target Environment Rules and the project map.

Document for the journey:

- UI/application targets crossed (entry, intermediate pages, final assertion app);
- API/service targets crossed (backend actions, setup, cleanup);
- external/partner targets crossed;
- env name for each target from the project map;
- explicit ownership for setup, UI actions, and final assertions;
- setup/cleanup targets only when the journey uses them.

Simple project defaults:

- UI/application: `UI_BASE_URL`
- API: `API_BASE_URL`

If a required Feature Target or environment ownership is unclear:

- mark the journey **blocked**;
- document missing target or env name;
- do not use conditional readiness wording.

Do not derive API host from UI host.

Do not invent env variable names.

### 2b. Document Auth Strategy

Follow Authentication Strategy Rules and the project map.

Document for the journey:

- required: yes or no;
- role only if the project map registers roles and this journey uses one;
- auth as: `none`, `action`, or `precondition`;
- UI and API mechanisms from the project map;
- whether login is a journey step (`action`) or a setup session (`precondition`).

If the journey needs a signed-in start and the UI/API mode is not registered, mark the journey **blocked**.

Do not use storageState or UI login as hidden setup when login is a journey step.

How-to examples: `docs/auth-strategy.md`.

### 3. Define Setup/Data/Cleanup Strategy

Plan only allowed setup:

- API may be used only for setup/preconditions/cleanup;
- API must not replace the UI business flow under test.

Define:

- data strategy (disposable/generated/static);
- cleanup or isolation strategy;
- assumptions and risks.

### 4. Apply E2E Readiness Checklist

Run the mandatory readiness checklist before choosing status.

If ANY checklist item is unclear or not guaranteed, mark the journey as **blocked**.

Do not defer the decision to implementation.

### 5. Identify Dependencies And Blockers

Capture blockers and dependencies:

- mailbox/reset link/token;
- payment/third-party systems;
- unstable environment;
- unsafe cleanup;
- missing setup capabilities.

If any dependency is not deterministic and automation-safe, mark the journey as **blocked** with a clear reason and required unblocker.

### 6. Define Implementation Target

Include:

- target Playwright spec location under `tests/e2e/...`;
- required tags including `@e2e`;
- implementation notes for `/implement-e2e-flow`.

No Playwright code in the journey plan.

---

## Output Format

Use this exact structure in `specs/e2e/<area>/<journey>.md`:

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

## Target Applications / Services

UI apps crossed:
- <app name> — env: <name from project map> — role in journey: entry / action / final assertion

API services crossed:
- <service name> — env: <name from project map> — role: setup / cleanup / backend state

Setup/cleanup targets (only when needed):
- <target> — env: <name from project map> — used for: <setup or cleanup step>

If only one UI app and one API service exist, state defaults from project map.

If ownership is unclear, status must be **blocked**.

## Auth Strategy

- required:
- role: <only if registered in the project map; omit when no session>
- auth as: none | action | precondition
- API mode:
- UI mode:
- persistence:
- isolation:
- capture / secrets:

Login as a journey step uses `auth as: action`. Do not hide it behind storageState.

If a signed-in start is required and the mode is not in the project map, status must be **blocked**.

## Expected Outcome

<Final business-visible result>

## Determinism Guarantees

<Why this E2E flow is deterministic. Include payment or external flow behavior, step stability, and absence of unpredictable behavior.>

## Final Assertion Marker

<Exact UI elements used for final validation, such as confirmation heading text, success container, or account/dashboard marker. No vague wording.>

## Data Strategy

<Generated/disposable/static data strategy>

## Setup / Preconditions

<Allowed setup only. API may be used only for setup/preconditions, not to replace the UI journey.>

## Cleanup Strategy

<Safe cleanup approach. API may be used here if available.>

## External Dependencies And Blockers

<Mailbox, payment, reset links, third-party dependencies, unsafe cleanup, unstable environment, etc. If blocked, include reason and required unblocker.>

## Status

- ready to implement now
OR
- blocked

Forbidden status wording:

- "ready if"
- "ready once"
- "blocked until"
- "conditionally"
- "conditionally blocked"
- "conditionally ready"

## Implementation Target

Test location:
- tests/e2e/<area>/<journey>.e2e.spec.ts

Tags:
- @e2e

## Implementation Notes

<Notes for implement-e2e-flow. Do not include Playwright code. Only present when status is ready to implement now.>
```

---

## Deterministic Readiness Requirement

E2E plans must be deterministic.

Do NOT produce:

- "ready if"
- "conditionally ready"
- "conditionally blocked"
- "blocked until confirmed"
- "ready once"
- any wording that implies uncertainty or future validation

Only two statuses are allowed:

- ready to implement now
- blocked

If determinism, final assertion, external dependencies, data strategy, or cleanup/isolation cannot be stated with certainty, the journey MUST be marked as **blocked**.

Do not defer readiness decisions to implementation.

---

## E2E Readiness Checklist (Mandatory)

Before marking a journey as **ready to implement now**, ALL of the following must be explicitly defined:

- **Flow Determinism:**
  The full journey can run without randomness or unstable behavior.

- **Final Assertion:**
  A clear and stable UI marker exists for the final expected outcome.

- **External Dependencies:**
  All dependencies (payments, email, etc.) are deterministic and automation-safe.

- **Data Strategy:**
  Test data can be created safely and deterministically.

- **Cleanup or Isolation:**
  Either cleanup exists OR the system safely allows disposable data.

- **Target Ownership:**
  Every UI app and API service crossed is named with env names from the project map.
  Setup, actions, and final assertion ownership are explicit.

If ANY item is unclear or not guaranteed:

→ the journey MUST be marked as **blocked**.

---

## Guardrails

Do not:

- implement tests;
- create Playwright specs;
- replace UI business actions with API calls;
- duplicate API/UI/schema/visual feature coverage;
- write low-level click-by-click steps unless needed for clarity;
- invent missing requirements or dependencies;
- use conditional readiness wording;
- mark a journey ready when any readiness checklist item is unclear.

### Cross-Browser And Responsive Policy

E2E cross-browser and responsive expansion is **not** the default.

- document browser or viewport variants in `specs/e2e/<area>/<journey>.md` only when a documented browser or viewport risk exists;
- limit cross-browser E2E to very small smoke journeys;
- do not plan full E2E regression matrices across browsers or viewports by default;
- if no browser-specific or viewport-specific E2E risk exists, state that no extra cross-browser or responsive E2E coverage is needed.

---

## Done Criteria

This skill is complete when:

- `specs/e2e/<area>/<journey>.md` was created/updated;
- candidate is validated as true E2E (or redirected);
- boundary is explicit (covered vs not covered);
- setup/data/cleanup strategy is defined;
- determinism guarantees are documented;
- target UI apps and API services are documented with env names from project map;
- Auth Strategy is documented;
- signed-in start without a registered auth mode is **blocked**;
- final assertion marker is explicit;
- status is exactly **ready to implement now** or **blocked** (no conditional wording);
- readiness checklist was applied;
- blockers/dependencies are documented when blocked;
- implementation target under `tests/e2e/...` is defined;
- tags include `@e2e`;
- no Playwright implementation was added.