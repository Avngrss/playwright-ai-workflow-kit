Use Skill: @.cursor/skills/verify/SKILL.md — §8 "Heal".

Heals a failing UI, E2E or API test from its verdict — the smallest fix, never a softened assertion or a fixed wait —
then reruns and reviews it (§2–§7). Requirement drift → back to `/plan`; a bug you confirmed by hand → a
`specs/known-bugs.md` row on your yes; flaky → classified, quarantined with `@flaky` only with its reason.
"explain" → only explains the failures (§8.1).

Failing test (optional — default: the failures in `reports/run-summary.md`): <spec path, test title, or the pasted error — no secrets>
Mode (optional): <heal | explain>
