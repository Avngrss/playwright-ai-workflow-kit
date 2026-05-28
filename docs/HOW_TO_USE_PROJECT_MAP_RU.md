# Как использовать Project Map

## Назначение

`Project Map` — это источник истины для AI-агентов и разработчиков.

Он отвечает на вопросы:

- где создавать файлы;
- какие папки считаются core/framework layer;
- какие папки считаются project layer;
- откуда импортировать fixtures;
- где лежат Page Objects;
- где лежат Component Objects;
- где лежат builders, generators и datasets;
- где лежат API clients;
- какие path aliases разрешены;
- какие tags разрешены;
- какие команды запускать для проверки;
- где лежат rules и skills.

Главный файл:

- `.cursor/rules/00-project-map.mdc`

---

## Главное правило

Перед тем как создавать новый файл, папку, fixture, Page Object, Component Object, builder, generator, API client, tag или command — сначала смотри `Project Map`.

Если `Project Map` говорит одно, а generic rule показывает пример с другим путём — следуй `Project Map`, если это не нарушает core/project boundary.

---

## Что такое Project Map в этом проекте

В этом проекте `Project Map` — это не просто документация.

Это Cursor rule с `alwaysApply: true`.

Файл:

- `.cursor/rules/00-project-map.mdc`

Он содержит:

- правила использования project map;
- repository tree;
- ownership по слоям;
- locations для specs, fixtures, pages, components, data, api;
- aliases;
- tags;
- commands;
- locations для rules и skills.

---

## Как обновляется Repository Tree

Repository tree внутри `00-project-map.mdc` обновляется автоматически скриптом:

- `scripts/project-cartographer.mjs`

Команда:

- `npm run project-map:update`

Скрипт обновляет только секцию между markers:

- `PROJECT_MAP_START`
- `PROJECT_MAP_END`

Он не должен менять ручные секции project map.

---

## Когда запускать project-map:update

Запускай:

- после добавления новых папок;
- после добавления новых rules;
- после добавления новых skills;
- после изменения структуры fixtures;
- после изменения структуры pages/components;
- после добавления API client folders;
- после добавления test data folders;
- после переезда файлов;
- после удаления важных папок;
- перед review framework/core changes.

Команда:

- `npm run project-map:update`

---

## Что Project Cartographer НЕ делает

`project-cartographer.mjs` не принимает архитектурные решения.

Он не решает:

- где должен жить Page Object;
- нужен ли Component Object;
- core это или project layer;
- нужен ли fixture;
- нужен ли builder;
- нужен ли API client;
- какие tags разрешены.

Он только обновляет дерево файлов.

Архитектурные решения задаются:

- ручными секциями Project Map;
- rules;
- skills;
- review.

---

## Когда обновлять ручные секции Project Map

Ручные секции нужно обновлять, когда меняется convention.

Примеры:

- добавили новый alias;
- поменяли final fixture entry point;
- добавили новую категорию tags;
- поменяли quality gate command;
- изменили location для Page Objects;
- изменили location для Components;
- добавили новую API structure;
- добавили новую skill folder convention;
- изменили core/project boundary.

Для этого используй skill:

- `Update Project Map`

---

## Как пользоваться Project Map при создании файлов

### Новый UI spec

Перед созданием проверь в Project Map:

- где лежат UI specs;
- какой final fixture entry point использовать;
- какие tags обязательны;
- какая command для impacted UI spec;
- какие Page Objects уже существуют.

Нельзя:

- создавать spec в произвольной папке;
- импортировать `@playwright/test` напрямую, если project map требует final fixture entry point;
- добавлять ad-hoc tags.

---

### Новый Page Object

Перед созданием проверь:

- Page Object location;
- naming convention;
- есть ли уже owner для этой route/screen;
- нужно ли добавить fixture exposure;
- какие aliases использовать.

Нельзя:

- создавать Page Object для маленького UI блока;
- класть Page Object в framework core для конкретного проекта;
- добавлять `expect` в Page Object;
- добавлять business flow в Page Object.

---

### Новый Component Object

Перед созданием проверь:

- Component Object location;
- naming convention;
- owning Page Object;
- есть ли уже похожий component;
- justified ли extraction.

Если ownership неясен — используй skill:

- `Discover UI Components`

Нельзя:

- создавать component just in case;
- создавать component для одной кнопки;
- expose component as fixture by default;
- добавлять `expect` в component.

---

### Новый Fixture

Перед созданием проверь:

- fixture layering;
- где final fixture entry point;
- какой layer должен владеть fixture;
- reuse justification;
- не скрывает ли fixture action under test.

Используй skill:

- `Create Fixture`

Нельзя:

- создавать fixture для one-off value;
- импортировать intermediate fixture layers из specs;
- прятать business flow в fixture.

---

### Новый Builder или Generator

Перед созданием проверь:

- test data location;
- types location;
- builders location;
- generators location;
- datasets location;
- core/project boundary.

Используй skill:

- `Create Test Data Builder`

Нельзя:

- генерировать random data inline в specs;
- класть domain-specific builder в framework core;
- создавать builder just in case.

---

### Новый API Client

Перед созданием проверь:

- API client location;
- API specs location;
- auth provider entry point;
- existing clients;
- aliases;
- project layer ownership.

Используй skill:

- `Create API Client`

Нельзя:

- создавать client для one-off request;
- класть endpoint-specific client в framework core;
- прятать assertions внутри client;
- дублировать login/auth logic.

---

## Как пользоваться Project Map при запуске команд

Project Map должен определять команды:

- update project map;
- convention check;
- impacted UI spec;
- impacted API spec;
- typecheck;
- lint;
- quality gate.

Если команда неизвестна — не выдумывай.

Сначала проверь Project Map.

Если команды нет — используй skill:

- `Update Project Map`

или попроси уточнение.

---

## Базовые команды

Обновить project map:

- `npm run project-map:update`

Проверить conventions:

- `npm run conventions:check`

Запустить quality gate:

- `npm run qa:gate`

---

## Как Project Map связан со scripts

### project-cartographer.mjs

Файл:

- `scripts/project-cartographer.mjs`

Команда:

- `npm run project-map:update`

Назначение:

- обновляет repository tree в `00-project-map.mdc`;
- не меняет ручные секции;
- не принимает architecture decisions.

---

### check-conventions.mjs

Файл:

- `scripts/check-conventions.mjs`

Команда:

- `npm run conventions:check`

Назначение:

- проверяет базовые architecture conventions;
- ловит запрещённые паттерны;
- поддерживает strict assertion policy.

---

## Что делать после изменения структуры

Если ты добавил или удалил папки/files:

1. Запусти `npm run project-map:update`.
2. Проверь diff в `.cursor/rules/00-project-map.mdc`.
3. Если изменилась convention — обнови ручную секцию Project Map.
4. Запусти `npm run conventions:check`.
5. Запусти `npm run qa:gate`.

---

## Что делать если Project Map устарел

Если Project Map не соответствует реальной структуре:

1. Запусти `npm run project-map:update`.
2. Если tree обновился — проверь diff.
3. Если устарели manual sections — используй `Update Project Map` skill.
4. Не создавай новые файлы, пока source of truth не обновлён.

---

## Что делать если Project Map не содержит нужной информации

Если нужной информации нет:

1. Проверь существующую структуру проекта.
2. Проверь похожие файлы.
3. Проверь rules и skills.
4. Если convention очевидна — предложи smallest safe option.
5. Если convention неясна — попроси уточнение.
6. После принятия решения обнови Project Map.

---

## Мини-шпаргалка

- Нужно создать файл? Сначала Project Map.
- Нужно добавить папку? Сначала Project Map.
- Нужно добавить alias? Обнови Project Map.
- Нужно добавить tag? Обнови Project Map/tag registry.
- Нужно добавить fixture entry point? Обнови Project Map.
- Изменилась структура? Запусти `project-map:update`.
- После изменений? Запусти `conventions:check` и `qa:gate`.
- Агент не знает куда класть файл? Значит Project Map неполный.

---

## Главный принцип

Project Map предотвращает architecture guessing.

Если агент начинает гадать, значит нужно:

- проверить Project Map;
- обновить Project Map;
- или уточнить convention.

Не создавай структуру по догадке.
