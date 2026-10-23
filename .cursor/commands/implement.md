Use Skill: @.cursor/skills/implement/SKILL.md

Writes the plan's ready cases on the layers their `Needs:` lines name (API first, then UI; a journey plan → its E2E
spec), skipping what is automated; `Layer: visual` adds or checks a screenshot checkpoint inside an existing UI
scenario (§6). Then `npm run qa:gate` and the verify skill.

Plan: `specs/<app>/<area>/<feature>/<feature>.md` or `specs/e2e/<app>/<area>/<journey>.md`
Cases (optional — default: every ready case not automated yet): <case numbers or ids>
Layer (optional): <visual — a screenshot checkpoint> (API, UI and E2E follow the plan: each case on the layers its `Needs:` names, whole)
Approve baseline (visual only): <yes | no — default no>
