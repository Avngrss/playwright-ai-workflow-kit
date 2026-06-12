Use Skill: @.cursor/skills/review-generated-code-quality/SKILL.md

Review changes in:
<files/diff/branch>

Scope:
- review only
- do not modify files

Focus:
- readability
- duplicated logic
- unnecessary abstractions
- local helper misuse
- fixture usage
- builder/generator usage
- API client necessity
- assertion ownership
- Page Object/Component ownership
- tags
- raw selector mechanics
- inline random data
- process.env usage
- Allure/reporting ownership
- verification evidence

Output findings by severity:
- critical
- major
- minor

For each finding include:
- file
- issue
- why it matters
- minimal suggested fix

Recommended next step must be one of:
- accept changes
- accept after minor cleanup
- run refactor-overengineering
- run heal-ui-test
- update rule/skill/project map
- request changes