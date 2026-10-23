---
name: setup
description: Set up the test home and every app it tests — a fresh clone (npm install, test:list, qa:gate); "add an app <url>" (its rows in specs/project-map.md, its .env names, npm run app:add, its first sign-in smoke); set up authentication once per app (sign-in — the address, a test account the user types into .env, signed-out exploration, the Swagger/OpenAPI contract, the API credential source with one trial at most, the ```auth block, a green sign-in smoke); a further app on the same sign-in, an extra account or role, a blocked or refused sign-in; and any change to the project map (update the project map — apps, sign-in blocks, external systems, app-wide behaviour, TMS case links, tracker queue, allowed tags, test locks). Use for the first app of a fresh map, another app, an app with no ```auth block, a plan that needs a signed-in user or another role, "change how tests sign in", or any map edit.
---

# Setup

One app or ten — the same layout: each app has its own map rows, `.env` names, Playwright projects, sign-in block,
fixtures, folders, report and tag. Adding an app adds rows, a block and folders and changes nothing of another app —
no rename, no move. Rules: `00-project-map.mdc` (layout, apps, `.env` names), `02-guardrails.mdc` (secrets, never
retry a refused sign-in), `01-workflow.mdc` (asking); roles and sessions inside specs: `specs.mdc`.
**The agent adapts, the user does not.** Ask only what you cannot find out, do the rest, and say plainly what you
found, did and still miss.

`/setup` — What: **app** → §2 · **sign-in** → §3 · **another account or role** → §3.9; any other map edit → §5.
Nothing said → a map with no app of its own yet → §2; otherwise ask which of the three.

## 1. Safety — always

- Secrets and `env:prepare`: `02-guardrails.mdc` §Secrets and settings. A URL, a public client id and scopes are not
  secrets — save them from chat. Write the map's rows and block lines first, then `env:prepare` (it lays both files
  out by app).
- **The user may choose the chat** for the test account (offered, never the default): save the values to `.env` at
  once through `env:prepare`, never repeat them, and say once: "Saved to .env. These values are now in this
  session's history — fine for a test account on a test environment; for anything else, change the password." The
  same for a secret pasted unasked. Client secrets only ever in `.env`.
- Test accounts only — never someone's personal account. Never type a login or password into the MCP browser;
  sign-ins run through the universal code (§3.7).
- **Every wrong password counts toward the account's lockout** — the tests' tries and the user's own. A
  test types a password only when it is known to work on **that** sign-in service: the user signed in
  with exactly those values by hand (a private window), or the tests already have. After a refusal —
  a new password included — nothing runs until the user says the manual sign-in with the values now in
  `.env` worked. Never delete `state/*.failed.json` to try an unchecked password.

## 2. Add an app — a fresh clone first

0. **A fresh clone** (no `node_modules`) — `npm install` first (its postinstall fetches the Chromium this
   Playwright runs), then `npm run test:list` and `npm run qa:gate` must pass with zero tests. A failure there is
   reported as it is, not worked around.
1. **The address** — from the user's words; otherwise one message, then wait:

   > **New app — its address.**
   > Reply with the URL of the app you want to test (for example its dev or QA environment). I'll find
   > out the rest myself: its API, and whether it signs in like `<the first app>`.

   (For the very first app say "the application you are testing" and leave out the last clause.)
2. **Its slug** — kebab-case: the user's name for it (`crm`, `order-desk`), else from its title or host ("Order
   Desk" → `order-desk`). Never a separate question: the report names it and the user may rename it there.
3. **Its rows** in §Apps and services (§5). **First app** (only the template's `default` rows) — they become this
   app's: `| <app> | <app>-web | UI | UI_BASE_URL | — | … |`, `| <app> | <app>-api | API | API_BASE_URL | — | … |`.
   **Further app** — rows of its own: `| <app> | <app>-web | UI | <APP>_UI_URL | — | … |`; its API row
   (`<APP>_API_URL`) once its API is found (§3.3 step 3). Rows of other apps are not edited.
4. **Save the address** as given: `npm run env:prepare -- <its UI env name>=<url>`. An app under a path
   (`https://host/shop`) is opened there — `urlOf` gives the tests' base the trailing slash, addresses in code are
   relative (`ui.mdc` §Opening a page).
5. **Its fixtures**: `npm run app:add -- <app>` — creates `src/fixtures/<app>/data.fixture.ts`, `pages.fixture.ts`
   and `test.ts` (the `test` its specs import, and `caseLinks`). It refuses an app the map does not list — rows
   first. Files that exist are kept. Its other folders appear with the first plan and test, never in advance.
6. **Its sign-in** → §3: the first app from §3.1 (the offer); a further app from §3.8.
7. **Its test id attribute** — on the first page the app shows (signed in when it signs in: the saved session in the
   MCP browser), count the marked elements with the MCP's evaluate:
   `() => Object.fromEntries(['data-testid', 'data-test', 'data-test-id', 'data-qa', 'data-cy'].map((a) => [a, document.querySelectorAll('[' + a + ']').length]))`.
   The most used one, when it is not `data-testid` → a `test id: <attribute>` line in the app's ```app-wide block
   (§5). None on that page → nothing written; a feature's live check looks again (`live-app.mdc`).
8. **First smoke** — `npx playwright test --project=smoke:<app>` green (§3.7), then `npm run qa:gate`.
9. **Report** — the §3.4 shape; **Done** also says: App `<app>` — its tests go to `tests/<layer>/<app>/` (another
   name? say it now) · signs in like `<other app>` — the same test account | its own (`<APP>_LOGIN`) · from the
   second app on, `npm run test:app -- <app>` runs only this app (`npx playwright test --project="*:<app>"`),
   `npm run test:ui` every app, and this app's report is `reports/allure/html/awesome-<app>/`. **A rename** said
   there → the slug changes in its rows, its block's `platform:` line, the `src/fixtures/<app>/` folder and any
   `.env` names made for it (new names prepared with `env:prepare`; a secret the user already typed is moved by the
   user); nothing else exists yet.
10. Next: `/plan` for the app's first feature.

## 3. Sign-in — once per app

Goal: the app's URLs in `.env`; an ```auth block (§4) the universal sign-in code (`src/setup/auth/`) reads; the API
contract in the Apps table; a passing sign-in smoke. No rows yet → §2 first (it comes back here).

### 3.1 Offer — the first app only

The map has no ```auth block at all. Ask "Your tests may need to sign in to the application. Set up
authentication now?":

1. **Set it up for me** — share the application's URL here (and the Swagger link if you plan API tests); I save them
   to .env, prepare the test account's entries, find and configure the sign-in and verify it. You type the
   account's login and password into .env yourself.
2. **I'll fill in .env myself** — I add every needed entry with hints; you fill them, URLs included; I take it from there.
3. **Later** — continue without sign-in; cases that need a signed-in user stay blocked until it is set up.
4. **Not required** — the app is public; tests run signed out.

Later → nothing is written; ask again only when a plan needs a signed-in user. Not required → the block `ui: none`
/ `api: none`. A further app (the map already has a block) skips this offer → §3.8.

### 3.2 What only the user knows — one action per message

**Look first, only where no secret lives:** the map's Apps table, `.env.example`, READMEs and docs in this
repository and in repos the user points at — **never** another repo's `.env*`, `appsettings*` or other config
files. Found → offer it ("I found `https://app.example.test` in README.md — reply yes or send another address").
Never ask what you can find out (the product name from the URL or title; the API and Swagger: §3.3).

**Set it up for me** — message 1, then wait:

> **Step 1 of 2 — the application's address.**
> Reply with the URL of the application you are testing (for example its dev or QA environment). I'll find the
> API and its Swagger myself after signing in.

Save it with `env:prepare` (the name from the app's UI row), explore (§3.3), prepare the account entries (§3.5
names), then message 2:

> **Step 2 of 2 — the test account.**
> Open `.env` and fill in `<APP>_LOGIN` and `<APP>_PASSWORD` for a test account (not your personal one) that
> signs in at `<the sign-in page's host>` — not sure? sign in there by hand once first: every wrong password
> counts toward the account's lockout. Then reply **ready**. Please type them into `.env`, not into this chat:
> chat messages stay in the session history; `.env` is git-ignored and stays on your machine. If you prefer,
> send them here — I'll save them to `.env` and never repeat them.

**I'll fill in .env myself** — prepare the URL and account entries, list them in one message (with the same security
line, and "paste the app's address here too — it is not a secret, I need it to explore"), wait for **ready**, then
`npm run env:prepare -- <the names>` to see they are filled. Roles are never asked: one test account, no `roles:`
line; more only when the user asks (§3.9).

### 3.3 Explore signed out — facts, not guesses

With the Playwright MCP as `live-app.mdc` says. **Look, never submit:** no form gets made-up data — it loads the
stand's sign-in service and its limits and shows nothing the real sign-in won't. What is invisible signed out (the
password step's button) gets the likeliest label, corrected from the first real sign-in's message (§3.7).

1. Open the URL. Where does it land — the app (public), its own sign-in page, an external identity provider (OIDC:
   `<host>/.well-known/openid-configuration` — its token endpoint and allowed grants), an SSO page? **No answer**
   (timeout, DNS, certificate) → stop: "`<url>` did not respond (<what happened>). Check the address, the VPN, or
   whether this environment is up. Nothing was saved yet." Never guess another address. **JSON instead of a page**
   (or no web UI) → an API-only app: `ui: none`; credentials per §3.5 without the browser rows. **The app for a
   visitor, with a sign-in link** (a shop, a portal) → open to visitors: find signed out a page that sends a visitor
   to sign in (the account or profile page from the menu) → `members only: ${<its UI env name>}/<its path>` (names, never a value); the sign-in smoke checks
   there, since the home page looks the same signed in and out.
2. The form's **visible** steps: fields, buttons (email → Next → password is common), SSO-only buttons. A frontend
   repo at hand → its auth setup **in source code** (an OIDC client, a sign-in request — never its `.env`): where
   the signed-in app keeps its token.
3. **API base and Swagger** (not given) — after the first successful sign-in (§3.7 step 3): load the saved session
   into the MCP browser, read the hosts of its data requests (`browser_network_requests`), save the API row
   (`<APP>_API_URL`, or `API_BASE_URL` for the first app) through `env:prepare`. Then find the contract **without
   guessing**, each once, in this order: (1) a Swagger UI page on the API host → the definition's address from the
   page itself (its `swagger-initializer.js`, `configUrl`, the `url` / `urls` it loads); (2) otherwise the common
   paths `/swagger.json`, `/swagger/v1/swagger.json`, `/openapi.json`, `/v3/api-docs`, `/api-docs`, `/swagger`,
   `/swagger/index.html`; (3) the definition answers 401 → one more request with the test account's headers
   (through the auth code; the token is never shown). Judge a hit by **content**, never the status: JSON with an
   `openapi` / `swagger` key, or a page with `swagger-ui`. A hit → the Docs column of the app's API row
   (`{<API env name>}/<path>`), not `.env`. Nothing → stop looking; report it as **Missing** (§3.4). It blocks only
   API tests.

### 3.4 Report — the action first

One message. **Its first line is the one thing the user has to do now** (or "Nothing needed from you"); then three
short headings, at most 4–5 plain bullets each:

> **Reply "ready" once the test account is filled in `.env`.**
>
> **Discovered** — Signed-out visitors go to the sign-in page at `id.example.com`: email → Next → password
>
> **Done** — App `order-desk` — its tests go to `tests/<layer>/order-desk/` (another name? say it now) · `.env`:
> application and sign-in addresses saved; empty entries `ORDER_DESK_LOGIN`, `ORDER_DESK_PASSWORD`
>
> **Missing** — The test account in `.env` — blocks every signed-in test

Every missing item says what it blocks, what is **not** affected and who can provide it ("Swagger: the page at
`<url>` opens but cannot load the definition (401). Share the link to the JSON definition, or ask the backend team.
API tests are blocked until then; UI tests are not affected."). A missing item that blocks only some tests never
stops the setup. Only a missing sign-in stops it.

**Blockers** — never worked around:

| Found | Needed from the team |
|---|---|
| a one-time code (SMS / authenticator) after the password | a test account without 2FA on this environment, or a test token endpoint |
| a captcha | a test bypass on this environment |
| only SSO buttons, no form | a test user with a password, or a test token endpoint |
| a sign-in by e-mail link | another way to sign in for tests |

A blocker → end with the report; the next run starts at §3.2 with what `.env` already has.

### 3.5 API credentials — facts first, one trial at most

Decided once; the block keeps it. Only a confidential client needs a secret — most web apps need nothing
beyond the test account.

**Facts first** — none asks anything, none uses the account: the provider's discovery document
(`token_endpoint`, `grant_types_supported`); the app's own `…/authorize?client_id=…&scope=…` request seen
signed out; the contract's `securitySchemes`; after the first sign-in, the **names** (never values) in
`state/<app>.<role>.<host>.session.json` — a token entry, and whether a refresh token is there.

**Then the first that fits:**

| # | When the facts say | `api:` | Needs from the user | API tests then depend on |
|---|---|---|---|---|
| 1 | the contract: an API key or Basic | `key` / `basic` | the key in `.env` / nothing | nothing else |
| 2 | the provider allows `password` | `token` — password grant with the app's own client id and scopes, no secret | nothing | the identity provider only — no browser |
| 3 | 2 refused, the session keeps a refresh token | `refresh-token` | nothing | one browser sign-in, then new tokens over HTTP |
| 4 | the signed-in app keeps a token | `session-token` | nothing | the UI sign-in (once per run, cached) |
| 5 | cookies only | `login-request` if the app has its own sign-in request, else `session-cookies` | nothing | that request / the UI sign-in |
| 6 | the team gives a test client | `token` with its secret, or `client_credentials` (no user — no per-role tests) | client id (chat is fine), secret (`.env`, by the user) | the identity provider only |
| 7 | none fits | `custom` (§3.6) | — | — |

**The one trial (row 2)** — after "ready", write the block with the app's client id and run once:
`npx playwright test --project=smoke:<app> --no-deps -g "data requests"`. Passed → keep it.
`unauthorized_client` / `unsupported_grant_type` → this client may not sign in this way; nothing is
paused — go to row 3 or 4; never guess another client id. `invalid_grant` → wrong login or password; the
account pauses as in §3.7.

A question only for a real choice — e.g. row 2 works **and** the team offers a test client: "Where
should API tests get their credentials? 1. Keep <the source that works> (recommended) — <its dependency>
· 2. Use the team's test client — no browser; you enter the secret in .env". The report names the source
and what would remove a dependency.

**`.env` names:** one account `<APP>_LOGIN`, `<APP>_PASSWORD`; with roles `<APP>_<ROLE>_LOGIN`,
`<APP>_<ROLE>_PASSWORD`; `<APP>_CLIENT_ID` set from what you saw; `<APP>_API_KEY` /
`<APP>_CLIENT_SECRET` filled by the user. `npm run auth:check` must pass before §3.7.

### 3.6 When neither universal client fits

Neither a form nor a token endpoint (a signed request, a client certificate, a custom SSO handshake), or sign-in code
the user points at → write or port `src/setup/auth/project.ts` with `browserSession(browser, role, platform)` and
`apiHeaders(browser, role, platform)`, as `data-and-fixtures.mdc` §Sign-in setup says for a project's own login
(`ui: custom` / `api: custom` in the block). The report says plainly it is project code for the user to review.

### 3.7 Verify — not done until this passes

1. `npm run auth:check` — ✓ for the account (every role, when there are roles).
2. The sign-in smoke is the template's `tests/smoke/sign-in.smoke.spec.ts` — skipped until the block exists,
   **never edited or replaced**. Everything app-specific comes from the block: `signed in when:` (it must tell the
   app from a sign-in page on the same host — e.g. `url starts with ${UI_BASE_URL}/app`, or a `text "…"` only the
   app shows) and `session check:` (a cheap "who am I" API request found in the signed-in app's requests and
   confirmed in the contract). It checks the first account only, on purpose.
3. Run it, this app only: `npx playwright test --project=smoke:<app>`. No API base yet → the UI test first
   (`-g "web app"`), then §3.3 step 3, then the whole file. With roles, `npm run auth:sign-in -- <app> all` signs
   each one in the same way. A public app (`ui: none` + `api: none`) has one test, "The web app opens": its address
   answers and its page shows. **Green = at least one test passed** — a run of skips only is not a smoke: the block or
   the app's rows are wrong.

A failure is reported, not retried — the code never repeats a refused sign-in with the same login and
password. Turn its message into this shape:

> **API sign-in check failed**
> - Request: `GET /api/users/me` as the test account
> - Status: **401 Unauthorized**, reason: `invalid_token: audience mismatch`
> - Needed: the token is issued for a different API — ask the team for the right scope or audience.
> - UI tests are not affected.

| The run says | Tell the user |
|---|---|
| `needs X, Y in .env` | which entries are still empty |
| `did not get signed in … showing "…"` | what the page shows: a form with an error → check the login and password in .env; a code, captcha or SSO page → a blocker (§3.4) |
| `Login step … found nothing to click … buttons "…"` | a step label in the block is wrong: fix it from the listed buttons, run once more — not a refusal, nothing paused |
| `invalid_client` | wrong client id or secret |
| `unauthorized_client` / `unsupported_grant_type` | this client may not get tokens this way — the team decides |
| `invalid_grant` | wrong login or password, or the account is locked |
| `invalid_scope` | a scope this client may not ask for |
| 401 with a reason | the server's reason (`WWW-Authenticate`) and what it implies |
| 403 | signed in, but the user lacks rights — a permissions question |

**A wrong password, in this order:** `npm run auth:check` first (it names, without showing, a value
`.env` reads cut short — a `#` outside quotes); then the user signs in **once** by hand in a private
window with the same values. Fails by hand too → the password is wrong for this service: ask for the
right one or a reset; a locked account → the team unlocks it — never "try again". Works by hand → only
then delete that account's `state/*.failed.json` and run once more. A new password in `.env` gets one
attempt on its own. Never loop.

### 3.8 A further app — its sign-in reused when it can be

Another app is added to a map that has a block (§2 sends you here after its rows); existing apps stay untouched.

1. **Explore signed out** (§3.3) and compare the **sign-in page's host and port** with the set-up apps exactly,
   never by looks — one company's sign-in pages look alike yet keep separate accounts and lockout counters; the same
   domain suffix with another host is another service.
2. **The same sign-in** → nothing is asked; the new block says `sign-in like: <app>` and writes only what differs
   (§4). One trial with the borrowed account: `npx playwright test --project=smoke:<app> -g "web app"`.
   - Passed → §3.3 step 3 (its API and Swagger), then the whole smoke (§3.7).
   - Refused (the page says the account has no access, or `invalid_grant` / 403) → nothing more is tried. The block
     gets its own account lines (`login: ${BETA_LOGIN}`, `password: ${BETA_PASSWORD}`; with `api: token` also the
     `token field: username` / `password` lines), entries prepared empty; the report's first line: "**Sign in to
     beta by hand once (a private window) with a test account that has access, put it into `.env` as `BETA_LOGIN`
     / `BETA_PASSWORD`, then reply ready.** alpha's account signs in to the same provider, but beta does not let it
     in. If the team gives that account access instead, reply **same account**." "same account" → the block drops
     those lines, the failed file is deleted, the trial runs again.
3. **A different sign-in** (another host or form, SSO only, an API key) → §3.2 message 2 with its own account,
   §3.3–§3.7 as for the first app, a block without `sign-in like`. The report's **first line** says it is not the
   same sign-in and asks for a manual sign-in first ("beta signs in through its own service
   (`auth.beta.example.com`), not alpha's — alpha's password will not work there, even for the same e-mail.").
   After "ready", `npm run auth:check` warns when the values match another app's; on a warning, ask once whether
   that account really signed in by hand on beta's service.

### 3.9 A further account or role

Another account a case needs (a role, a user without some right) — only on the user's request:

1. Prepare the entries empty: `npm run env:prepare -- --note "Test account: <role>" <APP>_<ROLE>_LOGIN <APP>_<ROLE>_PASSWORD`.
2. The app's block gets the account's own lines — `login <role>: ${<APP>_<ROLE>_LOGIN}`,
   `password <role>: ${<APP>_<ROLE>_PASSWORD}` — nothing of the first account renamed.
3. The user fills them (an account signed in with by hand) and replies ready (values sent in chat: §1); then
   `npm run auth:check -- <app>:<role>` and `npm run auth:sign-in -- <app> <role>` (the account really signs in; the
   smoke checks only the first one). Tests use `test.use({ role: "<role>" })`.

**Done** — the map holds the block, the API row and its Docs; `.env.example` lists the names. One closing line:
"Authentication is ready: the test account signs in to the web app and the API accepts the session." Then back to
what asked for it (§2, the plan skill), or the next command `/plan`.

## 4. The ```auth block and its API modes

One block per app in §Auth, starting `platform: <app>` (a block without it serves a one-app map only), read by
`src/setup/auth/auth-config.ts`. It holds `.env` **names** (`${NAME}`), never values. No block = login not set up.
What the template then guarantees (one sign-in per role per run, cached sessions, refused logins recorded):
`data-and-fixtures.mdc` §Sign-in setup.

```auth
platform: shop
ui: form
start: ${UI_BASE_URL}
step: fill "Email" with login
step: click "Next"
step: fill password with password
step: click "Log in"
signed in when: url starts with ${UI_BASE_URL}
login: ${SHOP_LOGIN}
password: ${SHOP_PASSWORD}

api: session-token
session token: localStorage oidc.user:* access_token
session check: ${API_BASE_URL}/me
```

- **Steps**, as a person does them: `fill "<field>" with login|password` (label, placeholder or accessible name) ·
  `fill password with password` · `click "<button>"` · `wait for "<text>"`. **Signed in when:** `url starts with
  <url>` or `text "<visible text>"`.
- **`api:` modes**: `token` (token url + `token field:` lines; a public client's password grant needs no secret; no
  browser) · `refresh-token` (one browser sign-in, then tokens over HTTP) · `session-token` (the signed-in app keeps
  a bearer token; API tests depend on the UI login, once per run) · `session-cookies` · `login-request` (the app's
  own sign-in request; `login url:`, `login body:`, `login format:`, `session from:`) · `key` (`key header:`,
  `key:`) · `basic` · `custom` (`project.ts`, §3.6) · `none`. `ui: none` + `api: none` = a public app.
- **Optional**: `session check: <url>` (a cheap "who am I") · `session max age: <minutes>` · `members only: <url>` (an
  app open to visitors: a page that sends a visitor to sign in — the sign-in smoke opens it, §3.3 step 1).
- **Roles**: no `roles:` line = one test account (role `user`); a further account adds its own `login <role>:` /
  `password <role>:` lines (§3.9); the first account's lines never change. Whether signing out ends every session
  of the account is recorded as a comment here by the app's first sign-out test (the check: `specs.mdc`).
- **Apps on one identity provider**: the further app's block says `sign-in like: <app>` and writes only what differs
  — e.g. `platform: beta` · `sign-in like: alpha` · `start: ${BETA_UI_URL}/app` · `signed in when: url starts with
  ${BETA_UI_URL}/app` · `token field: client_id = <beta's own client id, when it has one>`, and its own `login:` /
  `password:` when the shared account is not let in. `qa:gate` fails a missing borrowed block or a circle.

## 5. The map, section by section

`specs/project-map.md` is read by `playwright.config.ts`, the sign-in code, `qa:gate`, `env:prepare`,
`suite:coverage` and every skill. How it is edited — only the section that changes, names never values, then the
checks: `00-project-map.mdc`.

1. **The section and its rules** — each filled when it becomes known, never in advance:

   | Section | What goes in | Filled when · rules |
   |---|---|---|
   | Apps and services | one row per web app / API: `Platform` (the app's slug), Name, Kind, Env URL name, Docs (Swagger/OpenAPI), Notes | §2; the API row's Docs when the contract is found (§3.3); never an API URL derived from a UI URL |
   | Auth | one ```auth block per app (§4) | sign-in set up (§3); after a change `npm run auth:check` |
   | External systems | `App · System · What the app takes from it · The tests' access · Facts given by the engineer` | a plan first meets a fact another system owns (the plan skill); access `none`, `read-only — <ENV name>` or `through the app only` |
   | App-wide behaviour | an ```app-wide block per app: `dismiss: dialog "<text>" by "<button>"`, `ready when: hidden …`, `test id: <attribute>` | an overlay or global spinner the test does not cause is met; never a toast; `test id:` when the app marks its elements with another attribute than `data-testid` (§2 step 7) (format: `src/setup/app-wide.ts`) |
   | Test cases (TMS) | `- tms: <name>`, `- case link <app>: <one case URL with {id}, and {folder} when the TMS needs it>`, `- id format:` | the first case link of that app is pasted (ids → `{id}`, folders → `{folder}`); never guessed, never another app's |
   | Tracker queue | `- query:` in the tracker's own query language | only the user's own open tickets; empty disables it |
   | Allowed tags | the tag registry: tag, kind, apply when | a cross-cutting tag before any spec uses it; no feature or area tags (`specs.mdc`) |
   | Shared state (test locks) | `Lock · The shared state it protects · Stand item` | before a test declares the lock; Stand item = the real item's exact name as the app shows it (`specs.mdc`) |
   | Playwright projects, Smoke | explanations only | built by `playwright.config.ts` from §Apps and services — nothing to write |

2. New `.env` names → `npm run env:prepare -- --note "<what it is>" <NAMES>` after the map edit; then the checks of
   `00-project-map.mdc` (`qa:gate`; `test:list` after Apps; `auth:check` after Auth). **Report** the section(s)
   changed, the lines added or changed, and the check that passed.
