---
description: What must never happen — secrets and sensitive data in chat, code and artifacts, .env typed by the user, env:prepare, a refused sign-in retried; qa:gate and the stop check, how to treat a finding; a test never fitted to the product without a source, can-fail, the independent review, summary numbers from result files; shared code changed only on request
alwaysApply: true
---

# Guardrails

## Secrets and settings

- **Values live only in the git-ignored `.env`, typed by the user**; their names are in the map (URLs per
  app, the ```auth block's `${NAME}`s) and `.env.example`; CI uses the same names.
- **Never ask for, print, repeat or quote a secret** (password, token, key, cookie, session file) — in chat,
  plans, the map, code, comments, commits or reports; never open, print or grep `.env`. One printed or
  committed by accident → tell the user to rotate it.
- **`npm run env:prepare` is the agent's only way to `.env`**: non-secret values (`-- UI_BASE_URL=https://…`),
  empty entries the user fills (`-- --note "Test account" SHOP_LOGIN SHOP_PASSWORD`), names reported
  filled/empty and mirrored into `.env.example` (only URLs keep values); it refuses while git would commit
  `.env`. `npm run auth:check [-- <roles>]` names empty login entries → tell the user the exact names, wait.
- Settings reach tests through `playwright.config.ts` and fixtures (`baseURL`, `apiRequestContext`,
  `authHeaders`): no `process.env`, hardcoded URL, credential, token, tenant or user id in test code.
- Sessions live only in `state/`; never commit `state/`, `.env` or session files, never upload them in a test.
- **A refused sign-in is never retried with the same values** — repeated wrong passwords lock accounts. The
  template records it (`state/*.failed.json`, a hash, never the values) and stops; the user fixes `.env`.
  Never retry by hand, never type a password into the MCP browser (`live-app.md`).

## Sensitive data in artifacts

Every log, report, trace, screenshot and video is assumed shared: prevention first, scrubbing is the net.
- The template: `secret-scrub.reporter.ts` (first reporter, even with a command-line `--reporter`) replaces
  `.env` values named *PASSWORD*, *SECRET*, *TOKEN*, *KEY* with `[secret]` in traces and text attachments and
  sweeps `test-results/`, `playwright-report/`, the Allure results at the start and end of a run; the shared
  session signs in before a trace starts, `signIn()` takes typed values out; readable errors and the run
  summary pass `maskSecrets`; background errors record method and path, never the query.
- A test still never: attaches text without `maskSecrets`; logs except through `safeLogger`, or logs bodies,
  headers, tokens, cookies, storage, `.env`; attaches Authorization headers, cookies, storage state or whole
  storage; puts personal data in check names, titles or steps (noun phrases only). A generated identity is
  kept out of logs, appears in check messages only as a received value and in attachments only as far as a
  failure needs; `.env` names and hosts are fine anywhere.
- Screenshots and videos are not scrubbed: when the case allows, check before navigating to a screen full of
  generated personal data and note the risk in the plan for sign-in and form flows; never weaken a check to
  avoid a capture. Visual baselines mask secrets and generated identities (`specs.md`).
- Generated data uses non-routable domains (`example.test`). Redaction beyond `maskSecrets` → `src/security/`,
  field names from the contract or plan, never guessed. Reports, traces and videos have restricted access.

## Quality gate

`npm run qa:gate` = `scripts/gate/check.mjs`, then `tsc --noEmit` — after every change to specs, support code,
plans or the map, and before any commit; it runs no tests. It checks what the rules state — specs, Page Objects,
clients, fixtures, the layout, the map, plans and their routes (`docs/Layer Routing Algorithm.md` §9), the
agents' copies — and lists every finding at once, each with its rule and its fix. ✗ fails, ! warns; readability
rules judge only files being written now (uncommitted) — committed ones are warned, not reworked; plans and
tests written before routing get their route findings as a list to rework (`plans.md` §A later pass).

**A finding** is fixed the way its message says — never dodged (an equivalent call, a renamed method, a moved
copy, a Page Object's body pasted into the spec). One that looks wrong is a suspected gate bug: keep the code
as the rules want it and name it in the summary; never edit the gate unasked (§Shared code). A warning is
fixed or its reason given.

**The stop check** (each agent's stop hook) runs the gate without `tsc` on the files you changed and looks for
the heal a red verify still owes (the verify skill §5): what it finds sends you back once — do it, then stop. A
finding in a file you did not change is the tree's from before: named, never yours to chase now. Stopped for a
question the user must answer → ask it and stop again.

## Never fitted to the product

- **A test is never fitted to the product silently.** *How* it reaches the product (a path, a locator, a label's
  spacing) is fixed on evidence; *what* it expects (a step, a rule, a value) changes only with a source — the
  feature's ticket, the product's code, its history — quoted (a ticket's field, `file:line`, a commit). A change
  with a source is followed through the plan; without one it is a question to the user ("is this intended?")
  or a possible bug, and the test stays as it is.
- **Every new or changed check proves it can fail**: `npm run verify -- <app> <spec…> --can-fail
  <spec>:<line>=<the line spoiled>` swaps the expected value of the check this run wrote or changed (the main
  one in a new test; a state → its opposite), runs only those tests once and puts every line back. A changed
  expected value or assertion → can-fail; a locator-only fix or a renamed or moved step → none. Red at its line
  → it can fail; green → blind, fixed and proven again; red elsewhere → the test does not reach its check.
- **Independent review**, once the run is green: **full** for every new test — a NEW chat (`/review`) given only
  the cases as their source states them, the plan's `Data:` and `Rules:` lines, the test code and the run's
  report, asked where each test passes though its case is broken (an unasserted step, a check that cannot fail,
  assumed data, a re-proved fact, a mock); **light** for an edit — the same five kinds answered here, each with
  the `file:line` that holds it. No new chat possible → the summary says "not independent". A finding on a test
  this run touched is fixed and rerun, or answered; on an untouched one, listed for a later refresh.
- **Numbers only from the result files** — the summary's counts, verdicts, can-fail lines and coverage are copied
  from the `npm run verify` block (`test-results/verify.json`), `reports/run-summary.json` or `suite:coverage`,
  never written from memory.

## Shared code

Shared code — the template's own files: `src/setup/*.ts` and `src/setup/auth/`, `src/reporting/`,
`src/fixtures/*.ts`, the files `src/assertions/shared/` came with, `scripts/` — is changed only when the user
asks for it, and the summary names every such change. The tests' own code is not shared code, wherever the
rules put it: an app's `src/setup/<app>/`, `src/fixtures/<app>/`, `src/assertions/<app>/`, and a new helper
several apps need in `src/assertions/shared/` or `src/data/**/shared/`.
