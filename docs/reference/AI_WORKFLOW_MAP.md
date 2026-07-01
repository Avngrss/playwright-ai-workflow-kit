# AI Workflow Map

## Purpose

This document explains how to use project rules, skills, agents, commands, and the project map in day-to-day AI-assisted work with the **Playwright AI Workflow Kit**.

**Repository entry point:** [README](../../README.md)

**npm package name:** `playwright-ai-workflow-kit`

**GitHub repository:** https://github.com/Avngrss/playwright-ai-workflow-kit

**Detailed new-project onboarding:** [Start a New Project](../START_NEW_PROJECT.md)

The clean starter baseline has no `src/test/**` project implementation layer. Page Objects, fixtures, schemas, assertion helpers, builders, and reporting helpers are created per application through skills and commands when implementation starts.

The clean starter baseline also has **zero tests** — that is valid. Package test scripts use `--pass-with-no-tests` and succeed until real tests are added through `/plan-feature`, `/plan-e2e-journey`, and implementation commands.

```text
Project Map = source of truth for structure, commands, aliases, tags, environment ownership, app/service env names, fixture entry points, and file ownership

Rules = always-on architecture and quality guardrails

Skills = task-specific procedures

Commands = reusable task launchers

Agents = roles that use skills while following rules and the project map

Prompt = the current task ticket
```

### Short Version

- Use **Project Map** to decide where files live and which commands to run.
- Use **Rules** as permanent constraints for all work.
- Use **Skills** when solving a specific task.
- Use **Commands** to start repeatable workflows.
- Use **Agents** as roles: planner, generator, healer, reviewer.
- Keep prompts short.
- Put methodology into skills.
- Put permanent constraints into rules.
- Put project-specific conventions into the project map.

---

## Core Operating Principle

```text
What am I doing?
-> choose the right skill or command

Where should I do it?
-> follow the project map

What must I not violate?
-> rules always apply

What is the selected scope?
-> follow the feature plan or task boundary

What after changes?
-> run verification

What if tests fail?
-> heal root cause

What if the same issue repeats?
-> harden rules, skills, helpers, or project map only when the learning is reusable
```

---

## Rules vs Skills vs Commands

### Rules

Rules answer:

```text
What is allowed?
What is forbidden?
Where are the architecture boundaries?
```

Examples:

- Do not use `waitForTimeout`.
- Do not use fake assertions.
- Do not put project-specific logic into framework core.
- Do not create fixtures for one-off values.
- Do not create Component Objects just in case.
- Do not generate inline random data in specs.
- Do not put Playwright `expect` into Page Objects or Component Objects.
- Do not put schema assertions into API clients.
- Do not hide the action under test in fixtures or hooks.

Rules are always active guardrails.

---

### Skills

Skills answer:

```text
How do I perform this specific task correctly?
```

Examples:

- Plan Test Coverage.
- Plan From TMS.
- Align Feature Plan With TMS.
- Implement API Feature From Plan.
- Implement UI Feature From Plan.
- Plan E2E Journey.
- Implement E2E Flow From Journey Plan.
- Heal API Test.
- Heal UI Test.
- Create Test Data Builder.
- Discover UI Components.
- Create Fixture.
- Review Generated Code Quality.
- Audit Test Coverage.
- Audit Test Data Strategy.
- Audit Test Stability.

Skills are used only when their task matches the current work.

---

### Commands

Commands answer:

```text
How do I start a repeatable workflow quickly?
```

Examples:

- `/plan-feature`
- `/plan-from-tms`
- `/align-plan-with-tms`
- `/implement-api-batch`
- `/implement-ui-batch`
- `/plan-e2e-journey`
- `/implement-e2e-flow`
- `/review-generated`
- `/audit-test-coverage`
- `/audit-test-data-strategy`
- `/audit-test-stability`
- `/refactor-overengineering`
- `/heal-api-test`
- `/heal-ui-test`
- `/update-project-map`

Commands should be short.

Commands should not duplicate all rules or all skill logic.

---

## Agent Roles

### Planner

Use when the task needs coverage planning before implementation.

Planner should:

- understand the feature or flow;
- define source of truth;
- define in scope and out of scope;
- identify behaviors and risks;
- choose the correct primary test level;
- classify ready to implement now vs blocked/postponed;
- identify API negative and boundary decisions;
- identify UI unique user-facing value;
- create actionable API and UI implementation briefs;
- identify target UI app(s), API service(s), and precondition service(s) when more than one exists;
- note when a full journey may need a separate E2E journey plan in `specs/e2e/<journey>.md`;
- avoid implementation.

Planner must create or update the feature plan file when requested.

Planner must **not** add E2E scenarios to feature plans.

For feature plans, use Agent mode when the output must be saved to `specs/<feature>.md`.

Do not use Cursor Plan mode Build for planning-only tasks that must write a plan file.

---

### Generator

Use when implementing approved work.

Generator should:

- follow the selected skill;
- follow the feature plan;
- follow the project map;
- keep changes minimal;
- avoid speculative abstractions;
- preserve architecture boundaries;
- request discovery when ownership is unclear;
- implement only selected ready-now coverage;
- avoid broadening scope.

---

### Healer

Use when tests fail.

Healer should:

- inspect evidence;
- identify the failing point;
- capture actual request/status/body or UI evidence;
- classify root cause;
- fix at the correct layer;
- avoid masking failures;
- avoid weakening assertions;
- run targeted verification.

Use API healing for API failures.

Use UI healing for UI failures.

---

### Reviewer

Use when auditing quality or architecture.

Reviewer should:

- not modify code;
- classify findings by severity;
- explain why each issue matters;
- suggest minimal fixes;
- verify rule and project map compliance;
- check scope alignment;
- check test pyramid alignment;
- check Zod/schema ownership;
- check fixture and setup boundaries.

For plan-to-test alignment (missing ready coverage, unplanned tests, duplicate/wrong-layer coverage, TMS traceability gaps), use **Audit Test Coverage** instead of code-only review.

For flaky-pattern detection (forbidden waits, retry loops, weak assertions, hidden flows, debug artifacts, data instability), use **Audit Test Stability** before commit; use **Heal UI Test** when fixes are requested.

For test data safety (shared mutable data, missing cleanup/isolation, inline random data, builder/generator/fixture misuse, E2E data policy), use **Audit Test Data Strategy** before E2E implementation or destructive flows; use **Create Test Data Builder** or **Create Fixture** when implementation is requested after audit.

---

## Test Levels

Choose the lowest reliable level that proves the behavior.

Primary levels:

- **API** — backend contract, validation, auth, data predicates, negative and boundary behavior;
- **UI** — focused user-facing browser behavior, visible feedback, page/form/control interaction;
- **E2E** — critical full user or business journeys crossing multiple states, pages, or system boundaries; planned separately in `specs/e2e/<journey>.md`;
- **visual** — meaningful layout or appearance regression inside stable UI states;
- **schema/contract** — response or payload shape validation;
- **not automated** — manual, unstable, duplicate, or low-value automation.

Cross-browser and responsive coverage are focused additions for documented browser or viewport risks.

They are not a default browser/device matrix.

- default UI runs use the primary browser project from the project map;
- API and schema tests must not be duplicated per browser;
- responsive scenarios must define viewport, user value, and expected visible behavior;
- E2E cross-browser expansion belongs in `specs/e2e/<journey>.md`, not feature coverage plans.

Rule:

- `.cursor/rules/browser-and-responsive-testing.rules.mdc`

Tag and metadata policy:

- Playwright tags describe test intent; browser and viewport are execution environment;
- optional registered coverage-type tags: `@cross-browser`, `@responsive`;
- forbidden tag names: `@chromium`, `@firefox`, `@webkit`, `@mobile`, `@tablet`, `@desktop`;
- browser/viewport details belong to Playwright projects and Allure metadata, not Playwright tags;
- Allure metadata must not replace Playwright layer or execution tags.

Layer ownership:

- API owns backend contract, schema, negative, boundary, auth, filtering, sorting, and data predicate risks.
- UI owns distinct user-facing browser behavior on a page, form, control, or short flow.
- E2E owns critical full journeys that lower levels cannot prove safely alone; E2E is **not** part of feature coverage plans.
- Visual owns appearance risk only.
- Schema/contract supports API coverage; it does not replace behavior assertions.

Not every UI test is E2E.

Short page render checks, field visibility checks, one-form validation checks, and simple submit feedback checks remain UI coverage.

Feature plans use ready to implement now / blocked-postponed for API, UI, schema, visual, and not automated levels.

E2E journey plans use the same readiness classification for full-journey scenarios.

Do not use first batch / later batch terminology.

---

## Planning Layers

```text
specs/<feature>.md     = feature coverage (API, UI, schema, visual, not automated)
specs/e2e/<journey>.md = E2E journey plans (full user/business flows only)
```

Feature coverage plans do **not** include E2E.

E2E journey plans may reuse API/UI capabilities but must not duplicate their coverage.

---

## Main Workflow: New Feature

Use when adding coverage for a new feature, endpoint, page, or flow.

```text
Plan Feature Coverage
-> Review Feature Plan, if feature is broad, risky, or has API/UI overlap
-> Create or validate Test Data Builder, if needed
-> Implement selected API coverage marked ready to implement now, if present
-> Implement selected UI coverage marked ready to implement now, if present
-> Add visual checkpoints later, if planned and explicitly selected
-> Review Generated Code Quality
-> Refactor / Heal / Harden only if needed
```

For critical full journeys, plan separately:

```text
Run /plan-e2e-journey
-> Review E2E journey plan
-> Implement selected E2E coverage marked ready to implement now, if present
-> Review Generated Code Quality
-> Run Verification
```

### Practical Notes

- Planning comes before implementation.
- Do not implement API and UI in one agent run.
- Do not implement E2E together with API or UI in one agent run unless explicitly approved.
- Feature plans cover API, UI, schema, visual, and not automated only — not E2E.
- Use `ready to implement now / blocked-postponed`.
- Do not use first batch / later batch terminology.
- Do not create builders, clients, fixtures, schemas, components, or helpers speculatively.
- API should own backend contract, schema, negative, boundary, auth, filtering, sorting, and data predicate risks.
- UI should own distinct user-facing browser behavior.
- E2E should own critical full journeys with safe setup, data, cleanup, and meaningful final assertions.
- Visual should own visual layout risk only.
- If the plan is too vague, refine the relevant implementation brief before coding.

---

## TMS Planning Workflows

TMS integration is optional and provider-agnostic at the workflow kit level. Default mode is **read-only**.

**Qase** is a currently supported example provider via user/global Cursor MCP when configured (server name `qase`). Other TMS providers may be supported later through approved integration paths.

MCP ownership:

- project `.cursor/mcp.json` — `playwright` only (project-level; safe to commit)
- TMS credentials — user/global MCP settings, extension settings, or local secret storage (not in repository env files); never commit real TMS tokens

TMS cases are planning input and traceability — **do not assume 1 TMS case = 1 Playwright test**.

TMS Source and TMS Mapping belong in `specs/<feature>.md`.

TMS reporter/result publishing is separate and not configured. TMS writes require explicit user approval.

Never commit real TMS tokens into docs, rules, skills, commands, or specs.

### No existing feature plan (TMS-first)

```text
/plan-from-tms
-> review generated plan
-> implement selected ready API/UI coverage
```

Use when `specs/<feature>.md` does not exist and TMS cases are the main input.

Plan E2E journeys separately in `specs/e2e/` when a full cross-boundary flow is needed.

### Existing feature plan + TMS alignment

```text
/plan-feature (or plan already exists)
-> /align-plan-with-tms
-> review aligned plan
-> implement selected ready API/UI coverage
```

Use when a plan exists and must be aligned with TMS suite/cases.

### Normal planning (not TMS-first)

```text
/plan-feature
-> review plan (optional)
-> implement selected ready API/UI coverage
```

Do not implement directly from TMS cases. Do not implement blocked/postponed coverage without clarification. Do not add E2E to feature plans.

---

## Main Workflow: Existing Feature Plan

Use when a feature plan already exists.

```text
Implement selected API coverage marked ready to implement now
or
Implement selected UI coverage marked ready to implement now
-> Run Verification
-> Review Generated Code Quality
-> Audit Test Coverage (optional; plan vs implemented alignment)
-> Audit Test Data Strategy (optional; data/cleanup/isolation before destructive flows)
-> Audit Test Stability (optional; flaky patterns before commit)
-> Heal if failed
```

For E2E, use an E2E journey plan at `specs/e2e/<journey>.md` instead.

Do not redo heavy planning if the feature plan is already clear.

Do not implement blocked or postponed coverage.

Do not implement API and UI coverage together.

---

## Main Workflow: New API Coverage

Use when adding API endpoint or API behavior coverage from a plan.

```text
Implement API Feature From Plan
-> Create Test Data Builder, if reusable payload data is needed
-> Create API Client, only if endpoint reuse or request composition justifies it
-> Run Verification
-> Review Generated Code Quality
-> Heal API Test, if failed
```

API tests should own:

- request/response behavior;
- documented status behavior;
- response schema/shape;
- documented negative cases;
- documented boundary cases;
- auth and authorization contract;
- filtering, sorting, and data predicates;
- backend validation behavior.

API tests must not use:

- Page Objects;
- Component Objects;
- browser page interactions;
- UI selectors;
- UI fixtures as action layer.

### API Schema Validation

Use Zod for non-trivial, reused, nested, paginated, or contract-critical response shapes.

Use the shared Zod assertion helper for `safeParse` plus Playwright `expect`.

Keep behavior assertions separate from schema validation.

Do not put schema assertions into API clients.

Do not call raw `schema.parse()` in specs when a feature-specific assertion helper exists.

---

## Main Workflow: New UI Coverage

Use when adding UI automation from a feature plan.

```text
Implement UI Feature From Plan
-> Create Test Data Builder, if reusable structured data is needed
-> Discover UI Components, if ownership is unclear
-> Create Page Object, if a new route/screen is needed
-> Create Fixture, if reusable fixture wiring is needed
-> Run Verification
-> Review Generated Code Quality
-> Heal UI Test, if failed
```

UI tests should own:

- focused user-facing browser behavior;
- page, form, and control interaction;
- visible validation feedback;
- visible success or error states;
- navigation to a page or screen;
- frontend/backend integration visible on one page or short flow.

UI tests should not duplicate API/schema coverage without distinct visible UI value.

Short functional UI tests are not E2E.

Examples that remain UI coverage:

- forgot-password page render;
- empty forgot-password validation feedback;
- valid forgot-password submit confirmation;
- login invalid-credentials feedback;
- product sort dropdown visibility.

### UI Precondition Setup

When a UI or E2E test needs backend preconditions, prefer approved API precondition setup from the project fixture chain when available and reliable.

UI specs must not:

- read env variables directly;
- derive API host from UI host;
- validate full API contracts during setup;
- hide the UI action under test in fixture or hook.

Example pattern only:

```text
<approvedPreconditionFixture>.createRequiredState(...)
```

The same approved precondition pattern may be used in E2E when the plan documents setup only for backend state before the UI journey starts.

Environment ownership:

```text
Simple projects:
UI_BASE_URL = UI application for ui-chromium and e2e
API_BASE_URL = API project/tests
UI_PRECONDITION_API_BASE_URL = API backend for UI/E2E preconditions

Multi-target projects:
Register named targets in project map before use — examples:
CUSTOMER_UI_BASE_URL, ADMIN_UI_BASE_URL, AUTH_API_BASE_URL, ORDER_API_BASE_URL
```

Rule: `.cursor/rules/multi-target-environment.rules.mdc`

Rules:

- project map is the source of truth for app/service env names;
- plans must reference targets explicitly when more than one app or service exists;
- agents must not invent env variable names;
- specs must not read env variables directly;
- do not derive API host from UI host;
- do not use generic `API_BASE_URL` when the feature belongs to a specific service;
- implementation skills stop when target service is missing from the plan.

`UI_PRECONDITION_API_BASE_URL` is for UI backend preconditions only and must point to the same API backend used by the UI runtime when those preconditions are implemented, unless the plan documents a different precondition service explicitly.

---

## Main Workflow: New E2E Coverage

Use when adding full-journey E2E automation from an E2E journey plan.

```text
Run /plan-e2e-journey
-> Review journey plan
-> /implement-e2e-flow specs/e2e/<journey>.md
-> Review Generated Code Quality
-> Run impacted E2E spec and quality gate
-> Heal UI Test, if browser-side E2E test fails
```

E2E is **not** planned in `specs/<feature>.md`. Use a separate journey plan at `specs/e2e/<journey>.md`.

Planning separation:

- `specs/<feature>.md` — feature coverage for API, UI, schema, visual, and not automated scenarios;
- `specs/e2e/<journey>.md` — full user or business journey plans only.

Use E2E only when the scenario is a critical full user or business journey crossing multiple states, pages, or system boundaries and lower-level coverage cannot prove that journey safely.

Good E2E journey examples (illustrative only — not current repository contents):

- sign-up followed by login and authenticated account access;
- item selection followed by cart state and order completion;
- full password reset followed by login with a new password when safe setup and cleanup exist.

Do not use E2E for:

- page render checks;
- field visibility checks;
- one-form validation checks;
- simple submit feedback checks;
- isolated API contract tests;
- visual-only checks;
- behavior already covered by lower-level tests without additional journey value.

E2E location and tags:

- `tests/e2e/**/*.e2e.spec.ts`
- `@e2e` plus `@smoke` or `@regression`
- `@e2e` replaces `@ui` as the layer tag for full-journey E2E specs by default

Implement only E2E coverage marked ready to implement now.

Do not implement blocked or postponed E2E scenarios.

### API Usage In E2E

API setup in E2E is allowed only for:

- backend preconditions;
- cleanup;
- minimal setup-success verification.

API setup in E2E must not:

- replace the UI action under test;
- hide the full user journey in fixtures, hooks, Page Objects, helpers, or workflow wrappers;
- validate full API contracts;
- duplicate API schema, negative, or boundary coverage.

API contract, schema, negative, and boundary coverage belongs in API tests.

E2E setup should verify only minimal setup success.

Use disposable or isolated data.

Destructive flows require cleanup or safe isolation.

### E2E Blocked Or Postponed Conditions

Block or postpone E2E when:

- setup, data, cleanup, or isolation strategy is missing or unclear;
- destructive shared-state mutation cannot be cleaned up or isolated safely;
- mailbox, reset-link, reset-token, or payment access is missing;
- external dependency is unstable;
- no safe disposable data strategy exists;
- no Playwright runner matches `tests/e2e/**/*.e2e.spec.ts` yet and config update is not approved.

### Forgot Password Example

Feature plan (API + UI only):

- forgot-password page render;
- empty-email validation feedback;
- valid-email submit confirmation;
- API reset-request contract.

Full forgot-password reset plus login with a new password belongs in a separate E2E journey plan and requires:

- reset-link or reset-token retrieval;
- password reset;
- login with the new password;
- safe disposable user or cleanup/isolation strategy.

Full Forgot Password E2E remains blocked or postponed until required setup exists.

### Playwright Runner Note

Current browser projects in `playwright.config.ts`:

- `ui-chromium` — focused UI specs (`*.ui.spec.ts`); Desktop Chrome; default viewport `1280x720`
- `ui-firefox` — focused cross-browser UI coverage (`@cross-browser`)
- `ui-webkit` — focused cross-browser UI coverage (`@cross-browser`)
- `ui-mobile-chromium` — focused responsive UI coverage (`@responsive`)
- `api` — API specs; no browser
- `e2e` — E2E specs (`*.e2e.spec.ts`)

Broad browser/device matrix is **not** the default.

Full E2E cross-browser/mobile matrix remains future work unless documented in the project map.

If no runner matches the intended spec path or pattern, stop and report the config gap.

---

## Main Workflow: Visual Checkpoint

Use only when visual coverage is planned or explicitly requested.

```text
Implement Visual Checkpoint
-> Run targeted visual verification
-> Review Generated Code Quality
```

Visual checks should:

- have meaningful visual risk;
- be inside a stable UI flow;
- use functional assertions before screenshot assertion;
- use `@visual`;
- default to `@regression`;
- avoid baseline updates unless explicitly requested.

Visual checks should not replace functional assertions.

---

## Main Workflow: Failing API Test

Use when one or more API tests fail.

```text
Heal API Test
-> Run impacted API spec
-> Run related specs if shared code changed
-> Run quality gate
-> Harden Rules From Failure, only if recurring issue is found
```

API healer should:

- inspect failing endpoint/method;
- inspect request payload/query;
- inspect response status/body;
- classify root cause;
- distinguish data/setup/schema/assertion/product/environment failures;
- fix at the correct layer;
- avoid weakening assertions;
- avoid silently widening schemas;
- avoid changing expected status without contract evidence.

Examples of correct API healing:

- invalid builder default -> fix builder/generator;
- schema mismatch with contract -> fix schema;
- assertion bug -> fix assertion helper/spec;
- environment mismatch -> fix config/setup, not assertions.

---

## Main Workflow: Failing UI Test

Use when one or more UI tests fail.

```text
Heal UI Test
-> Run impacted UI spec
-> Run related specs if shared code changed
-> Run quality gate
-> Harden Rules From Failure, only if recurring issue is found
```

UI healer should:

- inspect failing step;
- inspect trace/screenshot/video if available;
- classify root cause;
- avoid `waitForTimeout`;
- avoid weakening assertions;
- avoid moving action under test into hooks or fixtures;
- fix at the correct layer.

Examples of correct UI healing:

- invalid default form data -> fix builder;
- wrong locator -> fix Page Object locator;
- changed product behavior -> confirm behavior before changing assertion;
- setup mismatch -> fix setup/config layer.

---

## Main Workflow: API / UI Environment Mismatch

Use when API-created data is not visible to UI, or UI-created data is not visible to API tests.

```text
Investigate API Environment Or Setup Mismatch
-> Fix config/setup only if confirmed
-> Run targeted verification
```

Check:

- API project base URL or named API service env from project map;
- UI base URL or named UI app env from project map;
- UI runtime API endpoint from browser network;
- UI precondition API base URL or named precondition service;
- whether API-created data is visible to UI runtime;
- whether UI-created data is visible to API runtime;
- whether the wrong generic env name was used instead of a service-specific target.

Do not derive API host from UI host.

Do not read env variables in specs.

Do not fix environment mismatch by weakening assertions.

---

## Main Workflow: Reusable Test Data

Use when reusable structured data is needed.

```text
Create Test Data Builder
```

If data must be exposed through fixtures:

```text
Create Fixture
```

Only expose data through fixtures when reuse is justified.

Builder defaults must be valid by default.

Invalid or negative data must be explicit through overrides.

Additional policy:

- do not call faker or random generators directly in specs;
- keep reusable generators in `src/test/data/generators/**`;
- keep reusable builders in `src/test/data/builders/**`;
- `@faker-js/faker` is optional and project-driven, not installed by default;
- add faker only when a real project needs it and keep generated values deterministic enough to debug.

Rule:

- `.cursor/rules/test-data-generation.rules.mdc`

---

## Main Workflow: New Fixture

Use when reusable dependency wiring or setup is needed.

```text
Create Fixture
```

The fixture must answer:

- What does it provide?
- Which layer owns it?
- Is reuse justified?
- Does it stay thin?
- Does it avoid hiding the action under test?
- Does it preserve the final fixture entry point?

Fixtures wire dependencies.

Fixtures do not hide scenarios.

---

## Main Workflow: Unclear Component Ownership

Use when it is unclear whether a UI block should stay in a Page Object or become a Component Object.

```text
Discover UI Components
```

Possible decisions:

- keep inside Page Object;
- extract Component Object now;
- reuse existing Component Object;
- postpone extraction;
- remove unnecessary abstraction.

If extraction is recommended:

```text
Refactor Page Object To Components
-> Run Verification
```

---

## Main Workflow: Large Page Object

Use when a Page Object has grown too large or mixes unrelated UI areas.

```text
Discover UI Components, if ownership is unclear
-> Refactor Page Object To Components
-> Run Verification
```

Do not use Simplify Overengineered Test Architecture for this case unless the goal is to remove unnecessary abstractions.

---

## Main Workflow: Overengineered Architecture

Use when tests pass, but architecture is too complex.

```text
Simplify Overengineered Test Architecture
-> Run Verification
-> Review Generated Code Quality
```

Examples:

- component for one button;
- helper for one trivial line;
- fixture for one-off value;
- domain flow for simple page action;
- API client for one one-off request;
- speculative methods for future tests;
- duplicated Zod `safeParse` wrapper;
- helper logic inside specs.

---

## Main Workflow: Generated Code Review

Use after AI generated or modified code.

```text
Review Generated Code Quality
```

Review should check:

- scope alignment;
- test pyramid;
- UI value;
- API positive/negative/boundary coverage;
- Zod/schema ownership;
- shared Zod helper usage;
- helper logic in specs;
- fixture/setup boundaries;
- Page Object/Component ownership;
- API client necessity;
- tags;
- reporting ownership;
- verification evidence.

This skill is review-only.

It must not modify files.

---

## Main Workflow: Starter Baseline Cleanup

Use when converting the repository into a reusable **Playwright AI Workflow Kit** baseline or cleaning project-specific artifacts from a copied template.

Rule:

- `.cursor/rules/framework-starter-boundary.rules.mdc`

Workflow:

```text
Audit first, delete later
-> inventory files
-> classify each file as keep / remove / generated / unsure
-> remove only clear project-specific artifacts
-> leave unsure files untouched until user decision
-> generalize preserved framework docs/config where needed
-> run verification
-> report removed, preserved, unsure, verification, and remaining risks
```

Protect during cleanup:

- `.cursor/rules/**`
- `.cursor/skills/**`
- `.cursor/commands/**`
- reusable `docs/**`
- reviewed package/config and generic scripts

Classify `.github/**` per file during audit; do not blindly keep or remove it.

Also see:

- `docs/reference/HOW_TO_USE_AI_AUTOMATION.md` — section 19a
- `docs/AI_SKILLS_COMMANDS_PLAYBOOK_FULL.md` — Starter Baseline Cleanup

---

## Main Workflow: Framework/Core Review

Use when reviewing framework, fixtures, config, auth, API infrastructure, rules, skills, commands, or project map changes.

```text
Review Framework Change
```

It checks:

- core/project boundary;
- fixture boundaries;
- public entry points;
- secrets/config safety;
- speculative abstractions;
- project map consistency;
- command/skill/rule consistency.

---

## Main Workflow: Project Structure Or Convention Changed

Use when repository conventions changed.

```text
Update Project Map
```

Examples:

- new folder convention;
- new alias;
- new tag;
- new fixture entry point;
- new quality gate command;
- new rule;
- new skill;
- new command;
- changed core/project structure;
- new env/config convention.

Project map must remain the source of truth.

Do not add broad repository tree sync noise to focused feature/refactor commits unless explicitly requested.

---

## Main Workflow: Recurring Failure Or Repeated AI Mistake

Use when a failure reveals reusable learning.

```text
Harden Rules From Failure
```

It decides whether to update:

- rule;
- skill;
- project map;
- helper;
- diagnostics;
- documentation.

Do not create new rules for one-off issues.

---

## Main Workflow: After Any Code Change

Use after implementation, healing, refactoring, or framework changes.

```text
Run Verification
```

Verification order:

1. impacted spec or targeted check (`npm run test:api`, `npm run test:ui`, `npm run test:e2e`, or tag scripts such as `npm run test:smoke`);
2. related specs if shared code changed;
3. typecheck/lint if applicable;
4. repository quality gate from project map (`npm run qa:gate`).

Baseline-safe package scripts:

- `npm test` — baseline run (`api`, `ui-chromium`, `e2e`)
- `npm run test:list` — discovery without execution
- `npm run test:api` / `test:ui` / `test:e2e` — layer scripts using registered projects only
- `npm run test:smoke` / `test:regression` — baseline tag runs on `api`, `ui-chromium`, `e2e`
- `npm run test:visual` — baseline tag run on `ui-chromium`
- `npm run test:cross-browser` — `@cross-browser` on `ui-chromium`, `ui-firefox`, `ui-webkit`
- `npm run test:responsive` — `@responsive` on `ui-mobile-chromium`

`npm test` is baseline scope only and does not run the full browser/mobile matrix. Tags describe test intent. Browser and viewport execution depends on Playwright projects in `playwright.config.ts`.

---

## Starter CI Baseline

Workflow:

- `.github/workflows/playwright.yml`

Behavior:

- enables npm dependency caching via `actions/setup-node` (`cache: npm`);
- always runs `npm ci`, `npm run qa:gate`, and `npm run test:list`;
- detects test files and skips matrix execution when no tests exist;
- runs matrix jobs only when tests exist;
- includes API/UI/E2E/tag-based jobs plus focused cross-browser/responsive jobs;
- uploads generated artifacts when present:
  - `playwright-report/`
  - `test-results/`;
- keeps TMS publishing out of scope by default;
- keeps GitHub Pages publishing out of scope by default.

This CI baseline complements local scripts and keeps the starter useful both before and after tests are added.

Reporting integration (including Allure reporter/metadata setup) is handled in a separate approved batch.

---

# Skill Selection Cheat Sheet

## New feature

Use:

```text
Plan Feature Coverage
```

Then use selected feature-level implementation skills:

```text
Implement API Feature From Plan
```

or

```text
Implement UI Feature From Plan
```

Optional:

```text
Create Test Data Builder
Create Fixture
Implement Visual Checkpoint
Review Generated Code Quality
```

---

## Existing feature plan

Use:

```text
Implement API Feature From Plan
```

or

```text
Implement UI Feature From Plan
```

Do not redo planning if the plan is clear.

For E2E, use a separate journey workflow:

```text
/plan-e2e-journey
-> /implement-e2e-flow specs/e2e/<journey>.md
```

---

## New E2E journey

Use:

```text
/plan-e2e-journey
```

Then:

```text
Review the journey plan at specs/e2e/<journey>.md
```

Then:

```text
/implement-e2e-flow specs/e2e/<journey>.md
```

Optional:

```text
Create Test Data Builder
Create Fixture
```

Do not use E2E for short UI functional tests.

Do not plan E2E in feature coverage plans.

---

## New API endpoint or behavior

Use:

```text
Implement API Feature From Plan
```

Optional:

```text
Create Test Data Builder
Create API Client
```

---

## New UI behavior

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
```

---

## Failing API test

Use:

```text
Heal API Test
Run Verification
```

Optional:

```text
Harden Rules From Failure
```

---

## Failing UI test

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

## New fixture

Use:

```text
Create Fixture
```

---

## UI API precondition setup

Use:

```text
Create Fixture
```

Then document in project map.

---

## New route or screen

Use:

```text
Create Page Object
```

---

## Unclear component ownership

Use:

```text
Discover UI Components
```

---

## Large Page Object

Use:

```text
Refactor Page Object To Components
```

Use discovery first if ownership is unclear.

---

## Too much abstraction

Use:

```text
Simplify Overengineered Test Architecture
```

---

## Reused API endpoint calls

Use:

```text
Create API Client
```

Only when reuse is justified.

---

## Generated code audit

Use:

```text
Review Generated Code Quality
```

---

## Coverage alignment audit

Use:

```text
Audit Test Coverage
```

Command:

```text
/audit-test-coverage
```

Use when comparing feature plans, E2E journey plans, implemented tests, and optional TMS mappings.

Audit only — does not implement tests, delete tests, update TMS, or publish results.

Use after planning/implementation batches or before cleanup or baseline conversion.

---

## Test data strategy audit

Use:

```text
Audit Test Data Strategy
```

Command:

```text
/audit-test-data-strategy
```

Use when auditing shared mutable data, isolation, cleanup policy, inline random data, builder/generator/fixture misuse, E2E data risks, and environment/service ownership for data setup.

Audit only — does not create or modify data, change tests, delete data, mutate environment, update TMS, or infer cleanup without evidence unless explicitly requested.

Use before E2E implementation, before destructive flows, and before cleanup or baseline conversion.

It complements `/audit-test-coverage` (coverage alignment) and `/review-generated` (code-quality review) by focusing specifically on data safety and ownership risks.

For implementation after audit, use Create Test Data Builder, Create Fixture, Plan E2E Journey, or heal skills as appropriate.

Rule references:

- `.cursor/rules/fixtures-data.mdc`
- `.cursor/rules/test-data-generation.rules.mdc`
- `.cursor/rules/test-isolation-state.rules.mdc`
- `.cursor/rules/multi-target-environment.rules.mdc`

---

## Stability audit

Use:

```text
Audit Test Stability
```

Command:

```text
/audit-test-stability
```

Use when auditing UI/E2E tests for flaky patterns, weak synchronization, hidden journeys, debug artifacts, and data or environment instability.

Audit only — does not heal tests, add waits, weaken assertions, install browsers, or run broad suites unless explicitly requested.

Use after UI/E2E implementation and before committing test changes.

For actual fixes, use `/heal-ui-test` or `/heal-api-test`.

Rule reference:

- `.cursor/rules/flakiness-policy.rules.mdc`

---

## Framework/core audit

Use:

```text
Review Framework Change
```

---

## Structure or convention changed

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

## After any change

Use:

```text
Run Verification
```

---

# When Not To Use All Skills

Do not use every skill for every task.

Choose the smallest skill that matches the current problem.

## Small locator fix

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

## API test status/body failure

Use:

```text
Heal API Test
```

Do not use:

```text
Implement API Feature From Plan
Refactor Overengineering
```

unless the root cause is implementation or architecture.

---

## One simple assertion added to existing test

Use relevant rules and run verification.

Do not create new Page Objects, Components, Fixtures, Builders, Schemas, or API Clients unless justified.

---

## Simple deterministic constant

Allowed directly in specs:

- `sortKey = "price,asc"`
- `expectedItemsCount = 10`
- `searchQuery = "laptop"`

Do not use Create Test Data Builder for simple test mechanics constants.

---

## Feature plan already clear

Use implementation skill directly.

Do not redo planning.

---

## Test passes but code is noisy

Use:

```text
Review Generated Code Quality
```

Then:

```text
Simplify Overengineered Test Architecture
```

only if review finds concrete issues.

---

# Final Rule Of Thumb

```text
Do not use all skills.
Use the smallest matching skill.
Rules always apply.
Project map always wins for structure, commands, tags, environment ownership, and fixture entry points.
Feature plan defines selected API/UI implementation scope.

E2E journey plan at `specs/e2e/<journey>.md` defines selected E2E implementation scope.
API owns backend contract and data predicates.
UI owns distinct user-facing browser behavior.
E2E owns critical full journeys with safe setup, data, cleanup, and meaningful final outcomes.
Verification follows every change.
Healing fixes root causes.
Hardening captures only reusable learning.
```

Keep this file visible when working with AI agents.

---

