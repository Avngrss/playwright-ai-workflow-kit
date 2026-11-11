---
description: How the agent works here — the skill and command for each stage, which path (refresh, heal, triage, new tests), asking, never writing to the TMS or tracker without a yes, conduct, cleanup before "done", hardening rules, the one severity scale, starter conversion
alwaysApply: true
---

# Workflow

## The skill for each stage

Four skills, eight commands:

1. **setup** (`/setup` — What: app, sign-in, another account or role) — the test home, a new app (map rows,
   `npm run app:add`), its sign-in (an app with no ```auth block of its own gets it first, once), a further
   account or role, any change of the map.
2. **plan** (`/plan`) — intake: what to cover (a TMS link, a ticket or a bug, a requirements doc, an API
   collection or words), which app, an owner limit if any — ask only what the request leaves open; each case's
   scenarios, owners and routes from the live check; writes the plan and shows it as tables; nothing is
   implemented until the user confirms (`plans.md`). The plan exists already → a later pass, an alignment
   with the TMS or a refresh, by itself.
3. **implement** (`/implement`; `Layer: visual` for a screenshot checkpoint) — only cases `ready to implement
   now`, each whole: every scenario its one test in its owner's folder, started by `npm run spec:draft`; a
   visual checkpoint changes a baseline only on "Approve baseline: yes".
4. **verify** (`/verify`) — one `npm run verify` of what changed (the gate, can-fail, one run), one automatic
   heal after a fresh implement, a review of only what the gate cannot check — independent for a new test
   (`/review`, `02-guardrails.md` §Never fitted to the product) — the summary. Its Heal section (`/heal`,
   `/heal explain`) starts from the run summary and the failure's verdict (`code.md`) — a technical fix only;
   its Triage (`/triage`) sorts a red run; its Coverage section (`/coverage`) shows a TMS suite case by case.

A refactor of passing tests is done only on request (`ui.md` §Ownership decisions and refactoring).

## Which path

The first that matches:
- **a product or rule change named** (a ticket, a doc, the user's words) → a plan refresh (`plans.md` §When
  the product changes), even with red tests at hand — they are its evidence;
- **one or two red tests** of planned features → heal ("heal the red tests: <spec>:<line> …");
- **three or more, or a CI run** → triage ("triage the run <link | reports/run-summary.json>");
- **new tests** → plan → confirm → implement → verify.

The run summary's last line names the path for the run it describes. `npm run test:failed` only reproduces a
failure before a change; every rerun after one is `npm run verify` of the touched tests.

## Asking

- A real choice: one short question in chat with numbered options, then wait — never print a question and
  carry on. Free text: one plain message, then wait. Never ask what you can find out, or twice in a run.
  Never ask for a secret (`02-guardrails.md`).
- The TMS and the tracker are the ones the map names (§Test cases (TMS), §Tracker queue, `ticket link:` of
  `specs/known-bugs.md`): read them through their MCP or API; none reachable → say so in one line and work
  from what the user pastes. **Read-only**: never create, edit, move, delete, comment or mark anything there
  (cases, runs, results, folders, tickets) without the user's explicit yes to that exact write in this
  conversation — propose or draft it in chat.

## Conduct

- Small, reviewable changes; touch only what the task needs; no opportunistic refactoring; public Page Object
  and client methods keep their names unless the change needs it. Reuse before create (`code.md` §One home per kind).
- Never invent apps, URLs, env names, roles, endpoints, statuses, messages, tags or locks — they come from the
  map, the contract, the live app or the user; missing → `blocked`, or ask. Facts about the stand, an account
  or the sign-in are checked, never predicted.
- Everything shown and written (plans, specs, test names, the map) is in English.
- Code examples in rules illustrate a pattern: never copy names, paths, roles, endpoints, tags or domains the
  project lacks, never add an abstraction because an example has one; the map and the more specific rule win.
- Commit or push only when the user asks. "Done" = verification ran (or the summary says what to run and why
  it did not) and the temporary artifacts are gone.

## Cleanup before "done"

Debug in temporary artifacts, deliver in the proper layers, delete the temporary ones before calling a task
(implement, heal, verify, explore) complete — even unasked, at the end of the task, not after every attempt:
one-off scripts (`scripts/debug-*.mjs`, `discover-*`, `scratch-*`, any ad-hoc script), dumps
(`discover-*-output.json`, `*-discovery.json`, MCP snapshots or logs copied into source — `.playwright-mcp/`
is runtime output), probe specs and their folders (`live-app.md`), throwaway copies of a Page Object, spec or
plan, notes at the repo root. Move a probe's findings first (a locator to its Page Object, a decision to the
plan); never keep something "just in case" or move a debug script into `src/` or `tests/`. Code taken out of
the suite is deleted — never kept in `state/`, beside the tests or commented out; the change log says what
left; a copy the user wants goes outside the repository. Keep `tests/**`, `src/**`, reviewed `specs/**`, the
permanent scripts (`scripts/gate/`, `scripts/agent/`, `run-tests.mjs`, `auth.mjs`) and files the user made
or asked to keep; unsure → report, never delete silently. A dump holding a secret is
deleted, never summarized, and the user told to rotate it; a recurring artifact goes into `.gitignore`. The
summary names what was removed and what was left as unsure (nothing removed → no line).

## Hardening rules

A failure, flaky test, review finding or repeated agent mistake changes a rule, skill, helper, the map or the
docs only when it can recur and nothing covers it clearly — never for a one-off, a typo or what belongs only
in code. Search the existing guidance first, make the smallest edit of an existing rule, never put project
detail into a universal rule, never duplicate or contradict guidance.

## Severity — one scale for plans, bugs and reviews

| Severity | A product breakage (a case, a bug) | A finding in tests, code or a plan |
|---|---|---|
| **Critical** | data lost or exposed, a Core scenario blocked | can give a wrong verdict — a false pass or fail (a fake, weakened or missing check, a check that cannot fail, an expectation fitted to the product without a source, a schema contradicting the assertions, a check hidden in a Page Object or client, a fixed wait); a secret exposed |
| **Major** | broken, a workaround exists | maintainability or architecture: a scenario proven twice or not as its route says, the wrong home, stale or unused code, an abstraction not earning its cost, a spec made unreadable |
| **Minor** | cosmetic | readability worth fixing now: a name, an order, a wrapper to inline, an import |

Never report a speculative finding without evidence.

## Starter conversion

Turning a project back into the reusable kit (asked in words — no command of its own): inventory and classify
every file — **keep** (rules, skills, commands, reusable docs, package and config files such as
`playwright.config.ts`, `tsconfig.json`, `.gitignore` and a generic `.env.example`, generic scripts and workflow
templates, the shared sign-in smoke, `agents/mcp.json` with safe MCP only) · **remove** (tests, plans,
`src/<kind>/<app>/` folders, the product's map rows and blocks, known-bug rows, `src/**` code bound to the
product even in a generic folder, sample tests not marked as templates, visual snapshot folders, product-only
docs and URLs, committed credentials or sessions, app-specific CI) · **generated** (`state/`, `reports/allure/**`, `reports/run-summary.*`,
`test-results/`, `playwright-report/`, `.playwright-mcp/`, scratch scripts and dumps, traces, videos, logs, a
local `.env` — delete or ignore) · **unsure** (ask, never delete); `.github/**` per file. Nothing is deleted
before the user decides on the lists; then `npm run test:list` and `npm run qa:gate`. The map, known-bugs and
`docs/test-strategy.md` become blank templates, `src/data/sweeps.ts` an empty list. Report Removed · Preserved
· Unsure · Verification · Remaining risks; not complete while unsure files remain unless the user accepted it.
