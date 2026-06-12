Use Skill: @.cursor/skills/refactor-overengineering/SKILL.md

Target:
<component/helper/fixture/flow/client/spec>

Problem:
<why current code is too noisy, duplicated, or overengineered>

Task:
Simplify architecture without changing behavior.

Rules:
- check actual usage before removing or moving anything
- keep behavior unchanged
- keep test intent unchanged
- preserve tags
- preserve fixture contracts
- do not broaden refactor scope
- do not add new feature coverage
- do not create speculative abstractions
- do not add dependencies

After changes:
run impacted specs and quality gate from project map.

Report:
- files changed
- what was simplified
- verification results
- remaining risks