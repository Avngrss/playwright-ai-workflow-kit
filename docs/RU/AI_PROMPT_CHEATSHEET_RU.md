# AI Prompt Cheatsheet RU

## Назначение

Коротskills/<skill-folder>/SKILL.mdКороткие prompt-шаблоны для ежедневной работы с AI agents в Playwright + TypeScript framework.

Task:
<task>

Allowed changes:
- <allowed files/layers>

Forbidden:
- no unrelated files
- no speculative abstractions
- no behavior changes unless required

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

# UI Workflows

## 1. UI Plan

Используй, когда нужно создать план тестов, но ещё не писать код.

```text
Use Playwright planner agent.

Task:
Create UI test plan for <feature>.

Target:
<url/page>

Scope:
- UI only
- no API tests
- no code implementation

Allowed change:
- create or update only specs/<feature>.md

Output:
- feature scope
- scenarios
- required test data
- candidate Page Objects
- candidate Components only if justified
- risks and assumptions
- recommended first batch
```

---

## 2. UI Implementation From Plan

Используй, когда уже есть план в `specs/<feature>.md`.

```text
Use Playwright generator agent.

Use skills:
@.cursor/skills/implement-ui-feature/SKILL.md
@.cursor/skills/create-page-object/SKILL.md

Feature plan:
specs/<feature>.md

Task:
Implement first recommended batch only.

Allowed changes:
- UI specs
- required Page Objects
- required Components only if clearly justified
- required fixtures only if justified
- required builders/generators only if reusable data is needed

Forbidden:
- no API tests
- no unrelated files
- no speculative abstractions
- no component fixtures by default
- no expect in Page Objects or Components
- no waitForTimeout

Rules:
- use create-page-object only if a new route/page owner is required
- if component ownership is unclear, stop and ask to use discover-ui-components
- keep assertions in specs or dedicated assertion helpers
- keep Allure concrete metadata values in specs
- use shared Allure metadata helper if metadata is needed

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

## 3. Add Small UI Test To Existing Area

Используй для маленького добавления в уже существующий UI area.

```text
Use Playwright generator agent.

Task:
Add UI test for <scenario>.

Target:
<existing spec/page area>

Allowed changes:
- existing UI spec
- existing Page Object only if required
- test data only if reusable data is needed

Forbidden:
- no API tests
- no new Components unless clearly justified
- no new fixtures unless clearly justified
- no speculative abstractions
- no unrelated files
- no expect in Page Objects or Components
- no waitForTimeout

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

## 4. Discover UI Component Ownership

Используй, когда непонятно: оставить UI block в Page Object или вынести Component Object.

```text
Use Playwright reviewer agent.

Use skill:
@.cursor/skills/discover-ui-components/SKILL.md

Task:
Decide whether <UI block> should stay inside Page Object or become Component Object.

Target:
<page/screen/flow>

Do not modify files.

Output:
- component candidates
- recommendation
- reasoning
- suggested ownership
- minimal refactor plan if extraction is justified
- files that would be affected
```

---

## 5. Refactor Page Object To Components

Используй, когда Page Object стал большим, а ownership уже понятен.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/refactor-page-object-to-components/SKILL.md

Task:
Refactor Page Object into justified Component Objects.

Target:
<page object path>

Allowed changes:
- target Page Object
- new Component Objects only if justified
- affected specs only if needed

Forbidden:
- no behavior changes
- no unrelated refactoring
- no component fixtures by default
- no expect in Page Objects or Components
- no test.step in Page Objects or Components
- no speculative methods

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

# Visual Testing

## 6. Add Visual Checkpoint Inside UI Scenario

Используй, когда нужен screenshot checkpoint внутри существующего UI-сценария.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/implement-visual-test/SKILL.md

Task:
Add visual checkpoint for <state> inside existing UI scenario.

Target:
<spec/test/state>

Allowed changes:
- existing UI spec
- Page Object locator exposure only if needed

Forbidden:
- no separate visual spec by default
- no full-page screenshot unless justified
- no waitForTimeout
- no Page Object visual assertions
- no Component visual assertions
- no behavior changes
- no snapshot update
- no unrelated files

Rules:
- functional assertion before screenshot
- use scoped stable screenshot target
- add @visual tag to tests with toHaveScreenshot
- visual checks are scenario checkpoints, not separate tests by default

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

## 7. Update Visual Baseline Explicitly

Используй только когда visual change ожидаемый и baseline нужно обновить.

```text
Use Playwright generator agent.

Task:
Update visual baseline for <spec/test>.

Allowed action:
- run visual test with --update-snapshots only for the affected spec/test

Forbidden:
- no code changes
- no unrelated snapshot updates
- no broad snapshot update
- no hiding unexpected diffs

Command:
npx playwright test <spec-path> --grep @visual --update-snapshots

After update:
- report updated snapshot files
- explain why baseline update is expected
```

---

# API Workflows

## 8. API Contract Discovery

Используй перед API implementation, если контракт нужно прочитать из Swagger/OpenAPI/docs.

```text
Use Playwright planner agent.

Use skill:
@.cursor/skills/implement-api-feature/SKILL.md

Contract source:
<swagger/openapi/docs url>

Task:
Discover API contract for <method endpoint>.

Do not modify files.

Output:
- method
- endpoint
- auth requirement
- required payload fields
- optional payload fields
- expected success response
- documented negative cases
- cleanup strategy
- builder needed: yes/no
- API client justified: yes/no
- blockers if contract is incomplete
```

---

## 9. API Implementation

Используй, когда API contract уже понятен.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/implement-api-feature/SKILL.md

Contract source:
<swagger/openapi/docs url>

Task:
Implement API test for <method endpoint>.

Allowed changes:
- API spec
- payload builder/generator only if reusable payload is needed
- thin API client only if justified
- schema only if response contract validation is required

Forbidden:
- no UI tests
- no Page Objects
- no Components
- no browser page usage
- no guessed contract fields
- no guessed status codes
- no hardcoded credentials
- no Allure in API clients
- no assertions inside API clients
- no unrelated files

Rules:
- one primary API action under test
- assertions stay in specs
- API clients stay thin
- specs may use shared Allure metadata helper
- if contract is incomplete, stop and report missing details

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

## 10. Create API Client

Используй только если raw requests начали дублироваться или endpoint group явно требует client.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/create-api-client/SKILL.md

Task:
Create or update thin API client for <endpoint group>.

Allowed changes:
- API client
- affected API spec imports only if needed

Forbidden:
- no assertions inside API client
- no Allure inside API client
- no login logic inside API client
- no business workflow inside API client
- no service hierarchy
- no unrelated files

Rules:
- client must be thin
- client composes requests and returns response/typed data
- specs own assertions and metadata

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

# Test Data / Fixtures

## 11. Create Test Data Builder

Используй, когда нужны reusable structured data или payload.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/create-test-data-builder/SKILL.md

Task:
Create reusable test data builder for <entity/payload/form>.

Allowed changes:
- data type
- builder
- generator only if unique primitive value is needed
- dataset only if stable reusable constants are needed

Forbidden:
- no inline random data in specs
- no builder just in case
- no domain-specific builder in framework core
- no API calls inside builder
- no UI actions inside builder
- no assertions inside builder
- no unrelated files

Rules:
- builder returns valid data by default
- builder supports Partial<T> overrides
- unique fields use generators

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

## 12. Create Fixture

Используй, когда нужна reusable dependency wiring, но не one-off value.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/create-fixture/SKILL.md

Task:
Create fixture for <purpose>.

Allowed changes:
- fixture files
- final fixture entry point only if needed
- affected specs only if needed

Forbidden:
- no fixture for one-off values
- no action under test inside fixture
- no business flow inside fixture
- no component fixtures by default
- no unrelated files

Rules:
- fixture must be thin
- fixture must belong to correct layer
- specs use final fixture entry point

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

# Healing / Review

## 13. Heal Failing UI Test

Используй, когда UI test упал.

```text
Use Playwright healer agent.

Use skill:
@.cursor/skills/heal-ui-test/SKILL.md

Failing test:
<spec path>

Failing output:
<paste output>

Task:
Find root cause and apply minimal fix at the correct layer.

Forbidden:
- no waitForTimeout
- no fake assertions
- no assertion weakening
- no expected behavior changes without requirement confirmation
- no hiding action under test in hooks or fixtures
- no unrelated files
- no broad refactor

Run commands one by one:
- npm run qa:gate
```

---

## 14. Review Generated Code Quality

Используй после генерации кода, когда “формально всё ок, но код выглядит грязно”.

```text
Use Playwright reviewer agent.

Use skill:
@.cursor/skills/review-generated-code-quality/SKILL.md

Task:
Review recently generated code.

Do not modify files.

Focus:
- duplication
- local helpers
- dirty workarounds
- unnecessary abstractions
- test data placement
- Allure usage
- visual checkpoints
- API client boundaries
- readability

Output:
- critical findings
- major findings
- minor findings
- positive observations
- recommended next step
```

---

## 15. Review UI Suite

Используй для audit UI test suite.

```text
Use Playwright reviewer agent.

Use skill:
@.cursor/skills/review-ui-suite/SKILL.md

Task:
Review UI suite quality and architecture.

Target:
<spec folder/files>

Do not modify files.

Focus:
- test.step usage
- hook safety
- assertion ownership
- fixture usage
- tags
- Page Object ownership
- Component Object justification
- locator strategy
- test data usage
- visual checkpoints
- Allure usage
- flakiness risks

Output findings by severity.
```

---

## 16. Review Framework Change

Используй для review changes в rules/skills/project map/config/fixtures/core.

```text
Use Playwright reviewer agent.

Use skill:
@.cursor/skills/review-framework-change/SKILL.md

Task:
Review framework/core/config/rules/skills/project map changes.

Do not modify files.

Focus:
- core/project boundary
- fixture layering
- config/secrets
- reporting boundaries
- API architecture
- visual testing boundaries
- project map consistency
- convention scripts

Output findings by severity.
```

---

# Project Map / Maintenance

## 17. Update Project Map

Используй, когда нужно обновить ручную секцию Project Map.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/update-project-map/SKILL.md

Task:
Update manual Project Map section: <section name>.

Target:
.cursor/rules/00-project-map.mdc

Allowed changes:
- only manual section <section name>

Forbidden:
- do not edit generated Repository Tree manually
- no unrelated sections
- no tests
- no source code changes

Run commands one by one:
- npm run project-map:update
- npm run qa:gate
```

---

## 18. Harden Rules From Failure

Используй, когда проблема повторяется и нужно закрепить её в rules/skills/scripts/project map.

```text
Use Playwright reviewer agent.

Use skill:
@.cursor/skills/harden-rules-from-failure/SKILL.md

Trigger:
<failure/review finding/repeated AI mistake>

Task:
Decide whether this needs hardening.

Do not modify files unless explicitly requested.

Output:
- one-off or recurring
- affected layer
- missing rule/skill/project map/script check if any
- recommended hardening action
- files that should be updated
```

---

## 19. Run Verification

Используй, когда нужно выбрать правильные проверки после changes.

```text
Use Playwright generator agent.

Use skill:
@.cursor/skills/run-verification/SKILL.md

Changed files:
<list files>

Task:
Choose and run appropriate verification.

Rules:
- use project map commands
- run targeted checks first
- then qa:gate
- do not invent commands

Output:
- commands run
- results
- not run reason if any
```

---

# Quick Decision Map

## Что выбрать

```text
Новая UI-фича
-> UI Plan
-> UI Implementation

Маленький UI тест
-> Add Small UI Test To Existing Area

Падает UI тест
-> Heal Failing UI Test

Нужен Component
-> Discover UI Components
-> Refactor Page Object To Components

Нужен screenshot
-> Visual Checkpoint

Нужен API тест
-> API Contract Discovery
-> API Implementation

Нужен API client
-> Create API Client

Нужны reusable data
-> Create Test Data Builder

Нужен fixture
-> Create Fixture

Код грязный
-> Review Generated Code Quality

Нужно обновить карту
-> Update Project Map

Повторяющаяся проблема
-> Harden Rules From Failure
```

---

# Final Rule

Не используй все skills сразу.

Одна задача = один основной skill.

Project Map говорит где.

Rules говорят что нельзя.

Skill говорит как.

Agent выполняет.

Scripts проверяют.

Используй этот файл, когда нужно быстро дать задачу агенту без длинных объяснений.

Главная идея:

- один prompt = одна задача;
- один основной skill = один workflow;
- Project Map всегда source of truth;
- Rules применяются всегда;
- после изменений запускать проверки.

---

## Общий шаблон prompt

```text
Use <agent>.

Use skill:
