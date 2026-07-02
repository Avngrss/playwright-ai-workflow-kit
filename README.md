# Playwright AI Workflow Kit

npm package: `playwright-ai-workflow-kit`

GitHub repository: https://github.com/Avngrss/playwright-ai-workflow-kit

A reusable **AI-assisted workflow kit** and starter foundation for **Playwright + TypeScript** automation projects.

It provides rules, skills, commands, docs, conventions, and baseline scripts that guide planning, implementation, review, and audit work for **API**, **UI**, **E2E**, **visual**, **TMS-assisted planning**, **cross-browser**, and **responsive** testing workflows.

The clean starter baseline ships **zero tests** and **no `src/test/**` implementation layer**. That is valid. Project-specific code is created when you start work on a concrete application.

You can copy or clone this repository as a **template for new automation projects**. For step-by-step onboarding, see [Start a New Project](docs/START_NEW_PROJECT.md).

---

## What This Workflow Kit Includes

- Playwright + TypeScript starter configuration
- AI rules, skills, and slash commands under `.cursor/`
- Feature coverage planning (`specs/<feature>.md`)
- E2E journey planning (`specs/e2e/<journey>.md`)
- TMS planning and alignment support
- Provider-agnostic TMS model — **Qase** is an example supported provider only
- Cross-browser and responsive testing policies
- Visual testing policy
- Baseline-safe package scripts (`--pass-with-no-tests`)
- Starter-safe GitHub Actions CI with Playwright artifacts
- Provider-agnostic `.env.example`
- Multi-application / multi-service environment support

---

## What Is Intentionally Not Included

- Project-specific tests
- Project-specific feature or E2E plans
- `src/test/**` implementation layer (Page Objects, fixtures, schemas, assertion helpers, builders)
- `src/test/data/**` project data layer (builders, generators, datasets)
- Real URLs or production credentials
- TMS result publishing or GitHub Pages report publishing
- Browser or mobile execution matrix by default
- Data-generation libraries by default (`@faker-js/faker` is optional and project-driven)

These are added per application through planning and implementation workflows.

---

## Quick Start

**Daily cheat sheet:** [Quick Reference](docs/QUICK_REFERENCE.md)

```bash
npm install
```

Copy the environment template when your project needs runtime URLs:

```bash
cp .env.example .env
```

Fill placeholders as needed:

- **Simple projects:** `UI_BASE_URL`, `API_BASE_URL`
- **UI preconditions:** `UI_PRECONDITION_API_BASE_URL` only when backend setup is required
- **Multi-target projects:** register app/service env names in the project map first

Verify the starter baseline:

```bash
npm run qa:gate
npm run test:list
```

---

## Environment Model

**Simple projects** may use:

| Variable | Purpose |
|----------|---------|
| `UI_BASE_URL` | UI application for browser tests |
| `API_BASE_URL` | API project and API tests |
| `UI_PRECONDITION_API_BASE_URL` | Optional API backend for UI/E2E preconditions only |

**Multi-target projects** (multiple UI apps or API/microservices) must register every env name in `.cursor/rules/00-project-map.mdc` before use. See `.cursor/rules/multi-target-environment.rules.mdc`.

Rules:

- Agents must not invent env variable names
- API hosts must not be derived from UI hosts
- Specs must not read environment variables directly
- Real `.env` files stay local and uncommitted

---

## Core Workflows

### Feature Coverage

For API, UI, schema, visual, cross-browser, and responsive coverage:

```text
/plan-feature
-> review plan at specs/<feature>.md
-> /review-generated
-> /implement-api-batch        (API ready coverage)
-> /implement-ui-batch           (UI ready coverage)
-> /implement-visual-checkpoint  (only when planned and approved)
-> /review-generated
```

- Feature plans cover API, UI, schema, visual, cross-browser, and responsive decisions
- Feature plans do **not** contain E2E journeys
- Use **ready to implement now** vs **blocked/postponed** in plans

### E2E Journey

For critical full user or business journeys only — not short UI form or validation checks:

```text
/plan-e2e-journey specs/e2e/<journey>.md
-> review journey plan
-> /implement-e2e-flow specs/e2e/<journey>.md
-> /review-generated
```

- E2E journey plans live under `specs/e2e/<journey>.md`
- E2E proves a full journey crossing multiple states, pages, or system boundaries
- API may be used in E2E **only** for setup, preconditions, or cleanup — not to replace UI journey steps

---

## TMS Workflow

| Command | When to use |
|---------|-------------|
| `/plan-from-tms` | No feature plan yet; TMS cases are the main input |
| `/align-plan-with-tms` | Feature plan exists; align with TMS suite or cases |

TMS principles:

- **Provider-agnostic** — Qase is an example supported provider only
- **Read-only by default** — list and read cases; no writes without explicit approval
- TMS cases are planning input and traceability — not a 1:1 mapping to Playwright tests
- Reporter and result publishing are **not** configured by default
- TMS tokens belong in user/global MCP settings or local secret storage — not in the repository

---

## Package Scripts

All scripts are baseline-safe. Zero tests is a valid state.

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Convention and quality checks |
| `npm test` | Baseline run: `api` + `ui-chromium` + `e2e` projects |
| `npm run test:list` | List discovered tests without executing |
| `npm run test:api` | Run API project |
| `npm run test:ui` | Run UI project (`ui-chromium`) |
| `npm run test:e2e` | Run E2E project |
| `npm run test:smoke` | Baseline `@smoke` run on `api` + `ui-chromium` + `e2e` |
| `npm run test:regression` | Baseline `@regression` run on `api` + `ui-chromium` + `e2e` |
| `npm run test:visual` | Baseline `@visual` run on `ui-chromium` |
| `npm run test:cross-browser` | Filter by `@cross-browser` coverage-type tag |
| `npm run test:responsive` | Filter by `@responsive` coverage-type tag |
| `npm run report:allure:generate` | Generate `allure-report/` from `allure-results/` |

`npm test` is a **baseline run**, not a full browser/mobile matrix. `test:smoke`, `test:regression`, and `test:visual` are baseline-scoped tag runs. `test:cross-browser` and `test:responsive` are explicit opt-in coverage paths. Browser and viewport execution depends on Playwright projects in `playwright.config.ts`.

After test runs, Playwright writes `playwright-report/` and Allure writes `allure-results/`. Run `npm run report:allure:generate` to build `allure-report/`. Failure screenshots, traces, and videos are retained on failure only.

---

## CI Baseline

The starter CI workflow is starter-safe and stays valid in zero-test repositories.

- Always runs `npm ci`, `npm run qa:gate`, and `npm run test:list`
- Uses `actions/setup-node` npm dependency cache (`cache: npm`) in CI jobs
- Detects test files and skips matrix jobs when no tests exist
- Runs API/UI/E2E/tag-based matrix jobs only when tests are present
- Maps repository variables to Playwright env when matrix jobs run (empty fallback when unset)
- Runs cross-browser UI coverage with `@cross-browser` on `ui-chromium`, `ui-firefox`, and `ui-webkit`
- Runs responsive UI coverage with `@responsive` on `ui-mobile-chromium`
- Uploads generated artifacts when present: `playwright-report/`, `test-results/`, `allure-results/`, `allure-report/`
- Generates Allure HTML report when `allure-results/` exists after test runs
- Keeps TMS publishing and GitHub Pages publishing out of scope by default

Playwright HTML and Allure reporting are enabled for local and CI artifacts only. Allure is **not** TMS result publishing. Step-level custom Allure screenshots in specs are project-specific and not enabled by default. Zero-test repositories still pass — matrix jobs and report uploads are skipped when no tests exist.

### GitHub Actions variables and secrets

Configure non-sensitive URLs as **repository or environment variables** (Settings → Secrets and variables → Actions):

| Variable | Purpose |
|----------|---------|
| `UI_BASE_URL` | UI application base URL for `ui-chromium` and `e2e` projects |
| `API_BASE_URL` | API base URL for the `api` project |
| `UI_PRECONDITION_API_BASE_URL` | Optional API backend for UI/E2E precondition setup |

Multi-target projects register additional names in the project map first, for example `CUSTOMER_UI_BASE_URL`, `AUTH_API_BASE_URL`, `ORDER_API_BASE_URL`.

Store sensitive values as **Secrets** (never in workflow YAML or committed files):

- user passwords
- API tokens
- service account credentials
- TMS provider tokens
- external service credentials

Rules:

- never commit real `.env` files
- never hardcode secrets in workflow YAML
- prefer GitHub **environment** secrets for staging/production-like targets
- use repository/environment **variables** for non-sensitive URLs
- use **secrets** for tokens and passwords
- document required CI variables and secrets per real project in `.cursor/rules/00-project-map.mdc`
- CI must not publish TMS results unless explicitly planned and approved

The clean starter baseline does not require configured variables or secrets — the baseline gate passes with zero tests and empty env fallbacks.

Local `.env` (from `.env.example`) corresponds conceptually to CI variables and secrets for the same env names.

---

## Current Workflow Kit Structure

Shipped with the starter baseline:

```text
.cursor/rules/**      Architecture and quality guardrails
.cursor/skills/**     Task-specific AI procedures
.cursor/commands/**   Slash command launchers
docs/**               Workflow kit and automation documentation
.env.example          Provider-agnostic env placeholders
playwright.config.ts  Playwright projects and defaults
scripts/**            Convention checks and tooling
package.json          Baseline-safe npm scripts
```

Created when a real project starts:

```text
tests/**              API, UI, and E2E specs
specs/**              Feature and E2E journey plans
src/test/**           Page Objects, fixtures, schemas, helpers, data
```

Test-data policy for real projects:

- no random or faker calls directly in specs;
- keep generators under `src/test/data/generators/**`;
- keep builders under `src/test/data/builders/**`;
- add faker only when there is a real project need and keep generation deterministic enough for debugging.

Source of truth for structure, tags, projects, apps, services, and env names: `.cursor/rules/00-project-map.mdc`.

---

## Key Principles

- Plan before implementation
- Use **ready to implement now** vs **blocked/postponed**
- Keep API, UI, E2E, and visual responsibilities separate
- E2E is for full journeys only — not page render or single-form checks
- No secrets in the repository
- TMS is read-only by default
- No browser or device Playwright tags (`@firefox`, `@mobile`, etc.)
- No `waitForTimeout`
- No unnecessary abstractions
- No inline random data in specs
- Project map is the source of truth for tags, Playwright projects, apps, services, and env names

---

## Documentation

| Document | Purpose |
|----------|---------|
| [Quick Reference](docs/QUICK_REFERENCE.md) | Daily-use workflow cheat sheet |
| [Helper Recipes](docs/HELPER_RECIPES.md) | Reusable helper patterns (documentation only; no shipped source) |
| [Start a New Project](docs/START_NEW_PROJECT.md) | Detailed onboarding guide |
| [AI Skills and Commands Playbook](docs/AI_SKILLS_COMMANDS_PLAYBOOK_FULL.md) | Full skills and commands reference |
| [How To Use AI Automation](docs/reference/HOW_TO_USE_AI_AUTOMATION.md) | Day-to-day AI workflow usage |
| [AI Workflow Map](docs/reference/AI_WORKFLOW_MAP.md) | Rules, skills, agents, and workflow map |
| [AI Agent Prompts](docs/reference/AI_AGENT_PROMPTS.md) | Prompt patterns for agents |

Project map: `.cursor/rules/00-project-map.mdc`

---

## Maintenance Notes

- Update the project map when adding apps, services, Playwright projects, or tags
- Configure TMS tokens outside the repository (user/global MCP or local secret storage)
- Keep full E2E browser/mobile matrix out of default baseline unless explicitly planned
- Add TMS result publishing or GitHub Pages report publishing only as an explicit project decision (Playwright HTML + Allure artifacts are already enabled)
