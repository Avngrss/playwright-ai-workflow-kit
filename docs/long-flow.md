# Long flow

Do not choose this instead of [Quick flow](quick-flow.md).

Quick flow is how you **implement** a feature (plan → API/UI → review).

This page is a **menu**. Open it, run the one extra command you need, stop. Most items do not write tests. After them you go back to quick flow.

Templates: [Commands](commands.md).

---

## Menu

| Need | What it does | Then |
|------|----------------|------|
| [TMS](#tms) | Refine the plan against cases | Quick flow implement |
| [API collection](#api-collection) | Refine the plan against Bruno / OpenAPI | Quick flow implement |
| [Audit](#audit) | Report gaps, data, or flakes. Does not write tests | Quick flow if there are ready gaps |
| [Later UI extras](#later-ui-extras) | Screenshot or extra browser **after** UI exists | Only if already in the feature plan |
| [E2E](#e2e) | Separate implement cycle for a multi-page journey | Stay here (`/implement-e2e-flow`) |
| [Heal](#heal) | Fix a failing test | Stay here |
| [Extra pieces](#extra-pieces) | Create a builder, page, client, or helper | Continue the current plan |

Do not run the whole page. Audit is one row, not the whole menu. Screenshots and extra browsers are extra implement steps on the same UI — they live here so they stay out of the default quick cycle.

---

## E2E

E2E is a separate layer, not “heavy UI” and not “UI plus screenshots or extra browsers”.

Use it only for a journey that crosses pages, state, or systems. Page render, one form, or one validation stays in quick flow as UI. Plan it in `specs/e2e/<area>/<journey>.md` and implement with `/implement-e2e-flow` — not with `/implement-ui-batch`.

```text
/plan-e2e-journey specs/e2e/<area>/<journey>.md
→ review the journey plan
→ /implement-e2e-flow specs/e2e/<area>/<journey>.md
→ npm run test:e2e + npm run qa:gate
→ /review-generated
```

- Specs: `tests/e2e/**/*.e2e.spec.ts` with `@e2e` and `@smoke` or `@regression`
- Keep the journey visible in the spec
- API only for setup or cleanup — not to replace the UI path
- Block the journey if mailbox, payment, or cleanup is missing
- Do not implement E2E in the same run as API or UI

Example: forgot-password **page** is UI (quick flow). Reset-link plus login with a new password is E2E, and it stays blocked without mailbox access.

---

## TMS

Use TMS to make coverage more precise: what is already covered, what is missing, what stays not automated.

Read-only by default. Cases are planning input, not one Playwright test per case.

No plan yet:

```text
/plan-from-tms → review specs/<feature>/<feature>.md → quick flow implementation
```

Plan already exists:

```text
/align-plan-with-tms → review the aligned plan → quick flow implementation
```

Do not implement from TMS cases directly. Do not write to TMS unless asked. After the plan is reviewed, implement with quick flow (`/implement-api-batch`, `/implement-ui-batch`).

---

## API collection

Use the collection to make API coverage more precise: which requests exist, which are already planned or tested, which are gaps.

Bruno is a list of example requests. OpenAPI/Swagger is the contract when it exists. `specs/<feature>/<feature>.md` still decides what is automated.

```text
/inspect-api-collection
→ /plan-from-api-collection
→ review the plan
→ /implement-api-batch
→ /audit-api-collection-coverage
```

Store curated collections under `collections/bruno/<service-or-domain>/**`. Do not generate tests from the collection. Do not commit secrets. Destructive requests need cleanup in the plan first.

If Bruno and OpenAPI disagree, report the drift. Do not guess.

---

## Later UI extras

Optional steps **after** functional UI from quick flow exists, and only when that **feature** plan already says so. Do not add them to E2E unless the E2E journey plan explicitly says so.

**Screenshot checkpoint** — appearance of a state you already asserted:

1. Functional checks first
2. `/implement-visual-checkpoint`
3. Tag `@ui` `@visual` `@regression`
4. Do not update baselines unless you explicitly ask

Failure screenshots under `test-results/` are diagnostics, not baselines.

Functional smoke/regression runs exclude `@visual` by default; run visuals through the dedicated visual command.

**Extra browser or viewport** — only if the plan names a real engine or layout risk:

- `@cross-browser` → `npm run test:cross-browser`
- `@responsive` → `npm run test:responsive`

Both focused overlay commands exclude quarantine tags (`@wip`, `@flaky`) by default.

Do not tag `@firefox` or `@mobile`. Browser and viewport are Playwright projects. Do not run every test across every browser.

`@wip` means work in progress and `@flaky` means unstable quarantine. Keep both temporary and return tests to `@smoke` or `@regression` after stabilization.

Rules (detail): `.cursor/rules/visual-testing.mdc`, `.cursor/rules/browser-and-responsive-testing.rules.mdc`.

---

## Heal

```text
Failing API  →  /heal-api-test
Failing UI   →  /heal-ui-test
```

Fix the root cause. Then run the impacted spec and `npm run qa:gate`.

Do not add `waitForTimeout`, weaken assertions, or hide the action in a hook.

---

## Audit

Use an audit when coverage already exists and you need to check it — not to add tests yet.

| Need | Command |
|------|---------|
| Plan vs implemented tests | `/audit-test-coverage` |
| Shared data / missing cleanup | `/audit-test-data-strategy` |
| Flaky patterns | `/audit-test-stability` |
| Passing but noisy code | `/refactor-overengineering` |
| Folders, tags, or env names changed | `/update-project-map` |

Audits do not implement coverage. After the report, implement only ready gaps through [Quick flow](quick-flow.md).

---

## Extra pieces

Create these only when the current plan needs them — not up front.

| Need | Command |
|------|---------|
| Reusable payload or form | `/create-builder` |
| Repeated API requests | `/create-api-client` |
| New page / route | `/create-page-object` |
| Unclear UI block | `/discover-ui-components` |
| Page Object too large | `/refactor-page-object-to-components` |
| Repeated wiring or setup | `/create-fixture` |
| How tests sign in (roles, helper, session files) | Tell the agent to update project map **Auth Strategy** first. Guide: [Auth strategy](auth-strategy.md) |

A helper is justified when logic is repeated or non-trivial (parse, sort, compare). Keep it next to its layer: `src/test/data/**`, `src/test/assertions/**`, Page Object for locators. Do not hide the user action or the E2E journey inside a helper. Do not add faker by default.

UI tests that need backend state use an approved setup fixture. Specs must not invent API hosts.
