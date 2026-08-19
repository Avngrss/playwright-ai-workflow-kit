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
| `npm run test:smoke` / `test:regression` | Tag filters |
| `npm run test:report` | Tests + fresh Allure report |

---

## Documentation

- [Getting started](docs/getting-started.md) — install, env, folders, CI
- [Quick flow](docs/quick-flow.md) — plan → implement → review for one feature
- [Auth strategy](docs/auth-strategy.md) — how login/session is declared per project
- [Long flow](docs/long-flow.md) — TMS, collections, audit, E2E, heal
- [Commands](docs/commands.md) — slash-command templates
- [Prompts](docs/prompts.md) — paste-ready prompts
