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
- API coverage backlog: first batch / later batch / postponed
- UI coverage backlog: first batch / later batch / postponed
- visual checkpoints: planned now / postponed
- schema/contract checks
- not automated / blockers
- API Implementation Brief
- UI Implementation Brief
- recommended next commands to run manually

Coverage backlog requirements:
- include all meaningful candidate coverage for the feature
- choose one primary level per behavior: API / UI / visual checkpoint / schema-contract / not automated
- explain why each item belongs to that level
- separate first batch from later batch
- mark unstable or unclear behavior as postponed or blocked
- do not list helpers, builders, clients, fixtures, Page Objects, Component Objects, or metadata helpers as standalone scenarios; include them only as implementation decisions.

Visual checkpoint decision must include:
- target state
- screenshot scope
- reason visual coverage is useful
- planned now or postponed
- dynamic content risks
- recommended tag: @visual with @regression by default

Stop condition:

- stop after creating or updating the feature coveragefeature>.md` file;- stop after creating or updating the feature coverage plan;
- do not use Cursor Plan mode Build for planning-only tasks;
- do not require a separate Build step or follow-up implementation step to write the plan file.
- do not start implementation;
- do not implement API tests;
- do not implement UI tests;
- do not create builders, fixtures, Page Objects, API clients, or visual checkpoints;
- do not add Allure metadata;
- do not run implementation verification;
- recommended next commands are output only, not permission to execute.

Execution mode guidance:

- prefer Agent mode for this command when the expected output is a `specs/<feature>.md` file;
- do not use Cursor Plan mode Build for planning-only tasks;
- do not require a separate Build step or follow-up implementation step to write the plan file.
