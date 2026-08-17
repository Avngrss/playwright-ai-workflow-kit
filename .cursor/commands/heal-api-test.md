Use Skill: @.cursor/skills/heal-api-test/SKILL.md

Failing test output:
<paste failing command output, stack trace, response status/body, or error summary>

Target:
<spec/helper/schema/builder/client files involved>

Task:
Diagnose and heal the failing API test with the smallest correct fix.

Context:
<any important contract, setup, environment, schema, builder, auth, or recent-change details>

Scope:
- API test healing only
- minimal fix
- do not add new coverage
- do not refactor unrelated files
- do not weaken assertions to force pass
- do not change expected behavior without contract evidence
- if requirement/contract drift vs the feature plan: stop and recommend /update-feature-plan

After fix:
run impacted API spec, related specs if shared code changed, and quality gate from project map.

Report:
- root cause
- files changed
- fix applied
- whether schema/Zod was involved
- verification results
- remaining risks