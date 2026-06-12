Use Skill: @.cursor/skills/configure-allure-reporting/SKILL.md

Target:
<spec file or feature area>

Task:
Add or normalize Allure metadata for the target specs.

Scope:
- metadata only
- no test behavior changes
- no Page Object changes
- no API client changes
- no builder/generator changes

Rules:
- use shared Allure metadata helper
- keep concrete metadata values in specs
- do not add Allure calls to Page Objects, Components, API clients, builders, generators, or domain flows
- do not create API diagnostics helper unless explicitly requested
- preserve existing tags and test intent

After changes:
run impacted spec or quality gate from project map.

Report:
- files changed
- metadata added/updated
- verification result
- remaining risks