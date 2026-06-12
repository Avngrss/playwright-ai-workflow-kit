# Как использовать AI Automation System

## Назначение

Этот файл — короткая ежедневная шпаргалка по использованию AI automation system в проекте.

Система состоит из:

- Project Map;
- Rules;
- Skills;
- Scripts;
- Prompts.

---

## 1. Project Map

Project Map — источник истины.

Главный файл:

- `.cursor/rules/00-project-map.mdc`

Используй его, чтобы понять:

- где создавать файлы;
- какой fixture entry point использовать;
- где лежат Page Objects;
- где лежат Component Objects;
- где лежат test data;
- какие aliases разрешены;
- какие tags разрешены;
- какие команды запускать.

Перед созданием файлов или папок сначала проверяй Project Map.

---

## 2. Rules

Rules — это постоянные guardrails.

Они задают, что разрешено и что запрещено.

Примеры:

- не использовать `waitForTimeout`;
- не использовать fake assertions;
- не класть project-specific logic во framework core;
- не создавать fixtures для one-off values;
- не использовать `expect` внутри Page Objects или Components;
- не генерировать random data inline в specs.

Rules не нужно запускать вручную.

Cursor и AI agents используют их как background constraints.

---

## 3. Skills

Skills — это процедуры под конкретные задачи.

Используй skill только когда задача подходит под него.

Примеры:

- новая UI-фича -> `Implement UI Feature From Plan`;
- падающий UI-тест -> `Heal UI Test`;
- reusable test data -> `Create Test Data Builder`;
- непонятно, нужен ли component -> `Discover UI Components`;
- новый fixture -> `Create Fixture`;
- новый API endpoint test -> `Implement API Feature`;
- framework review -> `Review Framework Change`;
- после изменений -> `Run Verification`.

Не используй все skills сразу.

Выбирай самый маленький skill, который решает текущую задачу.

---

## 4. Scripts

### Обновить Project Map

Команда:

- `npm run project-map:update`

Когда запускать:

- после изменения структуры проекта;
- после добавления папок;
- после добавления rules;
- после добавления skills;
- после изменения важных файлов.

Что делает:

- обновляет repository tree в `.cursor/rules/00-project-map.mdc`;
- обновляет только секцию между `PROJECT_MAP_START` и `PROJECT_MAP_END`;
- не принимает архитектурных решений.

---

### Проверить conventions

Команда:

- `npm run conventions:check`

Что проверяет:

- UI specs используют `test.step`;
- нет `waitForTimeout`;
- UI specs не импортируют `test` напрямую из `@playwright/test`;
- UI specs не создают Page Objects через `new SomePage()`;
- UI specs имеют `@ui` и `@smoke` или `@regression`;
- Page Objects и Components не используют `expect`;
- Page Objects и Components не используют `test.step`;
- Page Objects и Components не читают `process.env`;
- Page Objects и Components не генерируют random data inline.

---

### Quality Gate

Команда:

- `npm run qa:gate`

Когда запускать:

- перед завершением работы;
- после implementation;
- после healing;
- после refactoring;
- после framework/core changes.

Минимально запускает convention checks.

Позже может включать typecheck, lint и tests.

---

## 5. Основные сценарии

### Новая UI-фича

Порядок:

1. Playwright Planner создаёт или проверяет feature plan.
2. Используй `Implement UI Feature From Plan`.
3. Если нужны reusable data — `Create Test Data Builder`.
4. Если ownership component unclear — `Discover UI Components`.
5. Если нужна новая route/screen — `Create Page Object`.
6. Если нужен reusable fixture wiring — `Create Fixture`.
7. Запусти `npm run conventions:check`.
8. Запусти `npm run qa:gate`.
9. Если тесты упали — `Heal UI Test`.

---

### Падающий UI-тест

Порядок:

1. Используй `Heal UI Test`.
2. Найди root cause.
3. Исправь минимально в правильном layer.
4. Запусти impacted spec.
5. Запусти `npm run qa:gate`.
6. Если проблема повторяется — `Harden Rules From Failure`.

Нельзя чинить через:

- `waitForTimeout`;
- ослабление assertions;
- изменение expected behavior без подтверждения requirement;
- перенос action under test в hooks или fixtures.

---

### Непонятно, нужен ли Component Object

Порядок:

1. Используй `Discover UI Components`.
2. Не меняй файлы во время discovery.
3. Получи recommendation:
   - оставить в Page Object;
   - вынести Component Object;
   - переиспользовать existing Component Object;
   - postpone extraction;
   - удалить unnecessary abstraction.
4. Если extraction justified — используй `Refactor Page Object To Components`.
5. Запусти verification.

---

### Новый API-тест

Порядок:

1. Используй `Implement API Feature`.
2. Определи endpoint, method, auth, payload, expected status, essential response fields.
3. Если нужен reusable payload — `Create Test Data Builder`.
4. Если API calls reused — `Create API Client`.
5. Запусти impacted API spec.
6. Запусти `npm run qa:gate`.

API tests не должны использовать:

- Page Objects;
- Component Objects;
- UI fixtures;
- browser interactions.

---

## 6. Prompts

Готовые prompts лежат здесь:

- `.cursor/AI_AGENT_PROMPTS.md`
- `.cursor/AI_AGENT_PROMPTS_RU.md`

Workflow reference:

- `.cursor/AI_WORKFLOW_MAP.md`
- `.cursor/AI_WORKFLOW_MAP_RU.md`

Рекомендуемая структура prompt:

1. Добавь global prompt prefix.
2. Укажи skill.
3. Дай контекст задачи.
4. Дай файлы или failure output.
5. Попроси verification summary.

---

## 7. Мини-шпаргалка выбора skill

- Нужно добавить UI feature -> `Implement UI Feature From Plan`.
- UI test упал -> `Heal UI Test`.
- Нужны reusable data -> `Create Test Data Builder`.
- Нужен fixture -> `Create Fixture`.
- Нужна новая page abstraction -> `Create Page Object`.
- Неясно, нужен ли component -> `Discover UI Components`.
- Page Object слишком большой -> `Refactor Page Object To Components`.
- Архитектура переусложнена -> `Simplify Overengineered Test Architecture`.
- Нужен API test -> `Implement API Feature`.
- Нужен API client -> `Create API Client`.
- Нужен review -> `Review UI Suite` или `Review Framework Change`.
- Изменилась структура -> `Update Project Map`.
- Повторяющаяся проблема -> `Harden Rules From Failure`.
- Любое изменение кода -> `Run Verification`.

---

## 8. Финальный принцип

Не используй всё сразу.

Выбирай самый маленький подходящий skill.

Rules применяются всегда.

Project Map решает structure и commands.

Scripts enforce basic conventions.

Verification идёт после каждого изменения.
