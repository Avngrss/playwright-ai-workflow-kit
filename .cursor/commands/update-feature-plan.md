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
- refresh Feature Targets when URLs/services changed
- refresh Auth Strategy when login, session, token, role, or permission behavior changed
  - include `role: <role-slug-from-map>` when `auth as: precondition`
  - API mode and UI mode from project map — not invented
  - multi-role: same slug in plan for API and UI when the scenario is the same persona
- refresh Setup & Cleanup Strategy when persisted/shared state, destructive flows, or isolation changed
  - or explicitly document none / disposable-only when still true
- refresh Sensitive Data & Visual Masking when UI/forms/auth/profile visibility changed
- mark scenarios added, updated, removed, blocked, postponed, or not automated
- refresh ready to implement now vs blocked/postponed lists
- refresh API and/or UI Implementation Briefs for affected ready items
- note obsolete automation that should be removed or rewritten

Project map cross-check (report in summary — update map in a separate step when needed):
- if a new role slug is required but missing from project map Auth Strategy → mark affected scenarios blocked and recommend map update
- if auth mechanism, storageState path, creds env name, or role matrix row changed → recommend `Update project map Auth Strategy` before implement
- do not invent roles, paths, or env names in the feature plan

Plan sections that must remain complete after refresh (use placeholders when a section applies):

```md
## Change log
- <date or sprint>: <delta summary>

## Feature Targets
- UI/application: <UI_BASE_URL or named target from map>
- API/service: <API_BASE_URL or named target from map>

## Auth Strategy
- required: yes | no
- role: <role-slug-from-map — omit when no session>
- auth as: none | action | precondition
- API mode: <from project map, or none>
- UI mode: <from project map, or none>
- persistence: <from map when session used>
- token placement: <from map when applicable>
- isolation: <from map or none>
- capture / secrets: <path or env name from map, or none>

## Setup & Cleanup Strategy
- persisted state: yes | no
- parallel safe: yes | no | serial-only (<reason>)
- preferred isolation: disposable data | fixture teardown | spec step cleanup | afterEach | none
- setup owner: none | fixture | API helper | beforeEach navigation | setup project | blocked
- cleanup owner: none | fixture teardown | spec step | afterEach | blocked
- entities created: <user, order, ... or none>
- cleanup target/service: <Feature Target or none>
- idempotent cleanup: yes | no | n/a
- blocked reason / required unblocker: <only when missing>

## Sensitive Data & Visual Masking
- sensitive fields: <... or n/a>
- generated/unstable fields: <... or n/a>
- mask in @visual: <fields/locators or "none — default empty state only">
- failure artifacts: <note or n/a>
```

Multi-role reminder for Implementation Briefs:
- API ready items: credential/header wiring per plan `role: <slug>` — not storageState
- UI ready items: map UI mode — typically `test.use({ storageState: "state/<slug>.json" })` per describe when applicable
- do not recommend one global storageState or one global API token for all roles

Output:
- updated specs/<feature>/<feature>.md
- delta summary: added / updated / removed / blocked scenarios
- layers affected: API / UI / schema / visual
- project map updates needed: yes/no — what to register if yes
- recommended next commands

Recommended next commands (informational only):
- Update project map Auth Strategy — when roles, mechanisms, paths, or creds refs changed
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
- Auth Strategy / Setup & Cleanup / masking refreshed: yes/no
- project map gap(s) if any
- ready API coverage after refresh
- ready UI coverage after refresh
- blocked/postponed/removed items
- recommended next step
