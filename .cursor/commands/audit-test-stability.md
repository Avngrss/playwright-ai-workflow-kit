Use Skill: @.cursor/skills/audit-test-stability/SKILL.md

Test paths:
<tests/ui/... tests/e2e/... or leave empty for UI/E2E scope>

Optional failed spec/report:
<failure output, trace summary, or "none">

Task:
Audit UI/E2E tests for flaky patterns, weak synchronization, hidden flows, and stability risks.

Scope:
- audit only
- do not modify files
- do not fix tests
- do not add waits or retries
- do not install browsers
- do not run broad suite unless asked

Report:
- summary
- critical flaky risks
- major stability risks
- minor maintainability risks (only if worth fixing now)
- affected files
- root-cause category
- recommended fix strategy
- recommended next command
