Use Skill: @.cursor/skills/plan-e2e-journey/SKILL.md

Usage:
/plan-e2e-journey specs/e2e/<journey>.md

Input:
- target E2E journey plan path: specs/e2e/<journey>.md
- candidate journey scope (business/user flow)

Task:
Create or update an E2E journey plan only.

Rules:
- planning only (no Playwright implementation)
- full user/business journey only (not short UI checks)
- do not duplicate API/UI/schema/visual feature coverage
- include setup/data/cleanup strategy and blockers
- include implementation target under tests/e2e/... and tags including @e2e

Stop condition:
- stop after creating/updating specs/e2e/<journey>.md
