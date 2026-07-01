Use Skill: @.cursor/skills/audit-test-coverage/SKILL.md

Plan:
<path to specs/<feature>.md and/or specs/e2e/<journey>.md>

Optional test paths:
<tests/api/... tests/ui/... tests/e2e/... or leave empty for plan-derived scope>

Optional TMS:
<use TMS Source / TMS Mapping from plan, or note "none">

Task:
Compare planned coverage vs implemented tests and report alignment gaps.

Scope:
- audit only
- do not modify files
- do not implement tests
- do not delete tests
- do not update TMS
- do not publish results

Report:
- summary
- coverage matrix
- missing ready coverage
- unplanned tests
- duplicate coverage risks
- blocked/postponed violations
- TMS traceability gaps (if applicable)
- tag/layer issues
- recommended cleanup or implementation batches
- recommended next command
