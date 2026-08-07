# AI Skills and Commands Playbook

## Purpose

This playbook explains how to use the AI skills and Cursor slash commands for the **Playwright AI Workflow Kit** — an AI-assisted workflow kit for Playwright automation projects.

**npm package name:** `playwright-ai-workflow-kit`

**GitHub repository:** https://github.com/Avngrss/playwright-ai-workflow-kit

Use this document to decide:

- which skill fits the task;
- which command to run;
- what to put into the command placeholders;
- what the agent is allowed to change;
- how to verify the result.

The goal is to keep prompts short, avoid token waste, prevent scope creep, and make AI-generated code consistent with the workflow kit conventions.

**New to the Playwright AI Workflow Kit?** Start with [Start a New Project](START_NEW_PROJECT.md) for setup, structure, and first-workflow commands. You can also use this repository as a **template for new automation projects**.

---

## Core Model

```text
Project Map = where things live
Rules = what must never be violated
Skills = how to do a specific task
Commands = short launchers for common tasks
Your added context = concrete task details
Verification = proof that the result works
```

Use one main skill per task.

Do not use generic "write code" prompts.

Choose the smallest skill that matches the task.

---

## Package Test Scripts

Baseline-safe scripts (all use `--pass-with-no-tests`; zero tests is valid):

| Script | Purpose |
|--------|---------|
| `npm run qa:gate` | Convention checks |
| `npm test` | Baseline run: `api` + `ui-chromium` + `e2e` |
| `npm run test:list` | List tests without executing |
| `npm run test:api` | API project (`api`) |
| `npm run test:ui` | UI project (`ui-chromium`) |
| `npm run test:e2e` | E2E project (`e2e`) |
| `npm run test:smoke` | Baseline `@smoke` run on `api` + `ui-chromium` + `e2e` |
| `npm run test:regression` | Baseline `@regression` run on `api` + `ui-chromium` + `e2e` |
| `npm run test:visual` | Baseline `@visual` run on `ui-chromium` |
| `npm run test:cross-browser` | `@cross-browser` on `ui-chromium`, `ui-firefox`, `ui-webkit` |
| `npm run test:responsive` | `@responsive` on `ui-mobile-chromium` |

Rules:

- `npm test` is baseline scope only (`api`, `ui-chromium`, `e2e`) and not a full browser/mobile matrix;
- layer scripts use registered default execution projects: `api`, `ui-chromium`, `e2e`;
- smoke/regression/visual scripts are baseline-scoped tag runs;
- cross-browser/responsive scripts run planned coverage-type tags on registered UI projects only;
- browser/viewport execution still depends on `playwright.config.ts` projects;
- first real tests come from `/plan-feature`, `/plan-e2e-journey`, and implementation commands.

Starter CI baseline (`.github/workflows/playwright.yml`):

- enables npm dependency caching via `actions/setup-node` (`cache: npm`);
- always runs `npm ci`, `npm run qa:gate`, and `npm run test:list`;
- detects test files and skips matrix execution in zero-test state;
- maps repository variables to Playwright env when matrix jobs run (empty fallback when unset);
- runs matrix jobs only when tests exist;
- uploads generated Playwright artifacts when present (`playwright-report/`, `test-results/`);
- generates and uploads Allure artifacts when present (`reports/allure/results/`, `reports/allure/html/`);
- does not configure TMS publishing or GitHub Pages publishing by default.

Reporting (Playwright HTML + Allure):

- enabled in `playwright.config.ts` for local and CI artifacts only;
- Allure is **not** TMS result publishing;
- failure screenshots, traces, and videos are retained on failure only;
- `npm run report:allure:generate` builds `reports/allure/html/` from `reports/allure/results/`;
- CI generates/uploads Allure report only when results exist;
- step-level custom Allure screenshots are project-specific and not enabled by default;
- zero-test starter remains valid — no report folders required when matrix is skipped.

CI variables and secrets model:

- **Feature Target variables** (non-sensitive URLs): simple baseline `UI_BASE_URL` + `API_BASE_URL`; named targets only when registered in project map.
- **Secrets** (tokens/passwords/credentials): user passwords, API tokens, service accounts, TMS tokens, external service credentials.
- local `.env` corresponds conceptually to CI variables and secrets; never commit real `.env`.
- never hardcode secrets in workflow YAML; prefer environment secrets for staging/production-like targets.
- document required CI configuration per real project in `.cursor/rules/00-project-map.mdc`.
- clean starter does not require configured variables or secrets; TMS publishing remains disabled unless explicitly planned.

Each feature plan lists only the Feature Targets it uses: UI/application, API/service, external/partner, and setup/cleanup when relevant. Do not assume a global precondition API URL.

---

## Starter Baseline Cleanup

Use when converting the repository into a reusable **Playwright AI Workflow Kit** baseline or cleaning project-specific artifacts from a copied template.

Rule:

- `.cursor/rules/framework-starter-boundary.rules.mdc`

Keep:

- rules, skills, commands, reusable docs, generic scripts, and domain-neutral framework mechanisms

Remove or exclude unless explicitly approved as templates:

- project tests, specs, and the full `src/test/**` implementation layer (Page Objects, fixtures, schemas, helpers, data, reporting helpers, and related assets)
- product-specific docs

The clean starter baseline intentionally omits `src/test/**`. Skills such as `create-fixture`, `create-page-object`, and implementation skills create required structure per application.

Do not delete:

- ambiguous files without user decision;
- framework docs/rules/skills/commands;
- package/config files without explicit review

Generated/runtime artifacts such as `.playwright-mcp/**`, reports, and local run output are not framework source content.

Cleanup work must produce a report with removed files, preserved files, unsure files, verification, and remaining risks.

---

## Test Data Generation Baseline Policy

The clean starter baseline ships without `src/test/data/**`.

Create project data files only when implementation needs reusable generated data:

- `src/test/data/builders/**` for reusable structured domain data;
- `src/test/data/generators/**` for primitive unique values.

Rules:

- do not generate random data directly in specs;
- do not call faker directly in specs;
- `@faker-js/faker` is optional and should be added only for a real project need;
- if faker is added, keep generation deterministic enough for repeatable debugging.

Rule:

- `.cursor/rules/test-data-generation.rules.mdc`

---

## Planning Layers

Two planning layers exist. Do not mix them.

### Feature coverage plans

- location: `specs/<feature>.md`
- levels: API, UI, schema/contract, visual, not automated
- do **not** include E2E

### E2E journey plans

- location: `specs/e2e/<journey>.md`
- full user or business flows only
- may reuse API/UI capabilities but must not duplicate their coverage

---

## Test Levels

Use the lowest reliable level that proves the behavior.

- **API** — backend contract, validation, auth, data predicates, negative and boundary behavior
- **UI** — focused user-facing browser behavior, visible feedback, page/form/control interaction
- **E2E** — critical full user or business journeys crossing multiple states, pages, or system boundaries; planned separately in `specs/e2e/<journey>.md`
- **visual** — meaningful layout or appearance regression inside stable UI states
- **schema/contract** — response or payload shape validation
- **not automated** — manual, unstable, duplicate, or low-value automation

Cross-browser and responsive coverage are **not** default matrix expansion.

They are focused additions for documented browser or viewport risks on top of normal UI coverage.

**Full reference:** [Cross-Browser and Visual Testing](CROSS_BROWSER_AND_VISUAL_TESTING.md)

- do not run every UI or E2E test in every browser or viewport by default
- API and schema tests are browser-independent
- E2E cross-browser should stay limited to very small smoke journeys and be planned in `specs/e2e/<journey>.md`
- responsive coverage should use functional assertions unless planned visual coverage with approved baselines exists

Rule:

- `.cursor/rules/browser-and-responsive-testing.rules.mdc`

Tag and metadata policy:

- Playwright tags describe test intent: layer (`@api`, `@ui`, `@e2e`, `@visual`), execution scope (`@smoke`, `@regression`), optional registered coverage type (`@cross-browser`, `@responsive`);
- do not use browser or device names as tags: `@chromium`, `@firefox`, `@webkit`, `@mobile`, `@tablet`, `@desktop`;
- browser and viewport belong to Playwright projects (`api`, `ui-chromium`, `ui-firefox`, `ui-webkit`, `ui-mobile-chromium`, `e2e`) and Allure reporting metadata;
- Allure metadata must not replace Playwright tags.

Not every UI test is E2E.

Feature plans use ready to implement now / blocked-postponed for API, UI, schema, visual, and not automated levels.

E2E journey plans use the same readiness classification for full-journey scenarios.

Recommended next commands are informational only during planning.

Feature plans should recommend `/plan-e2e-journey` (not `/implement-e2e-flow`) when a full journey candidate exists.

Recommend `/implement-e2e-flow` only from an approved E2E journey plan at `specs/e2e/<journey>.md` with at least one ready-to-implement-now scenario.

---

## Commands vs Skills

### Skill

A skill is the procedure.

Examples:

- how to implement UI feature tests;
- how to implement E2E flow tests;
- how to implement API tests;
- how to heal a failing UI test;
- how to review generated code;
- how to plan coverage.

### Command

A command is a short launcher for a skill.

Examples:

- `/plan-feature`
- `/plan-from-tms`
- `/align-plan-with-tms`
- `/implement-api-batch`
- `/implement-ui-batch`
- `/plan-e2e-journey`
- `/implement-e2e-flow`
- `/review-generated`
- `/audit-test-coverage`
- `/audit-test-data-strategy`
- `/audit-test-stability`
- `/heal-api-test`

Commands should stay short. Do not copy full rules or full skills into commands.

Good command structure:

```text
Use Skill: <skill path>

Target / Feature plan:
<placeholder>

Implementation scope / Task:
<placeholder>

Context:
<placeholder>

Report:
<short report fields>
```

---

## Golden Workflow For New Features

### Normal planning (UI/API/requirements)

```text
/plan-feature
→ review plan (optional, use /review-generated on specs/<feature>.md)
→ /create-builder, only if needed
→ /implement-api-batch (all API coverage ready to implement now)
→ /implement-ui-batch (all UI coverage ready to implement now)
→ /implement-visual-checkpoint, only if planned/requested
→ /review-generated
→ /audit-test-coverage (optional; plan vs implemented coverage alignment)
→ /audit-test-data-strategy (optional; before destructive flows or shared-data review)
→ /audit-test-stability (optional; flaky patterns before commit)
→ /run-verification
→ /refactor-overengineering or /heal-api-test / /heal-ui-test only if needed
```

### E2E journey planning (separate from feature coverage)

```text
/plan-e2e-journey
→ review journey plan
→ /audit-test-data-strategy (optional; E2E data/cleanup/isolation before implementation)
→ /implement-e2e-flow specs/e2e/<journey>.md (only when journey plan has ready-to-implement-now scenarios)
→ /review-generated
→ /audit-test-coverage (optional; journey plan vs E2E specs)
→ /audit-test-data-strategy (optional; E2E data policy vs implementation)
→ /audit-test-stability (optional; E2E stability patterns before commit)
→ /run-verification
```

E2E is **not** part of `/plan-feature` output. Plan full journeys separately when a critical cross-boundary flow needs automation beyond API and UI coverage.

### No existing feature plan (TMS is primary input)

```text
/plan-from-tms
→ review generated plan
→ implement selected ready API/UI coverage (same implementation commands as above)
→ plan E2E journeys separately in specs/e2e/ when needed
```

### Existing feature plan + TMS alignment

```text
/plan-feature (or plan already exists)
→ /align-plan-with-tms
→ review aligned plan
→ implement selected ready API/UI coverage
→ plan E2E journeys separately in specs/e2e/ when needed
```

Planning creates the full coverage picture.

Implementation executes **ready to implement now** scope from the plan.

Do not implement **blocked/postponed** coverage without contract or product clarification.

Do not implement API and UI in one run unless explicitly approved.

Do not implement E2E together with API or UI in one run unless explicitly approved.

Do not implement directly from TMS cases — use feature plans and selected ready coverage.

Do not add E2E scenarios to feature plans — use `specs/e2e/<journey>.md` instead.

---

## TMS Planning Conventions

- TMS integration is optional and provider-agnostic at the workflow kit level.
- **Qase** is a currently supported example provider via user/global Cursor MCP when configured (server name `qase`); other TMS providers may be added later.
- TMS credentials belong in user/global MCP settings or local secret storage — not in repository env files or committed MCP config.
- Project MCP (`.cursor/mcp.json`): `playwright` only — project-level; safe to commit.
- Default mode: **read-only** (list/read cases; no writes, runs, or result publishing without explicit approval).
- TMS cases are **planning input and traceability** — do not assume 1 TMS case = 1 Playwright test.
- TMS Source and TMS Mapping live in `specs/<feature>.md` (TMS-aligned plan).
- TMS reporter/result publishing is **not configured** — separate from read-only TMS planning; do not add reporter integration by default.
- Never commit or document real TMS tokens in repo files.

| Command | When |
|---|---|
| `/plan-from-tms` | No `specs/<feature>.md` yet; TMS cases are main input |
| `/align-plan-with-tms` | Plan exists; align with TMS suite/cases |
| `/plan-feature` | Plan from UI/API/requirements (not TMS-first) |

---

## Execution Mode Guidance

### `/plan-feature`

Use Agent mode when the expected output is a `specs/<feature>.md` file.

Do not use Cursor Plan mode `Build` for planning-only tasks.

Reason:

```text
Build can start implementation.
```

Expected result:

```text
Only specs/<feature>.md is created or updated.
```

### Implementation commands

Use Agent mode.

Examples:

- `/implement-api-batch`
- `/implement-ui-batch`
- `/implement-e2e-flow`
- `/create-builder`
- `/implement-visual-checkpoint`
- `/refactor-overengineering`
- `/heal-api-test`
- `/heal-ui-test`

### Review commands

Use review-only mode/intent.

The agent must not modify files when running review commands.

---

# Command Catalog

## `/plan-feature`

### Purpose

Create a complete feature coverage plan.

The plan should classify coverage as:

- ready to implement now;
- blocked;
- postponed;
- not automated.

### Skill

```text
@.cursor/skills/plan-test-coverage/SKILL.md
```

### Use When

- starting a new feature;
- deciding API/UI/visual/schema coverage;
- creating or updating `specs/<feature>.md`;
- avoiding duplicate coverage across layers.

### Do Not Use When

- implementation has already been approved and scoped;
- only a locator fix is needed;
- a test is failing and needs healing.

### Template

```md
Use Playwright Planner.
Use Skill: @.cursor/skills/plan-test-coverage/SKILL.md

Feature:
<feature name>

Targets:
- UI: <route/page>
- API contract: <swagger/openapi/docs link>
- requirements/specs: <path/link if any>

Task:
Create a full feature coverage plan.

Scope:
- planning only
- allowed change: create/update only specs/<feature>.md
- do not include E2E — E2E journeys are planned separately in specs/e2e/<journey>.md

Output:
- coverage matrix
- smoke/regression split
- API coverage ready to implement now
- API coverage blocked/postponed
- UI coverage ready to implement now
- UI coverage blocked/postponed
- cross-browser/responsive decisions or explicit no-extra-coverage note
- Cross-Browser Implementation Brief when applicable
- Responsive Implementation Brief when applicable
- visual checkpoints planned now
- visual checkpoints postponed
- schema/contract checks
- not automated / blockers
- API Implementation Brief
- UI Implementation Brief
- note that E2E is planned separately when a full journey may be needed later
- recommended next commands to run manually

Coverage grouping rule:
- do not split coverage into first/later batches by default
- put all safe and unblocked coverage into ready to implement now
- put only genuinely blocked, unstable, unclear, or intentionally deferred coverage into blocked/postponed
- implementation details such as helpers, builders, clients, Page Objects, fixtures, and metadata helpers are not scenarios

Stop condition:
- stop after creating or updating the feature coverage plan
- do not start implementation
- do not implement API tests
- do not implement UI tests
- do not create builders, fixtures, Page Objects, API clients, or visual checkpoints
- do not add Allure metadata
- do not run implementation verification
- recommended next commands are output only, not permission to execute

Execution mode guidance:
- prefer Agent mode for this command when the expected output is a specs/<feature>.md file
- do not use Cursor Plan mode Build for planning-only tasks
- do not require a separate Build step or follow-up implementation step to write the plan file
```

---

## `/plan-from-tms`

### Purpose

Create `specs/<feature>.md` from TMS cases when **no feature plan exists**.

### Skill

```text
@.cursor/skills/plan-from-tms/SKILL.md
```

### Use When

- TMS suite/cases are the primary planning input;
- `specs/<feature>.md` does not exist yet.

### Do Not Use When

- `specs/<feature>.md` already exists (use `/align-plan-with-tms`);
- implementing tests or modifying TMS entities.

### Template

```md
Use Skill: @.cursor/skills/plan-from-tms/SKILL.md

Feature:
<feature name>

TMS:
- provider: <TMS provider, e.g. Qase>
- project code: <TMS project code>
- suite id: <suite id>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected ids>

Scope:
- planning only
- TMS read-only
- allowed change: create/update only specs/<feature>.md

Stop condition:
- stop after creating/updating specs/<feature>.md
- do not implement tests
- do not create/update TMS entities, runs, or publish results
```

---

## `/align-plan-with-tms`

### Purpose

Align an **existing** `specs/<feature>.md` with TMS cases.

### Skill

```text
@.cursor/skills/align-plan-with-tms/SKILL.md
```

### Use When

- feature plan exists and needs TMS traceability or gap analysis;
- comparing TMS intent with planned or existing automation.

### Do Not Use When

- no plan exists (use `/plan-from-tms`);
- implementing tests or modifying TMS entities.

### Template

```md
Use Skill: @.cursor/skills/align-plan-with-tms/SKILL.md

Feature plan:
specs/<feature>.md

TMS:
- provider: <TMS provider, e.g. Qase>
- project code: <TMS project code>
- suite id: <suite id>
- suite title/path: <suite title/path>
- cases: <all cases in suite / selected ids>

Scope:
- planning/alignment only
- TMS read-only
- allowed change: update only the feature plan file

Stop condition:
- stop after updating the feature plan
- do not start implementation
```

---

## `/inspect-api-collection`

### Purpose

Inspect API collection sources as planning and audit input without modifying files or executing requests.

### Inputs

- collection path, normally `collections/bruno/<service-or-domain>/**`;
- optional OpenAPI/Swagger path;
- optional target service/domain.

### Output

- endpoint inventory;
- variables/auth hints;
- destructive/stateful request candidates;
- contract drift notes when OpenAPI/Swagger is supplied;
- recommended next step.

### Do / Don't

- Do treat Bruno as executable request examples and OpenAPI/Swagger as contract authority when available.
- Do redact discovered secrets and flag unregistered environment names.
- Do not create plans or tests.
- Do not execute requests, call external APIs, or install dependencies.

### Recommended Next Command

`/plan-from-api-collection` when a feature plan should be created or updated.

---

## `/plan-from-api-collection`

### Purpose

Create or update `specs/<feature>.md` from a Bruno collection and optional OpenAPI/Swagger source.

### Inputs

- collection path under `collections/bruno/**`;
- optional OpenAPI/Swagger path;
- output feature plan path;
- optional TMS or requirements context.

### Output

- created or updated feature plan;
- ready, blocked/postponed, and not-automated coverage;
- service/environment ownership;
- data, auth, cleanup/isolation, destructive-request, and contract-drift decisions.

### Do / Don't

- Do group requests by capability rather than generating one test per request.
- Do block affected coverage when Bruno and OpenAPI/Swagger conflict.
- Do not implement tests, create `src/test/**`, execute requests, or modify source collections, contracts, or TMS.

### Recommended Next Command

`/implement-api-batch` only after the feature plan is reviewed and contains ready API coverage.

---

## `/audit-api-collection-coverage`

### Purpose

Audit alignment among Bruno collections, feature plans, implemented API tests, and optional OpenAPI/Swagger sources.

### Inputs

- collection path;
- feature plan path;
- `tests/api/**` path;
- optional OpenAPI/Swagger path.

### Output

- coverage matrix;
- planned coverage missing tests;
- collection requests not planned;
- tests without plan justification;
- contract drift, destructive-request, and environment/auth risks.

### Do / Don't

- Do identify blocked/postponed coverage implemented accidentally and duplicate coverage.
- Do not modify plans, collections, tests, OpenAPI/Swagger, or TMS.
- Do not execute API requests.

### Recommended Next Command

Use `/review-generated` for implementation quality or `/plan-from-api-collection` to update the plan when approved.

---

## `/implement-api-batch`

### Purpose

Implement API coverage from an existing feature plan.

The command name says batch, but the scope does not have to be tiny. Prefer:

```text
all API coverage ready to implement now
```

unless there is a reason to narrow the scope.

### Skill

```text
@.cursor/skills/implement-api-feature/SKILL.md
```

### Use When

- API coverage exists in a feature plan;
- API tests need to be implemented;
- API helper/client/builder decisions are needed.

### Do Not Use When

- the task is UI-only;
- API behavior is not planned;
- contract details are missing and no safe scope exists.

### Template

```md
Use Skill: @.cursor/skills/implement-api-feature/SKILL.md

Feature plan:
<path to feature plan>

Implementation scope:
<what API coverage to implement from the plan>

Input:
- API contract: <swagger/openapi/docs link>
- existing builder/client/helpers: <if any>

Scope:
- API tests only
- implement only coverage marked ready to implement now in the feature plan
- do not implement blocked/postponed scenarios
- do not guess undocumented status codes, bodies, validation messages, or boundary limits
- use Zod + shared assertion helper for non-trivial/reused/paginated response shapes
- keep behavior assertions separate from schema validation; no assertions in API clients

Context:
<any important constraints, blockers, known contract risks, or setup constraints>

After changes:
run impacted API spec and quality gate from project map.

Report:
- files changed
- API coverage implemented
- API coverage blocked/postponed
- builder/client/helper decisions
- verification results
- remaining risks
```

### Example

```text
/implement-api-batch

Feature plan:
@specs/<feature>.md

Implementation scope:
Implement all API coverage from the plan that is currently safe and unblocked.

Input:
- API contract: <swagger/openapi/docs link from the feature plan>
- existing builder/client/helpers: check existing project first

Context:
If authenticated endpoints require missing role-capable auth/setup, report them as blocked instead of inventing setup architecture.
```

---

## `/implement-ui-batch`

### Purpose

Implement UI coverage from an existing feature plan.

Prefer:

```text
all UI coverage ready to implement now
```

Do not artificially split safe UI coverage into tiny pieces.

### Skill

```text
@.cursor/skills/implement-ui-feature/SKILL.md
```

### Use When

- UI coverage exists in a feature plan;
- UI specs and Page Objects need to be added or updated;
- data/setup/page ownership needs to be handled.

### Do Not Use When

- the task is API-only;
- the task is visual-only;
- Page Object vs Component ownership is unclear and needs discovery first.

### Template

```md
Use Skill: @.cursor/skills/implement-ui-feature/SKILL.md

Feature plan:
<path to feature plan>

Implementation scope:
<what UI coverage to implement from the plan>

Context:
<any important setup/data/page/component/locator constraints>

After changes:
run impacted UI spec and quality gate from project map.

Report:
- files changed
- UI coverage implemented
- UI coverage blocked/postponed
- Page Object/component decisions
- data/setup strategy
- verification results
- remaining risks
```

### Example

```text
/implement-ui-batch

Feature plan:
@specs/<feature>.md

Implementation scope:
Implement all UI coverage from the plan that is currently safe and unblocked.

Context:
No visual screenshots in this step.
If a signed-in scenario requires missing approved auth/setup, report it as blocked instead of inventing setup architecture.
```

---

## `/plan-e2e-journey`

### Purpose

Create or update a dedicated E2E journey plan in `specs/e2e/<journey>.md`.

### Skill

```text
@.cursor/skills/plan-e2e-journey/SKILL.md
```

### Use When

- a critical full user/business journey needs E2E planning;
- lower-level API/UI/schema/visual coverage is not enough;
- E2E implementation must be prepared before coding.

### Do Not Use When

- task is feature-level planning in `specs/<feature>.md`;
- task is a short UI functional check;
- task is E2E implementation.

### Template

```md
Use Skill: @.cursor/skills/plan-e2e-journey/SKILL.md

E2E journey plan:
specs/e2e/<journey>.md

Task:
Create or update the E2E journey plan only.

Scope:
- planning only
- no Playwright code
- no implementation
- do not duplicate API/UI/schema/visual feature coverage

Output:
- business goal and journey summary
- E2E boundary (covered/not covered)
- data/setup/cleanup strategy
- external dependencies and blockers
- implementation target under tests/e2e/... with @e2e tag
```

---

## `/implement-e2e-flow`

### Purpose

Implement approved full-journey E2E coverage from an existing E2E journey plan.

Prefer:

```text
one exact E2E scenario marked ready to implement now
```

Do not convert short UI functional tests into E2E.

### Skill

```text
@.cursor/skills/implement-e2e-flow/SKILL.md
```

### Use When

- `specs/e2e/<journey>.md` exists and includes a ready-to-implement-now scenario;
- setup, data, cleanup or isolation, and final assertion are documented;
- the scenario is a critical full user or business journey.

### Do Not Use When

- the scenario is a short UI functional test;
- the scenario is blocked or postponed;
- mailbox, reset-link, reset-token, payment, or other required external dependency is missing;
- cleanup or isolation strategy is unclear;
- no Playwright runner matches `tests/e2e/**/*.e2e.spec.ts` and config update is not approved.

### Location And Tags

```text
tests/e2e/**/*.e2e.spec.ts
@e2e + @smoke or @regression
@e2e replaces @ui by default for full-journey E2E specs
```

### API Usage In E2E

Allowed:

- backend preconditions;
- cleanup;
- minimal setup-success verification.

Not allowed:

- replacing the UI journey under test;
- hiding the journey in fixtures, hooks, Page Objects, helpers, or workflow wrappers;
- full API contract validation;
- duplicated API schema, negative, or boundary coverage.

Use disposable or isolated data.

Destructive flows require cleanup or safe isolation.

### Examples

Forgot password (feature plan — API + UI only):

- API: reset request contract;
- UI: page render, empty-email validation feedback, valid-email submit confirmation.

Full forgot-password reset plus login with a new password belongs in a separate E2E journey plan (`specs/e2e/forgot-password-reset.md` or similar) and remains blocked or postponed without mailbox/reset-link access and safe disposable-user or cleanup strategy.

Checkout or onboarding (E2E journey plan examples only):

- sign-up followed by login and authenticated account access;
- item selection followed by cart state and order completion.

### Playwright Runner Note

Current browser projects in `playwright.config.ts`:

- `ui-chromium` — focused UI specs (`*.ui.spec.ts`); Desktop Chrome; default viewport `1280x720`
- `ui-firefox` — focused cross-browser UI coverage (`@cross-browser`)
- `ui-webkit` — focused cross-browser UI coverage (`@cross-browser`)
- `ui-mobile-chromium` — focused responsive UI coverage (`@responsive`)
- `api` — API specs; no browser
- `e2e` — E2E specs (`*.e2e.spec.ts`)

Broad browser/device matrix is **not** the default.

Full E2E cross-browser/mobile matrix remains future work unless documented in the project map.

If no runner matches the intended E2E spec path or pattern, stop and report the config gap.

### Template

```md
Use Skill: @.cursor/skills/implement-e2e-flow/SKILL.md

E2E journey plan:
<path to specs/e2e/<journey>.md>

Implementation scope:
Implement only E2E coverage marked ready to implement now.

Scenario:
<exact E2E scenario name from the journey plan>

Context:
<any important setup/data/cleanup/external dependency constraints>

After changes:
run impacted E2E spec using the browser project defined by the project map and quality gate from project map.

Report:
- files changed
- E2E scenario implemented
- setup strategy
- data strategy
- cleanup/isolation strategy
- final assertions
- tags used
- verification results
- remaining risks
```

---

## `/implement-visual-checkpoint`

### Purpose

Add, verify, or approve a visual checkpoint.

### Skill

```text
@.cursor/skills/implement-visual-test/SKILL.md
```

### Use When

- a visual checkpoint is planned or explicitly requested;
- an existing checkpoint must be verified;
- a baseline must be approved intentionally.

### Do Not Use When

- the task is functional UI automation only;
- baseline approval is not intended;
- the UI state cannot be stabilized.

### Template

```md
Use Skill: @.cursor/skills/implement-visual-test/SKILL.md

Target:
<spec/page/component>

Scenario/state:
<scenario or visual state>

Task:
<add visual checkpoint | verify existing checkpoint | approve existing baseline>

Approve baseline:
<yes | no>

Context:
<any dynamic content, masking, baseline, environment, or stability notes>

Rules:
- visual assertion must stay in spec
- functional assertion first
- screenshot assertion after stable UI state
- use @visual tag
- use @regression by default for visual checks
- do not add @smoke to visual checks unless explicitly requested
- do not create standalone visual spec by default
- do not put screenshot assertions in Page Objects or Components
- check dynamic content before screenshot
- mask only dynamic content that is not relevant to the visual risk
- do not update baselines unless Approve baseline is yes

If Approve baseline is no:
- run impacted visual test once
- if baseline is missing, report that baseline approval is required
- do not update or commit baseline snapshots
- keep Playwright failure artifacts or actual screenshots for review if generated
- report artifact paths when available

If Approve baseline is yes:
- run impacted visual test with snapshot update enabled
- run the same impacted visual test again without snapshot update
- report created or updated snapshot files
- report both command results

Report:
- files changed
- screenshot name
- masking strategy
- baseline status
- verification commands/results
- remaining risks
```

---

## `/create-builder`

### Purpose

Create or update reusable test data builders, generators, and types.

### Skill

```text
@.cursor/skills/create-test-data-builder/SKILL.md
```

### Use When

- structured data is reused;
- valid defaults and overrides are needed;
- unique/formatted primitive values are needed;
- UI and API share the same data shape.

### Do Not Use When

- the payload is small, deterministic, and used once;
- local constants in the spec are enough;
- there are no variants or overrides.

### Template

```md
Use Skill: @.cursor/skills/create-test-data-builder/SKILL.md

Feature plan:
<path to feature plan>

Target data/entity/payload:
<target>

Task:
Create or update only the reusable test data needed by the planned implementation scope.

Context:
<any required fields, uniqueness needs, existing data files, or contract notes>

After changes:
run impacted checks from project map.

Report:
- files changed
- builder capabilities
- generator decisions
- verification results
- remaining risks
```

---

## `/discover-ui-components`

### Purpose

Decide whether a UI block should stay inside a Page Object or become a Component Object.

### Skill

```text
@.cursor/skills/discover-ui-components/SKILL.md
```

### Use When

- ownership is unclear;
- Page Object is growing;
- UI block is reused;
- agent proposes a component and justification is uncertain;
- a block has many related locators/actions and a clear semantic boundary.

### Do Not Use When

- a simple page-specific form can stay in the Page Object;
- no ownership question exists;
- the task is just implementing a spec.

### Template

```md
Use Skill: @.cursor/skills/discover-ui-components/SKILL.md

Target page/screen/flow:
<target>

Question:
Should <UI block> stay inside the Page Object or become a Component Object?

Scope:
- discovery only
- do not modify files

Context:
<any existing specs/pages/components/reuse concerns>

Report:
- component candidates
- recommendation for each
- reasoning
- suggested ownership
- files that would be affected if extraction is justified
```

---

## `/create-page-object`

### Purpose

Create a minimal Page Object for a real page, route, screen, or navigation boundary.

### Skill

```text
@.cursor/skills/create-page-object/SKILL.md
```

### Use When

- a current UI test needs a new page abstraction;
- route/screen ownership is clear;
- no existing Page Object covers the target.

### Do Not Use When

- the target is only a UI block inside an existing page;
- the Page Object is speculative;
- a Component Object would be more appropriate.

### Template

```md
Use Skill: @.cursor/skills/create-page-object/SKILL.md

Target route/screen:
<route/screen>

Task:
Create a minimal Page Object only if needed by current tests.

Context:
<any current spec/fixture/project map details>

After changes:
run impacted spec/checks if usage is added.

Report:
- files changed
- Page Object created/updated
- fixture exposure decision
- verification results
- remaining risks
```

---

## `/create-api-client`

### Purpose

Create a thin API client for endpoint calls only when reuse or request composition justifies it.

### Skill

```text
@.cursor/skills/create-api-client/SKILL.md
```

### Use When

- the same endpoint group is reused;
- request composition is duplicated;
- a thin wrapper improves clarity.

### Do Not Use When

- a single request in one spec is enough;
- the client would hide assertions;
- the client would become a service hierarchy.

### Template

```md
Use Skill: @.cursor/skills/create-api-client/SKILL.md

Endpoint group:
<group/resource>

Task:
Create a thin API client only if reuse or request composition is justified.

Context:
<where calls are duplicated and existing client/helper status>

After changes:
run impacted API specs and quality gate.

Report:
- files changed
- why client is justified
- client responsibilities
- verification results
- remaining risks
```

---

## `/create-fixture`

### Purpose

Create or update a fixture only when reuse and layer ownership justify it.

### Skill

```text
@.cursor/skills/create-fixture/SKILL.md
```

### Use When

- repeated setup belongs in a fixture;
- final fixture entry point needs to expose a project object;
- fixture is thin and does not hide the action under test.

### Do Not Use When

- a one-off value is enough;
- fixture hides business flow;
- fixture exposes components by default;
- specs would import intermediate fixture layers.

### Template

```md
Use Skill: @.cursor/skills/create-fixture/SKILL.md

Fixture need:
<describe need>

Task:
Create or update fixture only if reuse and ownership justify it.

Context:
<any existing fixture entry points, project map rules, or reuse examples>

After changes:
run impacted specs/checks and quality gate.

Report:
- files changed
- fixture created/updated
- why fixture is justified
- verification results
- remaining risks
```

---

## `/refactor-page-object-to-components`

### Purpose

Extract justified UI blocks from a Page Object into Component Objects.

### Skill

```text
@.cursor/skills/refactor-page-object-to-components/SKILL.md
```

### Use When

- component extraction was justified;
- Page Object is too large;
- repeated UI block needs component ownership.

### Do Not Use When

- ownership is unclear;
- no reuse/complexity exists;
- extraction is speculative.

Use `Discover UI Components` first when ownership is unclear.

### Template

```md
Use Skill: @.cursor/skills/refactor-page-object-to-components/SKILL.md

Target Page Object:
<file/class>

Reason:
<why extraction is justified>

Context:
<any discovery result or repeated usage evidence>

After changes:
run impacted specs/checks and quality gate.

Report:
- files changed
- components created/updated
- behavior preserved: yes/no
- verification results
- remaining risks
```

---

## `/review-generated`

### Purpose

Review AI-generated or modified code.

### Skill

```text
@.cursor/skills/review-generated-code-quality/SKILL.md
```

### Use When

- before accepting AI-generated changes;
- after implementation;
- after refactor/heal.

### Do Not Use When

- code changes are needed immediately;
- a failing UI test needs healing;
- the task is verification only.

### Template

```md
Use Skill: @.cursor/skills/review-generated-code-quality/SKILL.md

Review changes in:
<files/diff/current working tree>

Context:
<any important scope, intentional cleanup, known risks, or verification results>

Scope:
- review only
- do not modify files
- do not run broad refactoring
- do not suggest unrelated architecture changes

Focus:
- critical or major issues
- broken imports
- failing or missing verification evidence
- rule violations that can cause false positives or false negatives
- unnecessary abstractions
- duplicated reusable logic
- local helper misuse
- fixture misuse
- builder/generator misuse
- API client necessity
- assertion ownership
- Page Object/Component ownership
- raw selector mechanics in specs
- inline random data
- process.env usage outside allowed config layer
- Allure/reporting ownership
- visual baseline/snapshot misuse, if visual changes exist

Do not focus on:
- cosmetic naming preferences
- optional future improvements
- tiny metadata duplication
- minor style issues unless they create real maintenance risk

Output findings by severity:
- critical
- major
- minor

For each finding include:
- file
- issue
- why it matters
- minimal suggested fix

Recommended next step must be one of:
- accept changes
- accept after minor cleanup
- run refactor-overengineering
- run heal-api-test
- run heal-ui-test
- update rule/skill/project map
- request changes
```

**Note:** `/review-generated` (Review Generated Code Quality) is the **primary** post-implementation code review. Use `/audit-test-coverage` for plan-to-test coverage alignment. Use `/audit-test-data-strategy` for test data safety, isolation, and cleanup policy review. Use `/audit-test-stability` for flaky-pattern and synchronization audits before commit. Use `/review-ui-suite` only for broader UI suite audits.

---

## `/audit-test-data-strategy`

### Purpose

Audit test data strategy for shared mutable data, isolation, cleanup, generation, builders, fixtures, and E2E data risks.

Audit/review only — does **not** create or modify data by default.

### Skill

```text
@.cursor/skills/audit-test-data-strategy/SKILL.md
```

### Use When

- before E2E implementation or destructive flows;
- before cleanup or baseline conversion;
- when shared users, carts, orders, or fixed entities are suspected;
- when inline random data or fixture/data misuse is suspected.

### Do Not Use When

- the task is to create builders or fixtures (use create skills);
- the task is to fix failing tests (use heal skills);
- only flaky synchronization patterns are in scope (use `/audit-test-stability`).

### Template

```md
Use Skill: @.cursor/skills/audit-test-data-strategy/SKILL.md

Plans/tests/data paths:
<specs, tests, src/test/data, src/test/fixtures — or empty>

Scope:
- audit only
- do not modify files
- do not create or change data
- do not delete data
- do not mutate environment

Report:
- summary
- safe data patterns found
- data risks
- destructive flow risks
- cleanup/isolation gaps
- builder/generator findings
- fixture findings
- E2E data risks
- recommended next actions
```

---

## `/audit-test-stability`

### Purpose

Audit UI/E2E tests for flaky patterns, weak synchronization, hidden journeys, debug artifacts, and stability risks.

Audit/review only — does **not** heal tests by default.

### Skill

```text
@.cursor/skills/audit-test-stability/SKILL.md
```

### Use When

- after UI or E2E implementation;
- before committing new or changed UI/E2E tests;
- when retry logic, sleeps, or weak assertions are suspected;
- after a failed run when static review may reveal root-cause patterns.

### Do Not Use When

- the task is to fix a failing test (use `/heal-ui-test` or `/heal-api-test`);
- the task is plan-to-test coverage alignment (use `/audit-test-coverage`);
- only API tests changed with no UI/E2E stability risk.

### Template

```md
Use Skill: @.cursor/skills/audit-test-stability/SKILL.md

Test paths:
<tests/ui/... tests/e2e/... or empty>

Optional failed spec/report:
<failure output or "none">

Scope:
- audit only
- do not modify files
- do not fix tests

Report:
- summary
- critical flaky risks
- major stability risks
- minor maintainability risks
- affected files
- root-cause category
- recommended fix strategy
- recommended next command
```

For actual fixes after audit, use `/heal-ui-test`.

---

## `/audit-test-coverage`

### Purpose

Compare feature plans, E2E journey plans, implemented tests, and optional TMS mappings to find coverage alignment gaps.

Audit/review only — does **not** implement tests.

### Skill

```text
@.cursor/skills/audit-test-coverage/SKILL.md
```

### Use When

- after planning and implementation batches;
- before cleanup or baseline conversion;
- when duplicate API/UI/E2E coverage is suspected;
- when blocked/postponed scenarios may have been implemented;
- when TMS Mapping exists and traceability must be checked.

### Do Not Use When

- the task is to implement missing tests;
- the task is to heal failing tests;
- only recent code diff quality review is needed (use `/review-generated`).

### Template

```md
Use Skill: @.cursor/skills/audit-test-coverage/SKILL.md

Plan:
<specs/<feature>.md and/or specs/e2e/<journey>.md>

Optional test paths:
<tests paths or empty>

Optional TMS:
<from plan sections or "none">

Scope:
- audit only
- do not modify files
- do not implement tests

Report:
- summary
- coverage matrix
- missing ready coverage
- unplanned tests
- duplicate coverage risks
- blocked/postponed violations
- TMS traceability gaps
- tag/layer issues
- recommended next command
```

---

## `/review-ui-suite`

### Purpose

Review an existing **UI test suite area** for architecture, flakiness, ownership, and maintainability.

### Skill

```text
@.cursor/skills/review-ui-suite/SKILL.md
```

### Use When

- reviewing a UI folder/spec area holistically;
- checking Page Object and fixture usage across multiple specs;
- identifying flakiness or raw selector risks in a suite.

### Do Not Use When

- reviewing recently generated or modified code (use `/review-generated` first);
- framework/core changes need review;
- code changes should be made immediately.

### Template

```md
Use Skill: @.cursor/skills/review-ui-suite/SKILL.md

Review area:
<spec folder/files>

Scope:
- review only
- do not modify files

Context:
<any known risks, failures, or focus areas>

Report:
- critical findings
- major findings
- minor findings only if worth fixing
- minimal suggested fixes
- recommended next step
```

---

## `/review-framework-change`

### Purpose

Review framework-level changes.

### Skill

```text
@.cursor/skills/review-framework-change/SKILL.md
```

### Use When

- fixtures changed;
- config changed;
- project map changed;
- reporting/auth/API infrastructure changed;
- rules or skills changed.

### Do Not Use When

- only feature tests changed;
- generated feature code review is enough.

### Template

```md
Use Skill: @.cursor/skills/review-framework-change/SKILL.md

Review changes in:
<files/diff/current working tree>

Scope:
- review only
- do not modify files

Context:
<any framework-level intent, known risks, or verification evidence>

Report:
- critical findings
- major findings
- minor findings only if worth fixing
- minimal suggested fixes
- recommended next step
```

---

## `/refactor-overengineering`

### Purpose

Simplify working code without changing behavior.

### Skill

```text
@.cursor/skills/refactor-overengineering/SKILL.md
```

### Use When

- review found concrete issues;
- duplicate tests/helpers exist;
- abstraction is unjustified;
- ownership is wrong.

### Do Not Use When

- test is failing and needs healing;
- new coverage is needed;
- issue is only speculative preference.

### Template

```md
Use Skill: @.cursor/skills/refactor-overengineering/SKILL.md

Target:
<component/helper/fixture/flow/client/spec>

Problem:
<why current code is too noisy, duplicated, brittle, or overengineered>

Task:
Simplify or clean up with minimal behavior-preserving changes.

Context:
<any important scope, known risks, verification state, or intentional cleanup>

Scope:
- keep behavior unchanged
- keep test intent unchanged
- minimal changes only
- do not add new coverage
- do not refactor unrelated files
- do not broaden refactor scope

After changes:
run impacted specs/checks and quality gate from project map.

Report:
- files changed
- what was simplified
- behavior preserved: yes/no
- verification results
- remaining risks
```

---

## `/heal-api-test`

### Purpose

Investigate and fix a failing API test.

### Skill

```text
@.cursor/skills/heal-api-test/SKILL.md
```

### Use When

- an API spec fails;
- request/response/status/schema/assertion/setup issue must be diagnosed.

### Do Not Use When

- no test is failing;
- the task is cleanup/refactor;
- expected contract behavior is unknown without API owner confirmation.

### Template

```md
Use Skill: @.cursor/skills/heal-api-test/SKILL.md

Failing test output:
<insert failure output, status/body, stack trace>

Target:
<spec/helper/schema/builder/client files involved>

Task:
Heal only the failing API test with the smallest correct fix.

Scope:
- minimal fix only
- do not weaken assertions
- do not change expected behavior without contract evidence
- do not add new coverage

Context:
<any contract, setup, environment, or schema details>

After fix:
run impacted API spec and quality gate from project map.

Report:
- root cause
- files changed
- fix applied
- whether schema/Zod was involved
- verification results
- remaining risks
```

---

## `/heal-ui-test`

### Purpose

Investigate and fix a failing UI test.

### Skill

```text
@.cursor/skills/heal-ui-test/SKILL.md
```

### Use When

- a UI spec fails;
- locator/navigation/timing/data/setup issue must be diagnosed;
- trace/screenshot/video/MCP inspection may be needed.

### Do Not Use When

- no test is failing;
- the task is cleanup/refactor;
- expected behavior is unknown and needs product clarification.

### Template

```md
Use Skill: @.cursor/skills/heal-ui-test/SKILL.md

Failing test output:
<insert failure output>

Task:
Heal only the failing UI test.

Scope:
- minimal fix only
- do not refactor unrelated files
- do not change expected behavior without evidence
- do not use waitForTimeout

Context:
<any important environment/setup/details>

After fix:
run impacted spec.

Report:
- root cause
- files changed
- minimal fix applied
- verification result
- remaining risks
```

---

## `/run-verification`

### Purpose

Run the smallest sufficient verification.

### Skill

```text
@.cursor/skills/run-verification/SKILL.md
```

### Use When

- after implementation;
- after refactor/heal;
- before final acceptance.

### Do Not Use When

- code review is needed instead;
- failure investigation is required first.

### Template

```md
Use Skill: @.cursor/skills/run-verification/SKILL.md

Changed files:
<files/current working tree>

Task:
Run the smallest sufficient verification.

Context:
<any known risks, intentional deletions, or excluded checks>

Check:
<targeted checks/specs if known>

Report:
- commands run/results
- pass/fail summary
- blockers only
- known non-blocking risks
- final accept/reject recommendation
```

---

## `/update-project-map`

### Purpose

Update project map after structural or convention changes.

### Skill

```text
@.cursor/skills/update-project-map/SKILL.md
```

### Use When

- files/folders changed structurally;
- fixture entry point changed;
- path aliases/scripts/tags changed;
- rules/skills/conventions changed.

### Do Not Use When

- only feature tests changed and generated tree update is not needed;
- no project map impact exists.

### Template

```md
Use Skill: @.cursor/skills/update-project-map/SKILL.md

Change requiring project map update:
<describe change>

Task:
Update only relevant project map sections.

Context:
<any structural changes, deleted files, new commands, scripts, or conventions>

After changes:
run project map update/check commands from project map if applicable.

Report:
- files changed
- sections updated
- commands run/results
- remaining risks
```

---

## `/harden-rules`

### Purpose

Decide whether rules, skills, commands, or project map need hardening after repeated mistakes.

### Skill

```text
@.cursor/skills/harden-rules-from-failure/SKILL.md
```

### Use When

- same AI mistake repeats;
- review finds missing guardrail;
- skill/command is unclear;
- convention check should be added later.

### Do Not Use When

- issue is one-off;
- current code can be fixed directly;
- there is no repeated pattern.

### Template

```md
Use Skill: @.cursor/skills/harden-rules-from-failure/SKILL.md

Trigger:
<failure/review finding/repeated AI mistake>

Task:
Decide whether rules, skills, commands, or project map need hardening.

Scope:
- update only existing guidance if needed
- do not create new rule files unless no existing owner fits
- do not modify tests or production code
- keep changes minimal

Expected output:
- hardening needed: yes/no
- target files to update
- minimal proposed change
- remaining risks
```

---

## `/add-allure-metadata`

### Purpose

Add or normalize Allure metadata in specs.

### Skill

```text
@.cursor/skills/configure-allure-reporting/SKILL.md
```

### Use When

- specs need feature/story/severity/owner/tms/issue metadata;
- metadata is inconsistent;
- reporting metadata should be normalized.

### Do Not Use When

- behavior should change;
- Page Objects/API clients/builders need changes;
- attachments are requested without clear scope.

### Template

```md
Use Skill: @.cursor/skills/configure-allure-reporting/SKILL.md

Target:
<spec file or feature area>

Task:
Add or normalize Allure metadata for the target specs.

Context:
<any feature name, owner, severity convention, TMS/issue links, or existing metadata pattern>

Scope:
- metadata only
- no test behavior changes
- no Page Object changes
- no Component Object changes
- no API client changes
- no builder/generator changes
- no fixture changes unless reporting fixture is explicitly in scope

After changes:
run impacted spec or quality gate from project map.

Report:
- files changed
- metadata added/updated
- helper usage
- verification result
- remaining risks
```

---

# Skill Catalog

## configure-allure-reporting

### Purpose

Configure or normalize Allure reporting usage.

### Use When

- adding metadata helper usage;
- normalizing feature/story/severity/owner labels;
- updating reporting conventions;
- adding safe reporting artifacts when explicitly requested.

### Do Not Use When

- test behavior needs to change;
- Page Objects, API clients, builders, or generators are the target;
- attachments would include secrets or sensitive data.

---

## create-api-client

### Purpose

Create a thin API client only when endpoint call reuse or request composition duplication justifies it.

### Use When

- multiple tests call the same endpoint group;
- request composition is duplicated;
- a thin client improves readability.

### Do Not Use When

- one direct `request` call is enough;
- the client would hide assertions;
- the client would become a service hierarchy.

---

## create-fixture

### Purpose

Create or update fixtures.

### Use When

- reuse is meaningful;
- fixture is thin;
- fixture belongs to the correct layer;
- final fixture entry point remains the spec entry point.

### Do Not Use When

- one-off value is enough;
- fixture hides business flow or action under test;
- component is being exposed by default without justification.

---

## create-page-object

### Purpose

Create minimal Page Object for a real page, route, screen, or navigation boundary.

### Use When

- current tests need a page abstraction;
- no existing Page Object covers the route/screen.

### Do Not Use When

- target is a UI block inside an existing page;
- methods are speculative;
- a component ownership decision is needed first.

---

## create-test-data-builder

### Purpose

Create reusable structured test data.

### Use When

- data is reused;
- variants/overrides are needed;
- unique/formatted values are needed.

### Do Not Use When

- small deterministic local constant is enough.

---

## discover-ui-components

### Purpose

Decide Page Object vs Component Object ownership.

### Use When

- ownership is unclear;
- block is reused;
- Page Object is too large;
- component extraction is proposed but not justified.

### Do Not Use When

- simple page-specific form can stay in Page Object.

---

## harden-rules-from-failure

### Purpose

Decide whether guidance should be hardened after repeated mistakes.

### Use When

- same issue appears repeatedly;
- rules/skills/commands are missing a guardrail.

### Do Not Use When

- issue is one-off.

---

## heal-ui-test

### Purpose

Fix failing UI tests.

### Use When

- UI test fails;
- root cause must be classified;
- locator/timing/navigation/data/setup issue is suspected.

### Do Not Use When

- the task is planned implementation;
- the task is architecture cleanup only.

---

## implement-api-feature

### Purpose

Implement API tests from a feature plan.

### Use When

- API implementation scope is selected;
- endpoint behavior or contract should be tested.

### Do Not Use When

- task is UI-only;
- contract is too unclear to implement safely.

### Key Rule

Do not create separate tests just to exercise helpers, builders, or clients.

---

## implement-ui-feature

### Purpose

Implement UI tests and minimal Page Object updates from a feature plan.

### Use When

- UI implementation scope is selected;
- planned UI scenarios need automation.

### Do Not Use When

- task is API-only;
- task is E2E-only;
- component discovery is the only task;
- failing test needs healing.

### MCP Rule

Playwright MCP/codegen is optional discovery only. It is not used by default.

---

## plan-e2e-journey

### Purpose

Plan a full user/business E2E journey in `specs/e2e/<journey>.md`.

### Use When

- E2E planning is needed for a true cross-boundary journey;
- lower-level API/UI/schema/visual coverage is insufficient.

### Do Not Use When

- feature-level planning in `specs/<feature>.md` is the task;
- candidate is a short UI functional check.

### Key Rules

- planning only; no Playwright code;
- define setup/data/cleanup/blockers;
- define implementation target under `tests/e2e/...` with `@e2e` tag;
- do not duplicate feature-level API/UI/schema/visual coverage.

---

## implement-e2e-flow

### Purpose

Implement approved full-journey E2E coverage from an E2E journey plan at `specs/e2e/<journey>.md`.

### Use When

- an E2E journey plan exists with a scenario marked ready to implement now;
- the scenario crosses multiple states, pages, or system boundaries;
- setup, data, cleanup, and final assertion are documented.

### Do Not Use When

- task is short UI functional coverage;
- task is API contract coverage;
- scenario is blocked or postponed;
- external dependency or runner/config support is missing.

### Key Rules

- location: `tests/e2e/**/*.e2e.spec.ts`
- tags: `@e2e` plus `@smoke` or `@regression`
- `@e2e` replaces `@ui` by default for full-journey E2E specs
- keep journey steps visible in the spec
- API setup is for preconditions or cleanup only
- do not validate full API contracts inside E2E

---

## implement-visual-test

### Purpose

Add, verify, or approve visual checkpoints.

### Use When

- visual checkpoint is planned or requested;
- baseline needs explicit approval.

### Do Not Use When

- UI functional tests are the only task.

---

## plan-test-coverage

### Purpose

Create a complete feature coverage plan for API, UI, schema, visual, and not automated levels.

E2E is **not** part of feature coverage plans. Plan full journeys separately in `specs/e2e/<journey>.md`.

### Use When

- new feature needs coverage strategy;
- choosing API/UI/visual/schema/not automated levels.

### Do Not Use When

- implementation already has an approved plan;
- the task is to plan a full E2E journey (create or update `specs/e2e/<journey>.md` instead).

### Key Rule

Implementation details are not scenarios.

---

## refactor-overengineering

### Purpose

Simplify working code without changing behavior.

### Use When

- review found concrete cleanup issue;
- duplication/over-abstraction exists.

### Do Not Use When

- test is failing and needs healing.

---

## refactor-page-object-to-components

### Purpose

Extract justified Component Objects from Page Objects.

### Use When

- component extraction is justified by reuse/complexity/ownership.

### Do Not Use When

- extraction is speculative.

---

## review-framework-change

### Purpose

Review framework-level changes.

### Use When

- fixture/config/project map/reporting/rules/skills/core changed.

### Do Not Use When

- only feature tests changed.

---

## audit-test-data-strategy

### Purpose

Audit test data safety, isolation, cleanup, and fixture/builder/generator usage.

### Use When

- before E2E or destructive flows;
- before cleanup;
- investigating shared mutable data or missing isolation.

### Do Not Use When

- builders/fixtures should be created in the same task;
- only stability/flaky patterns are in scope.

---

## audit-test-stability

### Purpose

Audit UI/E2E tests for flaky patterns and stability risks.

### Use When

- before committing UI/E2E test changes;
- after UI/E2E implementation;
- investigating suspected synchronization or hidden-flow issues.

### Do Not Use When

- tests should be fixed in the same task (use heal skills);
- only coverage alignment is needed.

---

## audit-test-coverage

### Purpose

Compare planned coverage vs implemented tests and optional TMS mappings.

### Use When

- checking plan-to-test alignment after implementation;
- before cleanup or coverage reduction;
- investigating duplicate, missing, stale, or wrong-layer coverage.

### Do Not Use When

- missing tests should be implemented in the same task;
- only code quality of recent diffs is needed.

---

## review-generated-code-quality

### Purpose

Review generated code for architecture and correctness risks.

### Use When

- before accepting generated implementation;
- after implementation/refactor/heal.

### Do Not Use When

- files should be modified during the same task.

---

## review-ui-suite

### Purpose

Review UI suite quality.

### Use When

- checking existing UI specs/Page Objects/fixtures for quality and flakiness risks.

### Do Not Use When

- framework-level review is needed instead.

---

## run-verification

### Purpose

Run smallest sufficient verification.

### Use When

- after changes;
- before acceptance.

### Do Not Use When

- root cause is unknown and needs healing first.

---

## update-project-map

### Purpose

Update project map after structure/convention changes.

### Use When

- files/folders/scripts/tags/fixture entry points/conventions changed.

### Do Not Use When

- no project map impact exists.

---

# Playwright MCP Usage

Playwright MCP is optional.

Use MCP only when repository files and existing Page Objects are not enough to understand:

- actual UI structure;
- stable locators;
- visible page state;
- validation messages;
- route changes;
- behavior after an action.

Do not use MCP by default for every UI task.

Do not commit raw generated/codegen output.

MCP discoveries must be converted into project architecture:

- locators in Page Objects or Components;
- assertions in specs;
- no raw selector mechanics in specs.

---

# API Setup For UI Preconditions

When UI tests need backend preconditions:

- prefer approved API setup if it exists;
- do not derive API host from UI host;
- do not build API URLs manually in specs;
- do not read `process.env` in specs;
- do not validate full API contracts in UI setup;
- verify only that the precondition was created successfully;
- avoid shared static credentials when fresh data is possible.

If approved API setup does not exist:

- use explicit UI setup temporarily;
- or report a setup architecture gap;
- do not invent host rewriting.

---

# Visual Baseline Workflow

```text
Approve baseline: no
→ run visual test once
→ do not update snapshots
→ report missing baseline or diff

Approve baseline: yes
→ run with --update-snapshots
→ run same test again without update
→ report created/updated baseline files
```

---

# Final Checklist Before Sending A Command

```text
1. Which command am I using?
2. Which feature plan or files are the input?
3. What implementation scope is allowed?
4. What context is important for this run?
5. What verification should be run?
```

---

# Golden Rule

```text
Plan full coverage.
Implement clear scope.
Review generated code.
Refactor only real issues.
Heal failing tests at the correct layer.
Harden rules only for repeated mistakes.
Verify before accepting.
```
