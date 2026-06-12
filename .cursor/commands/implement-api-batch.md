Use Skill: @.cursor/skills/implement-api-feature/SKILL.md

Feature plan:
<path to feature plan>

Task:
Implement only the first API batch from the API Implementation Brief.

Input:
- API contract: <swagger/openapi/docs link>
- existing builder/client/helpers if any

Scope:
- API tests only
- no UI tests
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

If blocked:
stop and report missing contract, builder, auth, or response details.

After changes:
run impacted API spec and quality gate from project map.

Report:
- files changed
- tests added
- builder/client/helper decisions
- verification commands/results
- remaining risks