# AI Agent Prompt Templates

## Purpose

Reusable prompt templates for working with AI agents in the **Playwright AI Automation Framework** (Playwright + TypeScript test automation framework).

**npm package name:** `playwright-ai-automation-framework`

A good prompt defines:

- skill or command;
- task;
- inputs;
- scope;
- stop conditions;
- expected output;
- verification.

Keep prompts short.

Put methodology into skills.

Put permanent constraints into rules.

Put project-specific structure into the project map.

---

## Default Workflow For A New Feature

```text
1. Plan Feature Coverage
2. Review the feature plan if the feature is broad, risky, or has API/UI overlap
3. Create or validate Test Data Builder, if needed
4. Implement selected API coverage marked ready to implement now, if present
5. Implement selected UI coverage marked ready to implement now, if present
6. Add visual checkpoints later, if planned and explicitly selected
7. Review Generated Code Quality
8. Refactor / Heal / Harden only if needed
```

For critical full journeys, plan and implement separately:

```text
1. /plan-e2e-journey
2. Review the E2E journey plan
3. Implement selected E2E coverage marked ready to implement now, if present
4. Review Generated Code Quality
5. Run Verification
```

Planning separation:

```text
specs/<feature>.md     = feature coverage (API, UI, schema, visual, not automated)
specs/e2e/<journey>.md = E2E journey plans (full user/business flows only)
```

Rules of thumb:

- Do not implement API and UI in one agent run.
- Do not implement E2E together with API or UI in one agent run unless explicitly approved.
- Feature coverage plans do not include E2E.
- Use one main skill per task.
- Do not create builders, clients, fixtures, schemas, components, or helpers speculatively.
- Use ready to implement now / blocked-postponed, not first batch / later batch.
- API should own backend contract, schema, negative, boundary, auth, filtering, sorting, and data predicate risks.
- UI should own distinct user-facing browser behavior.
- E2E should own critical full journeys with safe setup, data, cleanup, and meaningful final assertions.
- Visual checks should cover visual risk only.
- Cross-browser and responsive coverage should be planned only for documented browser or viewport risks; broad browser/device matrix is not the default.
- Playwright tags describe test intent and coverage type; browser and viewport belong to Playwright projects and Allure reporting metadata.
- Use `@cross-browser` and `@responsive` only when explicitly planned; do not invent browser or device tags such as `@chromium`, `@firefox`, `@webkit`, `@mobile`, `@tablet`, or `@desktop`.
- If the plan is too vague for UI or API implementation, refine the relevant implementation brief before coding.
- If a test fails, use healing before refactoring.
- If the framework reveals a repeated failure pattern, harden rules or skills only after confirming it is not a one-off.

---

## Global Prompt Prefix

Use this prefix when starting most AI-agent tasks.

```text
You are working in a Playwright + TypeScript test automation framework.

Follow the project map as the source of truth for paths, commands, aliases, tags, fixture entry points, and ownership.

Follow all repository rules.

Use the smallest skill that matches the task.

Keep changes minimal and targeted.

Do not introduce speculative abstractions.

Do not modify unrelated files.

Tags describe test intent and coverage type. Browser and viewport belong to Playwright projects and reporting metadata. Use `@cross-browser` and `@responsive` only when planned. Do not invent browser or device tags.

If required information is missing, do not invent architecture or behavior. Report the blocker and propose the smallest safe next step.
```

---

# 1. Planning Prompts

## MCP ownership (planning with TMS)

- project `.cursor/mcp.json` — `playwright` only (project-level; safe to commit)
- TMS MCP or API access — user/global Cursor MCP settings, extension settings, or local secret storage (not in repo)
- **Qase** (example provider) — server name `qase` when configured user/global; other TMS providers may be supported later
- TMS tokens belong in user/global tool settings or local secret storage; never commit real TMS tokens to repo
- TMS reporter/result publishing is separate and not configured by default

---

## Prompt: Plan Feature Coverage

Use this as the main entry point for a new feature.

Use **Agent mode** when the expected output is a `specs/<feature>.md` file.

Do not use Cursor Plan mode Build for planning-only tasks that must write the plan file.

```text
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
- allowed change: create/update only specs/<feature>.md

Optional scope boundary:
- source of truth: <fill only if needed>
- in scope: <fill only if needed>
- out of scope: <fill only if needed>

Output:
- create or update specs/<feature>.md
- include coverage matrix
- include ready to implement now vs blocked/postponed coverage
- include API/UI/visual/schema/not automated decisions
- include cross-browser/responsive decisions or explicit no-extra-coverage note when relevant
- include API Implementation Brief
- include UI Implementation Brief
- note that E2E is planned separately in specs/e2e/<journey>.md when a full journey may be needed later
- include E2E Note only (no E2E scenarios or implementation brief)
- do not recommend /implement-e2e-flow directly from feature plans
- if E2E is relevant, recommend /plan-e2e-journey first
- include recommended next commands

Do not include E2E Coverage in feature plans.

Stop condition:
- stop after creating or updating specs/<feature>.md
- do not start implementation
- do not run recommended next commands
- recommended next commands are informational only

Execution mode:
- use Agent mode when the expected output is a specs/<feature>.md file
- do not use Cursor Plan mode Build for planning-only tasks
```

### When To Fill Optional Scope Boundary

Fill optional scope boundary when the feature can easily expand into adjacent behavior.

Good examples:

- catalog sorting near filters/search/pagination;
- checkout near cart/payment/shipping/confirmation;
- login near registration/forgot password/profile/current user;
- product filters near sorting/search/pagination;
- endpoint with many query parameters.

For simple targeted features, leave the optional scope boundary brief or unspecified.

The generated feature plan must still include:

- source of truth;
- in scope;
- out of scope.

---

## Prompt: Plan From TMS (No Existing Plan)

Use when TMS cases are the primary input and `specs/<feature>.md` does not exist.

```text
/plan-from-tms

Feature:
<feature name>

TMS:
- provider: <TMS provider, e.g. Qase>
- project code: <TMS project code>
- suite id: <suite id>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected ids>
- access mode: read-only

Scope:
- planning only
- TMS read-only
- allowed change: create/update only specs/<feature>.md
- do not create/update TMS entities, runs, or publish results
- do not add reporter integration
```

Stop after creating/updating the feature plan. Do not implement tests or modify TMS entities.

TMS rules:

- TMS cases are planning input and traceability — not 1:1 Playwright tests.
- Map cases by risk: API / UI / schema-contract / visual / not automated / blocked / postponed.
- TMS writes require explicit user approval.
- Reporter/result publishing is separate from read-only TMS planning.

---

## Prompt: Align Plan With TMS (Existing Plan)

Use when `specs/<feature>.md` exists and must be aligned with TMS cases.

```text
/align-plan-with-tms

Feature plan:
specs/<feature>.md

TMS:
- provider: <TMS provider, e.g. Qase>
- project code: <TMS project code>
- suite id: <suite id>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected ids>
- access mode: read-only

Scope:
- planning only
- TMS read-only
- allowed change: update TMS Source and TMS Mapping in specs/<feature>.md only
- do not create/update TMS entities, runs, or publish results
- do not add reporter integration
```

Update TMS Source and TMS Mapping only in the feature plan. Do not implement tests or modify TMS entities.

TMS rules:

- TMS cases are planning input and traceability — not 1:1 Playwright tests.
- Map cases by risk: API / UI / schema-contract / visual / not automated / blocked / postponed.
- Do not guess undocumented status codes, bodies, messages, or boundary limits.
- TMS writes require explicit user approval.
- Reporter/result publishing is separate from read-only TMS planning.

---

## Prompt: Review Feature Coverage Plan

Use this before implementation when the feature is broad, risky, or has API/UI overlap.

```text
/review-generated

Review changes in:
specs/<feature>.md

Context:
This is a feature coverage plan review before implementation.

Focus:
- source of truth is clear
- in scope / out of scope is clear
- API positive coverage is present where applicable
- documented API negative coverage is included or blocked/postponed with reason
- documented boundary cases are included or blocked/postponed with reason
- schema validation decision is present for non-trivial API response shapes
- UI scenarios have unique user-facing value
- UI does not duplicate API/schema coverage without visible UI risk
- E2E is not part of feature coverage plans — full journeys belong in specs/e2e/<journey>.md
- ready now vs blocked/postponed is clear
- implementation details are not listed as scenarios
- recommended next commands are informational only

Output:
- accept / request changes
- critical findings
- major findings
- minor findings only if worth fixing now
- recommended next step
```

---

## Prompt: Refine UI Implementation Brief

Use this only when the coverage plan exists but the UI part is too vague.

```text
Use Playwright Planner.
Use Skill: @.cursor/skills/plan-test-coverage/SKILL.md

Target:
<path to feature plan>

Task:
Refine only the UI Implementation Brief.

Do not change API coverage decisions unless there is an obvious inconsistency.

Add or improve:
- target route/page
- UI scenarios
- tags per scenario
- preconditions/test data
- user steps
- expected visible outcomes
- unique UI risk
- why API/schema is not sufficient
- recommended Page Object
- likely Page Object actions/readers
- Component Object decision
- locator discovery notes if available
- assertions in spec
- what API/schema owns instead of UI
- blocked/postponed UI items with reason

Constraints:
- planning only
- no implementation
- no file changes except updating the feature plan
- visual checkpoints postponed unless explicitly requested
- prefer Page Object first
- do not recommend Component Object unless justified by reuse, complexity, or ownership

Output:
updated UI Implementation Brief that is actionable for Implement UI Feature.
```

---

## Prompt: Refine API Implementation Brief

Use this only when the coverage plan exists but the API part is too vague.

```text
Use Playwright Planner.
Use Skill: @.cursor/skills/plan-test-coverage/SKILL.md

Target:
<path to feature plan>

Task:
Refine only the API Implementation Brief.

Do not change UI coverage decisions unless there is an obvious inconsistency.

Use contract source:
<swagger/openapi/docs link>

Add or improve:
- endpoint/method per scenario
- request payload source
- scenario data strategy
- expected status
- response assertions
- schema validation decision
- negative coverage decision
- boundary coverage decision
- builder need
- API client decision
- assertion helper decision
- contract gaps/blockers
- what must not be guessed

Constraints:
- planning only
- no implementation
- no file changes except updating the feature plan
- rely on the API contract or documented accepted behavior
- do not guess payload fields, status codes, response bodies, validation messages, or boundary limits

Output:
updated API Implementation Brief that is actionable for Implement API Feature.
```

---

# 2. Test Data Prompts

## Prompt: Create Test Data Builder

Use after planning if reusable structured data is needed.

```text
Use Skill: @.cursor/skills/create-test-data-builder/SKILL.md

Feature plan:
<path to feature plan>

Target data/entity/payload:
<target>

Task:
Create or update only the test data builder needed by the planned implementation scope.

Use this only if reusable structured data is needed.

Identify:
- required fields
- optional fields
- unique fields
- valid defaults
- existing builders/generators/datasets

Rules:
- builder must return valid data by default
- builder must support Partial<T> overrides
- invalid or negative data must be explicit through overrides
- no inline random data in specs
- use existing generators if available
- create generator only for unique/formatted primitive values if needed
- do not read process.env
- do not add fixture unless reuse justifies it
- do not guess fields missing from contract

If blocked:
stop and report missing contract or data details.

Report:
- files changed
- builder capabilities
- verification results, if applicable
- remaining risks
```

---

# 3. API Prompts

## Prompt: Implement API Feature From Plan

Use this after the feature plan is ready.

```text
Use Skill: @.cursor/skills/implement-api-feature/SKILL.md

Feature plan:
<path to feature plan>

Implementation scope:
Implement all API coverage marked as ready to implement now.

Input:
- API contract: <swagger/openapi/docs link>
- existing builder/client/helpers: check existing project first

Context:
<any important constraints, blockers, setup notes, or contract risks>

Rules:
- API tests only
- do not implement UI or visual tests
- do not expand to adjacent endpoints, query params, filters, states, or negative cases unless explicitly in scope
- implement documented negative/boundary cases marked ready
- if negative/boundary behavior is unclear, report it as blocked/postponed instead of guessing
- use Zod for non-trivial/reused response shapes
- use shared Zod assertion helper when using Zod
- do not create API client unless request composition reuse justifies it
- do not use login as hidden setup unless approved by the plan/setup layer
- do not hardcode tokens or credentials
- no process.env outside config/fixture layer
- no inline random data in specs

After changes:
run impacted API spec and quality gate from project map.

Report:
- files changed
- API coverage implemented
- API coverage blocked/postponed
- schema/helper/client/builder decisions
- verification results
- remaining risks
```

---

## Prompt: Add Targeted API Negative Or Boundary Coverage

Use when review finds missing documented API negative or boundary coverage.

```text
Use Skill: @.cursor/skills/implement-api-feature/SKILL.md

Feature plan:
<path to feature plan or relevant spec reference>

Implementation scope:
Implement only documented API negative/boundary coverage that is marked ready or clearly supported by the contract.

Context:
<contract notes, endpoint docs, current gaps>

Rules:
- API tests only
- do not add UI tests
- do not guess undocumented status codes, response bodies, messages, or boundary limits
- if behavior is unclear, report it as blocked/postponed
- do not create a full error matrix unless the contract requires it
- keep positive coverage unchanged
- use Zod only when response shape is non-trivial or reused
- keep behavior assertions separate from schema validation

After changes:
run impacted API specs and quality gate.

Report:
- negative/boundary coverage added
- cases blocked/postponed with reason
- files changed
- verification results
- remaining risks
```

---

## Prompt: Create API Client

Use only when API request composition is duplicated or clearly reused.

```text
Use Skill: @.cursor/skills/create-api-client/SKILL.md

Endpoint group:
<group/resource>

Task:
Create a thin API client only if endpoint calls are reused or request composition is duplicated.

Check existing clients first.

Client may:
- compose requests
- send requests
- return response or parsed data if project convention allows it

Client must not:
- hide assertions
- hide workflows
- call login as hidden setup
- hardcode tokens
- duplicate auth logic
- perform Zod schema assertions
- become a service hierarchy
- live in framework core if endpoint-specific

After changes:
run impacted API specs and quality gate.

Report:
- files changed
- why client is justified
- verification results
- remaining risks
```

---

# 4. UI Prompts

## Prompt: Implement UI Feature From Plan

Use this after the feature plan has a clear UI Implementation Brief.

```text
Use Skill: @.cursor/skills/implement-ui-feature/SKILL.md

Feature plan:
<path to feature plan>

Implementation scope:
Implement all UI coverage marked as ready to implement now.

Context:
<any important setup/data/page/component/locator constraints>

Rules:
- UI tests only
- no API tests
- no visual screenshots unless explicitly requested
- do not expand to adjacent controls, flows, filters, states, or pages unless explicitly in scope
- each UI scenario must have distinct user-facing value
- do not duplicate API/schema coverage without visible UI risk
- use approved API precondition setup when backend preconditions are needed and available
- specs must not read env variables
- specs must not derive API host from UI host
- keep Page Objects as actions/readers only
- keep assertions in specs or dedicated assertion helpers
- no raw selector mechanics in specs
- no inline random data in specs

After changes:
run impacted UI spec and quality gate from project map.

Report:
- files changed
- UI coverage implemented
- UI coverage blocked/postponed
- setup strategy
- Page Object/component decisions
- verification results
- remaining risks
```

---

## Prompt: Add UI Test To Existing Page

Use for small targeted additions.

```text
Use Skill: @.cursor/skills/implement-ui-feature/SKILL.md

Task:
Add UI test for <scenario> in <area/page>.

Input:
- existing spec/page object: <path if known>
- related feature plan: <path if applicable>

Scope:
- targeted UI test only
- minimal changes
- do not add API tests
- do not add visual screenshots unless explicitly requested
- do not expand to adjacent controls or flows

Check existing:
- specs
- Page Objects
- Component Objects
- fixtures
- builders/generators
- tags

Rules:
- scenario must have distinct user-facing value
- do not duplicate API/schema coverage without visible UI risk
- do not create new components, fixtures, or builders unless justified
- no raw selector mechanics in specs
- no inline random data
- assertions stay in specs or assertion helpers

After changes:
run impacted spec and quality gate from project map.

Report:
- files changed
- verification results
- remaining risks
```

---

## Prompt: Use API Precondition Setup In UI Test

Use only when an approved API precondition fixture exists and the UI runtime backend is aligned.

```text
Use Skill: @.cursor/skills/implement-ui-feature/SKILL.md

Target:
<UI spec or scenario>

Task:
Use approved API precondition setup for backend preconditions.

Approved setup example pattern only:

```text
<approvedPreconditionFixture>.createRequiredState(...)
```

Context:
UI_PRECONDITION_API_BASE_URL must point to the same API backend used by the UI runtime.
API_BASE_URL is for API project/tests and must not be used for UI preconditions unless it is intentionally the same backend.

Rules:
- do not read env variables in specs
- do not derive API host from UI host
- do not validate full API contract in UI setup
- setup should verify only required precondition creation
- keep UI action under test visible in the spec
- do not move action under test into fixture or beforeEach
- do not weaken UI assertions

After changes:
run impacted UI spec and quality gate.

Report:
- files changed
- setup strategy
- verification results
- remaining risks
```

---

# 4a. E2E Prompts

E2E is planned separately from feature coverage.

```text
specs/<feature>.md     = API, UI, schema, visual, not automated
specs/e2e/<journey>.md = full user/business journeys only
```

Do not add E2E scenarios to feature plans.

---

## Prompt: Plan E2E Journey

Use when a critical full user or business journey needs automation beyond API and UI coverage.

```text
/plan-e2e-journey

E2E journey plan path:
specs/e2e/<journey>.md

Journey:
<short journey name, e.g. checkout, registration-login>

Task:
Create an E2E journey plan for the selected full user/business flow.

Scope:
- planning only
- allowed change: create/update only specs/e2e/<journey>.md
- do not implement tests
- do not add E2E to feature coverage plans

Output must include:
- business value
- user journey steps
- systems or states crossed
- setup strategy
- data strategy
- cleanup or isolation strategy
- final outcome/assertion
- why API/UI/schema coverage is not sufficient
- ready to implement now vs blocked/postponed
- flakiness risks and external dependencies

Stop condition:
- stop after creating or updating the E2E journey plan
- do not start implementation
```

### Example journey plans (illustrative only)

Registration → login:

- path: `specs/e2e/registration-login.md`
- journey: register disposable user, log in, reach authenticated account area
- setup: API or UI registration precondition allowed; journey steps must stay visible in the spec

Checkout:

- path: `specs/e2e/checkout.md`
- journey: select product, add to cart, complete checkout, verify order confirmation
- setup: product/cart preconditions via approved API setup when available

Forgot password (feature plan stays API + UI only):

- feature plan: page render, validation feedback, submit confirmation, API contract
- full reset journey belongs in `specs/e2e/forgot-password-reset.md` and remains blocked or postponed without mailbox/reset-link access and safe disposable-user or cleanup strategy

---

## Prompt: Implement E2E Flow From Journey Plan

Use this after `specs/e2e/<journey>.md` includes at least one scenario marked ready to implement now.

```text
/implement-e2e-flow

E2E journey plan:
<path to specs/e2e/<journey>.md>

Implementation scope:
Implement only E2E coverage marked ready to implement now.

Scenario:
<exact E2E scenario name from the E2E journey plan>

Context:
<any important setup/data/cleanup/external dependency constraints>

Rules:
- E2E test only
- full user/business journey only, not short UI functional coverage
- use @e2e plus @smoke or @regression
- do not use @ui by default for full E2E specs
- keep the user journey visible in the spec
- do not hide the journey in fixtures, hooks, Page Objects, or helper flow methods
- API setup may be used only for backend preconditions or cleanup
- API setup must not replace the UI action under test
- do not validate full API contracts inside E2E
- use safe isolated/disposable data
- destructive flows require cleanup or isolation
- do not implement blocked/postponed E2E scenarios
- do not read E2E scenarios from feature coverage plans

Expected location:
- tests/e2e/...

If no Playwright runner matches tests/e2e/**/*.e2e.spec.ts yet:
- stop and report the config gap instead of guessing

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

### Example: Registration → Login (illustrative only)

```text
/implement-e2e-flow

E2E journey plan:
specs/e2e/registration-login.md

Implementation scope:
Implement only E2E coverage marked ready to implement now.

Scenario:
Register disposable user and reach authenticated account area

Context:
Use approved API precondition setup if available; keep registration and login steps visible in the spec.
```

### Example: Checkout (illustrative only)

```text
/implement-e2e-flow

E2E journey plan:
specs/e2e/checkout.md

Implementation scope:
Implement only E2E coverage marked ready to implement now.

Scenario:
Complete checkout from product selection to order confirmation

Context:
Use disposable test data; destructive order creation requires cleanup or safe isolation.
```

### Forgot Password Reminder

Do not use E2E prompts for:

- forgot-password page render;
- empty-email validation feedback;
- valid-email submit confirmation.

Those remain API + UI coverage in the feature plan.

Full Forgot Password E2E belongs in a separate journey plan and remains blocked or postponed without mailbox/reset-link access and safe disposable-user or cleanup strategy.

---

# 5. Visual Prompts

## Prompt: Implement Visual Checkpoint

Use only when visual checkpoint is already planned or explicitly requested.

```text
Use Skill: @.cursor/skills/implement-visual-test/SKILL.md

Feature/scenario:
<scenario>

Existing UI spec or planned UI scope:
<path/details>

Task:
Add only the planned visual checkpoint inside an existing or planned UI flow.

Rules:
- functional assertion first
- screenshot assertion after stable UI state
- add @visual tag
- default to @regression unless explicitly planned otherwise
- do not create standalone visual spec by default
- do not put screenshot assertions in Page Objects or Components
- do not update baselines unless explicitly requested
- do not include visual checks in qa:gate unless baseline environment is stable

After changes:
run impacted visual spec only.

Report:
- files changed
- checkpoint added
- verification result
- remaining risks
```

---

# 6. Component and Page Object Prompts

## Prompt: Discover UI Components

Use only when ownership is unclear.

```text
Use Skill: @.cursor/skills/discover-ui-components/SKILL.md

Target page/screen/flow:
<target>

Question:
Should <UI block> stay inside the Page Object or become a Component Object?

Scope:
- discovery only
- do not modify files

Review:
- specs
- Page Objects
- existing Component Objects
- fixtures
- project map
- rules

Use Playwright MCP only if repository files are not enough to understand UI structure.

Return:
- component candidates
- recommendation for each
- reasoning
- suggested ownership
- minimal refactor plan if extraction is justified
- files that would be affected

Final decision must be one of:
- no component needed now
- extract component now
- reuse existing component
- postpone
- remove abstraction
```

---

## Prompt: Create Page Object

Use only when a real page/route/screen abstraction is needed.

```text
Use Skill: @.cursor/skills/create-page-object/SKILL.md

Target route/screen:
<route/screen>

Task:
Create minimal Page Object only if needed by current tests.

Confirm:
- this is a real page, screen, route, or navigation boundary
- no existing Page Object already covers it

Rules:
- do not create Page Object for a UI block inside an existing page
- do not add business flows
- do not add test data generation
- do not add test.step
- do not add assertions
- do not add speculative methods
- add fixture exposure only if project map convention requires it

After changes:
run impacted spec if usage is added.

Report:
- files changed
- methods/locators added
- verification result
- remaining risks
```

---

## Prompt: Refactor Page Object To Components

Use only after component extraction is justified.

```text
Use Skill: @.cursor/skills/refactor-page-object-to-components/SKILL.md

Target Page Object:
<file/class>

Reason:
<why refactor is needed>

If ownership is unclear:
run Discover UI Components first.

Task:
Refactor only justified UI blocks into Component Objects.

Rules:
- preserve behavior
- do not add new feature coverage
- do not add speculative methods
- do not expose components as fixtures by default
- do not rewrite unrelated tests

After changes:
run impacted specs and quality gate.

Report:
- files changed
- components created/updated
- verification results
- remaining risks
```

---

# 7. Fixture Prompts

## Prompt: Create Fixture

Use only when reuse and layer ownership justify a fixture.

```text
Use Skill: @.cursor/skills/create-fixture/SKILL.md

Fixture need:
<describe need>

Task:
Create or update fixture only if reuse is meaningful.

Before creating fixture, confirm:
- reuse is meaningful
- fixture is thin
- fixture belongs to correct layer
- fixture does not hide action under test
- fixture does not expose component by default
- final fixture entry point remains the spec entry point

Rules:
- do not create fixtures for one-off values
- do not put business flows inside fixtures
- do not import intermediate fixture layers from specs
- do not read env variables in specs
- config/env access belongs in approved config or fixture layer

After changes:
run impacted specs and quality gate from project map.

Report:
- files changed
- why fixture is justified
- verification results
- remaining risks
```

---

## Prompt: Create UI API Precondition Fixture

Use only when UI specs need reusable backend preconditions.

```text
Use Skill: @.cursor/skills/create-fixture/SKILL.md

Fixture need:
UI specs need an approved way to create backend preconditions through API.

Task:
Create or update a minimal UI-consumable API precondition fixture.

Context:
UI specs must not read API env variables directly.
UI specs must not derive API host from UI host.
Setup should verify only required precondition creation.
Setup must not validate full API contracts.
Setup must not hide UI action under test.

Expected config:
- API_BASE_URL is for API project/tests
- UI_PRECONDITION_API_BASE_URL is for UI API preconditions
- UI_API_BASE_URL may be used as documented fallback if project convention allows it

Rules:
- use project map for fixture layer
- keep fixture thin
- do not create broad API client unless reuse justifies it
- keep final fixture entry point intact
- do not modify UI specs unless explicitly requested

After changes:
run quality gate from project map.

Report:
- files changed
- fixture layer used
- config variable used
- how specs consume it
- verification results
- remaining risks
```

---

# 8. Review and Refactor Prompts

## Prompt: Review Generated Code Quality

Use after AI generated or modified code.

```text
Use Skill: @.cursor/skills/review-generated-code-quality/SKILL.md

Review changes in:
<files/diff/branch/current working tree>

Scope:
- review only
- do not modify files

Focus:
- scope alignment with requested task
- test pyramid and UI value
- API positive/negative/boundary coverage
- Zod/schema ownership
- shared Zod assertion helper usage
- duplicated logic
- unnecessary abstractions
- local helper misuse
- fixture usage
- builder/generator usage
- API client necessity
- assertion ownership
- Page Object/Component ownership
- tags
- raw selector mechanics
- inline random data
- process.env usage
- Allure/reporting ownership
- verification evidence

Output findings by severity:
- critical
- major
- minor only if worth fixing now

For each finding include:
- file
- issue
- why it matters
- minimal suggested fix

Clearly state if no issues are found.

Recommended next step must be one of:
- accept changes
- accept after minor cleanup
- run refactor-overengineering
- run heal-ui-test
- run heal-api-test
- update rule/skill/project map
- request changes
```

---

## Prompt: Simplify Overengineered Test Architecture

Use when cleanup/refactor changes are needed.

```text
Use Skill: @.cursor/skills/refactor-overengineering/SKILL.md

Target:
<component/helper/fixture/flow/client/spec>

Problem:
<why current code is too noisy, duplicated, out of sync, or overengineered>

Task:
Simplify architecture without changing behavior.

Rules:
- check actual usage before removing or moving anything
- keep behavior unchanged
- keep test intent unchanged
- keep assertions unchanged unless they are clearly wrong or too weak
- preserve tags
- preserve fixture contracts
- do not broaden refactor scope
- do not add new feature coverage
- do not create speculative abstractions
- do not add dependencies

After changes:
run impacted specs and quality gate from project map.

Report:
- files changed
- what was simplified
- verification results
- remaining risks
```

---

# 9. Healing Prompts

## Prompt: Heal Failing UI Test

```text
Use Skill: @.cursor/skills/heal-ui-test/SKILL.md

Failing test output:
<insert output>

Target:
<spec/page/component/fixture/data files involved>

Task:
Investigate and apply the minimal fix at the correct layer.

Use:
- failing step
- stack trace
- trace/screenshot/video if available
- affected spec
- Page Object/Component
- fixture/data setup

Classify root cause:
- locator
- timing/async update
- navigation/setup
- fixture
- test data
- assertion mismatch
- environment/config
- isolation/flakiness

Rules:
- do not use waitForTimeout
- do not weaken assertions
- do not change expected behavior unless product behavior is confirmed changed
- do not hide action under test in hooks or fixtures

After fix:
run impacted spec and quality gate from project map.

Report:
- root cause
- files changed
- fix applied
- verification results
- remaining risks
```

---

## Prompt: Heal Failing API Test

```text
Use Skill: @.cursor/skills/heal-api-test/SKILL.md

Failing test output:
<insert output, status/body, stack trace, or error summary>

Target:
<spec/helper/schema/builder/client/config files involved>

Task:
Diagnose and heal the failing API test with the smallest correct fix.

Context:
<any important contract, setup, environment, schema, builder, auth, or recent-change details>

Scope:
- API test healing only
- minimal fix
- do not add new coverage
- do not refactor unrelated files
- do not weaken assertions to force pass
- do not change expected behavior without contract evidence
- do not modify schemas unless schema mismatch is proven

After fix:
run impacted API spec, related specs if shared code changed, and quality gate from project map.

Report:
- root cause
- files changed
- fix applied
- whether schema/Zod was involved
- verification results
- remaining risks
```

---

## Prompt: Investigate Flaky UI Test Without Fixing

```text
Use Skill: @.cursor/skills/heal-ui-test/SKILL.md

Mode:
investigation only

Task:
Analyze flaky test <test/spec>.

Scope:
- do not modify files

Review:
- failure pattern
- trace/screenshot/video
- locator stability
- setup and fixtures
- data uniqueness
- waits and assertions
- test isolation
- environment differences

Output:
- suspected root cause
- evidence
- affected layer
- minimal recommended fix
- whether hardening is needed
```

---

## Prompt: Investigate API Environment Or Setup Mismatch

Use when API-created data is not visible to UI or another API runtime.

```text
Use Skill: @.cursor/skills/heal-api-test/SKILL.md

Mode:
investigation only

Failing behavior:
<describe mismatch>

Target:
<fixtures/config/specs involved>

Task:
Diagnose whether API setup, UI runtime, and API tests point to the same backend/state.

Scope:
- do not modify files unless a minimal confirmed config fix is explicitly requested
- inspect configured API_BASE_URL
- inspect configured UI_PRECONDITION_API_BASE_URL or UI_API_BASE_URL
- inspect UI network API endpoints if needed
- compare API-created data visibility across API and UI paths
- do not derive API host from UI host
- do not read env variables in specs

Report:
- API fixture endpoint used
- UI runtime API endpoint used
- API-created data API result
- API-created data UI result
- UI-created data API result, if checked
- root cause or strongest evidence
- recommended next step
```

---

# 10. Architecture Maintenance Prompts

## Prompt: Update Project Map

```text
Use Skill: @.cursor/skills/update-project-map/SKILL.md

Change requiring project map update:
<describe change>

Task:
Update only relevant manual sections.

Check consistency with:
- actual files
- path aliases
- package scripts
- fixture entry points
- tags
- rules
- skills
- quality gate command

Rules:
- do not edit generated repository tree manually
- if repository tree changed, use project-map:update script
- manual sections may be updated only for convention changes
- do not document experimental structure as stable convention
- do not duplicate existing entries
- keep changes scoped to the current feature/refactor

After changes:
run project map update/check commands from project map if applicable.

Report:
- files changed
- sections updated
- commands run/results
- remaining risks
```

---

## Prompt: Harden Rules From Failure

```text
Use Skill: @.cursor/skills/harden-rules-from-failure/SKILL.md

Trigger:
<failure/review finding/repeated AI mistake>

Task:
Decide whether hardening is needed.

Classify trigger as:
- one-off issue
- recurring pattern
- missing rule
- unclear skill
- missing project map entry
- missing helper
- diagnostics gap

Rules:
- do not add rules for one-off issues
- prefer updating existing rules or skills over creating new ones
- avoid duplicate or conflicting guidance
- keep changes minimal

Output:
- hardening decision
- target file/rule/skill if change is needed
- minimal proposed change
- remaining risks
```

---

# 11. Verification Prompt

## Prompt: Run Verification

```text
Use Skill: @.cursor/skills/run-verification/SKILL.md

Changed files:
<files>

Task:
Choose and run the smallest sufficient verification.

Identify affected layer:
- UI spec
- API spec
- Page Object
- Component Object
- fixture
- builder
- generator
- dataset
- API client
- schema
- assertion helper
- config
- core
- rule
- skill
- command
- project map

Choose verification in this order:
1. impacted spec or targeted check
2. related specs if shared code changed
3. typecheck or lint if applicable
4. repository quality gate from project map

Rules:
- do not invent commands
- report commands run and results
- if a check cannot be run, state why and what should be run
```

---

# Universal Closing Instruction

Add this to prompts when strict reporting is needed.

```text
At the end, report:

- skill used
- rules most relevant
- files changed or reviewed
- verification run or not run
- remaining risks
- next recommended step
```

Use this file to choose the correct workflow, skill, task boundary, and expected output.

---

## Mental Model

```text
Project Map = where things live
Rules = what must never be violated
Skills = how to perform a task
Command = reusable task launcher
Prompt = the current task ticket
```

