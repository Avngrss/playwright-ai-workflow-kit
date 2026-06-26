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
- do not implement tests

Optional scope boundary:
- source of truth: <fill only if needed>
- in scope: <fill only if needed>
- out of scope: <fill only if needed>

Output:
- create or update specs/<feature>.md
- include coverage matrix
- include ready to implement now vs blocked/postponed coverage
- include API/UI/visual/schema/not automated decisions
- include API Implementation Brief
- include UI Implementation Brief
- include only an E2E Note when a full journey candidate exists
- do not include E2E coverage sections
- do not include E2E implementation briefs
- do not recommend /implement-e2e-flow directly
- if E2E is relevant, recommend /plan-e2e-journey for specs/e2e/<journey>.md first
- include recommended next commands

Stop condition:
- stop after creating or updating specs/<feature>.md
- do not start implementation
- do not run recommended next commands
- recommended next commands are informational only

Execution mode:
- use Agent mode when the expected output is a specs/<feature>.md file
- do not use Cursor Plan mode Build for planning-only tasks

Report:
- feature plan created/updated
- ready API coverage
- ready UI coverage
- blocked/postponed items
- not automated items
- recommended next step
