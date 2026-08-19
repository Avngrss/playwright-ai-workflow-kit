Use Skill: @.cursor/skills/implement-api-feature/SKILL.md
<API coverage items from the feature plan to implement now>

Task:
Implement only the selected API implementation scope from the API Implementation Brief.

Input:
- API contract: <swagger/openapi/docs link>
- existing builder/client/helpers if any

Scope:
- API tests only
- no UI tests
- no visual checkpoints
- minimal changes
- do not create new builder/client/helper unless required by the plan or clearly justified
- for mutation endpoints, include both positive and documented deterministic negative coverage
- if a new fixture is only inferred (not explicitly requested), provide a fixture recommendation first and wait for confirmation

Rules:
- rely strictly on the API contract
- do not guess payload fields, status codes, response body, or error messages
- use request/response model only
- no inline random data in specs
- create API client only if request composition is duplicated or reuse is justified
- API client must not contain assertions
- use dedicated assertion helper for non-trivial response contract/schema assertions
- postpone unstable or ambiguous cases instead of forcing flaky assertions
- if documented negative scenarios are ready in the plan, do not skip them silently

If blocked:
stop and report missing contract, builder, auth, setup, or response details.

After changes:
run impacted API spec and quality gate from project map.
Then run `/review-generated` on the changed files (includes embedded security posture review — do not call `/audit-security` separately).

Report:
- files changed
- tests added/updated
- builder/client/helper decisions
- postponed or blocked cases
- verification commands/results
- remaining risks

Feature plan:
<path to feature plan>

