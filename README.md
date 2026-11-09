# Playwright AI Workflow Kit

Starter repository for **Playwright + TypeScript** test automation with **Cursor rules, skills and
slash commands**.

Create your own repository from it on GitHub, add your application, and let the agent plan and write
tests under rules it cannot quietly break. The kit ships with **no application tests** — only the
sign-in smoke of the template. It ships the whole mechanism around them: sign-in from a project map,
one owner and one test per scenario, test data with cleanup, a check that every new test can fail,
readable failures with a verdict and the next step, case links and coverage, and a quality gate.

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
   `.cursor/mcp.json`) — the agent explores your app with it (without it, through a short Playwright
   script). Then type in the chat:
   - `/setup` — registers your application and sets up how tests sign in (a fresh clone is checked
     first: `test:list` and `qa:gate` pass with no feature tests — the template's sign-in smoke is
     listed, skipped until an app has an ```auth block);
   - `/plan` — the first feature's plan; answer **Yes, write them** and the same run writes the tests,
     checks them with one `npm run verify`, heals a failure once and sums up with one next command —
     for new tests, the `/review` line to paste into a new chat.

   The other commands are for later runs: the table below.

Step by step: [docs/getting-started.md](docs/getting-started.md).

### Already have a repository?

The kit can also live in a folder of your product's repository, for example `qa/`:

1. Copy the kit's files into the folder (without its `.git`). Its own `.gitignore` comes along and keeps `.env`,
   `state/` and the reports out of git from there.
2. In the folder: `npm install`, then `npm run env:prepare`.
3. Open **that folder** in Cursor — the rules, skills and commands load from its `.cursor/`.
4. CI: copy `.github/workflows/playwright.yml` to the repository's own `.github/workflows/` (GitLab:
   `ci/gitlab/gitlab-ci.yml` to `.gitlab-ci.yml` at the root) and follow the note at its top — the working
   directory, the cache path and `qa/` in front of its paths.

The scripts work from the folder as they are: the gate, the test list and `npm run verify` with its check that
a new test can fail.

---

## Commands

Type them in Cursor's chat; each one asks for what you leave out.

| Command | When |
|---|---|
| `/setup` | register an app, set up how its tests sign in, add another account or role |
| `/plan` | plan a feature or an E2E journey; on an existing plan: a later pass, one or two cases, an alignment with the TMS, or a refresh after a product or rule change |
| `/implement` | write a plan's ready cases — the rest of a plan, or a plan from another chat; `Layer: visual` for a screenshot test |
| `/verify` | check what was written or healed: one `npm run verify`, the report, the reviews, a summary led by the verdict |
| `/heal` | one or two red tests, each from its verdict; `/heal explain` only explains the failures |
| `/triage` | three or more red tests, or a CI run: every failure sorted, every changed expectation traced to its source |
| `/coverage` | a TMS folder case by case — read-only |
| `/review` | an independent review of new tests, in a **new chat** — the verify summary gives the line to paste |

Which one comes after a run: a product or rule change you can name → `/plan <plan> — <what changed>`, even
with red tests at hand; one or two red tests → `/heal`; three or more, or a CI run → `/triage`. The run
summary's last line names the one it needs.

---

## What is in the repo

| Area | Purpose |
|------|---------|
| `.cursor/rules/` | 10 rules the agent follows: 3 always-on, the rest by file |
| `.cursor/skills/` | 4 skills, step-by-step procedures: setup, plan, implement, verify (with its Heal, Coverage and Triage sections) |
| `.cursor/commands/` | 8 slash commands: `/setup`, `/plan`, `/implement`, `/verify`, `/heal`, `/coverage`, `/triage` open a skill; `/review` is the brief of an independent review, run in a new chat |
| `specs/project-map.md` | **The project map** — apps, URLs, sign-in, external systems, TMS case links, tags, test locks. Code and gate read it |
| `specs/known-bugs.md` | Confirmed bugs the suite tracks (the test turns grey at its step) |
| `specs/<app>/<area>/<feature>/` | Feature plans, written before any test |
| `tests/<api\|ui>/<app>/<area>/<feature>/` | Specs; `tests/smoke/` holds the template's sign-in check |
| `specs/e2e/<app>/<area>/`, `tests/e2e/<app>/<area>/` | E2E journeys: a plan and a spec per journey, no feature level |
| `src/fixtures/` | The shared chain `base → reporting → api → auth → data → pages → test.ts`, and per app `src/fixtures/<app>/` (its clients, data and Page Objects); specs import only `src/fixtures/<app>/test` |
| `src/setup/` | Sign-in (`auth/`), app-wide overlays and loading signs, request capture, the stand search, sweeps of leftovers, known bugs, the map reader |
| `src/assertions/`, `src/data/`, `src/reporting/`, `src/logging/` | Checks (`shared/` and per app), builders / generators / datasets / sweeps, the readable report and run summary, a logger that never prints secrets |
| `src/pages/<app>/`, `src/components/<app>/`, `src/api/clients/<app>/` | Page Objects, components and API clients (with the app's answer types, `contract.client.ts`) — created with the first tests that need them |
| `scripts/` | Quality gate, test runner, `verify`, sign-in check, coverage, plan blocks and test skeletons, the stand search, API types, app and env helpers |
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
.cursor/skills/     ← 4 skills (setup, plan → implement → verify, which also heals, triages, reviews and shows coverage)
.cursor/commands/   ← 8 commands: 7 short entries into the skills, and /review — the brief of an independent review
specs/project-map.md← the living registry the code and gate read
scripts/gate/       ← what is enforced, not advised: npm run qa:gate, then tsc
```

### Core stack

| Piece | Role |
|-------|------|
| **Playwright Test** 1.6x | Browser and API tests, parallel runs, `lock` for tests that share state |
| **TypeScript** 7 (strict, `noUnusedLocals`) | Typed specs and support code; `tsc` is part of the gate |
| **Zod** + **openapi-typescript** | Answer schemas of the fields tests read, typed from the app's OpenAPI contract (`npm run api:types`) |
| **Allure 3** | Report tree by app, area, feature and layer; readable steps |
| **dotenv** | `.env` values for the config and fixtures only — specs never read `process.env` |
| **Playwright MCP** | The agent explores the live app before writing a test (`.cursor/mcp.json`, with `--caps=storage` to load a saved session) |
| **Node 22** | The CI runtime |

### How a feature gets tested

1. **Plan first** (`/plan`; on an existing plan it starts a later pass, one or two cases, an alignment or
   a refresh by itself). The source is TMS cases, a ticket, a confirmed bug, a requirements doc, an API
   collection or plain words, checked against the live app. A case is split into **scenarios** — one
   obligation that fails on its own — and each scenario gets **one owner** (API, UI or E2E: where its
   failure would point) and a **route**: how its test proves the result. Every case gets a status —
   ready, blocked, postponed or cannot be automated — with its reason; no case is blocked before its rule,
   its data (every account and tenant: `npm run stand:find`) and a way to make it were searched.
   Preconditions are proven on the stand before the plan is shown; you confirm the plan in chat before
   any test is written.
2. **Implement only ready cases** (`/implement`). A case is automated whole — every scenario its one
   test in its owner's folder — or not at all. Each test starts as `npm run spec:draft`; a UI test reads
   as its case: actions are Page Object methods, checks are named.
3. **Verify** (`/verify`): one `npm run verify` (below), the Allure report, one automatic heal after a
   fresh implement, a review of only what the gate cannot check, then a summary that leads with the
   verdict.
4. **Review independently** (`/review`, in a new chat): a reader who did not write the tests sees only
   the cases, the plan's data and rules, the tests and the run's report, and names where a test would
   pass although its case is broken.
5. **Heal or triage.** `/heal` takes one or two red tests from their verdicts — the smallest fix at the
   real layer. `/triage` takes three or more, or a CI run: every failure sorted, every changed
   expectation traced to a quoted source or asked as "is this intended?". A confirmed product bug becomes
   a row of `specs/known-bugs.md`, a ticket only with your yes.
6. **Coverage** (`/coverage`): every case of a TMS folder — automated, to rework (a scenario tested
   twice, written before routing), not automated (with the reason) or inconsistent.

When the product changes, the plan is refreshed first (`/plan <plan> — <what changed>`); a heal fixes only the
test's mechanics against requirements that still hold.

### How a test is checked

One command — `npm run verify -- <app> <spec[:line]…>`. The proof is one green run without a retry,
and each new check seen red once with its expected value spoiled; no second green run is asked for.

1. **The gate** — `qa:gate` and `tsc`; while it fails, nothing runs.
2. **Can fail** — the expected value of each check the run wrote or changed is spoiled
   (`--can-fail <spec>:<line>=<the line spoiled>`); the test must go red at that line. Every line is put
   back and each file's hash proven; a check that stays green is blind and gets fixed.
3. **One run** with `--retries=0` — a pass on a retry is unstable, not green — with the neighbours that
   call what the run changed (`--also`), and `--with-browsers` for tests tagged `@cross-browser` or
   `@responsive`. A test that failed because the stand was slow or down gets one second pass.
4. **One block** of results, every number copied from the result files (`test-results/verify.json`): the
   verdict, each test's outcome, can-fail, the cases' coverage, the time.

### Test layers

| Layer | Project | Spec | What it proves |
|---|---|---|---|
| **API** | `api:<app>` | `tests/api/<app>/<area>/<feature>/<feature>.api.spec.ts` | what no screen shows: another input of a rule, access the page never tries, the contract, a file's content — no browser |
| **UI** | `ui:<app>` (desktop Chrome, 1280×720) | `tests/ui/<app>/<area>/<feature>/<feature>.ui.spec.ts` | one screen: the answer its own action got from the server, what the screen shows, what the browser checks itself, the messages |
| **E2E** | `e2e:<app>` | `tests/e2e/<app>/<area>/<journey>.e2e.spec.ts` | a journey across pages, roles or services ending in an outcome only it produces |
| **Smoke** | `smoke:<app>` (the sign-in check); a feature's one `@smoke` test runs in its own layer | `tests/smoke/sign-in.smoke.spec.ts` | is the stand alive — every other project of the app waits for the sign-in check |
| Browsers, phone | `firefox:<app>`, `webkit:<app>`, `mobile:<app>` (Pixel 5) | the same UI specs, tests tagged `@cross-browser` / `@responsive` | a control engines treat differently, a screen that changes on a phone |
| Screenshots | `ui:<app>` | a test of its own in `<feature>-visual.ui.spec.ts`, tagged `@visual` | a stable state whose look matters, against a baseline you approved |

A scenario belongs where its failure would point: one owner, one test — a UI test never re-proves what
its API test proves. A case is written whole, every scenario, or not at all.

### How tests are written

| Convention | What it means |
|---|---|
| A test reads as its case | the title is the outcome, `test.step`s are the case's steps, every check is named (`expect(x, "Delivery address")`) |
| The action's answer | a UI step takes the answer its own action got in one line (`answerTo(…)`) and checks the fields its route names — no second request, no API twin |
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
| One scenario, one test | each scenario has one owner and one route in the plan; the gate fails a scenario with two tests, a test outside its owner's folder, or a UI test listening where its route does not |
| Every new check can fail | `npm run verify` with `--can-fail` spoils the expected value of each new or changed check; the test must go red at that line, and every line is put back |
| Test data | sources none / stand / API setup / UI setup / mocked; `AQA`-marked data removed by the test; leftovers swept before and after every run |
| Searched before blocked | `npm run stand:find` looks for what a case needs in every account and tenant; a `Blocked` line ends with where it was searched |
| Shared stand | items tests change are listed with a lock; a test reading one without the lock fails at once |
| Readable failures | each failure opens with a verdict (possible bug, the product changed, stand or data, test needs fixing …) and what to check by hand; a test that failed because the stand was slow or down runs once more at the end; `reports/run-summary.md` and `.json` end with the next step: heal one or two red tests by name, triage three or more |
| Triage with sources | what a test expects changes only with a quoted source — a ticket's field, the product's code at `file:line`, a commit; without one it is a question ("is this intended?") and the test stays as it is |
| Answer types and schemas | `npm run api:types` writes the app's answer types from its OpenAPI contract; a client's schema holds only the fields its tests read, tied to those types; a field missing or retyped fails the type check and reads "API changed" in a run |
| Case blocks and test skeletons | `npm run plan:block` writes a case block in the plan's exact shape — empty, or drafted from a saved TMS case or confirmed bug (`--case`, `--bug`); `npm run spec:draft` writes a test's skeleton from a filled block |
| Independent review | `/review` in a new chat for every new test: only the cases, the plan's `Data:` and `Rules:`, the tests and the run's report; an edited test gets the same five questions in the same chat |
| Known bugs | `specs/known-bugs.md`; the test is grey while it fails at its step, red when it changes |
| Case links and coverage | tests link their TMS case through the map's case link line; `npm run suite:coverage` |
| Quality gate | layout, tags per test, fixture chain, Page Object rules, repeats, routes and whole cases, "a UI test reads as its case", a test still holding its skeleton, a spoiled line not put back, masked attachments, no secrets in specs; then `tsc` |
| Shared code on request | the template's own files (sign-in, reporting, the shared fixtures and checks, `scripts/`) change only when you ask; the summary names every such change |
| Browsers, phone, screenshots | every plan with UI cases decides them from a probe of the live screens (controls engines treat differently, the screen at phone width, stable states); you say no to any at the confirm; tagged tests also run in Firefox, WebKit and a phone during verify |
| Reports | console list, Playwright HTML (`playwright-report/`) and Allure (`reports/allure/` — all apps and one per app); `.env` secrets and session tokens scrubbed from traces and attachments before any reporter sees them |
| Planning sources | OpenAPI / Swagger (the contract — it wins), Bruno collections, TMS cases read through its MCP or API (never written without your yes), tickets, confirmed bugs, requirement docs, your own words |

### Environment and URLs

- Every address and account has a `.env` name from the map; `/setup` writes the names and the addresses, you type
  logins and passwords. The first app uses `UI_BASE_URL` / `API_BASE_URL`, a further app `<APP>_UI_URL` /
  `<APP>_API_URL` — `/setup app <its URL>` adds it without renaming anything.
- The config and fixtures read `.env`; specs never do. An API address is never derived from a UI address.
- An app under a path (`https://host/shop`) keeps it: addresses in code are relative (`goto("./")`).

### What ships, what each project adds

| In the template | Added per application, as its tests need it |
|---|---|
| rules, skills, commands; the config with projects per app; the fixture chain; sign-in from the map; the readable report and run summary; the quality gate; `verify` and the other scripts; the sign-in smoke; CI for GitHub and GitLab; the MCP config; docs | the app's rows and ```auth block in the map, `.env` values, plans, specs, Page Objects and components, clients and answer types, builders and generators, finders, screenshot baselines, known bugs |

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
| `npm run test:failed` | only the last run's failures and the tests it left unrun — to reproduce a failure before a change, never the rerun after one |
| `npm run test:app -- <app>[,<app>…] [layer] [--with-browsers]` | one app (or several); `--with-browsers` adds its tagged tests in Firefox, WebKit and a phone |
| `npm run verify -- <app> <spec[:line]…> [--also …] [--can-fail …] [--with-browsers]` | the gate, each new check proven able to fail, one run with `--retries=0`, one block of results (`--restore` puts back a cut-off spoil) |
| `npm run test:visual` / `test:cross-browser` / `test:responsive` | only the screenshots / the browsers / the phone |
| `npm run test:list` | list the tests (zero is valid) |
| `npm run qa:gate` | conventions, then `tsc` — before every commit |
| `npm run auth:check` / `auth:sign-in` | are the .env entries of the map's roles filled? / sign the roles in and save their sessions |
| `npm run plan:block -- <plan> …` | a plan's next case block in its exact shape — empty, or `--case` / `--bug state/sources/<id>.json` drafted from a saved TMS case or confirmed bug |
| `npm run spec:draft -- <plan> <#>` | a test's skeleton from a filled case block, in its owner's spec |
| `npm run stand:find -- <app> --in "GET <path>" --where "<condition>"` | search every account × tenant for the data a case needs — read-only |
| `npm run api:types [-- <app>]` | the app's answer types from its OpenAPI contract → `src/api/clients/<app>/contract.client.ts` |
| `npm run suite:coverage -- --app <app>` | coverage per case |
| `npm run data:sweep` | remove `AQA`-marked leftovers from the stand (also runs around every test run) |
| `npm run allure:report` / `allure:open` | the report |
| `npm run env:prepare` / `app:add` | used by `/setup`: `.env` names and addresses, edited in place (`-- --tidy` lays the file out by app) / an app's fixtures |

---

## Documentation

- [docs/test-strategy.md](docs/test-strategy.md) — the strategy in one page
- [docs/getting-started.md](docs/getting-started.md) — from clone to the first green smoke
- [docs/workflow.md](docs/workflow.md) — the 8 commands, the everyday path, which command after a run,
  the other paths (an existing plan, TMS, a bug, E2E journeys, collections, visual and cross-browser, a
  second app), where reviews, audits and refactors live, what you will see in the chat, example prompts
- [docs/auth-strategy.md](docs/auth-strategy.md) — how tests sign in
- [docs/failure-reporting.md](docs/failure-reporting.md) — how to read a failure
- [docs/security-data-handling.md](docs/security-data-handling.md) — secrets and sensitive data
- [docs/Layer Routing Algorithm.md](docs/Layer%20Routing%20Algorithm.md) — the design behind one owner and
  one test per scenario: the routes, the duplicates they rule out, what the gate checks

---

## Known limitations

- **Cursor only, for now.** The rules, skills and commands are written for Cursor (`.cursor/`). Other agents
  (Claude Code, GitHub Copilot, Codex) are planned.
- **Screenshot baselines are per operating system.** Playwright names them by platform (`…-win32.png`,
  `…-linux.png`), so a baseline approved on Windows does not cover the Linux CI: approve the baselines on the
  system that runs them, or keep `@visual` tests out of CI until the Linux ones exist.
- **The agent works with the live app.** `/setup`, `/plan` and `/heal` open your app through the Playwright MCP
  (or a short Playwright script without it), so the app must be reachable from your machine; an app behind a
  sign-in needs a test account you create.
- **The Allure report's own page carries an older DOMPurify.** The copy in `node_modules` is fixed by an
  override in `package.json`, but the prebuilt report UI that Allure ships bundles its own until Allure
  releases a build with the fix. Open the report locally and share it with restricted access.
- **`npm audit` lists moderate findings in Allure's report packages** (`glob`, `minimatch` under `allure`):
  they touch only the report build on your machine or in CI, not the tests or your app, and go when Allure
  updates them.

---

## License

[MIT](LICENSE) © 2026 Yury Siadou
