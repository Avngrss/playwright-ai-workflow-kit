> **Embedded in `/review-generated`.** Do not call this separately after a normal implement → verify → review batch.

Use Skill: @.cursor/skills/review-generated-code-quality/SKILL.md

Security-only exception: full-repository exposure scan **without** code-quality review.

Scope:
<all | logs | reports | artifacts | visual | git — default all>

Optional paths:
<leave empty for repository scan>

Task:
Run step **15A** and the Security Posture output section from Review Generated Code Quality across the requested scope.

Scope:
- audit only
- do not modify files unless explicitly asked
- do not print real secret values

Use when:
- periodic repo-wide security scan outside an implementation batch
- onboarding audit before enabling CI artifact sharing

Do not use when:
- reviewing recent implementation changes — use `/review-generated` instead
