# AI Agent Prompt Templates RU

## Назначение

Этот документ содержит готовые промпты для работы с AI-агентами в Playwright + TypeScript test automation framework.

Используй эти промпты, чтобы быстро выбрать правильный workflow, skill и ожидаемый формат результата.

---

## Global Prompt Prefix

Добавляй этот префикс в начало большинства задач.

```text
Ты работаешь в Playwright + TypeScript test automation framework.

Следуй project map как источнику истины по путям, командам, aliases, tags, fixture entry points и ownership.

Соблюдай все repository rules.

Используй самый маленький skill, который подходит под задачу.

Делай изменения минимальными и targeted.

Не создавай speculative abstractions.

Не меняй unrelated files.

Если информации недостаточно, не выдумывай architecture или behavior. Сообщи blocker и предложи самый безопасный следующий шаг.
```

---

# UI Feature Prompts

## Prompt: спланировать новую UI-фичу

```text
Use Playwright Planner.

Задача: создать или проверить test plan для UI-фичи: <feature name>.

Прочитай доступные requirements/specs и определи:

- feature scope;
- user scenarios;
- smoke vs regression candidates;
- required tags;
- required test data;
- affected pages/routes;
- possible components;
- assertions;
- risks;
- suggested implementation batches.

Код не реализовывать.

Верни clear feature test plan и recommended first batch.
```

### Пример

```text
Use Playwright Planner.

Задача: создать test plan для Catalog Sorting.

Нужно покрыть сортировку товаров по цене и названию.

Код не писать. Верни scenarios, tags, data needs, affected pages/components и first batch.
```

---

## Prompt: реализовать UI-фичу из плана

```text
Use Skill: Implement UI Feature From Plan.

Feature plan: <path or pasted plan>.

Реализуй только этот batch: <batch/scenarios>.

Следуй project map и всем UI architecture rules.

Перед написанием тестов:

- определи required data;
- переиспользуй existing builders/generators/datasets;
- обнови Page Objects минимально;
- создавай Component Objects только если justified;
- используй Discover UI Components, если ownership unclear.

Tests must:

- use meaningful test.step;
- keep the main action under test explicit;
- use final fixture entry point;
- use required tags;
- avoid inline random data;
- avoid raw selector mechanics in specs.

После implementation используй Run Verification.

Если тесты упали, используй Heal UI Test.
```

### Пример

```text
Use Skill: Implement UI Feature From Plan.

Feature plan: specs/catalog-sorting.md.

Реализуй только scenarios 1-3.

Если для сортировки нужен отдельный component, сначала используй Discover UI Components.
После изменений запусти impacted spec и qa gate из project map.
```

---

## Prompt: добавить UI-тест на существующую страницу

```text
Use Skill: Implement UI Feature From Plan, если это часть planned feature.

Если это маленькое targeted addition, следуй relevant rules и делай minimal diff.

Task: добавить UI test для <scenario> в <area/page>.

Проверь existing:

- specs;
- Page Objects;
- Component Objects;
- fixtures;
- builders/generators;
- tags.

Не создавай новые components, fixtures или builders без justification.

Запусти impacted spec и project quality gate из project map.
```

### Пример

```text
Добавь UI-тест для проверки empty state на CatalogPage.

Не создавай новые компоненты, если existing Page Object уже покрывает нужное поведение.
Запусти impacted spec.
```

---

# Healing Prompts

## Prompt: починить падающий UI-тест

```text
Use Skill: Heal UI Test.

Failing test output:
<insert output>

Investigate using:

- failing step;
- stack trace;
- trace/screenshot/video if available;
- affected spec;
- Page Object/Component;
- fixture/data setup.

Classify root cause:

- locator;
- timing/async update;
- navigation/setup;
- fixture;
- test data;
- assertion mismatch;
- environment/config;
- isolation/flakiness.

Apply the minimal fix at the correct layer.

Do not use waitForTimeout.
Do not weaken assertions.
Do not change expected behavior unless requirement is wrong.
Do not hide action under test in hooks or fixtures.

After fix, use Run Verification.
```

### Пример

```text
Use Skill: Heal UI Test.

Тест tests/ui/catalog/sorting.spec.ts падает на шаге Verify products are sorted by price.

Вот output:
<paste output>

Найди root cause и примени minimal fix.
Не используй waitForTimeout.
```

---

## Prompt: исследовать flaky UI-тест без фикса

```text
Use Heal UI Test in investigation mode only.

Do not modify files.

Analyze flaky test: <test/spec>.

Review:

- failure pattern;
- trace/screenshot/video;
- locator stability;
- setup and fixtures;
- data uniqueness;
- waits and assertions;
- test isolation;
- environment differences.

Output:

- suspected root cause;
- evidence;
- affected layer;
- minimal recommended fix;
- whether hardening is needed.
```

---

# Component and Page Object Prompts

## Prompt: понять, нужен ли Component Object

```text
Use Skill: Discover UI Components.

Target page/screen/flow: <target>.

Question: should <UI block> stay inside the Page Object or become a Component Object?

Do not modify files.

Review:

- specs;
- Page Objects;
- existing Component Objects;
- fixtures;
- project map;
- rules.

Use Playwright MCP only if repository files are not enough to understand UI structure.

Return:

- component candidates;
- recommendation for each;
- reasoning;
- suggested ownership;
- minimal refactor plan if extraction is justified;
- files that would be affected.
```

### Пример

```text
Use Skill: Discover UI Components.

Target: CatalogPage.
Question: should filter panel become FilterPanelComponent?

Do not modify files.
Return recommendation and minimal refactor plan only if extraction is justified.
```

---

## Prompt: разложить большой Page Object на Components

```text
Use Skill: Refactor Page Object To Components.

Target Page Object: <file/class>.

Reason: <why refactor is needed>.

If ownership is unclear, run Discover UI Components first.

Refactor only justified UI blocks into Component Objects.

Preserve behavior.
Do not add new feature coverage.
Do not add speculative methods.
Do not expose components as fixtures by default.
Do not rewrite unrelated tests.

After refactor, use Run Verification.
```

### Пример

```text
Use Skill: Refactor Page Object To Components.

Target Page Object: src/test/pages/products.page.ts.
Reason: ProductsPage contains sorting, filtering and product list logic.

Extract only justified components.
Keep specs accessing them through productsPage.
Run impacted specs.
```

---

## Prompt: создать Page Object

```text
Use Skill: Create Page Object.

Target route/screen: <route/screen>.

Confirm that this is a real page, screen, route, or navigation boundary.

Check existing Page Objects first.

Create minimal Page Object only if needed by current tests.

Do not create Page Object for a UI block inside an existing page.
Do not add business flows.
Do not add test data generation.
Do not add test.step.
Do not add speculative methods.

Add fixture exposure only if project map convention requires it.

Run impacted spec if usage is added.
```

### Пример

```text
Use Skill: Create Page Object.

Target route: /account.

Check existing pages first.
Create minimal AccountPage only for current tests.
Expose via pages fixture only if project map requires it.
```

---

# Test Data and Fixture Prompts

## Prompt: создать test data builder

```text
Use Skill: Create Test Data Builder.

Target data/entity/payload: <target>.

Use this only if reusable structured data is needed.

Identify:

- required fields;
- optional fields;
- unique fields;
- valid defaults;
- existing builders/generators/datasets.

Create or update:

- type;
- generator, only if unique/formatted primitive values are needed;
- builder.

Builder must return valid data by default and support Partial<T> overrides.

Do not generate inline random data in specs.
Do not add data fixture unless reuse justifies it.
Do not put domain-specific builders in framework core.
```

### Пример

```text
Use Skill: Create Test Data Builder.

Target: registration user form data.

Fields: firstName, lastName, email, password.
Email must be unique.

Create/update type, email generator and builder.
Do not expose through fixture unless reused across specs.
```

---

## Prompt: создать fixture

```text
Use Skill: Create Fixture.

Fixture need: <describe need>.

Before creating fixture, confirm:

- reuse is meaningful;
- fixture is thin;
- fixture belongs to correct layer;
- fixture does not hide action under test;
- fixture does not expose component by default;
- final fixture entry point remains the spec entry point.

Do not create fixtures for one-off values.
Do not put business flows inside fixtures.
Do not import intermediate fixture layers from specs.

Run impacted specs and quality gate from project map.
```

### Пример

```text
Use Skill: Create Fixture.

Need: expose AccountPage for multiple UI specs.

Check fixture layering from project map.
Add to pages fixture if justified.
Specs must still import from final fixture entry point.
```

---

# API Prompts

## Prompt: реализовать API feature

```text
Use Skill: Implement API Feature.

Endpoint: <method path>.

Identify:

- method;
- path parameters;
- query parameters;
- request body;
- auth requirements;
- expected status;
- essential response fields;
- negative cases, if applicable.

Use project-approved auth provider or authenticated API fixture.
Do not call login directly in tests.
Do not hardcode tokens or credentials.

Use request/response model only.
Do not use Page Objects or Components.

Use Create Test Data Builder if reusable payload data is needed.
Use Create API Client only if reuse or request composition justifies it.

Run impacted API spec and quality gate from project map.
```

### Пример

```text
Use Skill: Implement API Feature.

Endpoint: POST /users.
Auth required: yes.
Expected status: 201.
Essential fields: id, email, createdAt.

Use approved auth provider.
Use builder if payload is reusable.
```

---

## Prompt: создать API client

```text
Use Skill: Create API Client.

Endpoint group: <group/resource>.

Create a thin API client only if endpoint calls are reused or request composition is duplicated.

Check existing clients first.

Client may compose requests and return response or typed data.

Client must not:

- hide assertions;
- hide workflows;
- call login directly;
- hardcode tokens;
- duplicate auth logic;
- become a service hierarchy;
- live in framework core if endpoint-specific.

Run impacted API specs and quality gate.
```

### Пример

```text
Use Skill: Create API Client.

Endpoint group: users.
Endpoints POST /users and GET /users/{id} are reused across API specs.
Create thin UserClient if no existing client owns this group.
```

---

# Review Prompts

## Prompt: review UI suite

```text
Use Skill: Review UI Suite.

Review area: <spec folder/files>.

Review only.
Do not modify files.

Check:

- test.step usage;
- hook safety;
- assertion ownership;
- fixture usage;
- tags;
- duplicated navigation;
- Page Object ownership;
- Component Object justification;
- locator strategy;
- test data usage;
- overengineering;
- core/project boundary;
- isolation and flakiness risks.

Output findings by severity:

- critical;
- major;
- minor.

For each finding include:

- file;
- issue;
- why it matters;
- minimal suggested fix.

Clearly state if no issues are found.
```

### Пример

```text
Use Skill: Review UI Suite.

Review tests/ui/catalog and related pages/components.
Do not modify files.
Return critical/major/minor findings and positive observations.
```

---

## Prompt: review framework change

```text
Use Skill: Review Framework Change.

Review changes in: <files/branch/diff>.

Review only.
Do not modify files.

Check:

- core/project boundary;
- fixture layering;
- public entry points;
- config/secrets handling;
- auth architecture;
- API infrastructure;
- project map consistency;
- speculative abstractions;
- import conventions;
- verification evidence.

Output findings by severity with minimal suggested fixes.
```

### Пример

```text
Use Skill: Review Framework Change.

Review changes in framework-core/fixtures and project fixtures.
Do not modify files.
Focus on fixture boundaries, final entry point and hidden actions under test.
```

---

# Architecture Maintenance Prompts

## Prompt: упростить overengineered architecture

```text
Use Skill: Simplify Overengineered Test Architecture.

Target abstraction: <component/helper/fixture/flow/client>.

Tests currently pass.
Goal is to simplify architecture without changing behavior.

Check actual usage before removing anything.

Remove or inline only unjustified abstractions.

Preserve:

- test intent;
- assertions;
- tags;
- behavior;
- fixture contract;
- public behavior used by specs.

Do not broaden refactor scope.
Run verification after changes.
```

### Пример

```text
Use Skill: Simplify Overengineered Test Architecture.

Target abstraction: SubmitButtonComponent.
Tests pass.
Check usage and remove only if it adds no readability or reuse.
Preserve behavior and run verification.
```

---

## Prompt: обновить project map

```text
Use Skill: Update Project Map.

Change requiring project map update: <describe change>.

Update only relevant sections.

Check consistency with:

- actual files;
- path aliases;
- package scripts;
- fixture entry points;
- tags;
- rules;
- skills;
- quality gate command.

Do not document experimental structure as stable convention.
Do not duplicate existing entries.
```

### Пример

```text
Use Skill: Update Project Map.

Change: added new skill folder .cursor/skills/create-api-client.
Update only skills section.
Do not modify unrelated project map sections.
```

---

## Prompt: harden rules from failure

```text
Use Skill: Harden Rules From Failure.

Trigger: <failure/review finding/repeated AI mistake>.

Decide whether this is:

- one-off issue;
- recurring pattern;
- missing rule;
- unclear skill;
- missing project map entry;
- missing helper;
- diagnostics gap.

Do not add rules for one-off issues.
Prefer updating existing rules or skills over creating new ones.
Avoid duplicate or conflicting guidance.

Output hardening decision and minimal change.
```

### Пример

```text
Use Skill: Harden Rules From Failure.

Trigger: AI repeatedly creates component fixtures for simple components.
Check existing rules and skills first.
Update existing guidance only if needed.
```

---

# Verification Prompt

## Prompt: run verification

```text
Use Skill: Run Verification.

Changed files: <files>.

Identify affected layer:

- UI spec;
- API spec;
- Page Object;
- Component Object;
- fixture;
- builder;
- generator;
- API client;
- config;
- core;
- rule;
- skill;
- project map.

Choose verification in this order:

1. impacted spec or targeted check;
2. related specs if shared code changed;
3. typecheck or lint if applicable;
4. repository quality gate from project map.

Do not invent commands.
Report commands run and results.
If a check cannot be run, state why and what should be run.
```

### Пример

```text
Use Skill: Run Verification.

Changed files:
- src/test/pages/products.page.ts
- src/test/components/product-list.component.ts
- tests/ui/catalog/sorting.spec.ts

Run impacted spec first, then related specs if component is shared, then quality gate from project map.
```

---

# Universal Closing Instruction

Добавляй это в конец prompt, если хочешь строгий отчёт.

```text
В конце отчитайся:

- какой skill использовался;
- какие rules были самыми важными;
- какие files changed или reviewed;
- какая verification была запущена или не запущена;
- remaining risks;
- next recommended step.
```
