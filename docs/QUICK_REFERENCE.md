# Quick Reference

Daily-use cheat sheet for the Playwright AI Workflow Kit. For full onboarding, see [README.md](../README.md) and [Start a New Project](START_NEW_PROJECT.md).

---

## 30-Second Mental Model

- **Feature coverage** = `/plan-feature` → `specs/<feature>.md` → API/UI/visual implementation.
- **E2E journey** = `/plan-e2e-journey` → `specs/e2e/<journey>.md` → `/implement-e2e-flow`.
- **TMS** = planning input, not direct test generation.
- **Review** generated changes with `/review-generated`.
- **Audit** coverage with `/audit-test-coverage`.

---

## Main Workflow Cheat Sheet

### Feature workflow (recommended order)

1. **`/plan-feature`** — create or update `specs/<feature>.md`
   - decide test level per scenario: API, UI, schema, visual, cross-browser, responsive, not automated, blocked
   - mark each scenario **ready to implement now** vs **blocked/postponed**
   - document Feature Targets (UI URL, API URL, env names from project map)
   - state explicitly when cross-browser, responsive, or visual coverage is **not needed**
2. **`/review-generated`** — review the plan before implementation
3. **`/implement-api-batch`** — implement API/schema scenarios marked ready
4. **`/implement-ui-batch`** — implement UI scenarios marked ready
5. **Verify** — run impacted tests and quality gate:

   ```bash
   npm run test:api    # or test:ui / test:e2e / npm test
   npm run qa:gate
   ```

6. **`/implement-visual-checkpoint`** — **optional, after UI exists** — only when the plan marks visual coverage ready or you explicitly request it later
7. **Cross-browser / responsive** — **optional, per test** — add `@cross-browser` or `@responsive` only when the plan documents browser/viewport risk; run `npm run test:cross-browser` or `npm run test:responsive`
8. **Report** — after test runs:

   ```bash
   npm run report:allure:generate
   npm run report:allure:open
   ```

9. **`/audit-test-coverage`** — compare plan vs implemented tests
10. **`/review-generated`** — review generated code quality

Visual and cross-browser are **not default steps**. They are added only when the feature plan says ready or you ask for them explicitly after functional coverage exists.

### E2E workflow

1. `/plan-e2e-journey`
2. `/review-generated`
3. `/implement-e2e-flow specs/e2e/<journey>.md`
4. `/audit-test-coverage`
5. `/review-generated`

### TMS workflow

- `/plan-from-tms` — when no plan exists
- `/align-plan-with-tms` — when plan exists
- Read-only by default
- Provider-agnostic; Qase is an example only

---

### API collection workflow

`Bruno → inspect → plan → implement API tests → audit`

- `/inspect-api-collection` — inspect collection content without modifying files.
- `/plan-from-api-collection` — create/update `specs/<feature>.md`; never implement tests.
- `/audit-api-collection-coverage` — audit collection, plan, and API-test alignment.

---

## API Collections (Short)

- **Bruno** = executable request and payload examples.
- **OpenAPI/Swagger** = API contract source of truth.
- **`specs/<feature>.md`** = reviewed automation plan.
- **`tests/api/**`** = Playwright implementation.
- Store curated team Bruno collections under `collections/bruno/**`; do not generate tests directly from them or commit secrets.

---

## Command Quick Table

| Command | Use when |
|---------|----------|
| `/plan-feature` | Create or update feature coverage plan at `specs/<feature>.md` |
| `/plan-e2e-journey` | Create or update full-journey plan at `specs/e2e/<journey>.md` |
| `/plan-from-tms` | Build feature plan from TMS cases (no existing plan) |
| `/align-plan-with-tms` | Align existing feature plan with TMS cases |
| `/inspect-api-collection` | Inspect a collection as planning/audit input |
| `/plan-from-api-collection` | Create/update a feature plan from collection input |
| `/audit-api-collection-coverage` | Audit collection, plan, and API-test alignment |
| `/implement-api-batch` | Implement ready API coverage from feature plan |
| `/implement-ui-batch` | Implement ready UI coverage from feature plan |
| `/implement-e2e-flow` | Implement ready E2E journey from journey plan only |
| `/implement-visual-checkpoint` | Add or verify visual checkpoint when planned |
| `/audit-test-coverage` | Compare plan vs implemented tests |
| `/review-generated` | Review and simplify generated code |

---

## Test Level Decision

- **API** — contracts, status codes, schema, backend behavior.
- **UI** — page behavior, forms, validation, controls.
- **E2E** — full user/business journey only.
- **Visual** — approved screenshot baseline.
- **Cross-browser** — planned browser-risk UI coverage.
- **Responsive** — planned viewport-risk UI coverage.
- **TMS** — source/traceability, not direct automation.

---

## Generated File Locations

| Artifact | Path |
|----------|------|
| Feature plan | `specs/<feature>.md` |
| E2E journey plan | `specs/e2e/<journey>.md` |
| API tests | `tests/api/**` |
| UI tests | `tests/ui/**` |
| E2E tests | `tests/e2e/**` |
| Implementation layer | `src/test/**` — created per real project only |
| Allure raw results | `reports/allure/results/` |
| Allure HTML report | `reports/allure/html/` |
| Allure config | `reports/allure/allurerc.mjs` |
| Allure metadata helper | `src/test/reporting/allure-metadata.helper.ts` |

---

## Tags

Required layer tags: `@api`, `@ui`, `@e2e`, `@visual` (when applicable).

Execution scope: `@smoke`, `@regression`.

Coverage type (when planned and registered): `@cross-browser`, `@responsive`.

**Do not use:** `@firefox`, `@webkit`, `@mobile`, `@tablet`, `@desktop`.

Browser and viewport belong to Playwright projects, not Playwright tags.

---

## Package Scripts

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Conventions and quality checks |
| `npm run test:list` | List discovered tests |
| `npm test` | Baseline run (all configured projects) |
| `npm run test:api` | API project |
| `npm run test:ui` | UI project |
| `npm run test:e2e` | E2E project |
| `npm run test:smoke` | Smoke-tagged tests |
| `npm run test:regression` | Regression-tagged tests |
| `npm run test:visual` | Visual-tagged tests |
| `npm run test:cross-browser` | Explicit cross-browser opt-in |
| `npm run test:responsive` | Explicit responsive opt-in |
| `npm run report:allure:generate` | Build `reports/allure/html/` from `reports/allure/results/` |
| `npm run report:allure:open` | Open generated HTML report |
| `npm run report:allure:serve` | Generate and open report from raw results (dev shortcut) |

- `npm test` = baseline run.
- Cross-browser and responsive scripts are explicit opt-in paths.
- Zero-test starter state is valid.
- Use **npm scripts** for Allure — do not call raw `allure` CLI with old v2 flags such as `--clean`.

---

## Env / Secrets Quick Model

- **Local:** copy `.env.example` to `.env`.
- **CI URLs:** GitHub Variables.
- **CI tokens/passwords:** GitHub Secrets.
- **Feature Targets:** each plan lists only its UI/application, API/service, external/partner, and optional setup/cleanup targets.
- Simple projects use `UI_BASE_URL` and `API_BASE_URL`.
- Multi-target env names must be registered in the project map.
- Do not hardcode secrets.

---

## E2E Rules (Short)

- Full journey only — not a short UI test.
- Setup, data, and cleanup required.
- API only for preconditions/cleanup.
- Business flow stays in UI.
- Deterministic only.
- Block if unstable external dependency (mailbox, payment, etc.).

---

## Cross-Browser / Responsive (Short)

- Not a full matrix by default — `npm test` runs `api` + `ui-chromium` + `e2e` only.
- `@cross-browser` only when planned; runs on `ui-chromium`, `ui-firefox`, `ui-webkit` via `npm run test:cross-browser`.
- `@responsive` only when planned; runs on `ui-mobile-chromium` via `npm run test:responsive`.
- No full E2E viewport/browser matrix by default.
- Do **not** use `@firefox`, `@webkit`, `@mobile`, `@tablet`, `@desktop` as tags — browser/viewport = Playwright projects.
- API/schema tests are browser-independent — never duplicate per browser.
- E2E cross-browser = very small smoke only, documented in `specs/e2e/<journey>.md`.

Full reference: [Cross-Browser and Visual Testing](CROSS_BROWSER_AND_VISUAL_TESTING.md)

---

## Visual / Screenshots (Short)

Two different concepts:

- **Failure artifacts** — automatic on failure (`test-results/`); not visual baselines.
- **Visual checkpoints** — planned `toHaveScreenshot` in specs with `@visual` + functional assertion first.

Rules:

- use `/implement-visual-checkpoint` only when planned or explicitly requested
- functional assertion before screenshot; smallest meaningful screenshot scope
- baselines require explicit approval — never update snapshots silently
- `@ui` + `@visual` + `@regression` by default; no `@smoke` unless requested
- no `toHaveScreenshot` in Page Objects or Components
- mask or stabilize dynamic content before screenshot; do not mask the element under test
- cross-browser/responsive visual baselines need per-engine or per-viewport approval
- do not add visual checks to `qa:gate` until baseline environment is stable

Full reference: [Cross-Browser and Visual Testing](CROSS_BROWSER_AND_VISUAL_TESTING.md)

---

## Test Data (Short)

- Faker optional, not default.
- No faker/random directly in specs.
- Prefer simple deterministic generators first.
- Builders/generators live under `src/test/data/**` when project exists.

---

## CI / Reporting (Short)

- CI is zero-test safe.
- `qa:gate` + `test:list` always run.
- Matrix runs when tests exist.
- Playwright artifacts: `playwright-report/`, `test-results/` (failure diagnostics only).
- Allure raw results: `reports/allure/results/` — written during test runs.
- Allure HTML: `reports/allure/html/` — built via `npm run report:allure:generate`.
- TMS publishing is not enabled by default.

### Allure readability defaults

- Playwright reporter uses `detail: false` — only explicit `test.step` appear in the report (no click/expect noise).
- Use `applyAllureMetadata(testInfo, { feature })` in specs for feature, story, layer, severity, and domain tags.
- Use `test.step` for meaningful user-level phases in UI, E2E, and API specs.
- Config: `reports/allure/allurerc.mjs` (Allure 3 — no `--clean` flag).

Local workflow after tests:

```bash
npm test                        # or test:ui / test:api / test:e2e
npm run report:allure:generate
npm run report:allure:open
```

---

## Do Not Do

- Do not implement without a plan.
- Do not write E2E from feature plans.
- Do not put secrets in the repo.
- Do not invent tags, env vars, or Playwright projects.
- Do not use `waitForTimeout`.
- Do not hide full E2E flow in fixtures or Page Objects.
- Do not add dependencies without plan/scope.

---

## Helper Guidance

Optional patterns when a project creates `src/test/**`: [Helper Recipes](HELPER_RECIPES.md) — documentation only, not shipped source helpers.

---

## Links

- [README.md](../README.md)
- [Cross-Browser and Visual Testing](CROSS_BROWSER_AND_VISUAL_TESTING.md)
- [API Collection Integration](API_COLLECTION_INTEGRATION.md)
- [Start a New Project](START_NEW_PROJECT.md)
- [Helper Recipes](HELPER_RECIPES.md)
- [AI Skills and Commands Playbook](AI_SKILLS_COMMANDS_PLAYBOOK_FULL.md)
- [AI Workflow Map](reference/AI_WORKFLOW_MAP.md)
- [AI Agent Prompts](reference/AI_AGENT_PROMPTS.md)
