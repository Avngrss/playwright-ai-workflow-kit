Use Skill: @.cursor/skills/audit-api-collection-coverage/SKILL.md

Collection path:
<collections/bruno/<service-or-domain>/**>

Feature plan path:
<specs/<feature>.md>

API tests path:
<tests/api/**>

Optional OpenAPI/Swagger path:
<path or none>

Scope:
- audit only
- do not modify files
- do not create tests
- do not update plans, collections, OpenAPI, or TMS
- do not execute requests

Report:
- coverage matrix
- planned coverage missing tests
- collection requests not planned
- tests without plan justification
- OpenAPI/Bruno drift
- destructive/env/auth risks
- recommended next command
