# Playwright AI Workflow Kit

Starter repository for **Playwright + TypeScript** test automation with **Cursor rules, skills and
slash commands**.

Create your own repository from it on GitHub, add your application, and let the agent plan and write
tests under rules it cannot quietly break. The kit ships with **no application tests** — only the
sign-in smoke of the template. It ships the whole mechanism around them: sign-in from a project map,
test data with cleanup, readable failures with a verdict, case links and coverage, and a quality gate.

---

## See it in action

The [`demo/todomvc`](https://github.com/Avngrss/playwright-ai-workflow-kit/tree/demo/todomvc) branch is
this kit after one pass of its workflow on a public app, [TodoMVC](https://demo.playwright.dev/todomvc):
the app registered in the map, a feature planned from the live screen, the tests written and run.

| What | Where |
|---|---|
| The app in the map — one web app, no sign-in | [specs/project-map.md](https://github.com/Avngrss/playwright-ai-workflow-kit/blob/demo/todomvc/specs/project-map.md) |
| The plan — 5 cases, 2 left for later with the reason, browsers / phone / screenshots decided from the live screen | [specs/todomvc/todos/todo-list/todo-list.md](https://github.com/Avngrss/playwright-ai-workflow-kit/blob/demo/todomvc/specs/todomvc/todos/todo-list/todo-list.md) |
| The tests — each one reads as its case | [tests/ui/todomvc/todos/todo-list/todo-list.ui.spec.ts](https://github.com/Avngrss/playwright-ai-workflow-kit/blob/demo/todomvc/tests/ui/todomvc/todos/todo-list/todo-list.ui.spec.ts) |
| The Page Object and what the screen should show | [src/pages/todomvc/todo-list.page.ts](https://github.com/Avngrss/playwright-ai-workflow-kit/blob/demo/todomvc/src/pages/todomvc/todo-list.page.ts), [src/assertions/todomvc/todo-list.ts](https://github.com/Avngrss/playwright-ai-workflow-kit/blob/demo/todomvc/src/assertions/todomvc/todo-list.ts) |

![The Allure report of the demo run: app › area › feature › layer](https://raw.githubusercontent.com/Avngrss/playwright-ai-workflow-kit/refs/heads/demo/todomvc/docs/images/allure-tree.png)

![One test in the report: its steps, worded as the case](https://raw.githubusercontent.com/Avngrss/playwright-ai-workflow-kit/refs/heads/demo/todomvc/docs/images/allure-test.png)

When a test fails, the report says what the failure most likely means and what to check by hand. Below,
the failure was made on purpose — the test was changed to expect "2 items left":

![A failing test in the report: the verdict, what differs, the page and what to check by hand](https://raw.githubusercontent.com/Avngrss/playwright-ai-workflow-kit/refs/heads/demo/todomvc/docs/images/allure-failure.png)

Run it yourself — no account needed:

```bash
git clone -b demo/todomvc https://github.com/Avngrss/playwright-ai-workflow-kit.git todomvc-demo
cd todomvc-demo
npm install
npm run env:prepare    # .env with the demo app's address from .env.example
npm test               # 6 passed, 1 skipped (the sign-in check of an app without sign-in)
npm run allure:open
```

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
| `src/fixtures/` | The shared chain `base → reporting → api → auth → data → pages → test.ts`, and per app `src/fixtures/<app>/` (its clients, data and Page Objects); specs import only `src/fixtures/<app>/test` |
| `src/setup/` | Sign-in (`auth/`), app-wide overlays and loading signs, request capture, sweeps of leftovers, known bugs, the map reader |
| `src/assertions/`, `src/data/`, `src/reporting/`, `src/logging/` | Checks (`shared/` and per app), builders / generators / datasets / sweeps, the readable report, a logger that never prints secrets |
| `src/pages/<app>/`, `src/components/<app>/`, `src/api/clients/<app>/` | Page Objects, components and API clients — created with the first tests that need them |
| `scripts/` | Quality gate, test runner, sign-in check, coverage, app and env helpers |
| `playwright.config.ts` | Projects per app: `smoke`, `api`, `ui`, `e2e`, plus `firefox`, `webkit`, `mobile` for tagged tests |
| `allurerc.mjs` | Allure 3: one report for all apps and one per app, tree by app, area, feature and layer |
| `collections/bruno/` | Curated API request collections — planning input, never a source of tests |
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
| **Playwright MCP** | The agent explores the live app before writing a test (`.cursor/mcp.json`, with `--caps=storage` to load a saved session) |
| **Node 20** | The CI runtime |

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

When the product changes, the plan is refreshed first (`/plan <plan> — <what changed>`); a heal fixes only the
test's mechanics against requirements that still hold.

### Test layers

| Layer | Project | Spec | What it proves |
|---|---|---|---|
| **API** | `api:<app>` | `tests/api/<app>/<area>/<feature>/<feature>.api.spec.ts` | what the server stores and returns, statuses, rules, access — no browser |
| **UI** | `ui:<app>` (desktop Chrome, 1280×720) | `tests/ui/<app>/<area>/<feature>/<feature>.ui.spec.ts` | one screen: what it shows, what the browser checks itself, that the form reaches the server, the messages |
| **E2E** | `e2e:<app>` | `tests/e2e/<app>/<area>/<journey>.e2e.spec.ts` | a journey across pages, roles or services ending in an outcome only it produces |
| **Smoke** | `smoke:<app>` (the sign-in check); a feature's one `@smoke` test runs in its own layer | `tests/smoke/sign-in.smoke.spec.ts` | is the stand alive — every other project of the app waits for the sign-in check |
| Browsers, phone | `firefox:<app>`, `webkit:<app>`, `mobile:<app>` (Pixel 5) | the same UI specs, tests tagged `@cross-browser` / `@responsive` | a control engines treat differently, a screen that changes on a phone |
| Screenshots | `ui:<app>` | a checkpoint inside a UI test, tagged `@visual` | a stable state whose look matters, against a baseline you approved |

A case belongs where its failure would point; a case is written on every layer it needs, or not at all.

### How tests are written

| Convention | What it means |
|---|---|
| A test reads as its case | the title is the outcome, `test.step`s are the case's steps, every check is named (`expect(x, "Delivery address")`) |
| Page Objects and components | locators, actions and readers only — no `expect`, no data, no network listening; one action of the case is one method |
| Expected values | `shown<Block>(…)` in `src/assertions/<app>/` — the block as the screen shows it, never assembled in the spec |
| Tags | one layer tag and `@regression` on every test; `@smoke`, `@visual`, `@cross-browser`, `@responsive` only from the plan; quarantine `@wip` / `@flaky` with its reason |
| Hooks | `beforeEach` only opens the page; signing in comes from the `role` option, never a login in a hook |
| Data and cleanup | the plan names one source per case; created data carries the `AQA` marker and is removed by the test, leftovers are swept |
| Isolation | tests run in parallel and depend on nothing; what tests share on the stand is a registered lock |
| Settings and secrets | specs never read `process.env` or name `.env`; secrets are typed by you into `.env`, never into the chat |

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
| Browsers, phone, screenshots | every plan with UI cases decides them from a probe of the live screens (controls engines treat differently, the screen at phone width, stable states); you say no to any at the confirm; tagged tests also run in Firefox, WebKit and a phone during verify |
| Reports | console list, Playwright HTML (`playwright-report/`) and Allure (`reports/allure/` — all apps and one per app); `.env` secrets scrubbed from traces and attachments before any reporter sees them |
| Planning sources | OpenAPI / Swagger (the contract — it wins), Bruno collections, TMS cases read through its MCP or API (never written without your yes), tickets, requirement docs, your own words |

### Environment and URLs

- Every address and account has a `.env` name from the map; `/setup` writes the names and the addresses, you type
  logins and passwords. The first app uses `UI_BASE_URL` / `API_BASE_URL`, a further app `<APP>_UI_URL` /
  `<APP>_API_URL` — `/setup app <its URL>` adds it without renaming anything.
- The config and fixtures read `.env`; specs never do. An API address is never derived from a UI address.
- An app under a path (`https://host/shop`) keeps it: addresses in code are relative (`goto("./")`).

### What ships, what each project adds

| In the template | Added per application, as its tests need it |
|---|---|
| rules, skills, commands; the config with projects per app; the fixture chain; sign-in from the map; the readable report and run summary; the quality gate; the sign-in smoke; CI for GitHub and GitLab; the MCP config; docs | the app's rows and ```auth block in the map, `.env` values, plans, specs, Page Objects and components, clients, builders and generators, finders, screenshot baselines, known bugs |

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
| `npm run test:api` / `test:ui` / `test:e2e` | one layer of every app |
| `npm run test:smoke` / `test:regression` / `test:flaky` | smoke / regression / the `@flaky` tests |
| `npm run test:app -- <app> [layer] [--with-browsers]` | one app; `--with-browsers` adds its tagged tests in Firefox, WebKit and a phone |
| `npm run test:visual` / `test:cross-browser` / `test:responsive` | only the screenshots / the browsers / the phone |
| `npm run test:list` | list the tests (zero is valid) |
| `npm run qa:gate` | conventions, then `tsc` — before every commit |
| `npm run auth:check` / `auth:sign-in` | are the .env entries of the map's roles filled? / sign the roles in and save their sessions |
| `npm run suite:coverage -- --app <app>` | coverage per case |
| `npm run data:sweep` | remove `AQA`-marked leftovers from the stand (also runs around every test run) |
| `npm run allure:report` / `allure:open` | the report |
| `npm run env:prepare` / `app:add` | used by `/setup`: `.env` names, an app's fixtures |

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

---

## Known limitations

- **Cursor only, for now.** The rules, skills and commands are written for Cursor (`.cursor/`). Other agents
  (Claude Code, GitHub Copilot, Codex) are planned.
- **Screenshot baselines are per operating system.** Playwright names them by platform (`…-win32.png`,
  `…-linux.png`), so a baseline approved on Windows does not cover the Linux CI: approve the baselines on the
  system that runs them, or keep `@visual` tests out of CI until the Linux ones exist.
- **The agent works with the live app.** `/setup`, `/plan` and `/heal` open your app through the Playwright MCP,
  so the app must be reachable from your machine; an app behind a sign-in needs a test account you create.

---

## License

[MIT](LICENSE) © 2026 Yury Siadou
