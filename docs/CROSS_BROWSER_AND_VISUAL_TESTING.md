# Cross-Browser, Responsive, and Visual Testing

Practical reference for browser/viewport matrix policy and screenshot/visual checkpoints. Use this doc when planning, implementing, or reviewing coverage so the default baseline stays fast and visual work stays intentional.

**Rule sources (authoritative):**

- `.cursor/rules/browser-and-responsive-testing.rules.mdc`
- `.cursor/rules/visual-testing.mdc`
- `.cursor/rules/00-project-map.mdc` — Playwright projects, tags, scripts, CI

---

## Quick Reminders

| Topic | Default policy |
|-------|----------------|
| Browser matrix | **Not** full matrix — baseline runs `ui-chromium` only |
| Cross-browser | Only when a **documented browser risk** exists in the feature plan |
| Responsive | Only when a **documented viewport risk** exists in the feature plan |
| E2E cross-browser | Very small smoke only; must be in `specs/e2e/<journey>.md` |
| Visual checkpoints | Planned only — functional assertion **first**, screenshot **second** |
| Baseline snapshots | **Explicit approval only** — never update silently |
| Playwright tags | `@cross-browser`, `@responsive` — **not** `@firefox`, `@mobile`, etc. |
| Browser/viewport execution | Playwright **projects**, not Playwright tags |

---

## Where Visual and Cross-Browser Fit in the Feature Lifecycle

Default feature flow:

```text
/plan-feature
  -> /implement-api-batch          (ready API/schema scenarios)
  -> /implement-ui-batch            (ready UI scenarios)
  -> npm run test:* + npm run qa:gate
  -> (optional) /implement-visual-checkpoint   — AFTER UI exists; only when plan says ready or explicitly requested
  -> (optional) @cross-browser on specific test — only when plan documents browser risk
  -> (optional) @responsive on specific test    — only when plan documents viewport risk
  -> npm run report:allure:generate + npm run report:allure:open
```

Rules:

- **Plan first** — visual, cross-browser, and responsive decisions belong in `specs/<feature>.md`.
- **Functional before visual** — UI tests must exist before adding `toHaveScreenshot` checkpoints.
- **Not a matrix by default** — do not add `@cross-browser` or `@responsive` to every test.
- **Per-test opt-in** — add coverage-type tags only to tests with documented risk.
- **Explicit later request** — if the plan says visual/cross-browser is postponed or not needed, implement functional coverage first; add optional layers only when you ask.

Example plan wording:

- visual: **postponed** — no `/implement-visual-checkpoint` until approved
- cross-browser: **not needed** — no `@cross-browser` tags
- responsive: **not needed** — no `@responsive` tags

---

## Two Different “Screenshot” Concepts

Do not mix these up.

### 1. Failure diagnostics (automatic)

Configured in `playwright.config.ts`:

- `screenshot: only-on-failure`
- `trace: retain-on-failure`
- `video: retain-on-failure`

These are **not** visual regression baselines. They help debug failed runs and land under `test-results/`.

### 2. Visual regression checkpoints (planned)

- `expect(locator).toHaveScreenshot(...)` in **specs only**
- Requires stable UI state, `@visual` tag, and approved baselines
- Baselines live next to specs (Playwright snapshot folders)
- Use `/implement-visual-checkpoint` with `Approve baseline: yes` only when you intend to create or update baselines

---

## Playwright Projects (Current Baseline)

| Project | Purpose | Default viewport |
|---------|---------|------------------|
| `ui-chromium` | Normal UI specs (`*.ui.spec.ts`) | `1280x720` |
| `ui-firefox` | Cross-browser UI only (`@cross-browser`) | Desktop Firefox |
| `ui-webkit` | Cross-browser UI only (`@cross-browser`) | Desktop Safari |
| `ui-mobile-chromium` | Responsive UI only (`@responsive`) | Mobile Chromium |
| `api` | API specs — **no browser** | — |
| `e2e` | E2E specs — primary browser by default | shared `use` config |

**Not configured by default:**

- full E2E cross-browser matrix
- responsive full-journey E2E matrix
- tablet/desktop/mobile E2E projects

Agents must not assume extra projects exist until they are registered in the project map.

---

## Tags vs Projects vs Allure

### Playwright tags (test intent)

**Required layer tags:** `@api`, `@ui`, `@e2e`, `@visual` (when applicable)

**Execution scope:** `@smoke`, `@regression`

**Coverage type (when planned and registered):**

- `@cross-browser` — marks cross-browser **intent**, not a browser name
- `@responsive` — marks responsive/viewport **intent**, not a device name

**Forbidden as Playwright tags:**

```text
@chromium  @firefox  @webkit
@mobile    @tablet   @desktop
```

### Playwright projects (execution environment)

Browser and viewport selection belongs here — for example run cross-browser tests via `npm run test:cross-browser`, which targets `ui-chromium`, `ui-firefox`, and `ui-webkit`.

### Allure metadata (reporting only)

Allure may describe browser, Playwright project, viewport, feature, story, and coverage type.

Allure metadata **must not replace** required Playwright layer or execution tags.

---

## Cross-Browser Coverage

### When it is justified

Use focused cross-browser **UI** coverage when the plan documents a real browser-specific risk, such as:

- browser-only interaction behavior
- known engine differences for a critical control
- browser-specific validation or dialog behavior
- critical login, checkout, modal, file upload, or navigation behavior

### When it is not needed

State explicitly in `specs/<feature>.md` when no browser-specific risk exists — for example backend-only behavior, API contracts, or UI with no known engine difference.

### E2E cross-browser policy

- limit to **very small smoke** journeys
- document in `specs/e2e/<journey>.md`, not in feature plans
- do not expand E2E to a browser matrix during normal implementation unless the journey plan says so

### API and schema

API and schema tests are browser-independent. **Do not duplicate them per browser.**

---

## Responsive Coverage

### When it is justified

Use focused responsive **UI** coverage when the plan documents viewport-specific risk, such as:

- mobile navigation / hamburger menu
- collapsed sidebar or filter panel
- form layout or control visibility at a breakpoint
- sticky header/footer/action bar
- table/card layout switching

Each responsive scenario in the plan should define:

- viewport or device profile
- user value
- expected visible behavior
- why default-viewport UI coverage is not enough

### Assertion policy

- prefer **functional** assertions for menus, layout state, and visible controls
- use visual checkpoints for responsive layout only when appearance is the risk **and** baselines are approved for that viewport/browser project
- do not use screenshots as a substitute for responsive functional checks

### E2E responsive policy

Full E2E journeys across many viewports are **discouraged by default**. Responsive work is usually focused UI coverage, not a full E2E viewport matrix.

---

## Package Scripts

| Script | What it runs |
|--------|----------------|
| `npm test` | Baseline: `api` + `ui-chromium` + `e2e` |
| `npm run test:ui` | `ui-chromium` only |
| `npm run test:visual` | `@visual` on `ui-chromium` |
| `npm run test:cross-browser` | `@cross-browser` on `ui-chromium`, `ui-firefox`, `ui-webkit` |
| `npm run test:responsive` | `@responsive` on `ui-mobile-chromium` |

`npm test` is **not** a full browser/mobile matrix. Cross-browser and responsive scripts are explicit opt-in paths.

---

## CI Baseline

When tests exist, CI includes:

- API, UI Chromium, E2E
- smoke, regression, visual tag jobs
- cross-browser job: `@cross-browser` on Chromium / Firefox / WebKit
- responsive job: `@responsive` on mobile Chromium

Zero-test repositories still pass — matrix jobs are skipped when no specs exist.

---

## Visual Testing Workflow

### Core order

1. Reach a **stable** UI state (readiness assertions)
2. Run **functional** assertions
3. Take a **scoped** screenshot checkpoint

Visual tests verify appearance. They must **not** replace functional behavior checks.

### Command

```text
/implement-visual-checkpoint
```

Skill: `.cursor/skills/implement-visual-test/SKILL.md`

Use only when visual coverage is **planned** or explicitly requested.

### Default tags for visual checkpoints

```text
@ui
@visual
@regression
```

Do not add `@smoke` to visual checks unless explicitly requested.

### Where visual logic lives

| Layer | Allowed |
|-------|---------|
| Spec | `toHaveScreenshot`, masking, visual assertions |
| Page Object / Component | locators and actions to reach stable state only |
| Page Object / Component | **No** `toHaveScreenshot`, **no** Playwright `expect` |

Prefer visual checkpoints **inside existing UI specs**. Separate `*.visual.spec.ts` files are optional and need a clear reason.

### Screenshot scope (smallest meaningful target)

1. component or section
2. page — only when full-page layout matters
3. full-page — only when explicitly justified

Avoid full-page screenshots by default.

---

## Dynamic Content Before Screenshot

Identify unstable content before adding `toHaveScreenshot`:

- generated emails, names, IDs
- timestamps, prices, counters
- animations, spinners, ads
- remote images, user-specific content

**Stabilization priority:**

1. choose a stable UI state that hides dynamic data
2. use deterministic test data
3. mask only elements **not** under visual test
4. use style overrides only when masking is not enough and the project allows it

**Masking rules:**

- masking belongs in the spec screenshot assertion
- do not mask the element that is the actual visual behavior under test
- do not use broad masks that hide real regressions
- do not update baselines just to hide dynamic noise

If the state cannot be stabilized safely, **postpone** the visual checkpoint and document why.

---

## Baseline Approval (Do Not Forget)

Agents must **not** create, keep, or update snapshot baselines silently.

### When `Approve baseline: no` (default)

- add or verify the checkpoint code
- run the impacted visual test once
- if baseline is missing, report that approval is required
- do not commit snapshot files
- report failure artifact paths for review when generated

### When `Approve baseline: yes` (explicit request only)

1. run impacted visual test with snapshot update enabled
2. review created/updated snapshot files
3. run the same test again **without** snapshot update
4. report both command results

### Environment sensitivity

Baselines differ by OS, browser engine, fonts, headless mode, hardware, viewport, theme, and locale.

- generate and verify baselines in a **controlled** environment
- cross-browser visual baselines need **per-browser/engine** approval
- responsive visual baselines need **per-viewport** approval
- do not include visual checks in `qa:gate` until the baseline environment is stable

---

## Planning Checklist

In `specs/<feature>.md`, document one of:

- Cross-browser coverage (ready / blocked / postponed / not automated)
- Responsive coverage (ready / blocked / postponed / not automated)
- explicit note: **no extra cross-browser or responsive coverage needed**

Also document:

- visual checkpoints planned now vs postponed
- browser or viewport risk that justifies extra coverage
- why default `ui-chromium` UI coverage is not enough

In `specs/e2e/<journey>.md`, document cross-browser E2E only when needed — small smoke scope with clear reason.

---

## Anti-Patterns (Quick “Do Not” List)

- run every UI spec in Chromium, Firefox, and WebKit by default
- run every E2E spec across browsers or viewports by default
- duplicate API tests per browser
- use `@firefox`, `@webkit`, `@mobile` as Playwright tags
- put `toHaveScreenshot` in Page Objects or Components
- screenshot-only tests without functional readiness assertions
- update visual baselines to make failing tests pass
- use screenshots to prove responsive menu behavior when functional checks are enough
- add cross-browser visual baselines without explicit per-engine approval
- use `waitForTimeout` to stabilize screenshots

---

## Related Commands and Skills

| Item | Path |
|------|------|
| Plan feature coverage | `/plan-feature` → `.cursor/skills/plan-test-coverage/SKILL.md` |
| Implement UI (incl. cross-browser/responsive when planned) | `/implement-ui-batch` → `.cursor/skills/implement-ui-feature/SKILL.md` |
| Visual checkpoint | `/implement-visual-checkpoint` → `.cursor/skills/implement-visual-test/SKILL.md` |
| Review generated code | `/review-generated` → `.cursor/skills/review-generated-code-quality/SKILL.md` |
| Quick cheat sheet | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) |
| Project map | `.cursor/rules/00-project-map.mdc` |
