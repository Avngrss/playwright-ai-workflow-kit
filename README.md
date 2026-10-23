# Playwright AI Workflow Kit

Starter repository for **Playwright + TypeScript** test automation with **Cursor rules, skills and
slash commands**.

Create your own repository from it on GitHub, add your application, and let the agent plan and write
tests under rules it cannot quietly break. The kit ships with **no application tests** — only the
sign-in smoke of the template. It ships the whole mechanism around them: sign-in from a project map,
test data with cleanup, readable failures with a verdict, case links and coverage, and a quality gate.

---

## Quick start

1. On this repository's GitHub page, click **Use this template** → **Create a new repository**, and
   create your own copy (yours to change; this kit stays as it is).
2. Clone **your new repository** and install:

   ```bash
   git clone https://github.com/<you>/<your-repo>.git
   cd <your-repo>
   npm install            # also installs Chromium
   npm run env:prepare    # creates .env from .env.example — you fill the values, never commit it
   ```

3. Open the folder in Cursor and turn on the `playwright` MCP server it lists (Cursor Settings → MCP;
   `.cursor/mcp.json`) — the agent explores your app with it. Then type in the chat:
   - `/setup` — registers your application and sets up how tests sign in (a fresh clone is checked
     first: `test:list` and `qa:gate` pass with zero tests);
   - `/plan` — the first feature's plan; answer **Yes, write them** and the same run writes the tests,
     runs them, heals a failure once, reviews and sums up with one next command.

   `/implement` and `/verify` on their own are for later runs (the rest of a plan, a rerun); `/heal` for a
   failing run, `/coverage` for a TMS folder.

Step by step: [docs/getting-started.md](docs/getting-started.md).

---

## What is in the repo

| Area | Purpose |
|------|---------|
| `.cursor/rules/` | 10 rules the agent follows: 3 always-on, the rest by file |
| `.cursor/skills/` | 4 skills, step-by-step procedures: setup, plan, implement, verify (with its Heal and Coverage sections) |
| `.cursor/commands/` | 6 slash commands, each opening a skill: `/setup`, `/plan`, `/implement`, `/verify`, `/heal`, `/coverage` |
| `specs/project-map.md` | **The project map** — apps, URLs, sign-in, external systems, TMS case links, tags, test locks. Code and gate read it |
| `specs/known-bugs.md` | Confirmed bugs the suite tracks (the test turns grey at its step) |
| `specs/<app>/<area>/<feature>/` | Feature plans, written before any test |
| `tests/<api\|ui>/<app>/<area>/<feature>/` | Specs; `tests/smoke/` holds the template's sign-in check |
| `specs/e2e/<app>/<area>/`, `tests/e2e/<app>/<area>/` | E2E journeys: a plan and a spec per journey, no feature level |
| `src/` | Fixtures, sign-in, data and cleanup, assertion helpers, reporting |
| `scripts/` | Quality gate, test runner, sign-in check, coverage, app and env helpers |
| `playwright.config.ts` | Projects per app: `smoke`, `api`, `ui`, `e2e`, plus `firefox`, `webkit`, `mobile` for tagged tests |
| `.github/workflows/`, `ci/gitlab/` | CI: gate, secret scan, test list, test matrix |
| `docs/` | Guides for people — start with [docs/test-strategy.md](docs/test-strategy.md) |

The agent's entry point is `.cursor/rules/00-project-map.mdc`: where the map lives, every npm
script, the projects and CI.

---

## Under the hood

### Control stack

```text
.cursor/rules/      ← 10 rules: 3 always-on (project map and layout, workflow, guardrails), the rest by file
.cursor/skills/     ← 4 skills (setup, plan → implement → verify, which also heals, reviews and shows coverage)
.cursor/commands/   ← 6 short entries into the skills
specs/project-map.md← the living registry the code and gate read
scripts/gate/       ← what is enforced, not advised: npm run qa:gate, then tsc
```

### Core stack

| Piece | Role |
|-------|------|
| **Playwright Test** 1.6x | Browser and API tests, parallel runs, `lock` for tests that share state |
| **TypeScript** 7 (strict, `noUnusedLocals`) | Typed specs and support code; `tsc` is part of the gate |
| **Allure 3** | Report tree by app, area, feature and layer; readable steps |
| **dotenv** | `.env` values for the config and fixtures only — specs never read `process.env` |
| **Playwright MCP** | The agent explores the live app before writing a test |

### How a feature gets tested

1. **Plan first** (`/plan`; on an existing plan it starts a later pass or a refresh by itself). The
   source is TMS cases, a ticket, a requirements doc, an API collection or plain words, checked
   against the live app. Every case gets a status — ready, blocked,
   postponed or cannot be automated — with its reason, and the layers it needs (API, UI, both, or an
   E2E journey). Preconditions are proven on the stand before the plan is shown; you confirm the
   plan in chat before any test is written.
2. **Implement only ready cases** (`/implement`). A case is automated whole, on every layer it
   needs, or not at all. A UI test reads as its case: actions are Page Object methods, checks are
   named.
3. **Verify** (`/verify`): one targeted run without retries, the gate, one automatic heal after a
   fresh implement, a review of only what the gate cannot check, then a summary that leads with the
   verdict.
4. **Heal** (`/heal`) from the failure's verdict — the smallest fix at the real layer; a confirmed
   product bug becomes a row of `specs/known-bugs.md`, a ticket only with your yes.
5. **Coverage** (`/coverage`): every case of a TMS folder — automated, not automated (with the
   reason) or inconsistent.

### What is built in

| Capability | How |
|---|---|
| Sign-in from the map | an ```auth block per app; UI form or custom, API token, refresh token, session, key, basic …; one sign-in per role per run; a refused password is never retried |
| Test data | sources none / stand / API setup / UI setup / mocked; `AQA`-marked data removed by the test; leftovers swept before and after every run |
| Shared stand | items tests change are listed with a lock; a test reading one without the lock fails at once |
| Readable failures | each failure opens with a verdict (possible bug, stand or data, test needs fixing …) and what to check by hand; `reports/run-summary.md` and `.json` |
| Known bugs | `specs/known-bugs.md`; the test is grey while it fails at its step, red when it changes |
| Case links and coverage | tests link their TMS case through the map's case link line; `npm run suite:coverage` |
| Quality gate | layout, tags per test, fixture chain, Page Object rules, repeats, whole-case coverage, "a UI test reads as its case", masked attachments, no secrets in specs; then `tsc` |
| Shared code on request | the template's own files (sign-in, reporting, the shared fixtures and checks, `scripts/`) change only when you ask; the summary names every such change |
| More browsers | `@cross-browser` → Firefox and WebKit, `@responsive` → a phone, `@visual` → screenshot comparison |

### CI

`.github/workflows/playwright.yml` runs the gate, a secret scan and the test list, then — once feature
tests exist — smoke, regression, visual, cross-browser and responsive jobs with Allure artifacts. The
GitLab version is `ci/gitlab/gitlab-ci.yml` (copy it to `.gitlab-ci.yml` at the root). URLs and
accounts come from CI variables named like the `.env` entries of the map. **GitHub** passes only what the
workflow names: add each `.env` name of the map to the test job's `env:` — `vars.<NAME>` for addresses,
`secrets.<NAME>` for logins, passwords and keys. GitLab hands its CI/CD variables to the job itself.

---

## Scripts

The full table is in `.cursor/rules/00-project-map.mdc`. The ones you use most:

| Script | What it does |
|---|---|
| `npm test` | every layer of every app |
| `npm run test:smoke` / `test:regression` | smoke / regression |
| `npm run test:app -- <app> [layer]` | one app |
| `npm run qa:gate` | conventions, then `tsc` — before every commit |
| `npm run auth:check` / `auth:sign-in` | are the .env entries of the map's roles filled? / sign the roles in and save their sessions |
| `npm run suite:coverage -- --app <app>` | coverage per case |
| `npm run allure:report` / `allure:open` | the report |

---

## Documentation

- [docs/test-strategy.md](docs/test-strategy.md) — the strategy in one page
- [docs/getting-started.md](docs/getting-started.md) — from clone to the first green smoke
- [docs/workflow.md](docs/workflow.md) — the 6 commands, the everyday path, the other paths (an
  existing plan, TMS, E2E journeys, collections, visual and cross-browser, a second app), where
  reviews, audits and refactors live, what you will see in the chat, example prompts
- [docs/auth-strategy.md](docs/auth-strategy.md) — how tests sign in
- [docs/failure-reporting.md](docs/failure-reporting.md) — how to read a failure
- [docs/security-data-handling.md](docs/security-data-handling.md) — secrets and sensitive data
