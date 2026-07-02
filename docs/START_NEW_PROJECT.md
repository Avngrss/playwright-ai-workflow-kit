# Start a New Project

**Overview:** [README](../README.md) — high-level workflow kit overview. This guide is the detailed onboarding walkthrough.

**Daily cheat sheet:** [Quick Reference](QUICK_REFERENCE.md) — commands, workflows, tags, and scripts at a glance.

---

## Purpose

This repository is the **Playwright AI Workflow Kit** — a reusable AI-assisted workflow kit and starter foundation for **Playwright + TypeScript** automation projects.

npm package name: `playwright-ai-workflow-kit`

GitHub repository: https://github.com/Avngrss/playwright-ai-workflow-kit

It provides rules, skills, commands, scripts, and documentation for building test automation on a target application. Project-specific tests, Page Objects, schemas, fixtures, builders, generators, and feature plans are created per application — they are not shipped with the starter baseline.

The clean starter baseline has **no `src/test/**` implementation layer**. Skills and commands create the required project structure when implementation starts.

The clean starter also has no `src/test/data/**` layer by default. Create builders and generators only when a real project needs reusable generated data.

Use this guide when you copy or clone this workflow kit as a **template for a new automation project**.

---

## Prerequisites

- **Node.js** installed (LTS recommended).
- **npm** available for dependency installation.
- **Playwright browsers** installed when you add browser UI or E2E tests.
- **Cursor** available if you use the AI workflow, slash commands, and MCP integrations.

---

## Initial Setup

1. **Clone or copy** this workflow kit into your project workspace (for example: `git clone https://github.com/Avngrss/playwright-ai-workflow-kit.git`).
2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create local environment file** when your project needs runtime URLs:

   ```bash
   cp .env.example .env
   ```

4. **Fill placeholders only when needed** for your target application:

   **Simple single-app projects** (starter defaults):

   ```text
   UI_BASE_URL=
   API_BASE_URL=
   UI_PRECONDITION_API_BASE_URL=
   ```

   - `UI_BASE_URL` — fill when adding UI or E2E browser tests.
   - `API_BASE_URL` — fill when adding API tests.
   - `UI_PRECONDITION_API_BASE_URL` — fill only when UI or E2E tests need approved backend precondition setup.

   **Multi-target projects** (multiple UI apps or API/microservices):

   - register every env name in `.cursor/rules/00-project-map.mdc` before use;
   - add matching commented examples to `.env.example`;
   - do not invent env names in plans or code;
   - feature plans must name target UI app(s), API service(s), and precondition service(s);
   - E2E journey plans must document every UI app and service crossed.

   Rule reference: `.cursor/rules/multi-target-environment.rules.mdc`

   Leave unused variables empty. Do not put real secrets, tokens, or production credentials in the repository.

   Local `.env` corresponds conceptually to GitHub Actions configuration for the same env names:
   - non-sensitive URLs → repository or environment **Variables**
   - passwords, tokens, credentials → **Secrets**

5. **Never commit** `.env` or other local secret files.

6. **Configure CI variables and secrets** when real tests run in GitHub Actions (see [CI Baseline](#ci-baseline) below).

---

## MCP and TMS Setup

| Integration | Where to configure |
|-------------|-------------------|
| **Playwright MCP** | Project `.cursor/mcp.json` (safe to commit; project-level only) |
| **TMS MCP or API access** | User/global Cursor MCP settings, extension settings, or local secret storage (not in repo) |
| **Azure DevOps, GitKraken, other user tools** | User/global or extension-level settings |

TMS guidance:

- TMS integration is **optional**. Use it for planning input and traceability when a Test Management System is available.
- **Qase** is a currently supported example provider via user/global Cursor MCP when configured — not a hard dependency of the workflow kit.
- Other TMS providers may be supported later through approved integration paths.
- TMS tokens belong in user/global MCP settings or local secret storage — **not** in repository env files.
- TMS is **read-only by default** (list/read cases; no writes, runs, or result publishing without explicit approval).
- TMS reporter/result publishing is separate and **not** configured in this workflow kit by default.

If you use Qase as your TMS example, verify its MCP connection in Cursor before running `/plan-from-tms` or `/align-plan-with-tms`.

---

## Workflow Kit Structure

Key locations:

| Path | Purpose |
|------|---------|
| `.cursor/rules/**` | Architecture and quality guardrails |
| `.cursor/skills/**` | Task-specific AI procedures |
| `.cursor/commands/**` | Slash command launchers |
| `docs/**` | Workflow kit and automation documentation |
| `specs/<feature>.md` | Feature coverage plans (API, UI, schema, visual) |
| `specs/e2e/<journey>.md` | E2E journey plans (full user/business flows) |
| `tests/api/**` | API specs (`*.api.spec.ts`) |
| `tests/ui/**` | UI specs (`*.ui.spec.ts`) |
| `tests/e2e/**` | E2E specs (`*.e2e.spec.ts`) |

**Project implementation layer** — created per application when implementation starts; **absent in clean baseline**:

| Path | Purpose |
|------|---------|
| `src/test/pages/**` | Page Objects |
| `src/test/components/**` | Component Objects |
| `src/test/fixtures/**` | Fixture chain; final entry point: `test.ts` |
| `src/test/assertions/**` | Assertion helpers |
| `src/test/schemas/**` | API Zod schemas |
| `src/test/data/**` | Builders, generators, datasets |
| `src/test/reporting/**` | Allure and reporting helpers |
| `src/test/api/clients/**` | Thin API clients (when justified) |
| `src/test/assets/files/**` | Safe synthetic upload assets |

Many project-specific folders do not exist until the first implementation run. Use skills such as `create-fixture`, `create-page-object`, and `implement-api-feature` / `implement-ui-feature` to create the required structure.

Optional reference when first implementation creates `src/test/**`: [Helper Recipes](HELPER_RECIPES.md) — reusable helper patterns documented for future projects; the starter does not ship helper source files.

Data generation policy for new projects:

- do not add data-generation libraries by default;
- `@faker-js/faker` is optional and should be added only for a real project need;
- do not call random/faker generators directly in specs;
- keep reusable generators in `src/test/data/generators/**`;
- keep reusable builders in `src/test/data/builders/**`.

Source of truth for structure and commands: `.cursor/rules/00-project-map.mdc`.

When you run `npm run project-map:update`, the generated repository tree uses the `package.json` name as the root label (for example `playwright-ai-workflow-kit/`), not the local workspace folder name.

---

## First Feature Workflow

Recommended flow for the first feature on a new application:

```text
/plan-feature
-> review generated plan at specs/<feature>.md
-> /implement-api-batch        (API ready coverage)
-> /implement-ui-batch           (UI ready coverage)
-> /implement-visual-checkpoint  (only when visual coverage is approved)
-> /review-generated             (after implementation)
-> /audit-test-coverage          (optional; plan vs tests alignment)
-> /audit-test-data-strategy      (optional; shared data / cleanup review)
-> /audit-test-stability         (optional; flaky patterns before commit)
```

Clarifications:

- **Feature plans** cover API, UI, schema, visual, cross-browser, and responsive decisions.
- **Feature plans** must identify target UI app(s), API service(s), and precondition service(s) when more than one exists.
- **Feature plans do not contain E2E journeys.** Plan E2E separately under `specs/e2e/`.
- Use **ready to implement now** vs **blocked/postponed** in plans; do not implement blocked items without clarification.
- **Project map** is the source of truth for app/service env names in multi-target projects.

---

## First E2E Workflow

Use E2E only for critical full user or business journeys — not for short UI form, control, or validation checks.

```text
/plan-e2e-journey specs/e2e/<journey>.md
-> review journey plan
-> /audit-test-data-strategy      (optional; data/cleanup/isolation before implementation)
-> /implement-e2e-flow specs/e2e/<journey>.md   (ready scenarios only)
-> /review-generated
-> /audit-test-coverage          (optional; journey plan vs E2E specs)
-> /audit-test-data-strategy      (optional; E2E data policy vs implementation)
-> /audit-test-stability         (optional; E2E stability before commit)
```

Rules:

- E2E specs live under `tests/e2e/**/*.e2e.spec.ts`.
- Tag with `@e2e` plus `@smoke` or `@regression`.
- E2E journey plans must document every UI app and API service crossed with env names from the project map.
- API may be used only for **setup, preconditions, or cleanup** — not to replace UI journey steps.
- Keep the full user journey visible in the spec; do not hide it in fixtures, hooks, or Page Objects.

---

## TMS Workflow

| Command | When to use |
|---------|-------------|
| `/plan-from-tms` | No `specs/<feature>.md` yet; TMS cases are the main input |
| `/align-plan-with-tms` | Feature plan exists; align with TMS suite/cases |
| `/audit-test-coverage` | Compare plan(s) vs implemented tests; audit only |
| `/audit-test-stability` | Audit UI/E2E flaky patterns; audit only — use `/heal-ui-test` to fix |
| `/audit-test-data-strategy` | Audit data isolation/cleanup/shared-data risks; audit only — does not create/modify data |

Rules:

- TMS is **read-only by default** unless explicitly approved for writes.
- TMS cases are **planning input and traceability** — do not assume 1 TMS case = 1 automated test.
- Map cases by risk: API, UI, schema, visual, not automated, blocked, or postponed.
- TMS reporter/result publishing is separate and not configured by default.
- **Qase** is a supported example provider when configured user/global — other TMS tools may be used when integration is approved.

---

## Cross-Browser and Responsive Coverage

- Cross-browser and responsive coverage are **risk-based**, not a default browser/device matrix.
- Browser and viewport belong to **Playwright projects** (`api`, `ui-chromium`, `ui-firefox`, `ui-webkit`, `ui-mobile-chromium`, `e2e`), not Playwright tags.
- Use `@cross-browser` and `@responsive` only when explicitly planned and registered.
- Do **not** invent tags such as `@firefox`, `@webkit`, `@mobile`, `@tablet`, or `@desktop`.
- Responsive coverage is usually focused UI coverage, not a full E2E viewport matrix.

Rule reference: `.cursor/rules/browser-and-responsive-testing.rules.mdc`

---

## Visual Testing

- Visual checkpoints are **separate from functional assertions** — verify behavior first, then screenshot stable UI state.
- Visual baselines require **explicit approval**; do not update snapshots silently.
- Do not add screenshots by default.
- Use `/implement-visual-checkpoint` only when visual coverage is planned and approved.

Rule reference: `.cursor/rules/visual-testing.mdc`

---

## Verification

The clean starter baseline has **zero tests** — that is valid. All package test scripts use `--pass-with-no-tests` so they succeed in the empty baseline state.

Common baseline checks:

```bash
npm run qa:gate
npm run test:list
npm test
```

Layer scripts (use registered Playwright projects only):

```bash
npm run test:api
npm run test:ui
npm run test:e2e
```

Baseline tag scripts (filter by Playwright tags on baseline projects):

```bash
npm run test:smoke
npm run test:regression
npm run test:visual
```

Coverage-type tag scripts (filter planned cross-browser or responsive tests only):

```bash
npm run test:cross-browser
npm run test:responsive
```

Notes:

- `npm test` is the baseline run and executes only `api`, `ui-chromium`, and `e2e`.
- **Smoke and regression** scripts run baseline projects (`api`, `ui-chromium`, `e2e`) filtered by `@smoke` or `@regression`.
- **Visual** script runs baseline UI project (`ui-chromium`) filtered by `@visual`.
- **Cross-browser** script targets `ui-chromium`, `ui-firefox`, and `ui-webkit` with `@cross-browser` only.
- **Responsive** script targets `ui-mobile-chromium` with `@responsive` only.
- **Browser and viewport execution** depends on Playwright projects in `playwright.config.ts` (`api`, `ui-chromium`, `ui-firefox`, `ui-webkit`, `ui-mobile-chromium`, `e2e`).
- **Zero-test baseline state** is expected. Scripts pass cleanly until real tests are added.
- **First real tests** are created through planning and implementation commands: `/plan-feature`, `/plan-e2e-journey`, `/implement-api-batch`, `/implement-ui-batch`, `/implement-e2e-flow`.

After implementing coverage, run the impacted layer or tag script and `npm run qa:gate` again.

Environment notes:

- **Missing browser binary** is an environment setup issue, not a test failure. Install when needed:

  ```bash
  npx playwright install chromium
  ```

---

## CI Baseline

Starter workflow file: `.github/workflows/playwright.yml`

Behavior:

- enables npm dependency caching via `actions/setup-node` (`cache: npm`);
- always runs `npm ci`, `npm run qa:gate`, and `npm run test:list`;
- detects whether test files exist and skips matrix execution when none exist;
- maps repository variables to Playwright env when matrix jobs run (empty fallback when unset);
- runs matrix jobs only when tests exist:
  - API, UI Chromium, E2E;
  - smoke, regression, visual;
  - cross-browser Chromium/Firefox/WebKit with `@cross-browser`;
  - responsive mobile Chromium with `@responsive`;
- uploads generated artifacts when present:
  - `playwright-report/`
  - `test-results/`
  - `allure-results/`
  - `allure-report/`;
- generates Allure HTML report via `npm run report:allure:generate` only when `allure-results/` exists;
- does not configure TMS publishing;
- does not configure GitHub Pages publishing.

The clean starter does not require configured CI variables or secrets — the baseline gate passes with zero tests.

### Reporting artifacts

When tests exist:

- Playwright writes `playwright-report/` (HTML) and failure artifacts under `test-results/` (screenshots/traces/videos retained on failure only);
- Allure writes raw results to `allure-results/`;
- CI runs `npm run report:allure:generate` when `allure-results/` exists, then uploads report folders when present.

Allure is for reporting artifacts only — **not** TMS result publishing. Step-level custom Allure screenshots in specs are project-specific and not enabled by default.

### GitHub Actions variables and secrets

Configure when real tests exist. Document required names per project in `.cursor/rules/00-project-map.mdc`.

**Repository or environment variables** (non-sensitive URLs):

| Variable | Purpose |
|----------|---------|
| `UI_BASE_URL` | UI application base URL |
| `API_BASE_URL` | API project base URL |
| `UI_PRECONDITION_API_BASE_URL` | Optional UI/E2E precondition API backend |

Multi-target projects register names such as `CUSTOMER_UI_BASE_URL`, `AUTH_API_BASE_URL`, `ORDER_API_BASE_URL` in the project map before use.

**Secrets** (tokens, passwords, credentials):

- user passwords
- API tokens
- service account credentials
- TMS provider tokens
- external service credentials

Rules:

- never commit real `.env` files;
- never hardcode secrets in workflow YAML;
- prefer GitHub **environment** secrets for staging/production-like targets;
- use **variables** for URLs, **secrets** for tokens and passwords;
- CI must not publish TMS results unless explicitly planned and approved.

Reporting and diagnostics:

- Playwright HTML and Allure reporting are enabled for local/CI artifacts (`playwright.config.ts`);
- Allure is for reporting artifacts only — **not** TMS result publishing;
- failure screenshots, traces, and videos are retained on failure only;
- CI generates and uploads Allure report only when `allure-results/` exists;
- CI uploads Playwright and Allure artifacts only when folders exist.

---

## Do and Do Not

### Do

- Create a plan before implementation.
- Use **ready to implement now** vs **blocked/postponed** in plans.
- Keep API, UI, E2E, and visual responsibilities separate.
- Use existing rules, skills, and commands.
- Keep secrets and tokens in local or user/global config only.
- Import tests from `src/test/fixtures/test.ts` once the project fixture chain is created (final fixture entry point).

### Do not

- Commit real tokens or `.env` with secrets.
- Write E2E scenarios from feature plans — use `specs/e2e/<journey>.md`.
- Duplicate UI/API coverage in E2E without distinct journey value.
- Invent tags, Playwright projects, or browser/device tag names.
- Use `waitForTimeout`.
- Hide E2E journey steps in fixtures, hooks, or Page Objects.
- Leave application-specific code out of the starter baseline when converting it for reuse.

---

## Minimal First Commands

```bash
npm install
npm run qa:gate
npm run test:list
```

Planning and implementation (Cursor slash commands):

```text
/plan-feature
/plan-e2e-journey
/review-generated
/audit-test-coverage
/audit-test-data-strategy
/audit-test-stability
```

---

## Related Documentation

- [README](../README.md) — high-level workflow kit overview
- [Helper Recipes](HELPER_RECIPES.md) — reusable helper patterns (documentation only)
- [How To Use AI Automation System](reference/HOW_TO_USE_AI_AUTOMATION.md)
- [AI Workflow Map](reference/AI_WORKFLOW_MAP.md)
- [AI Skills and Commands Playbook](AI_SKILLS_COMMANDS_PLAYBOOK_FULL.md)
- Project map: `.cursor/rules/00-project-map.mdc`
