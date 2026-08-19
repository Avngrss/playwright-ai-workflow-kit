Use Skill: @.cursor/skills/review-generated-code-quality/SKILL.md

Review changes in:
<files/diff/current working tree>

Context:
<any important scope, intentional cleanup, known risks, or verification results>

Scope:
- review only
- do not modify files
- do not run broad refactoring
- do not suggest unrelated architecture changes
- includes embedded security posture review (step 15A) — do not run a separate security audit in the same flow

Focus:
- critical or major issues
- broken imports
- failing or missing verification evidence
- rule violations that can cause false positives or false negatives
- secrets/logs/artifacts/visual exposure in changed code

Report:
- summary with security posture status
- critical / major / minor findings
- security posture section when applicable
- recommended next step
