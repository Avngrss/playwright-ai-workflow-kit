Use Skill: @.cursor/skills/verify/SKILL.md — §8 "Heal".

One or two red tests (a run summary's last line: "heal the red tests: <spec>:<line> …"), each by its verdict — read
only §8.2, the part of §8.5 the verdict needs, §8.7, §8.8, then §2, §6.2 Light and §7. The test needs fixing → the
locator recipe (the saved-session script first, the Playwright MCP to explore) and the smallest fix, no change-log
line · the stand → its second pass decides (failed again → no change; passed → the stand was slow, nothing to do) ·
the product changed → no test edit, `/plan <plan path> — <what changed>` · a bug you confirmed by hand → a
`specs/known-bugs.md` row on your yes · unstable → `--repeat-each 3`, classified, quarantined with `@flaky` only with
its reason. Then `npm run verify -- <app> <spec>:<line>` per healed test. "explain" → only explains the failures (§8.1).

Three or more red tests, or a CI run → `/triage`; a product or rule change named → `/plan <plan path> — <what
changed>` (a refresh).

Failing tests (optional — default: the "heal the red tests" line of `reports/run-summary.md`): <spec>:<line> … | a test title | the pasted error — no secrets
Mode (optional): <heal | explain>
