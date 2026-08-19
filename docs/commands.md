# Commands

Slash-command templates. When to run them: [Quick flow](quick-flow.md) or [Long flow](long-flow.md). Fuller prompts: [Prompts](prompts.md).

---

## Before you send a command

1. Which command?
2. Which feature plan or files are the input?
3. What scope is allowed?
4. What should be verified after?

Prefer Agent mode when the command must write a file (`specs/<feature>/<feature>.md`, tests, Page Objects).

---

## Command index

| Command | Skill |
|---------|--------|
| [`/plan-feature`](#plan-feature) | `plan-test-coverage` |
| [`/update-feature-plan`](#update-feature-plan) | `plan-test-coverage` |
| [`/plan-from-tms`](#plan-from-tms) | `plan-from-tms` |
| [`/align-plan-with-tms`](#align-plan-with-tms) | `align-plan-with-tms` |
| [`/inspect-api-collection`](#inspect-api-collection) | `inspect-api-collection` |
| [`/plan-from-api-collection`](#plan-from-api-collection) | `plan-from-api-collection` |
| [`/audit-api-collection-coverage`](#audit-api-collection-coverage) | `audit-api-collection-coverage` |
| [`/implement-api-batch`](#implement-api-batch) | `implement-api-feature` |
| [`/implement-ui-batch`](#implement-ui-batch) | `implement-ui-feature` |
| [`/plan-e2e-journey`](#plan-e2e-journey) | `plan-e2e-journey` |
| [`/implement-e2e-flow`](#implement-e2e-flow) | `implement-e2e-flow` |
| [`/implement-visual-checkpoint`](#implement-visual-checkpoint) | `implement-visual-test` |
| [`/create-builder`](#create-builder) | `create-test-data-builder` |
| [`/discover-ui-components`](#discover-ui-components) | `discover-ui-components` |
| [`/create-page-object`](#create-page-object) | `create-page-object` |
| [`/create-api-client`](#create-api-client) | `create-api-client` |
| [`/create-fixture`](#create-fixture) | `create-fixture` |
| [`/refactor-page-object-to-components`](#refactor-page-object-to-components) | `refactor-page-object-to-components` |
| [`/review-generated`](#review-generated) | `review-generated-code-quality` |
| [`/audit-test-data-strategy`](#audit-test-data-strategy) | `audit-test-data-strategy` |
| [`/audit-test-stability`](#audit-test-stability) | `audit-test-stability` |
| [`/audit-security`](#audit-security) | `audit-security-posture` |
| [`/audit-test-coverage`](#audit-test-coverage) | `audit-test-coverage` |
| [`/review-ui-suite`](#review-ui-suite) | `review-ui-suite` |
| [`/review-framework-change`](#review-framework-change) | `review-framework-change` |
| [`/refactor-overengineering`](#refactor-overengineering) | `refactor-overengineering` |
| [`/heal-api-test`](#heal-api-test) | `heal-api-test` |
| [`/heal-ui-test`](#heal-ui-test) | `heal-ui-test` |
| [`/run-verification`](#run-verification) | `run-verification` |
| [`/update-project-map`](#update-project-map) | `update-project-map` |
| [`/harden-rules`](#harden-rules) | `harden-rules-from-failure` |
| [`/add-allure-metadata`](#add-allure-metadata) | `configure-allure-reporting` |

Skills live under `.cursor/skills/<name>/SKILL.md`. Commands stay short; skills own the procedure.

---

## Catalog

The sections below are the command templates. Fill placeholders. Do not paste full rules into the prompt.

---

## Register auth in the project map (before features)

Not a slash command. Tell the agent once, then plan features.

Guide: [Auth strategy](auth-strategy.md)

### Template

```md
Update project map Auth Strategy in `.cursor/rules/00-project-map.mdc`.

Follow: @.cursor/rules/authentication-strategy.rules.mdc

Do not store tokens, passwords, or session JSON in the map, specs, or git.

How API tests get a session:
<helper path, or "create a user via this API then login">

How UI tests get a session:
<session file path per role, inject, or create user>

Roles:
<product role names>

Default for new features:
signed-in precondition | no session

Stop after the project map is updated.
Do not implement tests in this step.
```

---

## `/plan-feature`

### Purpose

Create a complete feature coverage plan.

The plan should classify coverage as:

- ready to implement now;
- blocked;
- postponed;
- not automated.

### Skill

```text
@.cursor/skills/plan-test-coverage/SKILL.md
```

### Use When

- starting a new feature;
- deciding API/UI/visual/schema coverage;
- creating or updating `specs/<feature>/<feature>.md`;
- avoiding duplicate coverage across layers.

### Do Not Use When

- implementation has already been approved and scoped;
- only a locator fix is needed;
- a test is failing and needs healing.

### Template

```md
Use Playwright Planner.
Use Skill: @.cursor/skills/plan-test-coverage/SKILL.md

Feature:
<feature name>

Targets:
- UI: <route/page>
- API contract: <swagger/openapi/docs link>
- requirements/specs: <path/link if any>

Task:
Create a full feature coverage plan.

Scope:
- planning only
- allowed change: create/update only specs/<feature>/<feature>.md
- do not include E2E — E2E journeys are planned separately in specs/e2e/<area>/<journey>.md

Output:
- Auth Strategy (required, role, auth as, API/UI modes from the project map)
- coverage matrix
- smoke/regression split
- API coverage ready to implement now
- API coverage blocked/postponed
- UI coverage ready to implement now
- UI coverage blocked/postponed
- cross-browser/responsive decisions or explicit no-extra-coverage note
- Cross-Browser Implementation Brief when applicable
- Responsive Implementation Brief when applicable
- visual checkpoints planned now
- visual checkpoints postponed
- schema/contract checks
- not automated / blockers
- API Implementation Brief
- UI Implementation Brief
- note that E2E is planned separately when a full journey may be needed later
- recommended next commands to run manually

Coverage grouping rule:
- do not split coverage into first/later batches by default
- put all safe and unblocked coverage into ready to implement now
- put only genuinely blocked, unstable, unclear, or intentionally deferred coverage into blocked/postponed
- implementation details such as helpers, builders, clients, Page Objects, fixtures, and metadata helpers are not scenarios

Stop condition:
- stop after creating or updating the feature coverage plan
- do not start implementation
- do not implement API tests
- do not implement UI tests
- do not create builders, fixtures, Page Objects, API clients, or visual checkpoints
- do not add Allure metadata
- do not run implementation verification
- recommended next commands are output only, not permission to execute

Execution mode guidance:
- prefer Agent mode for this command when the expected output is a specs/<feature>/<feature>.md file
- do not use Cursor Plan mode Build for planning-only tasks
- do not require a separate Build step or follow-up implementation step to write the plan file
```

---

## `/update-feature-plan`

### Purpose

Refresh an **existing** feature plan after product, contract, locator, or requirement change.

Use this before implementing or healing tests when the app changed — not for a first-time plan (`/plan-feature`) or a pure technical heal.

`What changed` may be `unknown`. The agent then discovers the delta from the plan vs the app, contract, or failing tests.

Requirements may be attached the same way as `/plan-feature` (`requirements/specs`, a path, a link, pasted text, or `@file`). When present, they are the intended behavior for the refresh. If they disagree with the live app, the agent records the drift instead of guessing.

`Layer to refresh` may be `api`, `ui`, `both`, or omitted. Specifying a layer is helpful; the agent still checks the other layer for side effects.

For E2E journey changes, use `/plan-e2e-journey`, not this command.

### Skill

```text
@.cursor/skills/plan-test-coverage/SKILL.md
```

### Use When

- requirements, validation, or UI flow changed;
- API contract or status expectations changed;
- controls or screens were added or removed;
- failing tests may reflect requirement drift, not just locators;
- TMS, OpenAPI, or product docs disagree with the current plan;
- something broke and the exact product change is not known.

### Do Not Use When

- the plan is current and only a locator/timing fix is needed (`/heal-ui-test` or `/heal-api-test`);
- creating a net-new feature with no existing plan (`/plan-feature`);
- the failing coverage is a full E2E journey (`/plan-e2e-journey`).

### Template

See `.cursor/commands/update-feature-plan.md`.

### After Update

```text
/update-feature-plan
→ review specs/<feature>/<feature>.md
→ /implement-api-batch and/or /implement-ui-batch (ready items only)
→ /heal-* only for technical drift against the updated plan
→ npm run qa:gate
→ /review-generated
```

Rule: `.cursor/rules/feature-change-lifecycle.rules.mdc`

---

## `/plan-from-tms`

### Purpose

Create `specs/<feature>/<feature>.md` from TMS cases when **no feature plan exists**.

### Skill

```text
@.cursor/skills/plan-from-tms/SKILL.md
```

### Use When

- TMS suite/cases are the primary planning input;
- `specs/<feature>/<feature>.md` does not exist yet.

### Do Not Use When

- `specs/<feature>/<feature>.md` already exists (use `/align-plan-with-tms`);
- implementing tests or modifying TMS entities.

### Template

```md
Use Skill: @.cursor/skills/plan-from-tms/SKILL.md

Feature:
<feature name>

TMS:
- provider: <TMS provider, e.g. Qase>
- project code: <TMS project code>
- suite id: <suite id>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected ids>

Scope:
- planning only
- TMS read-only
- allowed change: create/update only specs/<feature>/<feature>.md

Stop condition:
- stop after creating/updating specs/<feature>/<feature>.md
- do not implement tests
- do not create/update TMS entities, runs, or publish results
```

---

## `/align-plan-with-tms`

### Purpose

Align an **existing** `specs/<feature>/<feature>.md` with TMS cases.

### Skill

```text
@.cursor/skills/align-plan-with-tms/SKILL.md
```

### Use When

- feature plan exists and needs TMS traceability or gap analysis;
- comparing TMS intent with planned or existing automation.

### Do Not Use When

- no plan exists (use `/plan-from-tms`);
- implementing tests or modifying TMS entities.

### Template

```md
Use Skill: @.cursor/skills/align-plan-with-tms/SKILL.md

Feature plan:
specs/<feature>/<feature>.md

TMS:
- provider: <TMS provider, e.g. Qase>
- project code: <TMS project code>
- suite id: <suite id>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected ids>

Scope:
- planning/alignment only
- TMS read-only
- allowed change: update only the feature plan file

Stop condition:
- stop after updating the feature plan
- do not start implementation
```

---

## `/inspect-api-collection`

### Purpose

Inspect API collection sources as planning and audit input without modifying files or executing requests.

### Inputs

- collection path, normally `collections/bruno/<service-or-domain>/**`;
- optional OpenAPI/Swagger path;
- optional target service/domain.

### Output

- endpoint inventory;
- variables/auth hints;
- destructive/stateful request candidates;
- contract drift notes when OpenAPI/Swagger is supplied;
- recommended next step.

### Do / Don't

- Do treat Bruno as executable request examples and OpenAPI/Swagger as contract authority when available.
- Do redact discovered secrets and flag unregistered environment names.
- Do not create plans or tests.
- Do not execute requests, call external APIs, or install dependencies.

### Recommended Next Command

`/plan-from-api-collection` when a feature plan should be created or updated.

---

## `/plan-from-api-collection`

### Purpose

Create or update `specs/<feature>/<feature>.md` from a Bruno collection and optional OpenAPI/Swagger source.

### Inputs

- collection path under `collections/bruno/**`;
- optional OpenAPI/Swagger path;
- output feature plan path;
- optional TMS or requirements context.

### Output

- created or updated feature plan;
- ready, blocked/postponed, and not-automated coverage;
- service/environment ownership;
- data, auth, cleanup/isolation, destructive-request, and contract-drift decisions.

### Do / Don't

- Do group requests by capability rather than generating one test per request.
- Do block affected coverage when Bruno and OpenAPI/Swagger conflict.
- Do not implement tests, create `src/test/**`, execute requests, or modify source collections, contracts, or TMS.

### Recommended Next Command

`/implement-api-batch` only after the feature plan is reviewed and contains ready API coverage.

---

## `/audit-api-collection-coverage`

### Purpose

Audit alignment among Bruno collections, feature plans, implemented API tests, and optional OpenAPI/Swagger sources.

### Inputs

- collection path;
- feature plan path;
- `tests/api/**` path;
- optional OpenAPI/Swagger path.

### Output

- coverage matrix;
- planned coverage missing tests;
- collection requests not planned;
- tests without plan justification;
- contract drift, destructive-request, and environment/auth risks.

### Do / Don't

- Do identify blocked/postponed coverage implemented accidentally and duplicate coverage.
- Do not modify plans, collections, tests, OpenAPI/Swagger, or TMS.
- Do not execute API requests.

### Recommended Next Command

Use `/review-generated` for implementation quality or `/plan-from-api-collection` to update the plan when approved.

---

## `/implement-api-batch`

### Purpose

Implement API coverage from an existing feature plan.

The command name says batch, but the scope does not have to be tiny. Prefer:

```text
all API coverage ready to implement now
```

unless there is a reason to narrow the scope.

### Skill

```text
@.cursor/skills/implement-api-feature/SKILL.md
```

### Use When

- API coverage exists in a feature plan;
- API tests need to be implemented;
- API helper/client/builder decisions are needed.

### Do Not Use When

- the task is UI-only;
- API behavior is not planned;
- contract details are missing and no safe scope exists.

### Template

```md
Use Skill: @.cursor/skills/implement-api-feature/SKILL.md

Feature plan:
<path to feature plan>

Implementation scope:
<what API coverage to implement from the plan>

Input:
- API contract: <swagger/openapi/docs link>
- existing builder/client/helpers: <if any>

Scope:
- API tests only
- implement only coverage marked ready to implement now in the feature plan
- do not implement blocked/postponed scenarios
- do not guess undocumented status codes, bodies, validation messages, or boundary limits
- use Zod + shared assertion helper for non-trivial/reused/paginated response shapes
- keep behavior assertions separate from schema validation; no assertions in API clients

Context:
<any important constraints, blockers, known contract risks, or setup constraints>

After changes:
run impacted API spec and quality gate from project map.

Report:
- files changed
- API coverage implemented
- API coverage blocked/postponed
- builder/client/helper decisions
- verification results
- remaining risks
```

### Example

```text
/implement-api-batch

Feature plan:
@specs/<feature>/<feature>.md

Implementation scope:
Implement all API coverage from the plan that is currently safe and unblocked.

Input:
- API contract: <swagger/openapi/docs link from the feature plan>
- existing builder/client/helpers: check existing project first

Context:
If authenticated endpoints require missing role-capable auth/setup, report them as blocked instead of inventing setup architecture.
```

---

## `/implement-ui-batch`

### Purpose

Implement UI coverage from an existing feature plan.

Prefer:

```text
all UI coverage ready to implement now
```

Do not artificially split safe UI coverage into tiny pieces.

### Skill

```text
@.cursor/skills/implement-ui-feature/SKILL.md
```

### Use When

- UI coverage exists in a feature plan;
- UI specs and Page Objects need to be added or updated;
- data/setup/page ownership needs to be handled.

### Do Not Use When

- the task is API-only;
- the task is visual-only;
- Page Object vs Component ownership is unclear and needs discovery first.

### Template

```md
Use Skill: @.cursor/skills/implement-ui-feature/SKILL.md

Feature plan:
<path to feature plan>

Implementation scope:
<what UI coverage to implement from the plan>

Context:
<any important setup/data/page/component/locator constraints>

After changes:
run impacted UI spec and quality gate from project map.

Report:
- files changed
- UI coverage implemented
- UI coverage blocked/postponed
- Page Object/component decisions
- data/setup strategy
- verification results
- remaining risks
```

### Example

```text
/implement-ui-batch

Feature plan:
@specs/<feature>/<feature>.md

Implementation scope:
Implement all UI coverage from the plan that is currently safe and unblocked.

Context:
No visual screenshots in this step.
If a signed-in scenario requires missing approved auth/setup, report it as blocked instead of inventing setup architecture.
```

---

## `/plan-e2e-journey`

### Purpose

Create or update a dedicated E2E journey plan in `specs/e2e/<area>/<journey>.md`.

### Skill

```text
@.cursor/skills/plan-e2e-journey/SKILL.md
```

### Use When

- a critical full user/business journey needs E2E planning;
- lower-level API/UI/schema/visual coverage is not enough;
- E2E implementation must be prepared before coding.

### Do Not Use When

- task is feature-level planning in `specs/<feature>/<feature>.md`;
- task is a short UI functional check;
- task is E2E implementation.

### Template

```md
Use Skill: @.cursor/skills/plan-e2e-journey/SKILL.md

E2E journey plan:
specs/e2e/<area>/<journey>.md

Task:
Create or update the E2E journey plan only.

Scope:
- planning only
- no Playwright code
- no implementation
- do not duplicate API/UI/schema/visual feature coverage

Output:
- business goal and journey summary
- E2E boundary (covered/not covered)
- Auth Strategy (required, role, auth as, modes from the project map)
- data/setup/cleanup strategy
- external dependencies and blockers
- implementation target under tests/e2e/... with @e2e tag
```

---

## `/implement-e2e-flow`

### Purpose

Implement approved full-journey E2E coverage from an existing E2E journey plan.

Prefer:

```text
one exact E2E scenario marked ready to implement now
```

Do not convert short UI functional tests into E2E.

### Skill

```text
@.cursor/skills/implement-e2e-flow/SKILL.md
```

### Use When

- `specs/e2e/<area>/<journey>.md` exists and includes a ready-to-implement-now scenario;
- setup, data, cleanup or isolation, and final assertion are documented;
- the scenario is a critical full user or business journey.

### Do Not Use When

- the scenario is a short UI functional test;
- the scenario is blocked or postponed;
- mailbox, reset-link, reset-token, payment, or other required external dependency is missing;
- cleanup or isolation strategy is unclear;
- no Playwright runner matches `tests/e2e/**/*.e2e.spec.ts` and config update is not approved.

### Location And Tags

```text
tests/e2e/**/*.e2e.spec.ts
@e2e + @smoke or @regression
@e2e replaces @ui by default for full-journey E2E specs
```

### API Usage In E2E

Allowed:

- backend preconditions;
- cleanup;
- minimal setup-success verification.

Not allowed:

- replacing the UI journey under test;
- hiding the journey in fixtures, hooks, Page Objects, helpers, or workflow wrappers;
- full API contract validation;
- duplicated API schema, negative, or boundary coverage.

Use disposable or isolated data.

Destructive flows require cleanup or safe isolation.

### Examples

Forgot password (feature plan — API + UI only):

- API: reset request contract;
- UI: page render, empty-email validation feedback, valid-email submit confirmation.

Full forgot-password reset plus login with a new password belongs in a separate E2E journey plan (`specs/e2e/forgot-password-reset.md` or similar) and remains blocked or postponed without mailbox/reset-link access and safe disposable-user or cleanup strategy.

Checkout or onboarding (E2E journey plan examples only):

- sign-up followed by login and authenticated account access;
- item selection followed by cart state and order completion.

### Playwright Runner Note

Current browser projects in `playwright.config.ts`:

- `ui-chromium` — focused UI specs (`*.ui.spec.ts`); Desktop Chrome; default viewport `1280x720`
- `ui-firefox` — focused cross-browser UI coverage (`@cross-browser`)
- `ui-webkit` — focused cross-browser UI coverage (`@cross-browser`)
- `ui-mobile-chromium` — focused responsive UI coverage (`@responsive`)
- `api` — API specs; no browser
- `e2e` — E2E specs (`*.e2e.spec.ts`)

Broad browser/device matrix is **not** the default.

Full E2E cross-browser/mobile matrix remains future work unless documented in the project map.

If no runner matches the intended E2E spec path or pattern, stop and report the config gap.

### Template

```md
Use Skill: @.cursor/skills/implement-e2e-flow/SKILL.md

E2E journey plan:
<path to specs/e2e/<area>/<journey>.md>

Implementation scope:
Implement only E2E coverage marked ready to implement now.

Scenario:
<exact E2E scenario name from the journey plan>

Context:
<any important setup/data/cleanup/external dependency constraints>

After changes:
run impacted E2E spec using the browser project defined by the project map and quality gate from project map.

Report:
- files changed
- E2E scenario implemented
- setup strategy
- data strategy
- cleanup/isolation strategy
- final assertions
- tags used
- verification results
- remaining risks
```

---

## `/implement-visual-checkpoint`

### Purpose

Add, verify, or approve a visual checkpoint.

### Skill

```text
@.cursor/skills/implement-visual-test/SKILL.md
```

### Use When

- a visual checkpoint is planned or explicitly requested;
- an existing checkpoint must be verified;
- a baseline must be approved intentionally.

### Do Not Use When

- the task is functional UI automation only;
- baseline approval is not intended;
- the UI state cannot be stabilized.

### Template

```md
Use Skill: @.cursor/skills/implement-visual-test/SKILL.md

Target:
<spec/page/component>

Scenario/state:
<scenario or visual state>

Task:
<add visual checkpoint | verify existing checkpoint | approve existing baseline>

Approve baseline:
<yes | no>

Context:
<any dynamic content, masking, baseline, environment, or stability notes>

Rules:
- visual assertion must stay in spec
- functional assertion first
- screenshot assertion after stable UI state
- use @visual tag
- use @regression by default for visual checks
- do not add @smoke to visual checks unless explicitly requested
- do not create standalone visual spec by default
- do not put screenshot assertions in Page Objects or Components
- check dynamic content before screenshot
- mask only dynamic content that is not relevant to the visual risk
- do not update baselines unless Approve baseline is yes

If Approve baseline is no:
- run impacted visual test once
- if baseline is missing, report that baseline approval is required
- do not update or commit baseline snapshots
- keep Playwright failure artifacts or actual screenshots for review if generated
- report artifact paths when available

If Approve baseline is yes:
- run impacted visual test with snapshot update enabled
- run the same impacted visual test again without snapshot update
- report created or updated snapshot files
- report both command results

Report:
- files changed
- screenshot name
- masking strategy
- baseline status
- verification commands/results
- remaining risks
```

---

## `/create-builder`

### Purpose

Create or update reusable test data builders, generators, and types.

### Skill

```text
@.cursor/skills/create-test-data-builder/SKILL.md
```

### Use When

- structured data is reused;
- valid defaults and overrides are needed;
- unique/formatted primitive values are needed;
- UI and API share the same data shape.

### Do Not Use When

- the payload is small, deterministic, and used once;
- local constants in the spec are enough;
- there are no variants or overrides.

### Template

```md
Use Skill: @.cursor/skills/create-test-data-builder/SKILL.md

Feature plan:
<path to feature plan>

Target data/entity/payload:
<target>

Task:
Create or update only the reusable test data needed by the planned implementation scope.

Context:
<any required fields, uniqueness needs, existing data files, or contract notes>

After changes:
run impacted checks from project map.

Report:
- files changed
- builder capabilities
- generator decisions
- verification results
- remaining risks
```

---

## `/discover-ui-components`

### Purpose

Decide whether a UI block should stay inside a Page Object or become a Component Object.

### Skill

```text
@.cursor/skills/discover-ui-components/SKILL.md
```

### Use When

- ownership is unclear;
- Page Object is growing;
- UI block is reused;
- agent proposes a component and justification is uncertain;
- a block has many related locators/actions and a clear semantic boundary.

### Do Not Use When

- a simple page-specific form can stay in the Page Object;
- no ownership question exists;
- the task is just implementing a spec.

### Template

```md
Use Skill: @.cursor/skills/discover-ui-components/SKILL.md

Target page/screen/flow:
<target>

Question:
Should <UI block> stay inside the Page Object or become a Component Object?

Scope:
- discovery only
- do not modify files

Context:
<any existing specs/pages/components/reuse concerns>

Report:
- component candidates
- recommendation for each
- reasoning
- suggested ownership
- files that would be affected if extraction is justified
```

---

## `/create-page-object`

### Purpose

Create a minimal Page Object for a real page, route, screen, or navigation boundary.

### Skill

```text
@.cursor/skills/create-page-object/SKILL.md
```

### Use When

- a current UI test needs a new page abstraction;
- route/screen ownership is clear;
- no existing Page Object covers the target.

### Do Not Use When

- the target is only a UI block inside an existing page;
- the Page Object is speculative;
- a Component Object would be more appropriate.

### Template

```md
Use Skill: @.cursor/skills/create-page-object/SKILL.md

Target route/screen:
<route/screen>

Task:
Create a minimal Page Object only if needed by current tests.

Context:
<any current spec/fixture/project map details>

After changes:
run impacted spec/checks if usage is added.

Report:
- files changed
- Page Object created/updated
- fixture exposure decision
- verification results
- remaining risks
```

---

## `/create-api-client`

### Purpose

Create a thin API client for endpoint calls only when reuse or request composition justifies it.

### Skill

```text
@.cursor/skills/create-api-client/SKILL.md
```

### Use When

- the same endpoint group is reused;
- request composition is duplicated;
- a thin wrapper improves clarity.

### Do Not Use When

- a single request in one spec is enough;
- the client would hide assertions;
- the client would become a service hierarchy.

### Template

```md
Use Skill: @.cursor/skills/create-api-client/SKILL.md

Endpoint group:
<group/resource>

Task:
Create a thin API client only if reuse or request composition is justified.

Context:
<where calls are duplicated and existing client/helper status>

After changes:
run impacted API specs and quality gate.

Report:
- files changed
- why client is justified
- client responsibilities
- verification results
- remaining risks
```

---

## `/create-fixture`

### Purpose

Create or update a fixture only when reuse and layer ownership justify it.

### Skill

```text
@.cursor/skills/create-fixture/SKILL.md
```

### Use When

- repeated setup belongs in a fixture;
- final fixture entry point needs to expose a project object;
- fixture is thin and does not hide the action under test.

### Do Not Use When

- a one-off value is enough;
- fixture hides business flow;
- fixture exposes components by default;
- specs would import intermediate fixture layers.

### Template

```md
Use Skill: @.cursor/skills/create-fixture/SKILL.md

Fixture need:
<describe need>

Task:
Create or update fixture only if reuse and ownership justify it.

Context:
<any existing fixture entry points, project map rules, or reuse examples>

After changes:
run impacted specs/checks and quality gate.

Report:
- files changed
- fixture created/updated
- why fixture is justified
- verification results
- remaining risks
```

---

## `/refactor-page-object-to-components`

### Purpose

Extract justified UI blocks from a Page Object into Component Objects.

### Skill

```text
@.cursor/skills/refactor-page-object-to-components/SKILL.md
```

### Use When

- component extraction was justified;
- Page Object is too large;
- repeated UI block needs component ownership.

### Do Not Use When

- ownership is unclear;
- no reuse/complexity exists;
- extraction is speculative.

Use `Discover UI Components` first when ownership is unclear.

### Template

```md
Use Skill: @.cursor/skills/refactor-page-object-to-components/SKILL.md

Target Page Object:
<file/class>

Reason:
<why extraction is justified>

Context:
<any discovery result or repeated usage evidence>

After changes:
run impacted specs/checks and quality gate.

Report:
- files changed
- components created/updated
- behavior preserved: yes/no
- verification results
- remaining risks
```

---

## `/review-generated`

### Purpose

Review AI-generated or modified code. **Includes embedded security posture review** (logging, attachments, visual masks, artifacts) — no separate `/audit-security` needed in the normal flow.

### Skill

```text
@.cursor/skills/review-generated-code-quality/SKILL.md
```

### Use When

- before accepting AI-generated changes;
- after implementation;
- after refactor/heal.

### Do Not Use When

- code changes are needed immediately;
- a failing UI test needs healing;
- the task is verification only.

### Template

```md
Use Skill: @.cursor/skills/review-generated-code-quality/SKILL.md

Review changes in:
<files/diff/current working tree>

Context:
<any important scope, intentional cleanup, known risks, or verification results>

Scope:
- review only
- do not modify files
- do not run broad refactoring
- do not suggest unrelated architecture changes

Focus:
- critical or major issues
- broken imports
- failing or missing verification evidence
- rule violations that can cause false positives or false negatives
- unnecessary abstractions
- duplicated reusable logic
- local helper misuse
- fixture misuse
- builder/generator misuse
- API client necessity
- assertion ownership
- Page Object/Component ownership
- raw selector mechanics in specs
- inline random data
- process.env usage outside allowed config layer
- Allure/reporting ownership
- visual baseline/snapshot misuse, if visual changes exist

Do not focus on:
- cosmetic naming preferences
- optional future improvements
- tiny metadata duplication
- minor style issues unless they create real maintenance risk

Output findings by severity:
- critical
- major
- minor

For each finding include:
- file
- issue
- why it matters
- minimal suggested fix

Recommended next step must be one of:
- accept changes
- accept after minor cleanup
- run refactor-overengineering
- run heal-api-test
- run heal-ui-test
- update rule/skill/project map
- request changes
```

**Note:** `/review-generated` (Review Generated Code Quality) is the **primary** post-implementation code review and **includes embedded security posture review** (step 15A). Use `/audit-test-coverage` for plan-to-test coverage alignment. Use `/audit-test-data-strategy` for test data safety, isolation, and cleanup policy review. Use `/audit-test-stability` for flaky-pattern and synchronization audits before commit. Use `/audit-security` only for a **security-only full-repo scan** outside a normal review batch. Use `/review-ui-suite` only for broader UI suite audits.

---

## `/audit-test-data-strategy`

### Purpose

Audit test data strategy for shared mutable data, isolation, cleanup, generation, builders, fixtures, and E2E data risks.

Audit/review only — does **not** create or modify data by default.

### Skill

```text
@.cursor/skills/audit-test-data-strategy/SKILL.md
```

### Use When

- before E2E implementation or destructive flows;
- before cleanup or baseline conversion;
- when shared users, carts, orders, or fixed entities are suspected;
- when inline random data or fixture/data misuse is suspected.

### Do Not Use When

- the task is to create builders or fixtures (use create skills);
- the task is to fix failing tests (use heal skills);
- only flaky synchronization patterns are in scope (use `/audit-test-stability`).

### Template

```md
Use Skill: @.cursor/skills/audit-test-data-strategy/SKILL.md

Plans/tests/data paths:
<specs, tests, src/test/data, src/test/fixtures — or empty>

Scope:
- audit only
- do not modify files
- do not create or change data
- do not delete data
- do not mutate environment

Report:
- summary
- safe data patterns found
- data risks
- destructive flow risks
- cleanup/isolation gaps
- builder/generator findings
- fixture findings
- E2E data risks
- recommended next actions
```

---

## Security audit (standalone)

> **Default:** security posture is reviewed inside `/review-generated` (step 15A). You do not need this command after a normal implement → `qa:gate` → review batch.

### Purpose

Full-repository **security-only** exposure scan without code-quality review.

### Skill

```text
@.cursor/skills/audit-security-posture/SKILL.md
```

### Use When

- onboarding before enabling CI artifact sharing;
- periodic repo-wide scan outside an implementation batch;
- user explicitly asks for security-only audit.

### Do Not Use When

- reviewing recent implementation — use `/review-generated` (security is already embedded).

### Template

```text
/audit-security

Scope: all
```

---

## `/audit-test-stability`

### Purpose

Audit UI/E2E tests for flaky patterns, weak synchronization, hidden journeys, debug artifacts, and stability risks.

Audit/review only — does **not** heal tests by default.

### Skill

```text
@.cursor/skills/audit-test-stability/SKILL.md
```

### Use When

- after UI or E2E implementation;
- before committing new or changed UI/E2E tests;
- when retry logic, sleeps, or weak assertions are suspected;
- after a failed run when static review may reveal root-cause patterns.

### Do Not Use When

- the task is to fix a failing test (use `/heal-ui-test` or `/heal-api-test`);
- the task is plan-to-test coverage alignment (use `/audit-test-coverage`);
- only API tests changed with no UI/E2E stability risk.

### Template

```md
Use Skill: @.cursor/skills/audit-test-stability/SKILL.md

Test paths:
<tests/ui/... tests/e2e/... or empty>

Optional failed spec/report:
<failure output or "none">

Scope:
- audit only
- do not modify files
- do not fix tests

Report:
- summary
- critical flaky risks
- major stability risks
- minor maintainability risks
- affected files
- root-cause category
- recommended fix strategy
- recommended next command
```

For actual fixes after audit, use `/heal-ui-test`.

---

## `/audit-test-coverage`

### Purpose

Compare feature plans, E2E journey plans, implemented tests, and optional TMS mappings to find coverage alignment gaps.

Audit/review only — does **not** implement tests.

### Skill

```text
@.cursor/skills/audit-test-coverage/SKILL.md
```

### Use When

- after planning and implementation batches;
- before cleanup or baseline conversion;
- when duplicate API/UI/E2E coverage is suspected;
- when blocked/postponed scenarios may have been implemented;
- when TMS Mapping exists and traceability must be checked.

### Do Not Use When

- the task is to implement missing tests;
- the task is to heal failing tests;
- only recent code diff quality review is needed (use `/review-generated`).

### Template

```md
Use Skill: @.cursor/skills/audit-test-coverage/SKILL.md

Plan:
<specs/<feature>/<feature>.md and/or specs/e2e/<area>/<journey>.md>

Optional test paths:
<tests paths or empty>

Optional TMS:
<from plan sections or "none">

Scope:
- audit only
- do not modify files
- do not implement tests

Report:
- summary
- coverage matrix
- missing ready coverage
- unplanned tests
- duplicate coverage risks
- blocked/postponed violations
- TMS traceability gaps
- tag/layer issues
- recommended next command
```

---

## `/review-ui-suite`

### Purpose

Review an existing **UI test suite area** for architecture, flakiness, ownership, and maintainability.

### Skill

```text
@.cursor/skills/review-ui-suite/SKILL.md
```

### Use When

- reviewing a UI folder/spec area holistically;
- checking Page Object and fixture usage across multiple specs;
- identifying flakiness or raw selector risks in a suite.

### Do Not Use When

- reviewing recently generated or modified code (use `/review-generated` first);
- framework/core changes need review;
- code changes should be made immediately.

### Template

```md
Use Skill: @.cursor/skills/review-ui-suite/SKILL.md

Review area:
<spec folder/files>

Scope:
- review only
- do not modify files

Context:
<any known risks, failures, or focus areas>

Report:
- critical findings
- major findings
- minor findings only if worth fixing
- minimal suggested fixes
- recommended next step
```

---

## `/review-framework-change`

### Purpose

Review framework-level changes.

### Skill

```text
@.cursor/skills/review-framework-change/SKILL.md
```

### Use When

- fixtures changed;
- config changed;
- project map changed;
- reporting/auth/API infrastructure changed;
- rules or skills changed.

### Do Not Use When

- only feature tests changed;
- generated feature code review is enough.

### Template

```md
Use Skill: @.cursor/skills/review-framework-change/SKILL.md

Review changes in:
<files/diff/current working tree>

Scope:
- review only
- do not modify files

Context:
<any framework-level intent, known risks, or verification evidence>

Report:
- critical findings
- major findings
- minor findings only if worth fixing
- minimal suggested fixes
- recommended next step
```

---

## `/refactor-overengineering`

### Purpose

Simplify working code without changing behavior.

### Skill

```text
@.cursor/skills/refactor-overengineering/SKILL.md
```

### Use When

- review found concrete issues;
- duplicate tests/helpers exist;
- abstraction is unjustified;
- ownership is wrong.

### Do Not Use When

- test is failing and needs healing;
- new coverage is needed;
- issue is only speculative preference.

### Template

```md
Use Skill: @.cursor/skills/refactor-overengineering/SKILL.md

Target:
<component/helper/fixture/flow/client/spec>

Problem:
<why current code is too noisy, duplicated, brittle, or overengineered>

Task:
Simplify or clean up with minimal behavior-preserving changes.

Context:
<any important scope, known risks, verification state, or intentional cleanup>

Scope:
- keep behavior unchanged
- keep test intent unchanged
- minimal changes only
- do not add new coverage
- do not refactor unrelated files
- do not broaden refactor scope

After changes:
run impacted specs/checks and quality gate from project map.

Report:
- files changed
- what was simplified
- behavior preserved: yes/no
- verification results
- remaining risks
```

---

## `/heal-api-test`

### Purpose

Investigate and fix a failing API test.

### Skill

```text
@.cursor/skills/heal-api-test/SKILL.md
```

### Use When

- an API spec fails;
- request/response/status/schema/assertion/setup issue must be diagnosed.

### Do Not Use When

- no test is failing;
- the task is cleanup/refactor;
- expected contract behavior is unknown without API owner confirmation.

### Template

```md
Use Skill: @.cursor/skills/heal-api-test/SKILL.md

Failing test output:
<insert failure output, status/body, stack trace>

Target:
<spec/helper/schema/builder/client files involved>

Task:
Heal only the failing API test with the smallest correct fix.

Scope:
- minimal fix only
- do not weaken assertions
- do not change expected behavior without contract evidence
- do not add new coverage

Context:
<any contract, setup, environment, or schema details>

After fix:
run impacted API spec and quality gate from project map.

Report:
- root cause
- files changed
- fix applied
- whether schema/Zod was involved
- verification results
- remaining risks
```

---

## `/heal-ui-test`

### Purpose

Investigate and fix a failing UI test.

### Skill

```text
@.cursor/skills/heal-ui-test/SKILL.md
```

### Use When

- a UI spec fails;
- locator/navigation/timing/data/setup issue must be diagnosed;
- trace/screenshot/video/MCP inspection may be needed.

### Do Not Use When

- no test is failing;
- the task is cleanup/refactor;
- expected behavior is unknown and needs product clarification.

### Template

```md
Use Skill: @.cursor/skills/heal-ui-test/SKILL.md
Follow: @.cursor/rules/feature-change-lifecycle.rules.mdc

Failing test output:
<insert failure output>

Target:
<spec/page/component/fixture/data files involved>

Task:
Heal only the failing UI test with the smallest correct fix.

Scope:
- minimal fix only
- do not refactor unrelated files
- do not change expected behavior without plan or product evidence
- do not use waitForTimeout
- if requirement drift: stop and use /update-feature-plan

Context:
<any important environment/setup/details>

After fix:
run impacted UI spec and quality gate from project map.

Report:
- root cause
- files changed
- minimal fix applied
- whether plan refresh was required instead
- verification result
- remaining risks
```

---

## `/run-verification`

### Purpose

Run the smallest sufficient verification.

### Skill

```text
@.cursor/skills/run-verification/SKILL.md
```

### Use When

- after implementation;
- after refactor/heal;
- before final acceptance.

### Do Not Use When

- code review is needed instead;
- failure investigation is required first.

### Template

```md
Use Skill: @.cursor/skills/run-verification/SKILL.md

Changed files:
<files/current working tree>

Task:
Run the smallest sufficient verification.

Context:
<any known risks, intentional deletions, or excluded checks>

Check:
<targeted checks/specs if known>

Report:
- commands run/results
- pass/fail summary
- blockers only
- known non-blocking risks
- final accept/reject recommendation
```

---

## `/update-project-map`

### Purpose

Update project map after structural or convention changes.

### Skill

```text
@.cursor/skills/update-project-map/SKILL.md
```

### Use When

- files/folders changed structurally;
- fixture entry point changed;
- path aliases/scripts/tags changed;
- rules/skills/conventions changed.

### Do Not Use When

- only feature tests changed and generated tree update is not needed;
- no project map impact exists.

### Template

```md
Use Skill: @.cursor/skills/update-project-map/SKILL.md

Change requiring project map update:
<describe change>

Task:
Update only relevant project map sections.

Context:
<any structural changes, deleted files, new commands, scripts, or conventions>

After changes:
run project map update/check commands from project map if applicable.

Report:
- files changed
- sections updated
- commands run/results
- remaining risks
```

---

## `/harden-rules`

### Purpose

Decide whether rules, skills, commands, or project map need hardening after repeated mistakes.

### Skill

```text
@.cursor/skills/harden-rules-from-failure/SKILL.md
```

### Use When

- same AI mistake repeats;
- review finds missing guardrail;
- skill/command is unclear;
- convention check should be added later.

### Do Not Use When

- issue is one-off;
- current code can be fixed directly;
- there is no repeated pattern.

### Template

```md
Use Skill: @.cursor/skills/harden-rules-from-failure/SKILL.md

Trigger:
<failure/review finding/repeated AI mistake>

Task:
Decide whether rules, skills, commands, or project map need hardening.

Scope:
- update only existing guidance if needed
- do not create new rule files unless no existing owner fits
- do not modify tests or production code
- keep changes minimal

Expected output:
- hardening needed: yes/no
- target files to update
- minimal proposed change
- remaining risks
```

---

## `/add-allure-metadata`

### Purpose

Add or normalize Allure metadata in specs.

### Skill

```text
@.cursor/skills/configure-allure-reporting/SKILL.md
```

### Use When

- specs need feature/story/severity/owner/tms/issue metadata;
- metadata is inconsistent;
- reporting metadata should be normalized.

### Do Not Use When

- behavior should change;
- Page Objects/API clients/builders need changes;
- attachments are requested without clear scope.

### Template

```md
Use Skill: @.cursor/skills/configure-allure-reporting/SKILL.md

Target:
<spec file or feature area>

Task:
Add or normalize Allure metadata for the target specs.

Context:
<any feature name, owner, severity convention, TMS/issue links, or existing metadata pattern>

Scope:
- metadata only
- no test behavior changes
- no Page Object changes
- no Component Object changes
- no API client changes
- no builder/generator changes
- no fixture changes unless reporting fixture is explicitly in scope

After changes:
run impacted spec or quality gate from project map.

Report:
- files changed
- metadata added/updated
- helper usage
- verification result
- remaining risks
```

---
