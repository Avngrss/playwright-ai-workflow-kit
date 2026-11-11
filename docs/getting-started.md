# Getting started

From install to the first plan. The everyday path after that: [Workflow](workflow.md).

## Before you start

- Node 20+ (CI uses 22) and git.
- Claude Code, Cursor or GitHub Copilot (VS Code or Copilot CLI).
- A test environment of the app (dev or QA) and a **test account** for it — not your own; sign in with it by hand
  once first.
- Optional: MCP or API access to your TMS and tracker, so the agent reads cases and tickets itself.

## 1. Install

In your project's folder:

```bash
npx github:Avngrss/playwright-ai-workflow-kit
```

It asks where (`qa` by default), which AI and which CI, copies the kit, writes the CI, runs `npm ci` (Chromium
too) and creates `.env`. `--help` lists the flags (`--agent`, `--ci`, `--yes` …). When it stops, nothing was written:

| It says | Do |
|---|---|
| `already has what the kit would write (src/, tests/ …)` | that folder is your project's own — give another: `qa`, `tests/e2e` |
| `could not fetch the kit` | check the network or proxy for github.com, then run it again |
| `npm ci failed` | the kit is copied: run `npm ci` and `npm run env:prepare` in its folder |
| `.gitlab-ci.yml is there already — add to it:` | paste the printed `include:` lines into it |

A repository made with **Use this template** instead: `npm install`, `npm run env:prepare`,
`npm run agents:use -- claude` (or `cursor`, `copilot`, several).

## 2. Open it in your AI

Open **the kit's folder** (not the repository's root, when the kit is in `qa/`) and turn on the `playwright` MCP
server: Claude Code — approve it when asked; Cursor — Cursor Settings → MCP; Copilot CLI reads `.mcp.json`, VS
Code's Copilot with its workspace MCP setting on. In Copilot the commands are skills called by name.

## 3. Add your app: `/setup`

```text
/setup app https://qa.shop.example.com
```

The agent registers the app in `specs/project-map.md`, saves its address in `.env`, finds the sign-in flow
(signed out — it never submits a form), prepares empty login entries in `.env` — **you fill them yourself, never
in the chat**, then reply `ready` — and proves it with the sign-in smoke. A one-time code, a captcha or SSO-only
sign-in is reported with what the team must provide. Details: [Sign-in](auth-strategy.md).

## 4. Check

```bash
npm run qa:gate      # the conventions, then tsc
npm run test:smoke   # the app opens and its first account signs in
```

## 5. Plan the first feature

```text
/plan Account → Addresses
```

The agent checks the feature on the live app and shows the plan: each case's owner (API, UI or E2E), its checks,
priority and reason. Nothing is written before your yes. After **Yes, write them** it writes the tests, runs one
`npm run verify`, heals a failure once, has new tests reviewed by a reviewer that did not write them and sums up
with the next command.

## 6. CI

The installer wrote the workflow; CI only lacks the values. Give it every `.env` name of the map — GitHub:
Settings → Secrets and variables → Actions, addresses as **Variables**, logins and passwords as **Secrets**, and
the name in the workflow's `env:` (the agent adds it there when it adds the name to the map). A name left out:
the gate passes, the app's smoke fails with *setting missing*, and its other tests do not run.

## Later — the kit's newest version

```bash
npx github:Avngrss/playwright-ai-workflow-kit --update --dry-run   # the plan, nothing changed
npx github:Avngrss/playwright-ai-workflow-kit --update             # the plan, then "Update? (Y/n)"
```

| The plan says | It means |
|---|---|
| `replaced` · `added` · `removed` | kit files you never changed take the new version |
| `beside yours (.kit-new)` | you and the kit both changed it — compare with `<file>.kit-new`, keep what you want, delete it |
| `yours kept` | you changed it, the kit did not — nothing to do |

Your map, plans, tests, app code, `.env` and AI choice are never touched. Nothing is committed.

## Where things live

| Path | What |
|---|---|
| `agents/` | the rules, skills and commands your AI follows — edit here, then `npm run agents:sync` |
| `.claude/`, `.cursor/`, `.github/`, `.mcp.json` | your AI's copies of `agents/` — never edited by hand |
| `specs/project-map.md` | apps, `.env` names, sign-in, tags, locks — code and the gate read it |
| `specs/<app>/<area>/<feature>/<feature>.md` | a feature's plan (an E2E journey's: `specs/e2e/<app>/<area>/`) |
| `tests/<api\|ui\|e2e>/<app>/…` | the tests; `tests/smoke/` holds the sign-in smoke |
| `src/…/<app>/` | the app's fixtures, Page Objects, clients, data |
| `reports/run-summary.md`, `reports/allure/` | the last run's summary and report |

Every npm script: `agents/rules/00-project-map.md`. The strategy in one page: [Test strategy](test-strategy.md).
