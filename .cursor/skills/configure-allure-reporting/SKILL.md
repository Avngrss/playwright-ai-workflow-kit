---
description: Allure reporting usage rules
alwaysApply: true
---

# Allure Reporting Rules

## Purpose

These rules define how Allure reporting should be used in the Playwright + TypeScript test framework.

The goal is to keep reporting useful, structured, and separated from test logic.

---

## Core Principle

Allure is a reporting layer.

Allure must not become part of Page Object, Component Object, API client, builder, generator, or domain flow logic.

Tests and framework infrastructure may provide reporting metadata and diagnostic artifacts.

---

## Allowed Allure Usage

Allure may be used in:

- specs;
- test-level metadata helpers;
- reporting fixtures;
- diagnostic helpers;
- failure attachment utilities;
- CI/report generation scripts.

Allure may be used for:

- feature labels;
- story labels;
- suite labels;
- severity labels;
- owner labels;
- links to requirements or tickets;
- screenshots;
- traces;
- videos;
- API request/response diagnostics when safe;
- failure context.

---

## Not Allowed Allure Usage

Do not use Allure in:

- Page Objects;
- Component Objects;
- test data builders;
- generators;
- API clients;
- domain flows;
- low-level utilities without reporting responsibility.

Do not put Allure calls inside user actions.

Do not make test behavior depend on Allure.

Do not hide assertions inside Allure steps.

Do not use Allure as a replacement for `test.step`.

---

## Metadata Ownership

Test metadata belongs in specs or dedicated test metadata helpers.

Good metadata examples:

- feature;
- story;
- severity;
- owner;
- issue link;
- test case link.

Do not hardcode project-specific labels in framework core.

Project-specific labels belong to the project layer or project map.

## Default Metadata Policy

For newly created or updated UI/API specs, add Allure metadata by default through the shared helper:

- `src/test/reporting/allure-metadata.helper.ts`

Placement policy:

- use `beforeEach` for shared metadata across the suite (feature, suite, owner, layer, shared tags);
- use test-level metadata for scenario-specific values (story, severity, and optional case links).

Do not leave new planned feature tests without Allure metadata unless there is an explicit documented exception.

---

## Runtime API Import Policy

- `src/test/reporting/allure-metadata.helper.ts` uses `import * as allure from "allure-js-commons"`.
- Do not import `{ allure }` from `allure-playwright` in specs or helpers — deprecated.
- Specs call `applyAllureMetadata({ ... })` — no `testInfo` argument.
- `allure-playwright` is configured only as a reporter in `playwright.config.ts`.
- Allure 3 report layout: `reports/allure/allurerc.mjs` (`output`, `hideLabels`, `groupBy`).

---

### Metadata Placement

When adding Allure metadata to specs:

- keep concrete metadata values in the spec;
- use the shared Allure metadata helper;
- prefer a local common metadata const for repeated suite/feature/owner values;
- keep story, severity, tms, and issue close to the test they describe;
- use beforeEach for shared metadata only when it reduces repetition;
- do not create feature-specific metadata helpers unless repetition is significant.

Do not add Allure calls to:

- Page Objects;
- Components;
- API clients;
- builders;
- generators;
- domain flows.

---

## Allure Steps vs Playwright test.step

Use Playwright `test.step` as the primary step structure for UI tests.

Do not replace `test.step` with Allure steps.

If Allure step integration is used, it must mirror meaningful user-level steps and must not duplicate every low-level Playwright action.

---

## Attachments

Attachments should be useful for failure analysis.

Allowed attachments:

- screenshot;
- Playwright trace link or trace artifact;
- video;
- sanitized API request;
- sanitized API response;
- relevant logs;
- environment summary without secrets.

Do not attach:

- passwords;
- tokens;
- cookies;
- session storage with secrets;
- full local storage when it may contain sensitive data;
- personal data unless explicitly allowed;
- huge unrelated logs;
- raw secrets from environment variables.

---

## API Reporting

API tests may attach sanitized request and response diagnostics.

Do not attach:

- Authorization headers;
- tokens;
- cookies;
- passwords;
- secret keys;
- full sensitive payloads.

If request/response logging is added, sensitive fields must be masked.

---

## Failure Diagnostics

Allure attachments should help answer:

- what action was performed;
- what was expected;
- what actually happened;
- what page, endpoint, fixture, or data object was involved;
- which environment was used.

Do not attach noise just to make the report look rich.

---

## Core vs Project Boundary

Framework core may provide generic Allure integration mechanisms.

Allowed in core:

- generic reporter configuration;
- generic attachment helper;
- generic metadata helper interface;
- secret masking utility;
- report generation script.

Project layer owns:

- feature names;
- story names;
- owners;
- ticket links;
- requirement links;
- project-specific labels;
- domain-specific attachment content.

---

## Guardrails

Do not:

- call Allure from Page Objects or Components;
- call Allure from builders or generators;
- call Allure from API clients by default;
- attach secrets;
- attach tokens;
- attach passwords;
- duplicate every Playwright action as an Allure step;
- use Allure to hide assertions;
- make tests pass or fail based on reporting logic;
- put project-specific reporting metadata into framework core.

---

## Main Principle

Allure improves diagnostics and traceability.

It must not own test behavior.

It must not leak secrets.

It must not pollute Page Objects, Components, clients, or data layers.

---

## API Metadata Policy

Use the shared Allure metadata helper for both UI and API tests.

Current shared helper:

- `src/test/reporting/allure-metadata.helper.ts`
- `buildAllureSuitePath(rootSuite, ...segments)` for nested suite paths

Do not create a separate API metadata helper unless metadata behavior truly differs.

Do not create API diagnostics helpers until sanitized request/response attachments are required.

API specs own concrete metadata values.

API clients must not call Allure or reporting helpers.

Builders, generators, auth providers, and non-reporting fixtures must not call Allure.

Future optional helper (create during implementation when sanitized attachments are required):

- `src/test/reporting/allure-api-diagnostics.helper.ts`

---

## Artifact Cleanup Policy

Allure folders are runtime artifacts and must not accumulate across runs.

### Required behavior

- clear `reports/allure/results/` before Playwright test runs that write Allure output;
- clear `reports/allure/html/` before `allure generate`;
- use `scripts/clean-allure-artifacts.mjs` — do not leave manual cleanup to the user.

### npm scripts

- `report:allure:clean` — remove results and HTML;
- all Playwright `test*` execution scripts run `scripts/clean-allure-artifacts.mjs --results` first;
- `report:allure:generate` and `report:allure:serve` run `scripts/clean-allure-artifacts.mjs --html` before generation;
- `test:report` — tests plus fresh Allure serve;
- do not add separate npm scripts for `--results` or `--html` cleanup.

### Local workflow default

Prefer:

```bash
npm run test:report
```

Do not generate Allure HTML from stale accumulated results.

`allure generate` merges every file in `reports/allure/results/`; mixed old runs produce incorrect skipped/failed totals.

### Agent rule

When asked to run tests and open Allure, use project npm scripts that enforce cleanup.

Do not call raw `allure generate` unless cleanup is explicitly handled first.