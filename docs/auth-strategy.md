# Auth strategy

This guide explains how the tests sign in. Each app has one ```auth block in `specs/project-map.md`
§Auth. The template's sign-in code (`src/setup/auth/`, `src/fixtures/auth.fixture.ts`)
reads that block and nothing else, so specs never sign in by hand. The setup skill §3
(`/setup sign-in`) writes the block. Its full format, the `api:` modes and roles are in the
[setup skill](../.cursor/skills/setup/SKILL.md) §4; what the sign-in code guarantees is in
[`data-and-fixtures.mdc`](../.cursor/rules/data-and-fixtures.mdc) §Sign-in setup.

## The ```auth block

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

- The block holds `.env` **names** (`${NAME}`), never values. You type the values into `.env`.
- With no block, sign-in is not set up yet, and the sign-in smoke is skipped.
- `ui: none` together with `api: none` means a public app; the tests run signed out. Its smoke is one test,
  "The web app opens": the app's address answers and its page shows (the sign-in tests are skipped).
- An app open to visitors that also has accounts (a shop, a portal) names a page only a signed-in user may
  open: `members only: ${UI_BASE_URL}/account`. Its home page looks the same signed in and out, so the sign-in
  smoke checks there: a visitor is sent to the sign-in page, a signed-in user stays.

## UI sign-in

| `ui:` | When |
|---|---|
| `form` | The sign-in page, written as steps a person takes: `fill "<field>" with login`, `click "<button>"`, `wait for "<text>"`, then `signed in when:` a URL or a text only the app shows |
| `custom` | Neither a form nor a token endpoint, such as a signed request or a client certificate. The agent writes `src/setup/auth/project.ts` as project code for you to review |
| `none` | An API-only or public app |

## API sign-in

The setup skill (§3.5) picks the API mode from facts it can see: the provider's discovery document,
the app's own requests, and the contract's `securitySchemes`. It runs at most one trial sign-in to
test a mode. Most web apps need nothing beyond the test account.

| `api:` | What API tests depend on |
|---|---|
| `key` / `basic` | a key in `.env` / the account |
| `token` | the identity provider only, with no browser. Uses a password grant with the app's client id, or a test client the team gives |
| `refresh-token` | one browser sign-in, then new tokens over HTTP |
| `session-token` | the UI sign-in, once per run: the token that the signed-in app keeps |
| `session-cookies` / `login-request` | the UI sign-in's cookies / the app's own sign-in request |
| `custom` / `none` | `project.ts` / nothing |

API specs never sign in themselves. They get credentials only from `authHeaders`. The sign-in code
uses a browser only for the `session-*` and `refresh-token` modes, once per run.

## Roles

- One test account by default. Add more accounts only when a case needs different rights.
- A further role adds its own lines to the block (`login member: ${APP_MEMBER_LOGIN}`,
  `password member: ${APP_MEMBER_PASSWORD}`) and its `.env` entries. The first account's lines stay
  as they are, and no code changes.
- A spec picks the role with `test.use({ role: "member" })`. The `page`, the Page Objects and
  `authHeaders` follow the role. `role: "none"` runs signed out.
- A role whose `.env` entries are empty blocks its cases until you fill them.

## Saved sessions — `state/`

- Each role signs in once per run, and all workers share that session. The session is saved in the
  git-ignored `state/` folder until it nears expiry, and re-checked with `session check:`.
  - `state/<app>.<role>.<host>.session.json` — the browser session
  - `.api.json` — API headers
  - `.refresh.json` — the refresh token
- A test that signs out, changes the password or ends sessions takes its own session:
  - `test.use({ session: "own" })`;
  - `"signed-out"` plus `await signIn()` when signing in is the case itself.

  `qa:gate` fails such a test that uses the shared session.

## A refused password is never retried

Every wrong password counts toward the account's lockout, whether the tests or you typed it.

- A refused sign-in is recorded in `state/<app>.<role>.<host>.failed.json`, as a hash, never the
  values. The code never tries the same login and password again.
- What to do:
  1. Run `npm run auth:check`. It names a value `.env` reads cut short, such as a `#` outside quotes,
     without showing the value.
  2. Sign in **once by hand**, in a private window, with the same values.
  3. If it fails by hand too, the password is wrong or the account is locked. That is the team's to
     fix: ask for the right password, a reset or an unlock.
  4. Only if it works by hand, delete that account's `*.failed.json` and run once more.
- Never delete a `*.failed.json` to try a password you have not checked.

## Commands

```bash
npm run auth:check                         # which login entries in .env are empty — names only
npm run auth:check -- shop:member          # one role of one app (also: -- shop, -- member)
npm run auth:sign-in -- shop               # sign the first account in (what the smoke checks)
npm run auth:sign-in -- shop member        # one role; "all" for every role of the app
npx playwright test --project=smoke:shop   # the app's sign-in smoke
```

The sign-in smoke checks the first account only: the web app, the API session, and a signed-out
redirect. Further roles are checked with `auth:sign-in`.

## Several apps

- Each app has its own block, starting with `platform: <app>`.
- An app on the very same sign-in service (the same sign-in page host) says `sign-in like: <app>`
  and writes only what differs. It tries the first app's account once. If that account is refused,
  you add an account of its own.
- One app's broken sign-in stops only that app's tests.

## What blocks sign-in

The setup skill (§3.4) reports these and never works around them:

| Found | Needed from the team |
|---|---|
| A one-time code (SMS or authenticator) | A test account without 2FA, or a test token endpoint |
| A captcha | A test bypass |
| SSO buttons only | A test user with a password, or a test token endpoint |
| Sign-in by e-mail link | Another way for tests to sign in |

Secrets and `.env`: [Security and data](security-data-handling.md).
