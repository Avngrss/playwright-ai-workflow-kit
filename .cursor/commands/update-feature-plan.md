Use Playwright Planner.
Use Skill: @.cursor/skills/plan-test-coverage/SKILL.md
Follow: @.cursor/rules/feature-change-lifecycle.rules.mdc

Feature:
<feature slug, e.g. contact>

Existing plan:
specs/<feature>/<feature>.md

What changed:
<known delta — or write "unknown" / "tests started failing">

Layer to refresh (optional):
<api | ui | both | unknown>
# If omitted or unknown, agent discovers impact. Specifying a layer does not skip checking the other layer for side effects.

Sources to reconcile (optional but helpful):
- requirements/specs: <path, link, pasted text, or @file — same as /plan-feature>
- UI route/page: <path>
- API contract: <swagger/openapi/docs link>
- TMS: <suite/case ids if any>
- failing tests: <paths if any>
- Bruno collection: <path if any>
- notes: <anything observed>

If requirements are attached:
- treat them as the intended product behavior for this refresh
- compare old plan vs attached requirements vs live app/contract when available
- do not invent fields, messages, or status codes that the requirements do not define
- if requirements and live app disagree, record the drift in Change log and mark unclear items blocked/postponed

Task:
Refresh an existing feature coverage plan after a product or requirement change.

If What changed is unknown:
- do not invent requirements
- discover delta from the current plan vs live app/contract/failing tests
- document observed differences in Change log
- mark unclear scenarios blocked/postponed instead of guessing
- if the delta is technical only (locator/timing, same behavior), stop and recommend /heal-* instead of rewriting the plan

If Layer to refresh is api or ui:
- update that layer's scenarios and Implementation Brief first
- still scan the other layer for impact
- do not rewrite unaffected ready items unless a real cross-layer change is found
- recommended next command should match the affected layer only

This command is for feature plans only.
If the failure is a full E2E journey, use /plan-e2e-journey on specs/e2e/<area>/<journey>.md.
If both a feature step and the journey changed, update the feature plan first, then the E2E journey plan.

Scope:
- planning only
- allowed change: update only specs/<feature>/<feature>.md
- do not implement or heal tests in this command

Required plan updates:
- add a short Change log entry describing known or discovered delta
- refresh Auth Strategy if login, session, or token behavior changed
- mark scenarios added, updated, removed, blocked, postponed, or not automated
- refresh ready to implement now vs blocked/postponed lists
- refresh API and/or UI Implementation Briefs for affected ready items
- note obsolete automation that should be removed or rewritten

Output:
- updated specs/<feature>/<feature>.md
- delta summary: added / updated / removed / blocked scenarios
- layers affected: API / UI / schema / visual
- recommended next commands

Recommended next commands (informational only):
- /implement-api-batch — when ready API items changed
- /implement-ui-batch — when ready UI items changed
- /plan-e2e-journey — when a related full journey also changed
- /heal-ui-test or /heal-api-test — only for technical drift after plan is current
- /review-generated — after implementation or heal

Stop condition:
- stop after updating the plan
- do not start implementation or healing
- do not run recommended next commands

Execution mode:
- use Agent mode when the expected output is a plan file update
- do not use Cursor Plan mode Build for planning-only tasks

Report:
- plan path updated
- known vs discovered change summary
- layers affected
- ready API coverage after refresh
- ready UI coverage after refresh
- blocked/postponed/removed items
- recommended next step
