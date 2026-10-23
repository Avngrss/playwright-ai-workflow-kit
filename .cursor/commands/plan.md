Use Skill: @.cursor/skills/plan/SKILL.md

Plans a feature's coverage, or an E2E journey — planning only, no tests written. Ends with the plan at
`specs/<app>/<area>/<feature>/<feature>.md` (a journey: `specs/e2e/<app>/<area>/<journey>.md`) and "Write these <n> now?".
The plan exists already → a later pass by itself (§3): what is automated first, `Blocked` lines re-checked, an
alignment with the TMS cases or a refresh after a product change. A locator-only failure is `/heal`.

What to cover (optional — the skill asks when empty):
<a TMS folder or case link | a ticket id or link | a requirements doc | an API collection path | the feature in your own words | "E2E: <who does what, to what they see>" | an existing plan's path>
App and layers (optional): <app> · <API | UI | API + UI | E2E>
What changed (optional, an existing plan): <a TMS folder link | a field, contract or screen that changed | "nothing, re-check blocked cases">
