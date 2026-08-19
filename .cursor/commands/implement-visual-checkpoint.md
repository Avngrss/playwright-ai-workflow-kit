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
- use explicit `mask:` locators from Page Object `visualMaskTargets` when filled forms or generated data are visible (create optional `screenshot-masks.helper.ts` only when reuse justifies it)
- expose/use Page Object visualMaskTargets for non-default mask fields
- mask only dynamic or sensitive content that is not the layout under test
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