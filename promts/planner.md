Use the Playwright planner agent.

GOAL:
Create a comprehensive UI test plan for <FEATURE>.

CONTEXT / INPUTS:
- Base URL: <BASE_URL or "use configured baseURL">
- Existing rules: @.cursor/rules/20-ui-architecture.mdc
- (Optional) Seed test to bootstrap app state: @tests/ui/<...>/seed.spec.ts
- (Optional) Existing related tests/pages: @tests/ui/<...>.spec.ts, @src/test/pages/<...>.ts
- (Optional) PRD/requirements: @docs/<...>.md or paste acceptance criteria

SCOPE:
Include:
- Happy path
- Negative cases
- Validation cases
- Edge cases
Exclude:
- API tests (UI-only for now)
- Performance, security, visual tests (unless asked)

ARCHITECTURE REQUIREMENTS (must be reflected in the plan):
- Page Objects: one page per class
- No assertions inside Page Objects (assertions in spec files)
- UI tests must use test.step
- beforeEach only for safe navigation + "page loaded" checks
- Use getByTestId for data-test attribute (testIdAttribute configured)

OUTPUT:
- Save the plan as: specs/<feature>.md
- The plan must be detailed enough for code generation:
  each scenario includes preconditions, steps, and expected results.
- Mention which Page Objects/components are needed or should be extended.

PROCESS:
1) Explore the app UI where needed (use MCP if available).
2) Produce a numbered list of scenarios.
3) For each scenario: Steps + Expected results.
4) Keep the plan consistent with current project structure.
``


Use Playwright planner agent.

SCOPE: Create a UI test plan for <FEATURE> (UI-only).

INPUTS:
@.cursor/rules/20-ui-architecture.mdc
@tests/ui/<optional-seed>.spec.ts  (if exists)

OUTPUT:
Create specs/<feature>.md (only).

CONSTRAINTS:
- reflect our rules: test.step, no expect in Page Objects
- include happy/negative/validation cases
- write steps + expected results per case

VERIFY:
(no code yet)
