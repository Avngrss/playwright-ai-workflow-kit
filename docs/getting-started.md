# Getting started

Clone, install, env, and where files live. Then go to [Quick flow](quick-flow.md).

---

## Setup

1. Clone or copy the repository.
2. Install:

   ```bash
   npm install
   ```

3. If the project needs URLs:

   ```bash
   cp .env.example .env
   ```

   Simple project: fill `UI_BASE_URL` (browser) and `API_BASE_URL` (API).

   Several UI apps or API services: uncomment only the names this product has in `.env.example` (for example `CUSTOMER_APP_URL`, `ADMIN_APP_URL`, `AUTH_API_URL`), then register the **same** names in `.cursor/rules/00-project-map.mdc` before tests use them. Do not invent names in specs. Do not derive an API host from a UI host.

   Specs must not read `process.env`. Never commit `.env`.

4. Confirm the empty starter:

   ```bash
   npm run qa:gate
   npm run test:list
   ```

Zero tests is valid.

Chromium downloads once per machine on `npm install`. API-only: set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` before install. Later: `npm run browsers:install` if needed.

---

## MCP

| Tool | Where |
|------|--------|
| Playwright MCP | Project `.cursor/mcp.json` (safe to commit) |
| TMS, if you use one | User/global Cursor settings — not the repo |

TMS is optional and read-only by default. Do not commit tokens.

---

## Folders

Already in the starter: `.cursor/`, `docs/`, `playwright.config.ts`, `.env.example`.

Created when you start a real project:

| Path | What |
|------|------|
| `specs/<feature>/<feature>.md` | Feature plan |
| `specs/e2e/<area>/<journey>.md` | E2E plan |
| `tests/api/**`, `tests/ui/**`, `tests/e2e/**` | Specs |
| `src/test/**` | Page Objects, fixtures, helpers, data |

Do not create `src/test/**` empty. Skills create it on first implementation.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Convention checks plus TypeScript |
| `npm run test:list` | List tests |
| `npm test` | Baseline: `api` + `ui-chromium` + `e2e` |
| `npm run test:api` / `test:ui` / `test:e2e` | One layer |
| `npm run test:smoke` / `test:regression` | Tag filters |
| `npm run test:report` | Tests, then Allure |

`npm test` is not a browser matrix. All scripts work with zero tests.

---

## CI

`.github/workflows/playwright.yml` always runs `qa:gate` and `test:list`. Matrix jobs run only when tests exist.

URLs → GitHub Variables. Passwords and tokens → GitHub Secrets.

---

Next: if the app needs login, tell the agent how (helper, roles, session files — not tokens) and update the project map. Guide: [Auth strategy](auth-strategy.md). Then [Quick flow](quick-flow.md). [Long flow](long-flow.md) is the extra-command menu.
