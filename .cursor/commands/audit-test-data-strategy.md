Use Skill: @.cursor/skills/audit-test-data-strategy/SKILL.md

Plans/tests/data paths:
<specs/<feature>.md, specs/e2e/<journey>.md, tests/**, src/test/data/**, src/test/fixtures/** — or leave empty for scope-derived review>

Task:
Audit test data strategy for shared mutable data, isolation, cleanup, generation, builders, fixtures, and E2E data risks.

Scope:
- audit only
- do not modify files
- do not create or change data
- do not delete data
- do not mutate environment
- do not update TMS

Report:
- summary
- safe data patterns found
- data risks
- destructive flow risks
- cleanup/isolation gaps
- builder/generator findings
- fixture findings
- E2E data risks
- recommended next actions
