# Start a New Project

**Overview:** [README](../README.md) — high-level starter introduction. This guide is the detailed onboarding walkthrough.

---

## Purpose

This repository is a reusable **Playwright + TypeScript automation framework starter**.

It provides rules, skills, commands, scripts, and documentation for building test automation on a target application. Project-specific tests, Page Objects, schemas, fixtures, builders, and feature plans are created per application — they are not shipped with the starter.

The clean starter has **no `src/test/**` implementation layer**. Skills and commands create the required project structure when implementation starts.

Use this guide when you copy or clone the starter for a new automation project.

---

## Prerequisites

- **Node.js** installed (LTS recommended).
- **npm** available for dependency installation.
- **Playwright browsers** installed when you add browser UI or E2E tests.
- **Cursor** available if you use the AI workflow, slash commands, and MCP integrations.

---

## Initial Setup

1. **Clone or copy** this starter into your project workspace.
2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create local environment file** when your project needs runtime URLs:

   ```bash
   cp .env.example .env
   ```

4. **Fill placeholders only when needed** for your target application:

   **Simple single-app projects** (starter defaults):

   ```text
   UI_BASE_URL=
   API_BASE_URL=
   UI_PRECONDITION_API_BASE_URL=
   ```

   - `UI_BASE_URL` — fill when adding UI or E2E browser tests.
   - `API_BASE_URL` — fill when adding API tests.
   - `UI_PRECONDITION_API_BASE_URL` — fill only when UI or E2E tests need approved backend precondition setup.

   **Multi-target projects** (multiple UI apps or API/microservices):

   - register every env name in `.cursor/rules/00-project-map.mdc` before use;
   - add matching commented examples to `.env.example`;
   - do not invent env names in plans or code;
   - feature plans must name target UI app(s), API service(s), and precondition service(s);
   - E2E journey plans must document every UI app and service crossed.

   Rule reference: `.cursor/rules/multi-target-environment.rules.mdc`

   Leave unused variables empty. Do not put real secrets, tokens, or production credentials in the repository.

5. **Never commit** `.env` or other local secret files.

---

## MCP and TMS Setup

| Integration | Where to configure |
|-------------|-------------------|
| **Playwright MCP** | Project `.cursor/mcp.json` (safe to commit; project-level only) |
| **TMS MCP or API access** | User/global Cursor MCP settings, extension settings, or local secret storage (not in repo) |
| **Azure DevOps, GitKraken, other user tools** | User/global or extension-level settings |

TMS guidance:

- TMS integration is **optional**. Use it for planning input and traceability when a Test Management System is available.
- **Qase** is a currently supported example provider via user/global Cursor MCP when configured — not a hard dependency of the starter.
- Other TMS providers may be supported later through approved integration paths.
- TMS tokens belong in user/global MCP settings or local secret storage — **not** in repository env files.
- TMS is **read-only by default** (list/read cases; no writes, runs, or result publishing without explicit approval).
- TMS reporter/result publishing is separate and **not** configured in this starter by default.

If you use Qase as your TMS example, verify its MCP connection in Cursor before running `/plan-from-tms` or `/align-plan-with-tms`.

---

## Starter Structure

Key locations:

| Path | Purpose |
|------|---------|
| `.cursor/rules/**` | Architecture and quality guardrails |
| `.cursor/skills/**` | Task-specific AI procedures |
| `.cursor/commands/**` | Slash command launchers |
| `docs/**` | Framework and workflow documentation |
| `specs/<feature>.md` | Feature coverage plans (API, UI, schema, visual) |
| `specs/e2e/<journey>.md` | E2E journey plans (full user/business flows) |
| `tests/api/**` | API specs (`*.api.spec.ts`) |
| `tests/ui/**` | UI specs (`*.ui.spec.ts`) |
| `tests/e2e/**` | E2E specs (`*.e2e.spec.ts`) |

**Project implementation layer** — created per application when implementation starts; **absent in clean starter**:

| Path | Purpose |
|------|---------|
| `src/test/pages/**` | Page Objects |
| `src/test/components/**` | Component Objects |
| `src/test/fixtures/**` | Fixture chain; final entry point: `test.ts` |
| `src/test/assertions/**` | Assertion helpers |
| `src/test/schemas/**` | API Zod schemas |
| `src/test/data/**` | Builders, generators, datasets |
| `src/test/reporting/**` | Allure and reporting helpers |
| `src/test/api/clients/**` | Thin API clients (when justified) |
| `src/test/assets/files/**` | Safe synthetic upload assets |

Many project-specific folders do not exist until the first implementation run. Use skills such as `create-fixture`, `create-page-object`, and `implement-api-feature` / `implement-ui-feature` to create the required structure.

Source of truth for structure and commands: `.cursor/rules/00-project-map.mdc`.

---

## First Feature Workflow

Recommended flow for the first feature on a new application:

```text
/plan-feature
-> review generated plan at specs/<feature>.md
-> /implement-api-batch        (API ready coverage)
-> /implement-ui-batch           (UI ready coverage)
-> /implement-visual-checkpoint  (only when visual coverage is approved)
-> /review-generated             (after implementation)
-> /audit-test-coverage          (optional; plan vs tests alignment)
-> /audit-test-data-strategy      (optional; shared data / cleanup review)
-> /audit-test-stability         (optional; flaky patterns before commit)
```

Clarifications:

- **Feature plans** cover API, UI, schema, visual, cross-browser, and responsive decisions.
- **Feature plans** must identify target UI app(s), API service(s), and precondition service(s) when more than one exists.
- **Feature plans do not contain E2E journeys.** Plan E2E separately under `specs/e2e/`.
- Use **ready to implement now** vs **blocked/postponed** in plans; do not implement blocked items without clarification.
- **Project map** is the source of truth for app/service env names in multi-target projects.

---

## First E2E Workflow

Use E2E only for critical full user or business journeys — not for short UI form, control, or validation checks.

```text
/plan-e2e-journey specs/e2e/<journey>.md
-> review journey plan
-> /audit-test-data-strategy      (optional; data/cleanup/isolation before implementation)
-> /implement-e2e-flow specs/e2e/<journey>.md   (ready scenarios only)
-> /review-generated
-> /audit-test-coverage          (optional; journey plan vs E2E specs)
-> /audit-test-data-strategy      (optional; E2E data policy vs implementation)
-> /audit-test-stability         (optional; E2E stability before commit)
```

Rules:

- E2E specs live under `tests/e2e/**/*.e2e.spec.ts`.
- Tag with `@e2e` plus `@smoke` or `@regression`.
- E2E journey plans must document every UI app and API service crossed with env names from the project map.
- API may be used only for **setup, preconditions, or cleanup** — not to replace UI journey steps.
- Keep the full user journey visible in the spec; do not hide it in fixtures, hooks, or Page Objects.

---

## TMS Workflow

| Command | When to use |
|---------|-------------|
| `/plan-from-tms` | No `specs/<feature>.md` yet; TMS cases are the main input |
| `/align-plan-with-tms` | Feature plan exists; align with TMS suite/cases |
| `/audit-test-coverage` | Compare plan(s) vs implemented tests; audit only |
| `/audit-test-stability` | Audit UI/E2E flaky patterns; audit only — use `/heal-ui-test` to fix |
| `/audit-test-data-strategy` | Audit data isolation/cleanup/shared-data risks; audit only — does not create/modify data |

Rules:

- TMS is **read-only by default** unless explicitly approved for writes.
- TMS cases are **planning input and traceability** — do not assume 1 TMS case = 1 automated test.
- Map cases by risk: API, UI, schema, visual, not automated, blocked, or postponed.
- TMS reporter/result publishing is separate and not configured by default.
- **Qase** is a supported example provider when configured user/global — other TMS tools may be used when integration is approved.

---

## Cross-Browser and Responsive Coverage

- Cross-browser and responsive coverage are **risk-based**, not a default browser/device matrix.
- Browser and viewport belong to **Playwright projects** (`ui-chromium`, `api`, `e2e`), not Playwright tags.
- Use `@cross-browser` and `@responsive` only when explicitly planned and registered.
- Do **not** invent tags such as `@firefox`, `@webkit`, `@mobile`, `@tablet`, or `@desktop`.
- Responsive coverage is usually focused UI coverage, not a full E2E viewport matrix.

Rule reference: `.cursor/rules/browser-and-responsive-testing.rules.mdc`

---

## Visual Testing

- Visual checkpoints are **separate from functional assertions** — verify behavior first, then screenshot stable UI state.
- Visual baselines require **explicit approval**; do not update snapshots silently.
- Do not add screenshots by default.
- Use `/implement-visual-checkpoint` only when visual coverage is planned and approved.

Rule reference: `.cursor/rules/visual-testing.mdc`

---

## Verification

The clean starter has **zero tests** — that is valid. All package test scripts use `--pass-with-no-tests` so they succeed in the empty starter state.

Common starter checks:

```bash
npm run qa:gate
npm run test:list
```

Layer scripts (use registered Playwright projects only):

```bash
npm run test:api
npm run test:ui
npm run test:e2e
```

Tag-based scripts (filter by Playwright tags across projects):

```bash
npm run test:smoke
npm run test:regression
npm run test:visual
```

Coverage-type tag scripts (filter planned cross-browser or responsive tests only):

```bash
npm run test:cross-browser
npm run test:responsive
```

Notes:

- **Smoke and regression** scripts filter by `@smoke` or `@regression` tags — not by folder paths or project names.
- **Cross-browser and responsive** scripts filter by `@cross-browser` or `@responsive` coverage-type tags only. They do not run a browser matrix and do not imply Firefox, WebKit, or mobile projects exist.
- **Browser and viewport execution** still depends on Playwright projects in `playwright.config.ts` (`ui-chromium`, `api`, `e2e`). Tags describe test intent; projects describe execution environment.
- **Zero-test starter state** is expected. Scripts pass cleanly until real tests are added.
- **First real tests** are created through planning and implementation commands: `/plan-feature`, `/plan-e2e-journey`, `/implement-api-batch`, `/implement-ui-batch`, `/implement-e2e-flow`.

After implementing coverage, run the impacted layer or tag script and `npm run qa:gate` again.

Environment notes:

- **Missing browser binary** is an environment setup issue, not a test failure. Install when needed:

  ```bash
  npx playwright install chromium
  ```

---

## Do and Do Not

### Do

- Create a plan before implementation.
- Use **ready to implement now** vs **blocked/postponed** in plans.
- Keep API, UI, E2E, and visual responsibilities separate.
- Use existing rules, skills, and commands.
- Keep secrets and tokens in local or user/global config only.
- Import tests from `src/test/fixtures/test.ts` once the project fixture chain is created (final fixture entry point).

### Do not

- Commit real tokens or `.env` with secrets.
- Write E2E scenarios from feature plans — use `specs/e2e/<journey>.md`.
- Duplicate UI/API coverage in E2E without distinct journey value.
- Invent tags, Playwright projects, or browser/device tag names.
- Use `waitForTimeout`.
- Hide E2E journey steps in fixtures, hooks, or Page Objects.
- Leave application-specific code in the starter when converting it for reuse.

---

## Minimal First Commands

```bash
npm install
npm run qa:gate
npm run test:list
```

Planning and implementation (Cursor slash commands):

```text
/plan-feature
/plan-e2e-journey
/review-generated
/audit-test-coverage
/audit-test-data-strategy
/audit-test-stability
```

---

## Related Documentation

- [README](../README.md) — high-level starter overview
- [How To Use AI Automation System](reference/HOW_TO_USE_AI_AUTOMATION.md)
- [AI Workflow Map](reference/AI_WORKFLOW_MAP.md)
- [AI Skills and Commands Playbook](AI_SKILLS_COMMANDS_PLAYBOOK_FULL.md)
- Project map: `.cursor/rules/00-project-map.mdc`
