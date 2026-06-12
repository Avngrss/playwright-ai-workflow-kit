Use Skill: @.cursor/skills/configure-allure-reporting/SKILL.md

Target:
<spec file or feature area>

Task:
Add or normalize Allure metadata for the target specs.

Context:
<any feature name, owner, severity convention, TMS/issue links, or existing metadata pattern>

Scope:
- metadata only
- no test behavior changes
- no Page Object changes
- no Component Object changes
- no API client changes
- no builder/generator changes
- no fixture changes unless reporting fixture is explicitly in scope

Rules:
- use shared Allure metadata helper
- keep concrete metadata values in specs
- keep feature/story/severity/owner/tms/issue values close to the tests they describe
- do not add Allure calls to Page Objects, Components, API clients, builders, generators, or domain flows
- do not create feature-specific Allure helpers unless repetition is significant
- do not create API diagnostics helper unless explicitly requested
- preserve existing tags and test intent
- do not add attachments unless explicitly requested

If blocked:
stop and report missing metadata values or ownership decisions.

After changes:
run impacted spec or quality gate from project map.

Report:
- files changed
- metadata added/updated
- helper usage
- verification result
- remaining risks