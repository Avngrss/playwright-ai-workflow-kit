# Playwright AI Workflow Kit

npm package: `playwright-ai-workflow-kit`

GitHub: https://github.com/Avngrss/playwright-ai-workflow-kit

A reusable **AI-assisted workflow kit** for **Playwright + TypeScript** automation: rules, skills, commands, docs, and a starter config.

The clean starter has **zero tests** and no `src/test/**` layer. That is expected. Project code is created when you plan and implement coverage for a real application.

**Start here:** [Getting started](docs/getting-started.md) · [Quick flow](docs/quick-flow.md) · [Auth strategy](docs/auth-strategy.md) · [Docs index](docs/README.md)

---

## Included

- Playwright + TypeScript starter config
- Cursor rules, skills, and slash commands
- Plan locations for real projects: `specs/<feature>/<feature>.md` and `specs/e2e/<area>/<journey>.md`
- Baseline-safe npm scripts (`--pass-with-no-tests`)
- Starter GitHub Actions CI
- `.env.example` without real URLs or secrets
- ISC license

## Not included

- Project tests, Page Objects, fixtures, or data builders
- Real credentials or TMS result publishing
- A default browser or mobile matrix
- Faker / random data libraries

Those are added per application through planning and implementation.

---

## Quick start

```bash
npm install
cp .env.example .env
npm run qa:gate
npm run test:list
```

Fill `UI_BASE_URL` and `API_BASE_URL` when needed. Extra env names must be registered in `.cursor/rules/00-project-map.mdc` first.

Typical feature work: [Quick flow](docs/quick-flow.md). Extra commands (TMS, audit, extras, E2E): [Long flow](docs/long-flow.md).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Convention checks |
| `npm test` | Baseline: `api` + `ui-chromium` + `e2e` |
| `npm run test:api` / `test:ui` / `test:e2e` | One layer |
| `npm run test:smoke` / `test:regression` | Tag filters |
| `npm run test:report` | Tests, then a fresh Allure report |

All scripts are valid with zero tests.

---

## Source of truth

`.cursor/rules/00-project-map.mdc` — paths, tags, Playwright projects, apps, services, and env names.
