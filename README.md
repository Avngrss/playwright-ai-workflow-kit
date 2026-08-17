# Playwright AI Workflow Kit

GitHub: https://github.com/Avngrss/playwright-ai-workflow-kit

This repository is a **Cursor-first starter** for Playwright + TypeScript test automation.

It is not a test suite for a demo product, and it is not an npm package you install with `npm i playwright-ai-workflow-kit`. Clone (or use as a GitHub template), point it at **your** application, then use the slash commands to plan and implement coverage.

The empty `tests/` folder and missing `src/test/**` layer are intentional. Project code appears when you plan a real feature and implement items marked **ready to implement now**.

**Docs:** [Getting started](docs/getting-started.md) · [Quick flow](docs/quick-flow.md) · [Auth strategy](docs/auth-strategy.md) · [Docs index](docs/README.md)

---

## What this kit is

An AI-assisted **workflow plus Playwright skeleton**:

- Cursor **rules** (architecture, pyramid, Page Objects, API schemas, isolation, Allure)
- Cursor **skills** and **slash commands** (`/plan-feature`, `/implement-ui-batch`, `/review-generated`, …)
- Starter `playwright.config.ts`, CI, Allure config, and npm scripts that are valid with **zero tests**
- A **project map** agents must follow: `.cursor/rules/00-project-map.mdc`

Typical loop:

```text
/plan-feature
  → review specs/<feature>/<feature>.md
  → /implement-api-batch and/or /implement-ui-batch   (ready items only)
  → npm run test:api and/or test:ui
  → npm run qa:gate
  → /review-generated
```

Do not ask the agent to “write tests for the app” without a plan. Implement only coverage the plan marks ready.

---

## What this kit is not

- Product tests, Page Objects, fixtures, or builders for a training site
- A published npm library
- BMAD / `_bmad` workflows
- A default Firefox/WebKit/mobile matrix on every run
- TMS result publishing or committed credentials

Those belong to a concrete project after planning.

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

`npm install` is enough. Chromium downloads once unless you set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (or `CI=true`).

Zero tests from `test:list` is the clean starter. Fill `.env` when you add real tests.

---

## Environments and URLs

Simple project (default): one UI app and one API.

```text
UI_BASE_URL=https://your-app-host.example
API_BASE_URL=https://your-api-host.example
```

`playwright.config.ts` reads those two names. Specs must **not** read `process.env`. Do not derive the API host from the UI host.

Multi-app / multi-service project: extra names live in `.env.example` as **comments** (`CUSTOMER_APP_URL`, `ADMIN_APP_URL`, `AUTH_API_URL`, …). They are examples, not registered targets.

To use them:

1. Uncomment only names this product actually has.
2. Register the same names in `.cursor/rules/00-project-map.mdc`.
3. Point Page Objects, API clients, and setup at those targets.
4. Map the same names in `.github/workflows/playwright.yml` only after registration.

Rule: `.cursor/rules/multi-target-environment.rules.mdc`.

Never commit `.env`. CI uses GitHub Variables for URLs and Secrets for passwords/tokens.

If the app needs a logged-in session, declare **Auth Strategy** in the project map before writing authenticated tests. Guide: [Auth strategy](docs/auth-strategy.md).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Convention checks plus `tsc --noEmit` |
| `npm run test:list` | Discover tests (zero is valid) |
| `npm test` | Baseline: `api` + `ui-chromium` + `e2e` |
| `npm run test:api` / `test:ui` / `test:e2e` | One layer |
| `npm run test:smoke` / `test:regression` | Tag filters |
| `npm run test:report` | Tests, then a fresh Allure report |

Default UI/E2E runs use Chromium. `@cross-browser` and `@responsive` scripts exist for **planned** extra coverage only.

Allure: only `reports/allure/allurerc.mjs` is in git. `results/` and `html/` are generated locally and ignored.

---

## Source of truth

`.cursor/rules/00-project-map.mdc` — paths, tags, Playwright projects, env names, auth, CI.

Agents must not invent tests, env names, tags, auth mechanisms, or folder layout.
