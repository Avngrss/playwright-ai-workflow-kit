# Security and data handling

Assume that every log, report, trace, screenshot and video will be shared. The kit keeps secrets out
of them in layers:

- you type the secrets yourself;
- the gate keeps them out of code;
- a reporter scrubs them from artifacts;
- CI scans for them.

Prevention comes first. The scrubbing is a safety net. The rules are in
`.cursor/rules/02-guardrails.mdc` (§Secrets and settings, §Sensitive data in artifacts, §Quality gate).

## `.env` — values only there, typed by you

- **Values live only in `.env`**, which is git-ignored. Their **names** are in
  `specs/project-map.md` (the URLs per app and the ```auth block's `${NAME}`s) and in `.env.example`.
- **`npm run env:prepare` is the only way the agent touches `.env`.** It:
  - sets non-secret values such as URLs or a public client id;
  - adds empty entries for you to fill (`-- --note "Test account" SHOP_LOGIN SHOP_PASSWORD`);
  - prints names as filled or empty, never a value;
  - copies the names into `.env.example`, where only URLs keep their values.
- **`env:prepare` refuses to run while git would commit `.env`.** Add `.env` and `state/` to
  `.gitignore` first. The kit's `.gitignore` already has both.
- **You type logins, passwords, tokens and client secrets into `.env` yourself.** The agent never
  asks for them in chat, and never opens, prints or greps `.env`. `npm run auth:check` shows only
  which entries are still empty.
- If you paste a secret into the chat anyway, the agent saves it to `.env` at once and never repeats
  it. The value now sits in the session history, so change it unless it is a test account on a test
  environment.
- Use test accounts only, never a personal one. A secret printed or committed by accident is
  rotated, never quoted.

## No secrets in code — the gate

`npm run qa:gate` fails these:

- `process.env` in specs, Page Objects, components or clients. Settings reach tests only through
  `playwright.config.ts` and fixtures (`baseURL`, `authHeaders`).
- a token, or a path to `.env`, in a spec.
- a session file (`storageState`-like) outside `state/`.
- an attachment without `maskSecrets`.
- raw `console.*`. Intentional output goes only through `safeLogger`
  (`src/logging/safe-logger.helper.ts`), and never carries bodies, headers, tokens, cookies or
  storage.

## Saved sessions — `state/`

- Sign-in sessions, API headers and refresh tokens live only in the git-ignored `state/` folder.
- A refused sign-in is recorded as a hash, never the values.
- Never commit `state/`, `.env` or a session file, and never use one as an upload test file.

See [Auth strategy](auth-strategy.md).

## Artifacts — what the template scrubs

- **`src/reporting/secret-scrub.reporter.ts`** runs first among the reporters. It replaces
  every `.env` value of at least 4 characters with `[secret]`, when its name contains `PASSWORD`,
`SECRET` or `TOKEN`, or ends in `_KEY`:
  - where: each test's trace and its text attachments;
  - in which forms: as typed, JSON-escaped and URL-encoded.

  It also sweeps `test-results/`, `playwright-report/` and the Allure results at the start and end
  of every run, even when a `--reporter` is given on the command line.
- **Before the trace:** the shared session signs in before a test's trace starts. `signIn()` takes
  the values it typed out of the trace.
- **`maskSecrets`** (`src/reporting/readable-error.ts`) covers readable errors, the run
  summary and extra attachments. Sign-in codes and tokens in URLs become `***`.
- **Background errors** record the method and path, never the query.

## What a test must still not do

| Data | Logs | Check names, titles, steps | Attachments | Visual baselines |
|---|---|---|---|---|
| Secret (password, token, key, cookie, session) | never | never | never | always masked |
| Generated identity (email, phone, name) | avoid | never (only in received values) | only what the failure needs | masked |
| `.env` names, hosts | ok | ok | ok | — |

- **Screenshots and videos are not scrubbed.** Do not open a screen full of personal data when the
  case does not need it.
- **No sensitive attachments:** never attach Authorization headers, cookies, storage state or full
  local or session storage.
- **Generated data** is `AQA`-marked and uses non-routable domains
  (`data-and-fixtures.mdc` §Where data lives).
- **The MCP browser:** the agent never types a password into it. Sign-ins run through the kit's
  sign-in code.

## Reports and CI

- **Reports contain real stand data.** Publish Allure and Playwright reports, traces and videos
  with restricted access only.
- **The secret scan runs in CI:**
  - GitHub: `.github/workflows/playwright.yml` runs gitleaks after `qa:gate`, in the baseline job;
  - GitLab: `ci/gitlab/gitlab-ci.yml` runs `gitleaks detect --redact` in its `gate` stage.
- **CI variables:** CI reads URLs and accounts from variables named like the `.env` entries. Keep
  passwords in the CI's secret (masked) variables, never in the workflow file. GitHub passes only the names
  the workflow's `env:` lists (`secrets.<NAME>` for passwords); GitLab passes its CI/CD variables itself.

## Checks on demand

| Command | What it checks |
|---|---|
| `npm run qa:gate` | Every change: tokens and `process.env` in specs, raw `console.*`, unmasked attachments |
| `/verify` | A batch's changes. Its two security lines (verify skill §6) check changed code, config and CI for what the gate's patterns miss: sensitive data in logs, attachments and artifacts, trace and report retention, what CI uploads |
| CI secret scan | The whole repository on every pipeline: gitleaks (above) |
