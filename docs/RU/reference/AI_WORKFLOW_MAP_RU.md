# AI Workflow Map RU

## Назначение

Этот документ объясняет, как на практике использовать rules, skills, agents и project map в Playwright + TypeScript automation framework.

Держи этот файл перед глазами, когда работаешь с AI-агентами.

---

## Ментальная модель

```text
Project Map = источник истины по структуре, командам, aliases, тегам и ownership

Rules = постоянные архитектурные и quality guardrails

Skills = пошаговые процедуры под конкретную задачу

Agents = роли, которые используют skills и обязаны соблюдать rules и project map
```

### Короткая версия

- **Project Map** отвечает на вопрос: где что лежит и какие команды запускать.
- **Rules** отвечают на вопрос: что разрешено, что запрещено и где архитектурные границы.
- **Skills** отвечают на вопрос: как выполнить конкретную задачу.
- **Agents** — это роли: planner, generator, healer, reviewer.

---

## Главный принцип работы

```text
Что я делаю?
-> выбираю подходящий skill

Где это делать?
-> смотрю project map

Какие ограничения нельзя нарушать?
-> rules применяются всегда

Что после изменений?
-> запускаю verification

Что если тесты упали?
-> лечу root cause через healer

Что если проблема повторяется?
-> harden rules, skills, helpers или project map
```

---

## Rules vs Skills

### Rules

Rules — это законы проекта.

Они отвечают на вопросы:

```text
Что можно?
Что нельзя?
Где архитектурные границы?
```

Примеры rules:

- Не использовать `waitForTimeout`.
- Не использовать fake assertions.
- Не класть project-specific logic во framework core.
- Не создавать fixtures для one-off values.
- Не создавать Component Objects just in case.
- Не генерировать random data inline в specs.

Rules работают как постоянные ограничения.

---

### Skills

Skills — это процедуры.

Они отвечают на вопрос:

```text
Как правильно выполнить конкретную задачу?
```

Примеры skills:

- Implement UI Feature From Plan.
- Heal UI Test.
- Create Test Data Builder.
- Discover UI Components.
- Create Fixture.
- Review UI Suite.

Skills используются только когда задача действительно подходит под skill.

---

## Роли агентов

### Planner

Используется, когда нужно сначала спланировать работу.

Planner должен:

- понять feature или failure context;
- определить scenarios;
- выбрать batch scope;
- определить affected layers;
- понять, какие skills могут понадобиться;
- не начинать implementation, пока план неясен.

---

### Generator

Используется, когда надо реализовать утверждённую работу.

Generator должен:

- следовать выбранному skill;
- следовать project map;
- делать минимальные изменения;
- не создавать speculative abstractions;
- сохранять architecture boundaries;
- вызывать discovery, если ownership неясен.

---

### Healer

Используется, когда тесты упали.

Healer должен:

- изучить evidence;
- классифицировать root cause;
- чинить в правильном layer;
- не маскировать failures;
- запускать targeted verification.

---

### Reviewer

Используется для audit/review.

Reviewer должен:

- не менять код;
- классифицировать findings по severity;
- объяснять, почему issue важен;
- предлагать минимальный fix;
- проверять соответствие rules и project map.

---

# Основные workflow

## Workflow: новая UI-фича

Используй, когда нужно добавить UI automation для новой фичи или набора scenarios.

```text
Playwright Planner
-> Implement UI Feature From Plan
   -> Create Test Data Builder, если нужны reusable data
   -> Discover UI Components, если ownership неясен
   -> Create Page Object, если нужна новая route/screen abstraction
   -> Create Fixture, если нужен reusable fixture wiring
-> Run Verification
-> Heal UI Test, если тесты упали
-> Harden Rules From Failure, если найдена повторяемая проблема
```

### Пример использования

Задача:

```text
Добавить UI-тесты для сортировки товаров по цене.
```

Правильный путь:

```text
1. Planner определяет scenarios:
   - sort by price asc;
   - sort by price desc;
   - verify sorted order.

2. Generator использует Implement UI Feature From Plan.

3. Если данных недостаточно:
   - Create Test Data Builder.

4. Если непонятно, sorting — это часть Page Object или Component:
   - Discover UI Components.

5. После реализации:
   - Run Verification.

6. Если тест упал:
   - Heal UI Test.
```

---

## Workflow: есть готовый feature plan

Используй, когда план уже есть.

```text
Implement UI Feature From Plan
-> Create Test Data Builder, если нужно
-> Discover UI Components, если ownership неясен
-> Create Page Object, если нужна новая route/screen
-> Create Fixture, если нужно
-> Run Verification
-> Heal UI Test, если упало
```

### Пример использования

Задача:

```text
Есть specs/catalog-sorting.md. Реализуй первые 3 scenarios.
```

Правильный prompt:

```text
Use Skill: Implement UI Feature From Plan.
Feature plan: specs/catalog-sorting.md.
Implement only scenarios 1-3.
Follow project map and rules.
Run verification after changes.
```

---

## Workflow: падает UI-тест

Используй, когда один или несколько UI tests fail.

```text
Heal UI Test
-> Run Verification
-> Harden Rules From Failure, только если проблема повторяемая
```

### Пример использования

Задача:

```text
Тест catalog sorting падает на шаге Verify products are sorted by price.
```

Правильный путь:

```text
1. Heal UI Test анализирует failing step, trace, screenshot, locator, data.
2. Классифицирует root cause:
   - locator;
   - timing;
   - data;
   - assertion;
   - environment.
3. Применяет minimal fix в правильном layer.
4. Run Verification запускает impacted spec и qa gate.
```

Не делать:

- не добавлять `waitForTimeout`;
- не ослаблять assertion;
- не менять expected behavior без requirement confirmation.

---

## Workflow: непонятно, нужен ли Component Object

Используй, когда неясно, UI block должен остаться в Page Object или стать Component Object.

```text
Discover UI Components
```

Возможные решения:

- keep inside Page Object;
- extract Component Object now;
- reuse existing Component Object;
- postpone extraction;
- remove unnecessary abstraction.

Если extraction justified:

```text
Refactor Page Object To Components
-> Run Verification
```

### Пример использования

Задача:

```text
У нас есть filtering panel на catalog page. Нужно понять, выносить ли в FilterPanelComponent.
```

Правильный путь:

```text
1. Discover UI Components проверяет:
   - есть ли reuse;
   - есть ли multiple locators/actions;
   - есть ли semantic boundary;
   - есть ли stable root locator;
   - растёт ли Page Object.

2. Если да:
   - Refactor Page Object To Components.

3. Если нет:
   - оставить в Page Object.
```

---

## Workflow: Page Object стал большим

Используй, когда Page Object вырос и смешивает unrelated UI areas.

```text
Discover UI Components, если ownership неясен
-> Refactor Page Object To Components
-> Run Verification
```

### Пример использования

Задача:

```text
ProductsPage содержит sorting, filtering, product list, pagination, modal logic.
```

Правильный путь:

```text
1. Discover UI Components определяет meaningful UI blocks.
2. Refactor Page Object To Components выносит justified blocks.
3. Specs продолжают обращаться через ProductsPage.
4. Run Verification проверяет impacted specs.
```

---

## Workflow: архитектура переусложнена

Используй, когда тесты проходят, но архитектура стала слишком сложной.

```text
Simplify Overengineered Test Architecture
-> Run Verification
```

### Примеры overengineering

- Component для одной кнопки.
- Helper на одну строку.
- Fixture для one-off value.
- Domain flow для простого page action.
- API client для одного one-off request.
- Speculative methods для будущих тестов.

### Пример использования

Задача:

```text
Есть SubmitButtonComponent, который используется один раз и только вызывает click.
```

Правильный путь:

```text
1. Simplify Overengineered Test Architecture проверяет usage.
2. Если abstraction не оправдана, удаляет её минимальным diff.
3. Поведение теста не меняется.
4. Run Verification.
```

---

## Workflow: нужны reusable test data

Используй, когда нужны структурированные reusable данные.

```text
Create Test Data Builder
```

Если данные надо отдавать через fixture:

```text
Create Fixture
```

Только если reuse оправдан.

### Пример использования

Задача:

```text
Для регистрации пользователя нужны firstName, lastName, email, password.
Email должен быть уникальным.
```

Правильный путь:

```text
1. Create Test Data Builder определяет required fields.
2. Создаёт/обновляет type.
3. Создаёт/обновляет email generator.
4. Создаёт builder с valid defaults и Partial<T> overrides.
5. Не генерирует Date.now() прямо в spec.
```

---

## Workflow: нужен новый fixture

Используй, когда нужен reusable dependency wiring или setup.

```text
Create Fixture
```

Fixture должен ответить:

- Что предоставляет fixture?
- Какой layer владеет fixture?
- Есть ли reuse?
- Fixture thin?
- Не скрывает ли action under test?
- Сохранён ли final fixture entry point?

### Пример использования

Задача:

```text
Несколько specs вручную создают ProductsPage.
```

Правильный путь:

```text
1. Create Fixture проверяет project fixture layering.
2. Добавляет productsPage в pages.fixture, если это соответствует project map.
3. Specs импортируют test только из final fixture entry point.
```

---

## Workflow: новый API-тест

Используй, когда добавляется API endpoint coverage.

```text
Implement API Feature
-> Create Test Data Builder, если нужен reusable payload
-> Create API Client, если reuse/request composition оправданы
-> Run Verification
```

API tests должны быть request/response based.

Не использовать:

- Page Objects;
- Component Objects;
- UI fixtures;
- browser interactions;
- UI selectors.

### Пример использования

Задача:

```text
Добавить API-тест для POST /users.
```

Правильный путь:

```text
1. Implement API Feature определяет method, endpoint, payload, auth, expected status.
2. Если payload reusable — Create Test Data Builder.
3. Если endpoint будет reused — Create API Client.
4. Тест валидирует status и essential response fields.
5. Run Verification.
```

---

## Workflow: нужен API client

Используй, когда raw API requests дублируются или grouping улучшает clarity.

```text
Create API Client
```

API client должен быть:

- thin;
- optional;
- project-layer when endpoint-specific;
- без scenario assertions;
- без hidden workflows;
- без duplicated login logic.

### Пример использования

Задача:

```text
GET /users/{id} и POST /users используются в нескольких specs.
```

Правильный путь:

```text
1. Create API Client проверяет existing clients.
2. Создаёт/обновляет thin UserClient.
3. Auth идёт через approved auth provider/fixture.
4. Client возвращает response или typed data.
5. Assertions остаются в tests или dedicated assertion helpers.
```

---

## Workflow: review UI suite

Используй для audit UI test quality и architecture.

```text
Review UI Suite
```

Skill ничего не меняет.

Он выдаёт:

- critical findings;
- major findings;
- minor findings;
- positive observations;
- minimal suggested fixes.

### Пример использования

Задача:

```text
Проверь tests/ui/catalog на качество архитектуры.
```

Правильный prompt:

```text
Use Skill: Review UI Suite.
Review tests/ui/catalog.
Do not modify files.
Return findings by severity with minimal suggested fixes.
```

---

## Workflow: review framework/core change

Используй, когда review касается framework, fixtures, config, auth, API infrastructure, rules, skills, project map.

```text
Review Framework Change
```

Проверяет:

- core/project boundary;
- fixture boundaries;
- public entry points;
- secrets/config safety;
- speculative abstractions;
- project map consistency.

### Пример использования

Задача:

```text
Проверь изменения в fixtures и auth provider.
```

Правильный prompt:

```text
Use Skill: Review Framework Change.
Review changed fixture and auth files.
Do not modify files.
Focus on core/project boundary, fixture layering, auth duplication, secrets, and public entry points.
```

---

## Workflow: изменилась структура проекта

Используй, когда меняется repository convention.

```text
Update Project Map
```

Примеры:

- новый folder convention;
- новый alias;
- новый tag;
- новый fixture entry point;
- новая quality gate command;
- новый rule;
- новый skill;
- изменён core/project structure.

### Пример использования

Задача:

```text
Добавили новый alias @project/test-data.
```

Правильный путь:

```text
1. Update Project Map обновляет aliases section.
2. Проверяет tsconfig/package consistency.
3. Не меняет unrelated sections.
```

---

## Workflow: повторяющаяся ошибка или repeated AI mistake

Используй, когда failure выявил reusable learning.

```text
Harden Rules From Failure
```

Он решает, обновлять ли:

- rule;
- skill;
- project map;
- helper;
- diagnostics;
- documentation.

Не создавать rules для one-off issues.

### Пример использования

Задача:

```text
AI уже третий раз добавляет waitForTimeout при flaky UI test.
```

Правильный путь:

```text
1. Harden Rules From Failure проверяет existing rules.
2. Если rule уже есть — возможно обновить skill Heal UI Test или prompt.
3. Не создавать duplicate rule.
```

---

## Workflow: после любых изменений

Используй после implementation, healing, refactoring или framework changes.

```text
Run Verification
```

Verification order:

1. impacted spec или targeted check;
2. related specs if shared code changed;
3. typecheck/lint if applicable;
4. repository quality gate from project map.

### Пример использования

Задача:

```text
Изменили ProductListComponent и sorting.spec.ts.
```

Правильный путь:

```text
1. Run impacted sorting spec.
2. Run related catalog specs if ProductListComponent shared.
3. Run quality gate from project map.
```

---

# Skill Selection Cheat Sheet

## Новая UI-фича

Use:

```text
Implement UI Feature From Plan
```

Optional:

```text
Create Test Data Builder
Discover UI Components
Create Page Object
Create Fixture
Run Verification
Heal UI Test
```

---

## Падающий UI-тест

Use:

```text
Heal UI Test
Run Verification
```

Optional:

```text
Harden Rules From Failure
```

---

## Reusable test data

Use:

```text
Create Test Data Builder
```

---

## Новый fixture

Use:

```text
Create Fixture
```

---

## Новая route/screen

Use:

```text
Create Page Object
```

---

## Непонятно, нужен ли component

Use:

```text
Discover UI Components
```

---

## Большой Page Object

Use:

```text
Refactor Page Object To Components
```

Сначала discovery, если ownership unclear.

---

## Слишком много abstraction

Use:

```text
Simplify Overengineered Test Architecture
```

---

## Новый API endpoint test

Use:

```text
Implement API Feature
```

---

## Reused API endpoint calls

Use:

```text
Create API Client
```

---

## UI suite audit

Use:

```text
Review UI Suite
```

---

## Framework/core audit

Use:

```text
Review Framework Change
```

---

## Structure/convention changed

Use:

```text
Update Project Map
```

---

## Recurring failure pattern

Use:

```text
Harden Rules From Failure
```

---

## После любых изменений

Use:

```text
Run Verification
```

---

# Когда НЕ нужно использовать все skills

Не запускай все skills на каждую задачу.

Выбирай самый маленький skill, который соответствует проблеме.

## Маленький locator fix

Use:

```text
Heal UI Test
```

Do not use:

```text
Implement UI Feature From Plan
Discover UI Components
Create Page Object
```

---

## Один новый assertion в существующем тесте

Используй relevant rules и Run Verification.

Не создавай новые Page Objects, Components, Fixtures или Builders без justification.

---

## Простая deterministic constant

Allowed directly in specs:

- `sortKey = "price,asc"`
- `expectedItemsCount = 10`
- `searchQuery = "laptop"`

Не используй Create Test Data Builder для простых test mechanics constants.

---

# Финальное правило

```text
Не используй все skills.
Используй самый маленький подходящий skill.
Rules применяются всегда.
Project map всегда главный для structure и commands.
После изменений всегда verification.
Healing чинит root cause.
Hardening фиксирует только reusable learning.
```
