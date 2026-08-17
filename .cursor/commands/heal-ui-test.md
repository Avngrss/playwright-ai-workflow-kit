Use Skill: @.cursor/skills/heal-ui-test/SKILL.md
Follow: @.cursor/rules/feature-change-lifecycle.rules.mdc

Failing test output:
<paste failing command output, stack trace, step name, or error summary>

Target:
<spec/page/component/fixture/data files involved>

Task:
Diagnose and heal the failing UI test with the smallest correct fix.

Context:
<any important environment, setup, locator, data, or recent-change details>

Scope:
- UI test healing only
- minimal fix
- do not add new coverage
- do not refactor unrelated files
- do not use waitForTimeout
- do not weaken assertions to force pass
- do not change expected behavior without plan or product evidence

Plan-first gate:
- read specs/<feature>/<feature>.md for the failing feature
- if the failure is requirement/product drift, stop and recommend /update-feature-plan
- heal only technical drift against a current plan (locator, timing, fixture, data, config)

After fix:
run impacted UI spec, related specs if shared Page Object/helper changed, and quality gate from project map.

Report:
- root cause
- files changed
- fix applied
- whether plan refresh was required instead
- verification results
- remaining risks
