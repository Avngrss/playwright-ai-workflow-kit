# Getting started

From a fresh clone to a green sign-in smoke and the first feature plan. The everyday path after that
is in [Workflow](workflow.md).

## Prerequisites

- Node.js and npm (the CI uses Node 20), Git.
- Cursor with this folder open. The rules, skills and slash commands load from `.cursor/`.
- The Playwright MCP from `.cursor/mcp.json`, enabled in Cursor. The agent uses it to look at the
  live app.
- A test environment of the app (dev or QA) and a **test account** for it, not your personal one.
  Sign in with it by hand once before you give it to the tests.
- Optional: an MCP server or API access for your TMS and tracker, so the agent can read cases and
  tickets. Without one, you paste them into the chat.

## 1. Install

```bash
npm install
```

This also installs the Chromium build that this Playwright version runs (postinstall). Set
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to skip it, and install it later with `npm run browsers:install`.
Firefox and WebKit are needed only for `@cross-browser` tests — the runs that need them download them once
(`npm run browsers:install:all` does it in advance).

## 2. Create `.env`

```bash
npm run env:prepare
```

This creates `.env` from `.env.example`. It refuses to run while git would commit `.env`. From now on
the agent changes `.env` only through this script. It writes addresses and adds empty entries, and it
prints names and filled/empty only, never a value. **You type logins, passwords and secrets into
`.env` yourself.** Do not type them into the chat (see [Security and data](security-data-handling.md)).

## 3. Check the empty kit

```bash
npm run qa:gate     # the suite's conventions, then tsc
npm run test:list   # lists the tests without running them
```

Both pass with zero tests. If one fails on a fresh clone, report the failure as it is. Do not work
around it.

## 4. Add the first app: `/setup app`

```text
/setup app https://qa.shop.example.com
```

The setup skill (§2, Add an app):

- turns the template's `default` rows in `specs/project-map.md` §Apps and services into your app's
  rows. The first app keeps `UI_BASE_URL` / `API_BASE_URL`.
- saves the address with `env:prepare`.
- runs `npm run app:add -- <app>`. This creates `src/fixtures/<app>/` with `data.fixture.ts`,
  `pages.fixture.ts` and `test.ts` (the `test` that the app's specs import).
- goes on to set up sign-in (step 5), then runs the app's first sign-in smoke and `qa:gate`.

The app gets a kebab-case slug (`shop`). The report names it, and you can rename it there before any
test exists.

## 5. Set up sign-in: `/setup sign-in`

`/setup app` goes on to sign-in, the setup skill's §3. Run `/setup sign-in` yourself if you chose
"Later" there, or later to change how tests sign in or fix a broken sign-in; another role is
`/setup another account or role`.

1. The agent opens the app signed out and finds the sign-in flow. It never submits a form.
2. It prepares empty entries such as `SHOP_LOGIN`, `SHOP_PASSWORD` in `.env`. **You fill them** and
   reply `ready`.
3. It writes the app's ```auth block in `specs/project-map.md` §Auth (names of `.env` entries only),
   finds the API and its Swagger/OpenAPI, and chooses where API tests get their credentials.
4. It verifies the result: `npm run auth:check`, then the sign-in smoke.

Blockers such as a one-time code, a captcha or SSO-only sign-in are reported with what the team needs
to provide, and never worked around. Details: [Auth strategy](auth-strategy.md).

## 6. Run the gate and the smoke

```bash
npm run qa:gate
npm run test:smoke
```

The sign-in smoke (`tests/smoke/sign-in.smoke.spec.ts`, part of the template, never edited) checks,
per app, that the first account signs in to the web app, that the API accepts its session, and that
a signed-out visitor is sent to sign in. A public app (no sign-in at all) gets one test instead: "The
web app opens". Every other test of the app waits for it, so a dead stand stops the run early. Until
the app has an ```auth block, the smoke is skipped.

## 7. Plan the first feature

```text
/plan Account → Addresses, API + UI
```

The agent asks only what it cannot find out, checks the feature on the stand and shows a plan to
confirm. No test is written before you say yes. After your yes, the same run writes the tests
(`/implement`) and verifies them (`/verify`). Continue with [Workflow](workflow.md).

## Where things live

| Path | What |
|---|---|
| `specs/project-map.md` | the project map: apps, `.env` names, ```auth blocks, TMS case links, tags, locks. Code and the gate read it |
| `specs/known-bugs.md` | confirmed bugs the suite tracks |
| `specs/<app>/<area>/<feature>/<feature>.md` | a feature's plan |
| `specs/e2e/<app>/<area>/<journey>.md` | an E2E journey's plan |
| `tests/<api\|ui>/<app>/<area>/<feature>/<feature>.<layer>.spec.ts` | a feature's tests |
| `tests/e2e/<app>/<area>/<journey>.e2e.spec.ts` | a journey's test |
| `tests/smoke/sign-in.smoke.spec.ts` | the template's sign-in smoke |
| `src/fixtures/<app>/`, `pages/<app>/`, `components/<app>/`, `api/clients/<app>/`, `data/…/<app>/` | the app's support code |
| `state/` | saved sign-in sessions (git-ignored) |
| `reports/run-summary.md`, `reports/allure/` | the last run's summary and the Allure results |

An app's folders appear with its first plan and test. They are never created empty in advance. Every
npm script is listed in `.cursor/rules/00-project-map.mdc`. The strategy in one page is
[docs/test-strategy.md](test-strategy.md).
