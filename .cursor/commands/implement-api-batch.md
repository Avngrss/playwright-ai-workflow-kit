Use Skill: @.cursor/skills/implement-api-feature/SKILL.mdUse Skill: @.cursor/skills:
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

Rules:
- rely strictly on the API contract
- do not guess payload fields, status codes, response body, or error messages
- use request/response model only
- no inline random data in specs
- create API client only if request composition is duplicated or reuse is justified
- API client must not contain assertions
- use dedicated assertion helper for non-trivial response contract/schema assertions
- postpone unstable or ambiguous cases instead of forcing flaky assertions

If blocked:
stop and report missing contract, builder, auth, setup, or response details.

After changes:
run impacted API spec and quality gate from project map.

Report:
- files changed
- tests added/updated
- builder/client/helper decisions
- postponed or blocked cases
- verification commands/results
- remaining risks

Feature plan:
<path to feature plan>

