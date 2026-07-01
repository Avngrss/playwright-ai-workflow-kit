# Playwright AI Automation Framework

npm package: `playwright-ai-automation-framework`

A reusable **Playwright + TypeScript** AI-assisted automation framework foundation for building test automation on any target application.

It supports **API**, **UI**, **E2E**, **visual**, **TMS-assisted planning**, **cross-browser**, and **responsive** testing workflows. AI **rules**, **skills**, and **commands** guide planning, implementation, review, and audit.

The clean framework baseline ships **zero tests** and **no `src/test/**` implementation layer**. That is valid. Project-specific code is created when you start work on a concrete application.

You can copy or clone this repository as a **template for new automation projects**. For step-by-step onboarding, see [Start a New Project](docs/START_NEW_PROJECT.md).

---

## What This Framework Includes

- Playwright + TypeScript foundation
- AI rules, skills, and slash commands under `.cursor/`
- Feature coverage planning (`specs/<feature>.md`)
- E2E journey planning (`specs/e2e/<journey>.md`)
- TMS planning and alignment support
- Provider-agnostic TMS model — **Qase** is an example supported provider only
- Cross-browser and responsive testing policies
- Visual testing policy
- Baseline-safe package scripts (`--pass-with-no-tests`)
- Provider-agnostic `.env.example`
- Multi-application / multi-service environment support

---

## What Is Intentionally Not Included

- Project-specific tests
- Project-specific feature or E2E plans
- `src/test/**` implementation layer (Page Objects, fixtures, schemas, assertion helpers, builders)
- Real URLs or production credentials
- Reporter or TMS result publishing setup
- Browser or mobile execution matrix by default

These are added per application through planning and implementation workflows.

---

## Quick Start

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

Verify the framework baseline:

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
| `npm run test:list` | List discovered tests without executing |
| `npm run test:api` | Run API project |
| `npm run test:ui` | Run UI project (`ui-chromium`) |
| `npm run test:e2e` | Run E2E project |
| `npm run test:smoke` | Filter by `@smoke` tag |
| `npm run test:regression` | Filter by `@regression` tag |
| `npm run test:visual` | Filter by `@visual` tag |
| `npm run test:cross-browser` | Filter by `@cross-browser` coverage-type tag |
| `npm run test:responsive` | Filter by `@responsive` coverage-type tag |

`test:cross-browser` and `test:responsive` are **tag filters**, not a browser or mobile matrix. Browser and viewport execution depends on Playwright projects in `playwright.config.ts`.

---

## Current Framework Structure

Shipped with the framework baseline:

```text
.cursor/rules/**      Architecture and quality guardrails
.cursor/skills/**     Task-specific AI procedures
.cursor/commands/**   Slash command launchers
docs/**               Framework and workflow documentation
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
- Project map is the source of truth for tags, Playwright projects, apps, services, and env names

---

## Documentation

| Document | Purpose |
|----------|---------|
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
- Add browser or mobile Playwright projects only when intentionally supported and documented
- Add reporter or TMS result publishing only as an explicit project decision
