Use Skill: @.cursor/skills/plan/SKILL.md

Plans a feature's coverage, or an E2E journey — planning only, no tests written. Each scenario gets one owner (API,
UI or E2E) and its route from the live check; case blocks are written by `npm run plan:block` (a saved TMS case or
bug: `--case|--bug`); stand data is searched with `npm run stand:find` before a case is blocked. Ends with the plan
at `specs/<app>/<area>/<feature>/<feature>.md` (a journey: `specs/e2e/<app>/<area>/<journey>.md`) and "Write these
<n> now?". The plan exists already → a later pass by itself (§3): what is automated first, `Blocked` lines
re-checked, an alignment with the TMS cases, or a short path — read only:
- **one or two cases** of the planned feature → §1 (1, 7), §4 (the case's source), §4.5, §5 (what the case meets),
  §6 Whole case, §8;
- **a refresh** — a product or rule change named, red tests at hand or not → §3 "Already automated" and "Refresh",
  §4–§5 for the changed part only, the TMS cases it touches only, §6 Whole case for a changed or new scenario, §8 —
  its short form when only tests change;
- **one E2E journey** over planned features → §7 and the parts its list names.

A locator-only failure is `/heal`; three or more red tests, or a CI run → `/triage` — a run summary's last line
names which.

What to cover (optional — the skill asks when empty):
<a TMS folder or case link | a ticket id or link | a confirmed bug's id or link | a requirements doc | an API collection path | the feature in your own words | "E2E: <who does what, to what they see>" | an existing plan's path>
App and owners (optional): <app> · <only API | only UI | E2E — default: every owner the live check finds>
What changed (optional, an existing plan): <a ticket, a field, contract or screen that changed, a rule | a TMS folder link | "nothing, re-check blocked cases">
