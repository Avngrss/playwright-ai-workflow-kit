Use Skill: @.cursor/skills/plan-e2e-journey/SKILL.md

Usage:
/plan-e2e-journey specs/e2e/<area>/<journey>.md

Input:
- target E2E journey plan path: specs/e2e/<area>/<journey>.md
- candidate journey scope (business/user flow)
- what changed (optional): known delta, or "unknown" / failing E2E spec path

Task:
Create or update an E2E journey plan only.

If updating an existing journey and the delta is unknown:
- discover from the current journey plan vs the failing E2E spec and live flow
- do not invent missing external capabilities (mailbox, payment, cleanup)
- if the failure is a feature-level change, recommend /update-feature-plan for the related feature first

Rules:
- planning only (no Playwright implementation)
- full user/business journey only (not short UI checks)
- include Auth Strategy (required, role, auth as, modes from the project map)
- do not duplicate API/UI/schema/visual feature coverage
- include setup/data/cleanup strategy and blockers
- include implementation target under tests/e2e/... and tags including @e2e

Stop condition:
- stop after creating/updating specs/e2e/<area>/<journey>.md
