Use Skill: @.cursor/skills/align-plan-with-tms/SKILL.md

Feature plan:
<path to specs/<feature>/<feature>.md>

TMS:
- provider: Qase
- project code: <QASE_PROJECT_CODE>
- suite id: <QASE_SUITE_ID>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected case ids / QQL filter>

Task:
Align the existing feature coverage plan with TMS cases.

Scope:
- planning/alignment only
- TMS read-only
- allowed change: update only the feature plan file
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
- compare TMS intent with existing feature plan coverage
- map each TMS case to API / UI / schema-contract / visual / not automated / blocked / postponed
- do not guess undocumented status codes, response bodies, validation messages, or boundary limits
- update TMS Source and TMS Mapping sections in the feature plan
- keep ready to implement now vs blocked/postponed clear

Stop condition:
- stop after updating the feature plan
- do not start implementation
- recommended next commands are informational only

Report:
- feature plan updated
- TMS cases reviewed
- already covered cases
- missing ready coverage
- blocked/postponed cases
- not automated cases
- recommended next step