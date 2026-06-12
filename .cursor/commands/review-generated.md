Use Skill: @.cursor/skills/refactor-overengineering/SKILL.md

Target:
<component/helper/fixture/flow/client/spec>

Problem:
<why current code is too noisy, duplicated, brittle, or overengineered>

Task:
Simplify or clean up with minimal behavior-preserving changes.

Context:
<any important scope, known risks, verification state, or intentional cleanup>

Scope:
- keep behavior unchanged
- keep test intent unchanged
- minimal changes only
- do not add new coverage
- do not refactor unrelated files
- do not broaden refactor scope

Rules:
- check actual usage before removing or moving anything
- preserve assertions unless they are clearly wrong or too weak
- preserve tags
- preserve fixture contracts
- do not create speculative abstractions
- do not add dependencies

If blocked:
stop and report what information or decision is missing.

After changes:
run impacted specs/checks and quality gate from project map.

Report:
- files changed
- what was simplified
- behavior preserved: yes/no
- verification results
- remaining risks