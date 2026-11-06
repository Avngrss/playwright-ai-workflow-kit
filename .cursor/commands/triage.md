Use Skill: @.cursor/skills/verify/SKILL.md — §10 "Triage the run".

Three or more red tests, or a CI run (a run summary's last line: "triage the run <link>"): every failure sorted by its
verdict — evidence, never a guess. How a test reaches the product (a path, a locator, a label) is fixed on evidence;
what it expects changes only with a source quoted — a ticket's field, a doc or code `file:line`, a commit. The
touched tests go through one `npm run verify`; then one message — Fixed · Stand (its second pass) · Changed with a
source (plans and tests refreshed, TMS corrections listed) · Is this intended? (answer "1 yes, 2 no") · the rerun
line · Time. Yes → the plan and the test refreshed; no → the test stays red and a bug is drafted. Nothing is
committed, and nothing is written to the TMS or the tracker without your yes.

One or two red tests → `/heal <spec>:<line> …`; a product or rule change named → `/plan <plan path> — <what
changed>` (a refresh).

Run (optional — default: this test home's last run, `reports/run-summary.json`): <a CI job link | reports/run-summary.json>
Answers (optional — a later message): <question number: 1 yes | 2 no, one per question>
