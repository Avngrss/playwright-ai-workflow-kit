Use Skill: @.cursor/skills/plan-from-tms/SKILL.md

Feature:
<feature name>

TMS:
- provider: Qase
- project code: <QASE_PROJECT_CODE>
- suite id: <QASE_SUITE_ID>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected case ids / QQL filter>

Task:
Create a feature coverage plan from TMS cases.

Scope:
- planning only
- TMS read-only
- allowed change: create/update only specs/<feature>/<feature>.md
- do not implement tests
- do not create or update Qase entities
- do not create Qase runs
- do not publish results
- do not add reporter integration
- do not add TMS IDs to automated tests yet

Rules:
- use Qase MCP for TMS data
- do not use direct Qase API fallback if MCP is unavailable
- do not assume 1 TMS case equals 1 Playwright test
- treat TMS cases as test intent and traceability source
- map each TMS case to API / UI / schema-contract / visual / not automated / blocked / postponed
- do not guess undocumented status codes, response bodies, validation messages, or boundary limits
- if specs/<feature>/<feature>.md already exists, use /align-plan-with-tms instead

Output:
- create or update specs/<feature>/<feature>.md
- include TMS Source
- include TMS Mapping
- include coverage matrix
- include ready to implement now vs blocked/postponed coverage
- include API/UI/visual/schema/not automated decisions
- include API Implementation Brief
- include UI Implementation Brief
- include recommended next commands

Stop condition:
- stop after creating or updating specs/<feature>/<feature>.md
- do not start implementation
- recommended next commands are informational only

Report:
- feature plan created/updated
- TMS cases reviewed
- ready API coverage
- ready UI coverage
- blocked/postponed items
- not automated items
- recommended next step
