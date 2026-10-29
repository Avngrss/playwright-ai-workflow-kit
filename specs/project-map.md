# Project map

One map for this **test home**. Do not copy Playwright into sibling product repos.

Fill this file once. Feature plans only pick names that already exist here.
Never put passwords, tokens, or session JSON in this file.

## Test home

- this repo / folder is where tests, Page Objects, and Playwright config live
- sibling product repos (UI apps, APIs) are **targets**, not extra test projects

## Apps and services

| Platform | Name | Kind | Env URL name | Docs (Swagger/OpenAPI) | Notes |
|---|---|---|---|---|---|
| todomvc | todomvc-web | UI | `UI_BASE_URL` | — | Playwright demo TodoMVC; no API — the list lives in the browser (localStorage) |

Add a row per extra app/service. Do not invent env names in specs. Docs column is optional —
when set, planning that service reads it as the primary contract source instead of guessing.

`Platform` is the kebab-case product slug (the app) that becomes the first folder level under
`specs/`, `tests/<layer>/` and `src/fixtures|pages|api/clients|data/…` (see
`.cursor/rules/00-project-map.mdc`). Feature plans only use platform slugs listed here.

**One app or many — the same layout.** Each app is a `Platform` with its own rows — its web app, its
API — and its own `.env` names (the first app keeps `UI_BASE_URL` / `API_BASE_URL`, a further one
uses `<APP>_UI_URL`, `<APP>_API_URL`). From the first app on it has its own Playwright projects
(`ui:<app>`), sign-in block (§Auth), fixtures (`src/fixtures/<app>/`), folders, report label and
tag, so adding an app adds rows, blocks and folders and changes nothing of another app.

## Auth

How tests log in: an ```auth block below, one per app — written by the setup skill the first time
it meets the app (it asks how the app logs in, explores it, verifies the login; format: the skill's
`.cursor/skills/setup/SKILL.md`). No block yet = login not set up. Only **names** of `.env` variables
go here, never values.

- one test account by default; roles (`roles:`, `default role:`) only when tests need users with
  different rights — added here and in `.env`, no code change
- one ```auth block per app, starting with `platform: <app>`; an app on the very same sign-in
  service (the same sign-in page host) says `sign-in like: <app>` and writes only what differs (its
  address, its client id, its own login and password when the shared account is not let in)
- `npm run auth:check` shows which login entries are still empty in `.env`

```auth
platform: todomvc
ui: none
api: none
```

## External systems

Systems an app takes its data from that the tests do not drive themselves — a tracker, an HR or
finance system, a mailbox. Written by the plan skill when a plan first meets one, so the next plan
knows at once what the app cannot tell and what the tests can reach (the plan skill §5 "What the
tests can neither read nor make"). Not a list to fill in advance.

| App | System | What the app takes from it | The tests' access | Facts given by the engineer |
|---|---|---|---|---|

- **The tests' access**: `none` · `read-only — <ENV name>` (a token entered in `.env` by the
  engineer) · `through the app only`.
- **Facts given by the engineer**: the plans that hold such stand data (`<plan> — <what>, <date>`),
  so a changed fact on the stand is traced to the plans it breaks.

## App-wide behaviour

What the app does on its own on any page — overlays that pop up (a promotion pop-up, a cookie banner,
"what's new", "session expired"), the sign that a page has finished loading, and the attribute it marks
its elements for tests with (`test id:`, only when it is not `data-testid`; `getByTestId` reads it). The
kit's skills record them here when they meet them; `src/setup/app-wide.ts` closes the overlays on every page
and Page Objects wait for `appReady(page)` after navigating. Specs and Page Objects never handle them.
Never a toast here: a toast after an action is the app's answer to it — tests check it
(`expectToast`), and a line here would close it before they could. One block per app, starting with
`platform: <app>`.

```app-wide
# dismiss: dialog "<text in the dialog>" by "<button>"
# dismiss: "<text the banner shows>" by "<button>"
# ready when: hidden "<loading text>"
# ready when: hidden role progressbar
# test id: data-test
```

## Playwright projects

Built by `playwright.config.ts` from §Apps and services — nothing to write here:

- per app, from the first app on: `smoke:<app>` (runs first; the app's others depend on it),
  `api:<app>`, `ui:<app>`, `e2e:<app>`, each taking only `tests/<layer>/<app>/` and waiting only for
  its own smoke (before the first app is set up: plain `smoke`, `api`, `ui`, `e2e`)
- one app: `npm run test:app -- <app>` (every layer) or `npm run test:app -- <app> ui` (one layer); one
  layer of every app: `npm run test:ui` (`test:api`, `test:e2e`, `test:smoke`); everything: `npm test`

## Smoke

"Is the stand alive, and does each feature work at all?" — two parts, never stretched by roles:

- **Sign-in** — the template's `tests/smoke/sign-in.smoke.spec.ts` (never edited; skipped until
  login is set up), per app: the first account signs in to the web app, the API accepts its
  session, a signed-out visitor is sent to sign in (an app open to visitors: on its `members only:`
  page). A public app (`ui: none` + `api: none`): one test, "The web app opens". Every other test of
  the app waits for it. A further role's account: `npm run auth:sign-in -- <app> <role|all>`.
- **Features** — at most one test per feature, under the app's first account (a public app: signed
  out), tagged `@smoke` besides `@regression` (`plans.mdc` §Smoke). They run with `npm run test:smoke`
  and in the regression, in their own layer — a red one never stops the other tests. The list:
  `npx playwright test --list --grep @smoke`.

## Test cases (TMS)

Where the manual test cases live, so a test written from a case links back to it. TMS-neutral:
each test carries the **full URL** of its case — `annotation: tms(<case id>)`, one per case when cases
were merged, with `const tms = caseLinks(<folder>)` once per spec (the app's `test.ts`) — and the report
shows it as a link. The URL is built from the app's template below (`{folder}`, `{id}`), never spelled
in a spec.
**Filled by the kit's skills, not by hand:** `tms` and an app's `case link` — from the first case
link of that app the user pastes (the plan skill offers a TMS link as a source). The skills read cases through that TMS's
MCP or API when one is available and never write to it without the user's yes. Each app keeps its
cases in a TMS project of its own, so each has its own line. No TMS → this section stays empty.

- tms: <Testiny | Qase | Azure DevOps | …>
<!-- case link <app>: the URL of one case of that app's TMS project, with {id} (and {folder} if the TMS needs it) — one line per app, e.g. "- case link crm: https://tms.example/p/1/cases/{id}" -->
- id format: <e.g. TC-<number>, DEMO-<number>>

## Tracker queue (optional)

Query the plan skill runs at start (read-only, through the tracker's MCP or API) to
offer the engineer's **own** open tickets as "what to cover" options — never a suggestion, only
what is assigned to them. Leave `query:` empty or remove the section to disable. Use the tracker's
native query language, e.g. `project: <KEY> assignee: me unresolved, newest first`.

- query:
- note: if QA work is tracked as a sub-task under the story (e.g. a "Testing" task), say so here —
  the skill then plans for the parent story, not for the task.

## Allowed tags

This table is the tag registry: the plan assigns a tag to a scenario only when it is listed here
and the scenario matches "apply when"; `qa:gate` rejects unregistered tags. No feature/area tags —
the folder carries the feature name (select by path, filter in Allure by the tree).

| Tag | Kind | Apply when |
|---|---|---|
| `@api` `@ui` `@e2e` | layer | exactly one per test, by the folder it lives in |
| `@smoke` | scope | the template's sign-in check (`tests/smoke/`), and besides `@regression` the one test of a feature that proves it works at all — its main scenario, first account (§Smoke); `test:smoke`, on every deploy to QA |
| `@regression` | scope | every feature test (all of `tests/api`, `tests/ui`, `tests/e2e`), each test on its own; `test:regression`, nightly and before a release |
| `@wip` | quarantine | the test is not finished; needs `// wip: <reason>` above it |
| `@flaky` | quarantine | passes and fails on the same code and stand; needs `// flaky: <cause> — <ticket or plan note>`; runs only in `test:flaky` |

Cross-cutting tags (properties that do not follow folders) are added here first, with their
"apply when", before any spec uses them — e.g. `@destructive` for tests that mutate shared data.

| Tag | Kind | Apply when |
|---|---|---|
| `@visual` | property | the test compares a screenshot (`toHaveScreenshot`) — volatile parts masked, the baseline approved by a person; `test:visual` runs only these |
| `@cross-browser` | property | a UI test whose risk differs by browser engine; it also runs in `firefox:<app>` and `webkit:<app>` — `test:cross-browser` |
| `@responsive` | property | a UI test whose layout or controls change on a phone; it also runs in `mobile:<app>` — `test:responsive` |

## Shared state (test locks)

The locks of tests that change or read something other tests see — registered here before a test
declares one (`qa:gate` rejects an unregistered lock); a real stand item under **Stand item**, exactly
as the app names it. How locks and stand items work: `specs.mdc` §Isolation and shared state.

| Lock | The shared state it protects | Stand item |
|---|---|---|
