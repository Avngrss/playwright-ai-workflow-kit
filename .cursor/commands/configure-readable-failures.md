Use Skill: @.cursor/skills/configure-readable-failures/SKILL.md

Task:
Wire readable Allure failure diagnostics once for this project (first UI/API batch).

Scope:
- create failure-summary, failure-context, allure-failure-diagnostics helpers
- create reporting.fixture.ts and insert into fixture chain
- do not create specs, Page Objects, or sanitized HTTP helpers unless explicitly requested
- do not re-run if reporting.fixture.ts already exists

After changes:
- npm run qa:gate

Report:
- files created
- fixture chain change
- verification result
