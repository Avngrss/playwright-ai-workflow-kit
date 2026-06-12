Use Skill: @.cursor/skills/implement-visual-test/SKILL.md

Target:
<spec/page/component>

Scenario/state:
<scenario or visual state>

Task:
<add visual checkpoint | verify existing checkpoint | approve existing baseline>

Approve baseline:
<yes | no>

Context:
<any dynamic content, masking, baseline, environment, or stability notes>

Rules:
- visual assertion must stay in spec
- functional assertion first
- screenshot assertion after stable UI state
- use @visual tag
- use @regression by default for visual checks
- do not add @smoke to visual checks unless explicitly requested
- do not create standalone visual spec by default
- do not put screenshot assertions in Page Objects or Components
- check dynamic content before screenshot
- mask only dynamic content that is not relevant to the visual risk
- do not update baselines unless Approve baseline is yes

If Approve baseline is no:
- run impacted visual test once
- if baseline is missing, report that baseline approval is required
- do not update or commit baseline snapshots
- keep Playwright failure artifacts or actual screenshots for review if generated
- report artifact paths when available

If Approve baseline is yes:
- run impacted visual test with snapshot update enabled
- run the same impacted visual test again without snapshot update
- report created or updated snapshot files
- report both command results

Report:
- files changed
- screenshot name
- masking strategy
- baseline status
- verification commands/results
- remaining risks