# AI Daily Guide RU

## Назначение

Короткая ежедневная шпаргалка по работе с AI-assisted agent выбрать;Короткая ежедневная шпаргалка по работе с AI-assisted Playwright framework.
- какой skill использовать;
- какие ограничения помнить;
- какие команды запускать;
- что делать после генерации кода.

---

## Главная модель

- Project Map = источник истины по структуре, командам, aliases, tags и ownership.
- Rules = постоянные ограничения, которые применяются всегда.
- Skills = процедуры под конкретные задачи.
- Agents = исполнители: planner, generator, healer, reviewer.
- Scripts = автоматические проверки и обновление карты проекта.

---

## Базовый цикл работы

1. Определи задачу.
2. Выбери agent.
3. Выбери один основной skill.
4. Проверь Project Map.
5. Дай короткий prompt.
6. После изменений запусти проверки.
7. Если тест упал — используй healer.
8. Если проблема повторяется — обнови rule, skill или Project Map.

---

## Project Map

Главный файл:

- `.cursor/rules/00-project-map.mdc`

Project Map отвечает за:

- где лежат UI specs;
- где лежат API specs;
- где Page Objects;
- где Components;
- где fixtures;
- где builders/generators/datasets;
- где API clients;
- какие aliases разрешены;
- какие tags разрешены;
- какие команды запускать.

После изменения структуры запускай:

- `npm run project-map:update`

---

## Новая UI-фича

Используй:

- Playwright planner agent;
- затем Playwright generator agent;
- skill: `implement-ui-feature`.

Порядок:

1. Создать feature plan в `specs/<feature>.md`.
2. Реализовать только первый batch.
3. Создавать Page Object только если нужна новая page/screen abstraction.
4. Создавать Component только если reuse/complexity/ownership оправданы.
5. Создавать builder только если есть reusable structured data.
6. Visual checkpoints добавлять внутри UI-сценариев, не отдельным spec по умолчанию.
7. После изменений запускать проверки.

Команды:

- `npm run project-map:update`
- `npm run qa:gate`

---

## Новый API-тест

Используй:

- Playwright generator agent;
- skill: `implement-api-feature`.

Обязательно укажи contract source:

- Swagger/OpenAPI;
- API documentation;
- project schemas;
- explicit expected behavior в prompt.

Правила:

- не угадывать payload/status/response fields;
- если контракт неполный — остановиться и сообщить missing details;
- API tests не используют Page Objects и Components;
- API clients thin and optional;
- API clients не содержат assertions;
- API clients не используют Allure;
- payload builder нужен только для reusable structured payload.

---

## Падающий UI-тест

Используй:

- Playwright healer agent;
- skill: `heal-ui-test`.

Запрещено:

- `waitForTimeout`;
- fake assertions;
- ослаблять assertions;
- менять expected behavior без подтверждения;
- прятать action under test в hooks/fixtures;
- делать broad refactor.

Цель:

- найти root cause;
- исправить минимально;
- запустить verification.

---

## Review после генерации

Используй:

- `review-generated-code-quality`;
- `review-ui-suite`;
- `review-framework-change`.

Проверяй:

- дубли;
- лишние local helpers;
- грязные workaround-и;
- ненужные abstractions;
- неправильный layer ownership;
- Allure leakage;
- visual leakage;
- test data placement;
- readability.

---

## Allure

Используем общий helper:

- `src/test/reporting/allure-metadata.helper.ts`

Правила:

- specs задают concrete metadata values;
- helper применяет metadata;
- Page Objects не используют Allure;
- Components не используют Allure;
- API clients не используют Allure;
- builders/generators не используют Allure;
- attachments только sanitized.

---

## Visual Testing

Visual checks = checkpoints внутри UI-сценариев.

Хорошие checkpoint states:

- default state;
- filled form state;
- validation error state;
- success state;
- empty state;
- modal open state.

Правила:

- functional assertion сначала;
- screenshot потом;
- `@visual` обязателен;
- отдельный visual spec не создавать по умолчанию;
- `toHaveScreenshot` только в specs;
- Page Objects/Components не делают screenshots;
- baseline обновлять только явно.

---

## Test Assets

Upload/test files должны быть safe synthetic assets.

Запрещено использовать:

- `.env`;
- secrets;
- tokens;
- cookies;
- storage state;
- real personal data;
- project root files.

Разрешённая папка определяется в Project Map.

---

## Команды

Обновить карту:

- `npm run project-map:update`

Проверить conventions и quality gate:

- `npm run qa:gate`

Запустить конкретный UI spec:

- `npx playwright test <spec-path>`

Запустить API project:

- `npx playwright test --project=api`

Создать/обновить visual baseline только явно:

- `npx playwright test <spec-path> --grep @visual --update-snapshots`

---

## Главное правило

Не используй всё сразу.

Одна задача = один основной skill.

Project Map решает где.

Rules решают что нельзя.

Skill решает как.

Agent выполняет.

Scripts проверяют.

Используй этот файл, когда нужно быстро понять:

