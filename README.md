# Playwright AI Workflow Kit

Starter repository for **Playwright + TypeScript** test automation with **Cursor rules, skills, and slash commands**.

Clone this repo (or use it as a GitHub template), point it at your application, and use the workflow to plan and implement tests. The starter ships with **zero tests** and no `src/test/**` layer — that is expected. Project code is added when you implement a real feature.

---

## Quick start

```bash
git clone https://github.com/Avngrss/playwright-ai-workflow-kit.git
cd playwright-ai-workflow-kit
npm install
cp .env.example .env
npm run qa:gate
npm run test:list
```

Chromium installs on `npm install`. Skip browser download for API-only work: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

Fill `.env` when you add tests that need URLs. Never commit `.env`.

---

## What is in the repo

| Area | Purpose |
|------|---------|
| `.cursor/rules/` | Architecture and workflow rules for agents |
| `.cursor/skills/` | Step-by-step implementation skills |
| `.cursor/commands/` | Slash commands (`/plan-feature`, `/implement-ui-batch`, …) |
| `playwright.config.ts` | Playwright projects: `api`, `ui-chromium`, `e2e`, optional cross-browser/responsive |
| `.github/workflows/` | CI: quality gate, test discovery, matrix when tests exist |
| `reports/allure/allurerc.mjs` | Allure 3 report config (generated `results/` and `html/` stay local) |
| `tests/` | Empty placeholder — specs appear per feature |
| `docs/` | Guides: setup, quick flow, auth, commands |

Source of truth for paths, tags, env names, and auth: `.cursor/rules/00-project-map.mdc`.

---

## Under the hood

What the kit is built from and which capabilities are wired in. **Composition and features** — not usage guides. See [docs/](docs/) for workflows.

The clean starter has **zero application tests**. It ships infrastructure, conventions, and agent guidance. Project code (`tests/**`, Page Objects, schemas, helpers) is added when you automate a real app.

### AI control stack (rules and skills on top)

Browser MCP and bundled agent helpers are **tools**. The kit’s **rules, skills, and project map govern** planning, implementation, and review — not the other way around.

```text
.cursor/rules/          ← always-on constraints (41 rule files)
.cursor/skills/         ← step-by-step procedures (31 skills)
.cursor/commands/       ← short slash entry points (21 commands)
00-project-map.mdc      ← living registry: paths, tags, env, CI, auth

        ↓ must follow the above

Browser MCP (Cursor)        live app discovery in the IDE
Optional TMS MCP            pull manual test cases into plans (read-only by default)
.github/agents/             optional Copilot agent stubs — same rules/skills apply
```

| Layer | What it controls |
|-------|------------------|
| **Rules** | Test pyramid, PO/Component model, API/Zod, E2E vs UI, visual masking, auth, secrets, tags, flakiness, spec placement, TMS/Bruno policy |
| **Skills** | Plan → implement → heal → audit → review procedures agents execute within those rules |
| **Commands** | Thin prompts wired to skills (`/plan-feature`, `/implement-ui-batch`, `/heal-ui-test`, …) |
| **Project map** | Source of truth for folders, registered tags, scripts, env names, auth modes, CI — auto-synced by cartographer |
| **MCP / optional agents** | Browser discovery and external inputs; output must match rules and land in approved folders |

### Core stack

| Piece | Role |
|-------|------|
| **Playwright Test** (`@playwright/test` 1.60) | Browser automation, API request context, parallel runs, web-first assertions |
| **TypeScript** 5.7 (strict) | Typed specs and project layer; `tsc --noEmit` in quality gate |
| **Allure 3** (`allure`, `allure-playwright`, `allure-js-commons`) | Reporting, Runtime metadata API, single-file HTML report with charts |
| **dotenv** | Local env in `playwright.config.ts` only — not in specs |
| **@playwright/mcp** | Cursor MCP server (`npx playwright-mcp` in `.cursor/mcp.json`) |
| **Node 20** | CI runtime |

**Zod** — not preinstalled; full **schema validation pattern** (shared assertion helper + `src/test/schemas/api/**`) defined in rules; add the dependency with the first API feature.

Optional per project: **`@faker-js/faker`** when generated data is planned.

### Test pyramid and layers

Policy (in rules): use the **lowest reliable layer** — API/schema for contracts, UI for browser feedback, E2E only for full journeys, visual for layout risk. No duplicate coverage across layers without a distinct reason.

| Layer | Project | Spec pattern | Purpose |
|-------|---------|--------------|---------|
| **API** | `api` | `tests/api/<feature>/*.api.spec.ts` | Backend contracts, status/body, auth — no browser |
| **UI** | `ui-chromium` | `tests/ui/<feature>/*.ui.spec.ts` | Focused browser behavior (desktop Chrome, 1280×720) |
| **E2E** | `e2e` | `tests/e2e/<area>/*.e2e.spec.ts` | Full journeys — planned separately in `specs/e2e/`, not in feature plans |
| **Visual** | `ui-chromium` + `@visual` | checkpoints inside UI specs | `toHaveScreenshot`, masks for dynamic/PII fields |
| **Cross-browser** | `ui-chromium`, `ui-firefox`, `ui-webkit` + `@cross-browser` | same UI specs | Chromium / Firefox / WebKit matrix on demand |
| **Responsive** | `ui-mobile-chromium` + `@responsive` | same UI specs | Pixel 5 viewport for breakpoint risks |

Registered tags: `@api`, `@ui`, `@e2e`, `@visual`, `@smoke`, `@regression`, `@cross-browser`, `@responsive`, `@wip`, `@flaky`.

Execution defaults: `data-test` locators, headless, **fully parallel**, CI retries, `forbidOnly` in CI, E2E timeouts/actions tuned separately, **`--pass-with-no-tests`** on all npm test scripts (valid empty starter).

Failure artifacts: screenshot, trace, video — **only on failure**. Visual thresholds: `maxDiffPixels: 50`, `threshold: 0.2`.

Stability policy (rules): web-first assertions, **no `waitForTimeout`**, UI stability helpers for list/search sync when needed.

### Spec structure (UI / E2E / API)

| Convention | Role |
|------------|------|
| **`test.step`** | UI and E2E specs split into **user-intent phases** (open page, act, verify) — readable in Playwright and Allure reports |
| **Steps vs Page Objects** | Steps name the scenario; PO/Components own locators and actions — no raw selectors in specs |
| **Tags** | Layer + smoke/regression via Playwright `tag:` — not embedded in test titles |
| **`beforeEach`** | Safe navigation / page-ready only — not the action under test |
| **Allure metadata** | Feature, story, suite, severity via shared helper — reporting layer, not a replacement for `test.step` |
| **API specs** | Request → status/behavior assert → optional Zod shape — no Page Objects |
| **Test isolation** | Independent tests, parallel-safe data; no order dependency |

E2E journeys stay **visible in the spec** — not hidden in fixtures, hooks, or PO “full flow” methods.

### Architecture patterns

| Pattern | Location | Role |
|---------|----------|------|
| **Layered fixtures** | `src/test/fixtures/`: `base` → `api` → `data` → `pages` → [`auth`] → `test.ts` | One public import; optional `reporting` layer after first UI/API batch; optional `auth.fixture` when preconditions are registered |
| **Page Objects + Components** | `pages/**`, `components/**` | Route ownership; semantic locators (`getByRole` first); no `expect` in PO/Components |
| **Assertion helpers** | `assertions/api/**`, `ui/**` | Contract/UI invariants; Zod shape wrapper; sort/filter/search helpers where shared |
| **Zod schemas** | `schemas/api/**` | Runtime API contracts (on first API feature) |
| **Test data** | `data/builders`, `generators`, `datasets` | Valid-by-default builders; centralized uniqueness; no random data in specs |
| **API clients** | `api/clients/**` | Thin optional grouping; no assertions or Allure inside |
| **Auth setup** | `setup/auth/**`, `state/` (gitignored) | `storageState`, inject-before-goto, disposable users — from project map |
| **Reporting / security helpers** | `reporting/**`, `security/**`, `logging/**` | Allure metadata in starter; readable failure diagnostics wired on first UI/API batch; sanitized HTTP/redaction when plans need them |
| **Feature plans** | `specs/<feature>/<feature>.md` | Pyramid level, auth, masking, ready/blocked/postponed per scenario |
| **E2E journey plans** | `specs/e2e/<area>/<journey>.md` | Journeys only — setup, cleanup, final assertion |
| **Feature-grouped specs** | `tests/<layer>/<feature>/` | Enforced by convention checker |
| **Upload assets** | `src/test/assets/files/**` | Safe synthetic files only |
| **Optional domain flows** | `domain/*.flow.ts` | Cross-page business workflows when reuse justifies (not default) |

### Environment, URLs, and auth

Application URLs are **configuration**, not hardcoded in tests. Playwright projects pick them up as `baseURL` (UI/E2E) or API project base (API layer).

| Capability | Role |
|------------|------|
| **Default URLs** | `UI_BASE_URL` + `API_BASE_URL` in `.env` (from `.env.example`) and GitHub Actions variables for CI |
| **Multi-app / multi-service** | Extra env names per UI app or API service (e.g. admin UI, auth API) — register in project map, wire in config/fixtures/clients |
| **Conditional URL gate** | URLs required only when matching specs exist — empty starter runs without them |
| **Injection boundary** | Resolved in `playwright.config.ts`, fixtures, Page Objects, clients — **never** `process.env` in specs |
| **No host heuristics** | Do not derive API host from UI host (no `api.` + strip-`www` tricks) |
| **Auth strategy registry** | none / action / precondition + mechanism (`storageState`, inject, password-login, …) in project map |

### Reporting

Triple reporter: console + Playwright HTML + Allure raw results. Allure 3 (`allurerc.mjs`): groupBy **layer / feature / story**, severity charts, single-file HTML. Environment block: ui_host, api_host, OS, Node. Auto-clean stale Allure folders before each run/generate. Metadata via **`allure-metadata.helper.ts`**. Readable failure summaries: wire once on first UI/API batch — [docs/failure-reporting.md](docs/failure-reporting.md).

### Quality gate, audit, and heal

| Capability | Role |
|------------|------|
| **`qa:gate`** | `check-conventions.mjs` + strict TypeScript |
| **Convention checker** | Folder placement, tag registry, fixture chain, no `expect` in PO/Components, no Allure in wrong layers, security patterns in specs/helpers |
| **Gitleaks (CI)** | Secret scan on push/PR |
| **Audit skills (read-only)** | Coverage vs plans, flakiness patterns, test data strategy, security posture, Bruno ↔ automation alignment |
| **Heal skills** | Technical root-cause fix (locators, sync, setup) — **not** requirement drift; product changes go through plan refresh first |
| **Product change lifecycle** | `/update-feature-plan` before changing expected behavior; heal is for stable requirements only |

### CI pipeline

GitHub Actions: Node 20, npm cache, baseline gate always, **matrix only when tests exist** (API, UI, E2E, smoke, regression, visual, cross-browser ×3, responsive mobile), per-browser install, fail-fast off, artifact upload (HTML report, test-results, Allure), Allure generate on results. Zero-test repo stays green.

### External inputs (planning)

Contract and manual-test sources feed **feature plans** first — automation level is chosen there, not copied 1:1 into specs.

| Source | Role |
|--------|------|
| **OpenAPI / Swagger** | Primary API contract: endpoints, status codes, request/response shapes. Link or path goes in the feature plan; drives API coverage and **Zod schemas** — agents do not guess undocumented fields |
| **Bruno collections** | `collections/bruno/**` — git-native HTTP examples alongside or instead of Swagger; inspect/plan/audit; OpenAPI wins on contract conflicts |
| **Test Management System** | Manual cases via TMS MCP or approved integration (read-only by default). Plans include TMS Source + Mapping; kit maps each case to API / UI / schema / visual / E2E / not automated |

**Browser MCP** (`.cursor/mcp.json`) — live UI discovery in Cursor. **Optional agent stubs** in `.github/agents/` if you use Copilot — **rules, skills, and project map** still govern output.

### Maintenance scripts

| Script | Role |
|--------|------|
| `check-conventions.mjs` | Architecture + security enforcement |
| `clean-allure-artifacts.mjs` | Allure cleanup |
| `project-cartographer.mjs` | Sync repo tree → project map |
| `ensure-playwright-browsers.mjs` | Chromium on postinstall; browsers before UI runs |

Layer/matrix npm scripts: `test:api`, `test:ui`, `test:e2e`, smoke/regression, visual, cross-browser, responsive, Allure serve/generate.

### Shipped vs added on first feature

| In the kit today | Added per application |
|------------------|------------------------|
| Playwright config (6 projects), fixture skeleton, **Allure metadata helper**, Allure/CI/scripts, `.cursor/rules` + skills + commands, docs, MCP config, GitHub agents, Bruno folder, convention checker | `tests/**`, `specs/**`, Page Objects, readable failure wiring, Zod, schemas, assertions, builders, clients, auth artifacts, visual baselines, sanitized HTTP/security helpers |

---

## Typical workflow

```text
/plan-feature
  → review specs/<feature>/<feature>.md
  → /implement-api-batch and/or /implement-ui-batch   (ready items only)
  → npm run test:api and/or test:ui
  → npm run qa:gate
  → /review-generated
```

Plans live under `specs/<feature>/<feature>.md`. E2E journeys: `specs/e2e/<area>/<journey>.md`.

Implement only scenarios marked **ready to implement now** in the plan. More commands (TMS, audit, heal, E2E): [docs/long-flow.md](docs/long-flow.md).

---

## Configuration

**Simple project** — one UI app and one API (default):

```text
UI_BASE_URL=https://your-app-host.example
API_BASE_URL=https://your-api-host.example
```

**Several UI apps or API services** — commented examples in `.env.example` (`CUSTOMER_APP_URL`, `ADMIN_APP_URL`, `AUTH_API_URL`, …). To use them:

1. Uncomment only names your product has.
2. Register the same names in `.cursor/rules/00-project-map.mdc`.
3. Wire them in config, fixtures, Page Objects, or API clients — not in specs.
4. Add CI variable mapping in `.github/workflows/playwright.yml` after registration.

Specs must not read `process.env`. Do not derive an API host from a UI host.

If tests need a session, declare **Auth Strategy** in the project map first: [docs/auth-strategy.md](docs/auth-strategy.md).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Convention checks + TypeScript |
| `npm run test:list` | List tests (zero is valid) |
| `npm test` | `api` + `ui-chromium` + `e2e` |
| `npm run test:api` / `test:ui` / `test:e2e` | One layer |
| `npm run test:smoke` / `test:regression` | Functional tag filters (exclude `@visual`, `@cross-browser`, `@responsive`, `@wip`, `@flaky`) |
| `npm run test:report` | Tests + fresh Allure report |

---

## Documentation

- [Getting started](docs/getting-started.md) — install, env, folders, CI
- [Quick flow](docs/quick-flow.md) — plan → implement → review for one feature
- [Auth strategy](docs/auth-strategy.md) — how login/session is declared per project
- [Failure reporting](docs/failure-reporting.md) — readable Allure failures for QA and flaky analysis
- [Long flow](docs/long-flow.md) — TMS, collections, audit, E2E, heal
- [Commands](docs/commands.md) — slash-command templates
- [Prompts](docs/prompts.md) — paste-ready prompts
