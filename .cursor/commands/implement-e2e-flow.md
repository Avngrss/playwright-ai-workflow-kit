Use Skill: @.cursor/skills/implement-e2e-flow/SKILL.md

Usage:
/implement-e2e-flow specs/e2e/<journey>.md

Input:
- existing E2E journey plan only: specs/e2e/<journey>.md
- scenario must come from that journey plan

Task:
Implement only E2E coverage marked ready to implement now.

If input plan is missing:
"E2E journey plan is required. Create it first with /plan-e2e-journey under specs/e2e/<journey>.md."

If the journey plan is blocked:
"This E2E journey is blocked: <reason>. Resolve the blocker or create a different E2E journey plan."

Rules:
- E2E test only under tests/e2e/...
- use @e2e (+ @smoke or @regression)
- keep business flow in UI; API only for setup/preconditions/cleanup
- do not replace business actions with API calls
- do not read E2E scenarios from feature plans

Runner gap handling:
- if no Playwright runner matches tests/e2e/**/*.e2e.spec.ts, stop and report the config gap

Cleanup:
- remove temporary discovery/debug scripts and JSON dumps before finishing
- rule: `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`
