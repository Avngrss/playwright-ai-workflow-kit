# Create Test Data Builder

Use this skill when reusable test data is needed for UI, API, setup, or domain entities.

The goal is to avoid inline random data, duplicated payloads, and ad-hoc object creation in specs.

---

## Related Rules

Follow these rules:

- Fixtures and Test Data rules
- Core / Project Boundary and Structure rules
- Project Map rules
- Configuration and Secrets rules
- Examples Policy

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- the same data shape is reused across multiple tests or specs;
- a form, entity, or API payload has multiple required fields;
- one or more fields must be unique;
- data must be valid by default;
- specs contain duplicated inline objects;
- specs contain inline random values such as `Date.now()` or `Math.random()`;
- API setup or UI form submission needs reusable structured data.

---

## When NOT To Use

Do not create a builder for:

- one-off values used by a single test;
- simple deterministic constants;
- fixed sort keys;
- sample sizes;
- trivial local values;
- abstractions created only "just in case".

Allowed directly in specs:

- `sortKey = "price,asc"`
- `expectedItemsCount = 10`
- `searchQuery = "laptop"`

These values are allowed because they are simple deterministic constants that describe test mechanics, not reusable business data.

---

## Workflow

### 1. Check Project Map

Find project-approved locations for:

- types;
- builders;
- generators;
- datasets;
- fixtures;
- final fixture entry point;
- path aliases.

Do not invent folders, aliases, or naming conventions.

---

### 2. Identify Data Shape

Identify all required fields for the target:

- UI form;
- API payload;
- setup entity;
- domain object.

Clarify:

- required fields;
- optional fields;
- default valid values;
- validation constraints;
- fields that depend on environment or role.

Expected output:

- required fields are known;
- optional fields are known;
- valid defaults are defined.

---

### 3. Identify Unique Fields

Identify fields that must be unique.

Common examples:

- `email`
- `username`
- `externalId`
- `slug`
- `phone`

Unique values must be generated through existing or new generator utilities.

Do not generate unique values inline in specs.

---

### 4. Create or Update Type

Create or update the type in the project-defined type location.

The type must describe the data consumed by the page, API client, setup helper, or domain flow.

Rules:

- keep the type focused;
- do not mix unrelated entities;
- do not add fields that are not currently needed;
- follow existing naming conventions;
- keep domain-specific types in the project layer.

Example pattern:

- type name: `RegistrationUser`
- fields: `firstName`, `lastName`, `email`, `password`

This is an illustrative pattern only.

Do not create this exact type unless it matches the project domain.

---

### 5. Create or Update Generator If Needed

Create or update a generator only when unique or formatted primitive values are needed.

Generators may create:

- unique email values;
- unique usernames;
- unique IDs;
- formatted dates;
- valid primitive values.

Generators must not:

- create full domain objects;
- perform API calls;
- perform UI actions;
- read `process.env` directly;
- contain assertions;
- know project business workflows.

Example patterns:

- `emailGenerator.unique()`
- `idGenerator.unique()`
- `dateGenerator.futureDate()`

These are illustrative names.

Use existing project generator conventions.

---

### 6. Create or Update Builder

Create or update the builder in the project-defined builder location.

Builder must:

- return valid data by default;
- support overrides with `Partial<T>`;
- use generators for unique fields;
- avoid UI actions;
- avoid API calls;
- avoid assertions;
- avoid direct environment access;
- avoid hidden setup;
- stay in the project layer when domain-specific.

Example pattern:

- builder name: `entityBuilder`
- method: `build(overrides: Partial<Entity> = {})`
- behavior: returns valid default object with overrides applied last

Do not copy the example names blindly.

Follow the project map and existing naming conventions.

---

## Fixture Integration

Do not expose every builder through fixtures by default.

Add builder or reusable generated data to the data fixture layer only when:

- it is reused across multiple tests or specs;
- fixture access improves consistency;
- it avoids repeated setup;
- it does not create fixture bloat;
- it does not hide the action under test.

Specs must use the final fixture entry point when fixtures are involved.

Do not import intermediate fixture layers directly from specs.

Good import style:

- `import { test, expect } from "@project/fixtures/test"`

Avoid:

- importing from `@playwright/test` directly in specs that require project fixtures;
- importing from `data.fixture`;
- importing from `base.fixture`;
- importing from intermediate fixture layers.

---

## Usage in Specs

Specs should use builders instead of inline reusable business data.

Good pattern:

- `const user = userBuilder.build({ role: "admin" })`

Bad patterns:

- inline object with `Date.now()`;
- inline object with `Math.random()`;
- repeated object literals across specs;
- manually duplicated required fields.

The spec should remain readable and should not own unique value generation logic.

---

## Core vs Project Boundary

Domain-specific builders belong to the project layer.

Examples of project-specific builders:

- `UserBuilder`
- `ProductBuilder`
- `OrderBuilder`
- `AddressBuilder`
- `PaymentBuilder`

Framework core may contain only domain-neutral mechanisms, such as:

- primitive generators;
- generic builder helper types;
- generic ID generation utilities;
- generic date helpers;
- generic string helpers.

Do not add project-specific builders, datasets, domain types, or payloads to framework core.

---

## Verification

After changes:

- run TypeScript check if available;
- run impacted spec or targeted test if builder usage was added to specs;
- run the repository quality gate command defined by the project map when applicable.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## Done Criteria

This skill is complete when:

- project map was followed;
- required fields are identified;
- unique fields use generator utilities;
- type is created or updated;
- builder is created or updated;
- builder returns valid data by default;
- builder supports `Partial<T>` overrides;
- no inline random data was added to specs;
- fixture integration was added only if justified;
- domain-specific code stayed in the project layer;
- usage in specs is straightforward;
- code compiles cleanly.

---

## Anti-Patterns

Avoid:

- inline `Date.now()` in specs;
- inline `Math.random()` in specs;
- duplicated payload objects across specs;
- builders that require all fields every time;
- builders that create invalid data by default;
- builders that perform UI actions;
- builders that perform API calls;
- builders that read `process.env` directly;
- builders that contain assertions;
- builders that hide setup;
- adding builders to framework core when they are domain-specific;
- adding fixtures for one-off data;
- creating builders just in case.

---

## Main Principle

Builders create valid reusable data.

Generators create unique primitive values.

Fixtures expose reusable data only when it improves consistency.

Specs should stay readable and free from ad-hoc random data.