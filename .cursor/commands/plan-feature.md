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
- allowed change: create/update only specs/<feature>.md

Rules:
- follow test pyramid
- choose one primary level per behavior: API / UI / visual checkpoint / schema / not automated
- prefer the lowest reliable level
- do not duplicate the same risk across levels
- UI only for user-facing/browser-visible risks
- API/schema strictly from contract; do not guess missing details
Visual checkpoint decision must include:Visual checkpoint decision;
- target state;
- screenshot scope;
- reason visual coverage is useful;
- whether checkpoint is first batch or postponed;
- dynamic content risks.

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

Important:
The plan must not leave UI/API implementation details for implementation agents to invent.