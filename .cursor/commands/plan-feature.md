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

Output:
- coverage matrix
- smoke/regression split
- API coverage ready to implement now
- API coverage blocked/postponed
- UI coverage ready to implement now
- UI coverage blocked/postponed
- visual checkpoints planned now
- visual checkpoints postponed
- schema/contract checks
- not automated / blockers
- API Implementation Brief
- UI Implementation Brief
- recommended next commands to run manually

Coverage grouping rule:
- include all meaningful candidate coverage for the feature
- choose one primary level per behavior: API / UI / visual checkpoint / schema-contract / not automated
- put all safe, stable, and unblocked coverage into ready to implement now
- put only genuinely blocked, unstable, unclear, or intentionally deferred coverage into blocked/postponed
- do not split coverage into first/later batches by default
- do not list helpers, builders, clients, fixtures, Page Objects, Component Objects, or metadata helpers as standalone scenarios
- include helpers, builders, clients, fixtures, Page Objects, Component Objects, and metadata helpers only as implementation decisions
- do not expand coverage to adjacent controls, query parameters, endpoints, states, or variants unless they are explicitly in scope.

Visual checkpoint decision must include:
- target state
- screenshot scope
- reason visual coverage is useful
- planned now or postponed
- dynamic content risks
- recommended tag: @visual with @regression by default

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
- prefer Agent mode for this command when the expected output is a specs/<feature>.md file
- do not use Cursor Plan mode Build for planning-only tasks
- do not require a separate Build step or follow-up implementation step to write the plan file