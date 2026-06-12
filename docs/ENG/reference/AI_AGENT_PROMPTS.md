# AI Agent Prompt Templates

## Purpose

Reusable prompt templates for working with AI agents in the Playwright + TypeScript test automation framework.

Use this file to choose the correct workflow, skill, task boundary, and expected output.

---

## Mental Model

```text
Project Map = where things live
Rules = what must never be violated
Skills = how to perform a task
Prompt = the current task ticket
```

A prompt should not repeat all rules.

A good prompt defines:

- skill / agent;
- task;
- inputs;
- scope;
- stop conditions;
- expected output;
- verification.

---

## Default Workflow For A New Feature

```text
1. Plan Feature Coverage
2. Create or validate Test Data Builder, if needed
3. Implement first API batch, if present
4. Implement first UI batch, if present
5. Add visual checkpoints later, if planned
6. Review Generated Code Quality
7. Refactor / Heal / Harden only if needed
```

Rules of thumb:

- Do not implement API and UI in one agent run.
- Use one main skill per task.
- Do not create builders, clients, fixtures, or components speculatively.
- If the plan is too vague for UI or API implementation, refine the relevant implementation brief before coding.

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

If required information is missing, do not invent architecture or behavior. Report the blocker and propose the smallest safe next step.
```

---

# 1. Planning Prompts

## Prompt: Plan Feature Coverage

Use this as the main entry point for a new feature.

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
Create a feature coverage plan that is directly actionable for implementation agents.

Scope:
- planning only
- no test implementation
- no production code changes
- allowed change: create/update only specs/<feature>.md

Coverage rules:
- follow test pyramid
- choose one primary level per behavior: API / UI / visual checkpoint / schema / not automated
- prefer the lowest reliable level
- do not duplicate the same risk across UI, API, schema, and visual
- UI only for user-facing/browser-visible risks
- API/schema strictly from contract; do not guess missing fields, statuses, bodies, or messages
- visual checkpoints only inside UI flows and postpone them unless explicitly requested

Required output:
- coverage matrix
- smoke/regression split
- first API batch
- first UI batch
- API Implementation Brief
- UI Implementation Brief
- visual checkpoints / postponed visual items
- not automated / blockers
- recommended implementation order

API Implementation Brief must include:
- endpoint/method per scenario
- payload source or builder need
- expected status
- response assertions
- API client decision
- assertion helper decision
- contract gaps/blockers

UI Implementation Brief must include:
- route/page
- scenario steps
- tags
- preconditions/test data
- expected visible outcome
- recommended Page Object
- likely Page Object actions/readers
- Component Object decision
- locator discovery notes if available
- assertions in spec
- what API/schema owns instead of UI

Important:
The plan must not leave UI/API implementation details for implementation agents to invent.
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
- recommended Page Object
- likely Page Object actions/readers
- Component Object decision
- locator discovery notes if available
- assertions in spec
- what must not be tested in UI because API/schema owns it

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
- expected status
- response assertions
- builder need
- API client decision
- assertion helper decision
- contract gaps/blockers
- what must not be guessed

Constraints:
- planning only
- no implementation
- no file changes except updating the feature plan
- rely strictly on the API contract
- do not guess payload fields, status codes, response bodies, or error messages

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
Create or update only the test data builder needed by the planned batches.

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
- remaining risks
```

---

# 3. API Prompts

## Prompt: Implement API Feature From Plan

Use this after the feature plan and required builder are ready.

```text
Use Skill: @.cursor/skills/implement-api-feature/SKILL.md

Feature plan:
<path to feature plan>

Task:
Implement only the first API batch from the API Implementation Brief.

Input:
- API contract: <swagger/openapi/docs link>
- existing builder/client/helpers if any

Scope:
- API tests only
- no UI tests
- minimal changes
- do not create new builder/client/helper unless required by the plan or clearly justified

Rules:
- rely strictly on the API contract
- do not guess payload fields, status codes, response body, or error messages
- use request/response model only
- do not use Page Objects or Components
- do not call login directly in tests
- do not hardcode tokens or credentials
- no process.env outside config layer
- no inline random data in specs
- create API client only if request composition is duplicated or reuse is justified
- API client must not contain assertions
- use dedicated assertion helper for non-trivial response contract/schema assertions

If blocked:
stop and report missing contract, builder, auth, or response details.

After changes:
run impacted API spec and quality gate from project map.

Report:
- skill used
- files changed
- tests added
- builder/client/helper decisions
- verification commands/results
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
- return response or typed data

Client must not:
- hide assertions
- hide workflows
- call login directly
- hardcode tokens
- duplicate auth logic
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

Task:
Implement only the first UI batch from the UI Implementation Brief.

Scope:
- UI tests only
- no API tests
- no visual screenshots unless explicitly requested
- minimal changes

Use:
- existing builders/generators/datasets when suitable
- existing fixture entry point from project map
- existing Page Object conventions from project map

Architecture:
- create/update minimal Page Object only if needed
- prefer Page Object first
- keep simple one-page UI blocks inside the Page Object
- do not create Component Object by default
- use Discover UI Components only if ownership is unclear
- do not create new fixture unless required
- do not hide the action under test in fixtures/hooks

Locator discovery:
- use locator notes from the plan if available
- use Playwright generator/codegen/MCP only if stable locators or actual UI behavior are unclear
- do not commit raw generated/codegen output
- convert discovered locators/actions into Page Object methods and clean specs

Tests must:
- use meaningful test.step
- keep the main action under test explicit
- use required tags from the plan
- avoid raw selector mechanics in specs
- avoid inline random data
- keep assertions in specs or dedicated assertion helpers

If blocked:
stop and report missing locator, data, fixture, or behavior details.

After changes:
run impacted UI spec and quality gate from project map.

Report:
- skill used
- files changed
- tests added
- Page Object/component decisions
- whether generator/MCP was used and why
- verification commands/results
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

Check existing:
- specs
- Page Objects
- Component Objects
- fixtures
- builders/generators
- tags

Rules:
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

# 5. Visual Prompts

## Prompt: Implement Visual Checkpoint

Use only when visual checkpoint is already planned or explicitly requested.

```text
Use Skill: @.cursor/skills/implement-visual-test/SKILL.md

Feature/scenario:
<scenario>

Existing UI spec or planned UI batch:
<path/details>

Task:
Add only the planned visual checkpoint inside an existing or planned UI flow.

Rules:
- functional assertion first
- screenshot assertion after stable UI state
- add @visual tag
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

After changes:
run impacted specs and quality gate from project map.

Report:
- files changed
- why fixture is justified
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
<files/diff/branch>

Scope:
- review only
- do not modify files

Focus:
- readability
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
- minor

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
<why current code is too noisy, duplicated, or overengineered>

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
- do not change expected behavior unless requirement is wrong
- do not hide action under test in hooks or fixtures

After fix:
run impacted spec and quality gate from project map.

Report:
- root cause
- files changed
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

After changes:
run project map update/check commands from project map if applicable.

Report:
- files changed
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
- API client
- config
- core
- rule
- skill
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
